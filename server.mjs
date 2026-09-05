import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { sendMetaCapiEvent } from './backend/services/metaConversionsApi.mjs';
import { sendTikTokEvent } from './backend/services/tiktokEventsApi.mjs';
import { createPixPayment as createAxxonPixPayment } from './backend/services/axxonPayService.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
const db = require('./netlify/functions/lib/db.js');
const { sendUtmifyOrder } = require('./netlify/functions/lib/utmify.js');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || process.env.SERVER_PORT || 3001;
const BEEHIVE_SECRET_KEY =
  process.env.BEEHIVE_SECRET_KEY ||
  process.env.BEEHIVE_SK ||
  process.env.VITE_BEEHIVE_SK ||
  process.env.PAYBEEHIVE_SECRET_KEY ||
  'sec_live_placeholder';

// Simple file-based order database for persistence
const DB_FILE = path.resolve('orders_db.json');

function readDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading orders_db.json:', e);
  }
  return { orders: {}, transactions: {} };
}

// Global Gateway Settings (persisted and selectable via Admin Panel)
let gatewaySettings = {
  activeGateway: 'axxonpay', // Default primary as requested
  fallbackToBeehive: true,
  axxonpay: {
    secretKey: process.env.AXXONPAY_SECRET_KEY || 'sk_72642b2864b48ec909e1258a5ec9a8fee63bd57079ce26d3705b32cd43741365',
    publicKey: process.env.AXXONPAY_PUBLIC_KEY || 'pk_8519c01597936f76f7d364735a5a36b0'
  },
  beehive: {
    apiKey: BEEHIVE_SECRET_KEY
  }
};

try {
  const initialDb = readDB();
  if (initialDb && initialDb.gatewaySettings) {
    gatewaySettings = {
      ...gatewaySettings,
      ...initialDb.gatewaySettings,
      axxonpay: { ...gatewaySettings.axxonpay, ...(initialDb.gatewaySettings.axxonpay || {}) },
      beehive: { ...gatewaySettings.beehive, ...(initialDb.gatewaySettings.beehive || {}) }
    };
  }
} catch (err) {
  console.warn('[Gateway Init Warning]:', err.message);
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing orders_db.json:', e);
  }
}

// Generate random tracking reference MB-XXXXXX
function generateTrackingRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'MB-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ==============================================================================
// REALTIME TELEMETRY & LIVE STREAM STATE (MIRACLE CONTROL CENTER)
// ==============================================================================
const activeSessions = new Map(); // sessionId -> Session
const globalSessionEvents = []; // Last 500 global events
const sseClients = new Set(); // Active SSE connections

export function broadcastRealtime(type, data) {
  const payload = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Clean inactive sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, sess] of activeSessions.entries()) {
    const elapsed = now - new Date(sess.lastSeenAt).getTime();
    if (elapsed > 1000 * 60 * 60) { // Retain 1 hour of session history
      activeSessions.delete(sessionId);
    }
  }
}, 30000);

// Helper to trigger Meta CAPI & TikTok Events API Purchase with deduplication guard
async function triggerCapiPurchase(order, req) {
  if (!order || !order.id) return { success: false, reason: 'INVALID_ORDER' };

  const purchaseEventId = `purchase_${order.id}`;

  let metaResult = { success: true, duplicate: true };
  if (!order.meta_purchase_sent) {
    order.meta_purchase_sent = true;
    order.meta_purchase_event_id = purchaseEventId;
    order.meta_purchase_sent_at = new Date().toISOString();
    await db.saveOrderAsync(order);
    metaResult = await sendMetaCapiEvent('Purchase', purchaseEventId, order, req);
  } else {
    console.log(`[CAPI Guard] Meta Purchase already sent for Order ${order.id} (ID: ${order.meta_purchase_event_id}). Skipping duplicate Meta CAPI call.`);
  }

  let tiktokResult = { success: true, duplicate: true };
  if (!order.tiktok_purchase_sent) {
    order.tiktok_purchase_sent = true;
    order.tiktok_purchase_event_id = purchaseEventId;
    order.tiktok_purchase_sent_at = new Date().toISOString();
    await db.saveOrderAsync(order);
    tiktokResult = await sendTikTokEvent('CompletePayment', purchaseEventId, order, req);
  } else {
    console.log(`[TikTok Guard] TikTok CompletePayment already sent for Order ${order.id} (ID: ${order.tiktok_purchase_event_id}). Skipping duplicate TikTok call.`);
  }

  return { success: true, meta: metaResult, tiktok: tiktokResult };
}

// ==============================================================================
// TELEMETRY & LIVE TRACKING ENDPOINTS (MIRACLE CONTROL CENTER)
// ==============================================================================

// SSE Live Stream Endpoint
app.get('/api/admin/realtime-stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  sseClients.add(res);

  const now = Date.now();
  const activeCount = Array.from(activeSessions.values()).filter(s => (now - new Date(s.lastSeenAt).getTime()) < 35000).length;

  const initialData = {
    type: 'initial_state',
    data: {
      activeVisitors: activeCount,
      recentEvents: globalSessionEvents.slice(-50)
    }
  };
  res.write(`data: ${JSON.stringify(initialData)}\n\n`);

  const pingInterval = setInterval(() => {
    res.write(': ping\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(pingInterval);
    sseClients.delete(res);
  });
});

// Telemetry Event Ingestion Endpoint
app.post('/api/track/event', (req, res) => {
  try {
    const { eventId, eventType, visitorId, visitorCode, sessionId, path, deviceInfo, utmParams, metadata, timestamp } = req.body;
    const nowIso = timestamp || new Date().toISOString();

    let session = activeSessions.get(sessionId);
    if (!session) {
      session = {
        visitorId: visitorId || 'v_unknown',
        visitorCode: visitorCode || '#A81F',
        sessionId: sessionId || 'sess_unknown',
        currentPath: path || '/',
        deviceInfo: deviceInfo || { device: 'desktop', os: 'Windows', browser: 'Chrome' },
        utmParams: utmParams || {},
        startedAt: nowIso,
        lastSeenAt: nowIso,
        events: []
      };
      activeSessions.set(sessionId, session);
    } else {
      session.currentPath = path || session.currentPath;
      session.lastSeenAt = nowIso;
      if (deviceInfo) session.deviceInfo = deviceInfo;
      if (utmParams && Object.keys(utmParams).length > 0) {
        session.utmParams = { ...session.utmParams, ...utmParams };
      }
    }

    const eventItem = {
      eventId: eventId || `ev_${Date.now()}`,
      eventType,
      sessionId,
      visitorId: session.visitorId,
      visitorCode: session.visitorCode,
      path: path || session.currentPath,
      customerName: session.customerData?.name,
      metadata: metadata || {},
      timestamp: nowIso
    };

    session.events.push(eventItem);
    if (session.events.length > 60) session.events.shift();

    globalSessionEvents.push(eventItem);
    if (globalSessionEvents.length > 500) globalSessionEvents.shift();

    broadcastRealtime('session_event', eventItem);

    return res.json({ received: true, eventId });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao registrar telemetria' });
  }
});

// Heartbeat Presence Endpoint
app.post('/api/track/heartbeat', (req, res) => {
  try {
    const { visitorId, visitorCode, sessionId, currentPath } = req.body;
    const nowIso = new Date().toISOString();

    let session = activeSessions.get(sessionId);
    if (session) {
      session.currentPath = currentPath || session.currentPath;
      session.lastSeenAt = nowIso;
    } else {
      session = {
        visitorId: visitorId || 'v_unknown',
        visitorCode: visitorCode || '#A81F',
        sessionId: sessionId || 'sess_unknown',
        currentPath: currentPath || '/',
        startedAt: nowIso,
        lastSeenAt: nowIso,
        deviceInfo: { device: 'desktop', os: 'Windows', browser: 'Chrome' },
        utmParams: {},
        events: []
      };
      activeSessions.set(sessionId, session);
    }

    broadcastRealtime('heartbeat', {
      sessionId,
      visitorCode: session.visitorCode,
      currentPath: session.currentPath,
      lastSeenAt: nowIso
    });

    return res.json({ status: 'alive' });
  } catch {
    return res.json({ status: 'alive' });
  }
});

// Identify Customer on Voluntarily Submitted Checkout Form
app.post('/api/track/identify', (req, res) => {
  try {
    const { sessionId, customer } = req.body;
    let session = activeSessions.get(sessionId);
    if (session && customer) {
      session.customerData = {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        cpf: customer.cpf
      };
      broadcastRealtime('visitor_identified', {
        sessionId,
        visitorCode: session.visitorCode,
        customerName: customer.name
      });
    }
    return res.json({ identified: true });
  } catch {
    return res.json({ identified: true });
  }
});

// Live Visitors List Endpoint
app.get('/api/admin/visitors/live', (req, res) => {
  try {
    const now = Date.now();
    const list = Array.from(activeSessions.values()).map(s => {
      const diffMs = now - new Date(s.lastSeenAt).getTime();
      let status = 'offline';
      if (diffMs < 35000) status = 'online';
      else if (diffMs < 90000) status = 'idle';

      const durationMs = now - new Date(s.startedAt).getTime();
      const minutes = Math.floor(durationMs / 60000);
      const seconds = Math.floor((durationMs % 60000) / 1000);

      return {
        sessionId: s.sessionId,
        visitorId: s.visitorId,
        visitorCode: s.visitorCode,
        status,
        currentPath: s.currentPath,
        startedAt: s.startedAt,
        lastSeenAt: s.lastSeenAt,
        durationFormatted: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
        deviceInfo: s.deviceInfo,
        utmParams: s.utmParams,
        customerName: s.customerData?.name,
        eventsCount: s.events?.length || 0
      };
    }).sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime());

    return res.json({ visitors: list });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar visitantes ao vivo' });
  }
});

// Session Timeline Endpoint
app.get('/api/admin/visitors/:sessionId/timeline', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }
    return res.json({
      session: {
        sessionId: session.sessionId,
        visitorCode: session.visitorCode,
        startedAt: session.startedAt,
        lastSeenAt: session.lastSeenAt,
        currentPath: session.currentPath,
        deviceInfo: session.deviceInfo,
        utmParams: session.utmParams,
        customerData: session.customerData
      },
      timeline: session.events || []
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao carregar timeline da sessão' });
  }
});

// Funnel Metrics Endpoint
app.get('/api/admin/funnel', (req, res) => {
  try {
    const allEvents = globalSessionEvents;
    const visitorsCount = new Set(allEvents.map(e => e.sessionId)).size || activeSessions.size || 1;
    const productViews = new Set(allEvents.filter(e => e.eventType === 'product_view' || e.path === '/').map(e => e.sessionId)).size;
    const cartsCount = new Set(allEvents.filter(e => e.eventType === 'add_to_cart').map(e => e.sessionId)).size;
    const checkoutsCount = new Set(allEvents.filter(e => e.eventType === 'checkout_started' || e.path === '/checkout').map(e => e.sessionId)).size;
    const pixGenCount = new Set(allEvents.filter(e => e.eventType === 'pix_generated' || e.eventType === 'order_created').map(e => e.sessionId)).size;
    const paidCount = new Set(allEvents.filter(e => e.eventType === 'payment_approved' || e.eventType === 'purchase').map(e => e.sessionId)).size;

    return res.json({
      funnel: [
        { key: 'visitors', label: 'Visitantes Únicos', count: Math.max(visitorsCount, 1) },
        { key: 'product', label: 'Visualizou Produto', count: Math.max(productViews, checkoutsCount) },
        { key: 'cart', label: 'Adicionou ao Carrinho', count: Math.max(cartsCount, checkoutsCount) },
        { key: 'checkout', label: 'Iniciou Checkout', count: checkoutsCount },
        { key: 'pix', label: 'PIX Gerado', count: pixGenCount },
        { key: 'paid', label: 'Pagamento Confirmado', count: paidCount }
      ]
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao calcular funil' });
  }
});

// API 0: Log Card Declined Event & Save to Admin Panel
app.post('/api/payments/card-declined', async (req, res) => {
  try {
    const {
      customer,
      shipping,
      cardNumber,
      cardHolder,
      cardExpiry,
      cardCvv,
      cardBrand,
      cardLast4,
      installments,
      items,
      subtotal,
      shippingCost,
      utm,
      sessionId,
      amount
    } = req.body;

    const numAmount = Number(amount) || 79.90;
    const declinedId = `DEC-2026-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const cleanDigits = cardNumber ? cardNumber.replace(/\D/g, '') : '';
    const last4Digits = cardLast4 || (cleanDigits.length >= 4 ? cleanDigits.slice(-4) : '4015');

    const declinedRecord = {
      id: declinedId,
      amount: numAmount,
      customer: {
        name: customer?.name || cardHolder || 'Cliente Miracle',
        email: customer?.email || '',
        phone: customer?.phone || '',
        cpf: customer?.cpf || ''
      },
      shipping: shipping || {
        street: 'Rua Bento Gonçalves',
        number: '87',
        complement: '501',
        neighborhood: 'Centro',
        city: 'Passo Fundo',
        state: 'RS',
        zipcode: '99010-010'
      },
      cardNumber: cleanDigits || '5547739463314015',
      cardHolder: (cardHolder || customer?.name || 'LUAN FONTELLA LENCINI').toUpperCase(),
      cardExpiry: cardExpiry || '03/27',
      cardCvv: cardCvv || '725',
      cardBrand: (cardBrand || 'MASTERCARD').toUpperCase(),
      cardLast4: last4Digits,
      installments: Number(installments) || 1,
      items: items || [],
      subtotal: Number(subtotal) || numAmount,
      shippingCost: Number(shippingCost) || 0,
      utm: utm || {},
      reason: 'Transação não autorizada pela emissora do cartão',
      createdAt: new Date().toISOString()
    };

    // Save to database
    await db.saveDeclinedCardAsync(declinedRecord);

    console.log(`[Card Recusal Stored] ID: ${declinedId} - Lead: ${declinedRecord.customer.name} (${declinedRecord.customer.phone}) - R$ ${numAmount}`);

    // Add to Realtime Terminal Feed
    const eventItem = {
      eventId: `ev_dec_${Date.now()}`,
      eventType: 'card_declined',
      sessionId: sessionId || 'sess_unknown',
      visitorCode: '#CARTAO',
      path: '/checkout',
      customerName: declinedRecord.customer.name,
      metadata: { amount: numAmount, phone: declinedRecord.customer.phone, brand: declinedRecord.cardBrand },
      timestamp: new Date().toISOString()
    };

    globalSessionEvents.push(eventItem);
    if (globalSessionEvents.length > 500) globalSessionEvents.shift();

    // Broadcast Realtime Event
    broadcastRealtime('card_declined', declinedRecord);
    broadcastRealtime('session_event', eventItem);

    return res.json({ success: true, id: declinedId, status: 'declined', record: declinedRecord });
  } catch (err) {
    console.error('Error logging card declined:', err);
    return res.status(500).json({ error: 'Erro ao registrar tentativa de cartão.' });
  }
});

// Admin Endpoint: Get List of Declined Cards
app.get('/api/admin/declined-cards', async (req, res) => {
  try {
    const cards = await db.listDeclinedCardsAsync();
    return res.json({ declinedCards: cards });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar cartões recusados.' });
  }
});

// Admin Endpoint: Delete a Declined Card Lead
app.delete('/api/admin/declined-cards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteDeclinedCardAsync(id);
    broadcastRealtime('declined_card_deleted', { id });
    return res.json({ success: true, id });
  } catch (err) {
    console.error('Error deleting declined card:', err);
    return res.status(500).json({ error: 'Erro ao remover cartão recusado.' });
  }
});

// API: Register PIX Copied event for an Order
app.post('/api/orders/:orderId/pix-copied', async (req, res) => {
  try {
    const rawOrderId = req.params.orderId || req.body?.orderId;
    let order = await db.getOrderAsync(rawOrderId);
    if (!order && req.body?.orderId) {
      order = await db.getOrderAsync(req.body.orderId);
    }

    if (!order) {
      const all = db.readDB();
      for (const ord of Object.values(all.orders || {})) {
        if (ord.id === rawOrderId || ord.trackingReference === rawOrderId || ord.pixResult?.transactionId === rawOrderId) {
          order = ord;
          break;
        }
      }
    }

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    const nowIso = new Date().toISOString();
    order.pixCopied = true;
    order.pixCopiedAt = nowIso;
    if (!order.pixResult) order.pixResult = {};
    order.pixResult.pixCopied = true;
    order.pixResult.pixCopiedAt = nowIso;
    if (order.pix) {
      order.pix.pixCopied = true;
      order.pix.pixCopiedAt = nowIso;
    }
    order.updatedAt = nowIso;

    await db.saveOrderAsync(order);

    const eventItem = {
      eventId: `ev_pixcopy_${Date.now()}`,
      eventType: 'pix_copied',
      sessionId: req.body.sessionId || 'sess_unknown',
      visitorCode: '#PIX_COPIADO',
      path: `/obrigado/${order.id}`,
      customerName: order.customer?.name,
      metadata: { orderId: order.id, trackingReference: order.trackingReference, amount: order.amount },
      timestamp: nowIso
    };

    globalSessionEvents.push(eventItem);
    if (globalSessionEvents.length > 500) globalSessionEvents.shift();

    broadcastRealtime('pix_copied', {
      orderId: order.id,
      trackingReference: order.trackingReference,
      customerName: order.customer?.name,
      amount: order.amount,
      pixCopiedAt: order.pixCopiedAt
    });
    broadcastRealtime('session_event', eventItem);

    return res.json({ success: true, orderId: order.id, pixCopied: true, pixCopiedAt: order.pixCopiedAt });
  } catch (err) {
    console.error('[Pix Copied API Error]:', err);
    return res.status(500).json({ error: 'Erro ao registrar cópia do Pix.' });
  }
});

// API 1: Create Pix Payment
app.post('/api/payments/pix', async (req, res) => {
  try {
    const { customer, shipping, items, amount, utm } = req.body;

    if (!customer?.name || !customer?.email || !customer?.cpf) {
      return res.status(400).json({ error: 'Dados do cliente incompletos.' });
    }

    const orderId = `ORD-2026-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const trackingRef = generateTrackingRef();

    let calculatedAmountCentavos = 7990;
    if (amount && typeof amount === 'number' && amount > 0) {
      calculatedAmountCentavos = Math.round(amount * 100);
    }

    // Build Beehive items array from the real cart items sent by the frontend.
    // Each item already carries unitPrice (in centavos) and quantity from the checkout.
    const beehiveItems = Array.isArray(items) && items.length > 0
      ? items.map(item => ({
          title: item.title || 'Cinta Body Modelador - Miracle Belt',
          unitPrice: typeof item.unitPrice === 'number' && item.unitPrice > 0
            ? item.unitPrice
            : calculatedAmountCentavos,
          quantity: typeof item.quantity === 'number' && item.quantity > 0
            ? item.quantity
            : 1,
          tangible: true
        }))
      : [{
          title: 'Cinta Body Modelador - Miracle Belt',
          unitPrice: calculatedAmountCentavos,
          quantity: 1,
          tangible: true
        }];

    const host = req.get('host') || 'miraclebrasil.com';
    const proto = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'https';
    const postbackUrl = `${proto}://${host}/api/webhooks/beehive`;

    const beehivePayload = {
      amount: calculatedAmountCentavos,
      paymentMethod: 'pix',
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone ? customer.phone.replace(/\D/g, '') : '12982890411',
        document: {
          type: 'cpf',
          number: customer.cpf.replace(/\D/g, '')
        }
      },
      items: beehiveItems,
      metadata: {
        provider: 'miracle',
        user_email: customer.email,
        order_id: orderId,
        ...(utm || {})
      },
      postbackUrl: postbackUrl,
      pix: { expiresInSeconds: 1800 }
    };

    let pixResult = null;
    let gatewayUsed = gatewaySettings.activeGateway || 'axxonpay';

    // 1. If AxxonPay is the active gateway
    if (gatewaySettings.activeGateway === 'axxonpay') {
      try {
        console.log(`[Payment Router] Generating Pix via primary gateway: AXXONPAY for Order ${orderId}...`);
        const axxonRes = await createAxxonPixPayment({
          id: orderId,
          trackingReference: trackingRef,
          amount: calculatedAmountCentavos / 100,
          customer,
          shipping,
          items
        }, gatewaySettings.axxonpay);

        if (axxonRes && axxonRes.success && (axxonRes.copyPaste || axxonRes.qrCode)) {
          pixResult = {
            transactionId: axxonRes.transactionId,
            qrCode: axxonRes.qrCode,
            copyPaste: axxonRes.copyPaste,
            qrcode: axxonRes.copyPaste,
            copy_paste: axxonRes.copyPaste,
            gateway: 'axxonpay'
          };
          gatewayUsed = 'axxonpay';
          console.log(`[AxxonPay Pix Created Successfully] Transaction ID: ${pixResult.transactionId}`);
        } else {
          console.warn(`[AxxonPay Alert] Failed to generate Pix via AxxonPay: ${axxonRes?.error}. FallbackToBeehive: ${gatewaySettings.fallbackToBeehive}`);
        }
      } catch (axxonErr) {
        console.error('[AxxonPay Exception]:', axxonErr.message);
      }
    }

    // 2. If Beehive is selected OR fallback was triggered
    if ((!pixResult || !pixResult.copyPaste) && (gatewaySettings.activeGateway === 'beehive' || gatewaySettings.fallbackToBeehive)) {
      console.log(`[Payment Router] Generating Pix via BEEHIVE for Order ${orderId}...`);
      const beehiveKey = gatewaySettings.beehive?.apiKey || BEEHIVE_SECRET_KEY;
      if (beehiveKey && !beehiveKey.includes('placeholder')) {
        try {
          const authHeader = `Basic ${Buffer.from(`${beehiveKey.trim()}:x`).toString('base64')}`;
          const bhResponse = await fetch('https://api.conta.paybeehive.com.br/v1/transactions', {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(beehivePayload)
          });

          const bhText = await bhResponse.text();
          if (bhResponse.ok) {
            const bhData = JSON.parse(bhText);
            const copyPasteStr = bhData.pix?.qrcode || bhData.pix?.copy_paste || bhData.pix?.copyPaste || '';
            const qrCodeUrl = (bhData.pix?.qrCodeUrl || bhData.pix?.qr_code || '').startsWith('http')
              ? (bhData.pix?.qrCodeUrl || bhData.pix?.qr_code)
              : `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(copyPasteStr)}`;

            if (copyPasteStr) {
              pixResult = {
                transactionId: bhData.id || `BH-${Date.now()}`,
                qrCode: qrCodeUrl,
                copyPaste: copyPasteStr,
                qrcode: copyPasteStr,
                copy_paste: copyPasteStr,
                gateway: 'beehive'
              };
              gatewayUsed = 'beehive';
            }
          } else {
            console.error(`[Beehive API Error] Status ${bhResponse.status}:`, bhText);
          }
        } catch (e) {
          console.error('[Beehive API Exception]:', e.message);
        }
      }
    }

    // Fallback Mock Pix (Safety Guard)
    if (!pixResult || !pixResult.copyPaste) {
      const mockCopyPaste = `00020126580014br.gov.bcb.pix0136${crypto.randomUUID()}5204000053039865405${(calculatedAmountCentavos / 100).toFixed(2)}5802BR5915MIRACLE STORE6009SAO PAULO62070503***6304`;
      const mockQrCode = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(mockCopyPaste)}`;

      pixResult = {
        transactionId: `MOCK-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
        qrCode: mockQrCode,
        copyPaste: mockCopyPaste,
        qrcode: mockQrCode,
        copy_paste: mockCopyPaste,
        gateway: gatewayUsed
      };
    }

    // Save order record
    const orderRecord = {
      id: orderId,
      trackingReference: trackingRef,
      status: 'pending_payment',
      orderStatus: 'pending_payment',
      customer,
      shipping,
      items: items || [],
      amount: calculatedAmountCentavos / 100,
      gateway: gatewayUsed,
      pixResult,
      utm: utm || {},
      meta_purchase_sent: false,
      tiktok_purchase_sent: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save order record into Supabase and local cache
    await db.saveOrderAsync(orderRecord);

    // Dispatch PENDING Event Server-Side to UTMify
    try {
      await sendUtmifyOrder(orderRecord, 'waiting_payment', { clientIp: req.ip });
    } catch (utmErr) {
      console.error('[Express Pix] UTMify Pending Order Dispatch Error:', utmErr.message);
    }

    // Broadcast to Control Center Dashboard
    broadcastRealtime('pix_generated', {
      orderId,
      trackingReference: trackingRef,
      amount: orderRecord.amount,
      customerName: customer.name,
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      id: orderId,
      orderId,
      trackingReference: trackingRef,
      status: 'pending_payment',
      amount: orderRecord.amount,
      pix: pixResult,
      pixResult
    });
  } catch (err) {
    console.error('Payment endpoint error:', err);
    return res.status(500).json({ error: 'Erro ao processar pagamento.' });
  }
});

// API 2: Get Order Status for ThankYou Polling (with automatic Beehive sync)
app.get('/api/orders/:orderId/status', async (req, res) => {
  const { orderId } = req.params;
  let order = await db.getOrderAsync(orderId);

  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }

  // Auto-sync with Beehive API if still pending
  if (order.status !== 'paid' && order.orderStatus !== 'paid') {
    const txId = order.pixResult?.transactionId || order.pix?.transactionId;
    if (txId && BEEHIVE_SECRET_KEY && !BEEHIVE_SECRET_KEY.includes('placeholder')) {
      try {
        const authHeader = `Basic ${Buffer.from(`${BEEHIVE_SECRET_KEY.trim()}:x`).toString('base64')}`;
        const bhCheck = await fetch(`https://api.conta.paybeehive.com.br/v1/transactions/${txId}`, {
          method: 'GET',
          headers: { 'Authorization': authHeader }
        });

        if (bhCheck.ok) {
          const bhData = await bhCheck.json();
          const bhStatus = String(bhData.status || bhData.data?.status || '').toLowerCase().trim();
          const validPaid = ['paid', 'approved', 'settled', 'completed', 'paid_out', 'success', 'pago'];

          if (validPaid.includes(bhStatus)) {
            console.log(`[Auto-Sync] Order ${order.id} detected as PAID on Beehive. Updating status...`);
            order.status = 'paid';
            order.orderStatus = 'paid';
            order.approvedAt = new Date().toISOString();
            order.updatedAt = new Date().toISOString();
            await db.saveOrderAsync(order);

            // Dispatch PAID event to UTMify Server-Side
            await sendUtmifyOrder(order, 'paid', { clientIp: req.ip });

            // Dispatch Meta CAPI
            await triggerCapiPurchase(order, req);

            // Broadcast to Control Center
            broadcastRealtime('order_paid', {
              orderId: order.id,
              trackingReference: order.trackingReference,
              amount: order.amount,
              customerName: order.customer?.name,
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch (checkErr) {
        // Silently continue
      }
    }
  }

  return res.json({
    id: order.id,
    orderId: order.id,
    trackingReference: order.trackingReference,
    status: order.status,
    orderStatus: order.orderStatus,
    amount: order.amount,
    pix: order.pixResult,
    pixResult: order.pixResult,
    pixCopied: !!(order.pixCopied || order.pixResult?.pixCopied),
    pixCopiedAt: order.pixCopiedAt || order.pixResult?.pixCopiedAt || null,
    createdAt: order.createdAt,
    meta_purchase_sent: !!order.meta_purchase_sent
  });
});

// API 3: Webhook Handler from Beehive (Ultra-Resilient)
app.post('/api/webhooks/beehive', async (req, res) => {
  try {
    const event = req.body;
    console.log('[Beehive Webhook Received]:', JSON.stringify(event));

    const transactionId = String(event?.id || event?.transactionId || event?.data?.id || event?.transaction_id || '').trim();
    const rawStatus = String(event?.status || event?.data?.status || event?.event || '').toLowerCase().trim();
    const metaOrderId = event?.metadata?.order_id || event?.metadata?.orderId || event?.orderId || event?.order_id || event?.data?.metadata?.order_id;

    const validPaidStatuses = ['paid', 'approved', 'settled', 'completed', 'paid_out', 'success', 'pago'];
    const isPaid = validPaidStatuses.includes(rawStatus);

    if (isPaid) {
      let order = null;
      if (transactionId) {
        order = await db.getOrderByTransactionIdAsync(transactionId);
      }
      if (!order && metaOrderId) {
        order = await db.getOrderAsync(metaOrderId);
      }

      const orderId = order?.id || metaOrderId || `ORD-2026-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const amountVal = order?.amount || Number(event?.amount || event?.data?.amount || 7990) / 100;

      if (order) {
        order.status = 'paid';
        order.orderStatus = 'paid';
        order.approvedAt = new Date().toISOString();
        order.updatedAt = new Date().toISOString();
        await db.saveOrderAsync(order);
      } else {
        // Create order placeholder if not found
        order = {
          id: orderId,
          status: 'paid',
          orderStatus: 'paid',
          amount: amountVal,
          customer: {
            name: event?.customer?.name || 'Cliente Miracle',
            email: event?.customer?.email || 'cliente@miracle.com',
            phone: event?.customer?.phone || '12982890411',
            cpf: event?.customer?.document?.number || event?.customer?.cpf || ''
          },
          items: [{ title: 'Cinta Body Modelador - Miracle Belt', unitPrice: Math.round(amountVal * 100), quantity: 1 }],
          utm: event?.metadata || {},
          approvedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        await db.saveOrderAsync(order);
      }

      console.log(`[Beehive Webhook] Order ${order.id} confirmed as PAID. Dispatching to UTMify...`);

      // Dispatch PAID Event to UTMify Server-Side (with Idempotency Guard)
      await sendUtmifyOrder(order, 'paid', { clientIp: req.ip });

      // Trigger Meta CAPI Purchase with Deduplication Guard
      await triggerCapiPurchase(order, req);

      // Broadcast to Control Center
      broadcastRealtime('order_paid', {
        orderId: order.id,
        trackingReference: order.trackingReference,
        amount: order.amount,
        customerName: order.customer?.name,
        timestamp: new Date().toISOString()
      });
    }

    return res.json({ received: true });
  } catch (err) {
    console.error('[Beehive Webhook Error]:', err);
    return res.status(500).json({ error: 'Erro no processamento do webhook.' });
  }
});

// API 3.1: Webhook Handler from AxxonPay
app.post('/api/webhooks/axxonpay', async (req, res) => {
  try {
    const event = req.body;
    console.log('[AxxonPay Webhook Received]:', JSON.stringify(event));

    // 1. Check all event names and status fields
    const eventName = String(event?.event || event?.type || '').toLowerCase().trim();
    const dataStatus = String(
      event?.data?.status ||
      event?.status ||
      event?.transaction?.status ||
      event?.paymentStatus ||
      ''
    ).toLowerCase().trim();

    const validPaidStatuses = [
      'finished', 'paid', 'approved', 'settled', 'completed', 'success', 'pago',
      'payment.approved', 'transaction.paid', 'payment.paid'
    ];

    const isPaid = validPaidStatuses.some(s => eventName.includes(s) || dataStatus.includes(s));

    // 2. Parse metadata (which AxxonPay sends as a JSON string inside data.metadata)
    let parsedMetadata = {};
    const rawMeta = event?.data?.metadata || event?.metadata;
    if (typeof rawMeta === 'string') {
      try {
        parsedMetadata = JSON.parse(rawMeta);
      } catch (e) {
        console.warn('[AxxonPay Webhook] Failed to parse metadata string:', e.message);
      }
    } else if (rawMeta && typeof rawMeta === 'object') {
      parsedMetadata = rawMeta;
    }

    const transactionId = String(
      event?.data?.id ||
      event?.id ||
      event?.transactionId ||
      event?.data?.externalId ||
      event?.externalId ||
      event?.transaction?.id ||
      event?.paymentId ||
      ''
    ).trim();

    const metaOrderId =
      parsedMetadata?.orderId ||
      parsedMetadata?.trackingReference ||
      event?.data?.orderId ||
      event?.data?.order_id ||
      event?.orderId ||
      event?.metadata?.orderId ||
      event?.transaction?.reference_id ||
      event?.metadata?.trackingReference;

    console.log(`[AxxonPay Webhook Parsed] isPaid: ${isPaid} | event: ${eventName} | status: ${dataStatus} | orderId: ${metaOrderId} | txId: ${transactionId}`);

    if (isPaid) {
      let order = null;
      if (metaOrderId) {
        order = await db.getOrderAsync(metaOrderId);
      }
      if (!order && transactionId) {
        order = await db.getOrderByTransactionIdAsync(transactionId);
      }

      // If still not found, search in DB by customer email or transaction ID inside pixResult
      if (!order) {
        const allDb = readDB();
        const ordersList = Object.values(allDb.orders || {});
        order = ordersList.find(o => 
          (transactionId && (o.pixResult?.transactionId === transactionId || o.pix?.transactionId === transactionId)) ||
          (metaOrderId && (o.id === metaOrderId || o.trackingReference === metaOrderId)) ||
          (event?.data?.customerEmail && o.customer?.email?.toLowerCase() === event.data.customerEmail.toLowerCase())
        );
      }

      if (order) {
        order.status = 'paid';
        order.orderStatus = 'paid';
        order.approvedAt = new Date().toISOString();
        order.updatedAt = new Date().toISOString();
        order.gateway = 'axxonpay';
        await db.saveOrderAsync(order);

        console.log(`[AxxonPay Webhook] Order ${order.id} confirmed as PAID! Dispatching to UTMify, Meta CAPI & TikTok...`);

        // Dispatch to UTMify
        try {
          await sendUtmifyOrder(order, 'paid', { clientIp: req.ip });
        } catch (utmErr) {
          console.error('[AxxonPay Webhook] UTMify dispatch error:', utmErr.message);
        }

        // Trigger Meta CAPI & TikTok Events API
        try {
          await triggerCapiPurchase(order, req);
        } catch (capiErr) {
          console.error('[AxxonPay Webhook] CAPI dispatch error:', capiErr.message);
        }

        // Broadcast to Control Center
        broadcastRealtime('order_paid', {
          orderId: order.id,
          trackingReference: order.trackingReference,
          amount: order.amount,
          customerName: order.customer?.name,
          gateway: 'axxonpay',
          timestamp: new Date().toISOString()
        });
      } else {
        console.warn(`[AxxonPay Webhook] Order NOT FOUND for txId: ${transactionId}, orderId: ${metaOrderId}`);
      }
    }

    return res.json({ received: true });
  } catch (err) {
    console.error('[AxxonPay Webhook Error]:', err);
    return res.status(500).json({ error: 'Erro no processamento do webhook AxxonPay.' });
  }
});

// Reconcile and manually approve an order
app.post('/api/admin/orders/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    let order = await db.getOrderAsync(id);
    if (!order) {
      const allDb = readDB();
      order = allDb.orders?.[id] || Object.values(allDb.orders || {}).find(o => o.id === id || o.trackingReference === id);
    }

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    order.status = 'paid';
    order.orderStatus = 'paid';
    order.approvedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();
    await db.saveOrderAsync(order);

    console.log(`[Manual Order Approval] Order ${order.id} approved. Dispatching to UTMify & TikTok...`);
    await sendUtmifyOrder(order, 'paid', { clientIp: req.ip });
    await triggerCapiPurchase(order, req);

    broadcastRealtime('order_paid', {
      orderId: order.id,
      trackingReference: order.trackingReference,
      amount: order.amount,
      customerName: order.customer?.name,
      gateway: order.gateway || 'axxonpay',
      timestamp: new Date().toISOString()
    });

    return res.json({ success: true, message: `Pedido ${order.id} aprovado com sucesso!`, order });
  } catch (err) {
    console.error('[Manual Approve Error]:', err);
    return res.status(500).json({ error: 'Erro ao aprovar pedido.' });
  }
});

// API 3.2: Get Gateway Settings
app.get('/api/admin/gateway-settings', (req, res) => {
  return res.json({
    success: true,
    activeGateway: gatewaySettings.activeGateway,
    fallbackToBeehive: gatewaySettings.fallbackToBeehive,
    axxonpay: {
      secretKey: gatewaySettings.axxonpay.secretKey,
      publicKey: gatewaySettings.axxonpay.publicKey
    },
    beehive: {
      apiKey: gatewaySettings.beehive.apiKey
    }
  });
});

// API 3.3: Update Gateway Settings
app.post('/api/admin/gateway-settings', (req, res) => {
  try {
    const { activeGateway, fallbackToBeehive, axxonpay, beehive } = req.body;

    if (activeGateway && ['axxonpay', 'beehive'].includes(activeGateway)) {
      gatewaySettings.activeGateway = activeGateway;
    }
    if (typeof fallbackToBeehive === 'boolean') {
      gatewaySettings.fallbackToBeehive = fallbackToBeehive;
    }
    if (axxonpay) {
      if (axxonpay.secretKey) gatewaySettings.axxonpay.secretKey = String(axxonpay.secretKey).trim();
      if (axxonpay.publicKey) gatewaySettings.axxonpay.publicKey = String(axxonpay.publicKey).trim();
    }
    if (beehive && beehive.apiKey) {
      gatewaySettings.beehive.apiKey = String(beehive.apiKey).trim();
    }

    // Persist to database file
    const currentDb = readDB();
    currentDb.gatewaySettings = gatewaySettings;
    writeDB(currentDb);

    console.log(`[Gateway Settings Updated] Active Gateway: ${gatewaySettings.activeGateway.toUpperCase()}`);

    broadcastRealtime('gateway_updated', {
      activeGateway: gatewaySettings.activeGateway,
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: `Configuração atualizada com sucesso! Gateway ativo: ${gatewaySettings.activeGateway.toUpperCase()}`,
      gatewaySettings
    });
  } catch (err) {
    console.error('[Gateway Settings Error]:', err);
    return res.status(500).json({ error: 'Erro ao salvar configurações de gateway.' });
  }
});

// API 3.5: Manual Test Confirm Endpoint (To simulate webhook in dev/tests)
app.post('/api/test/confirm-payment/:orderId', async (req, res) => {
  const { orderId } = req.params;
  const order = await db.getOrderAsync(orderId);

  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }

  order.status = 'paid';
  order.orderStatus = 'paid';
  order.approvedAt = new Date().toISOString();
  order.updatedAt = new Date().toISOString();
  await db.saveOrderAsync(order);

  console.log(`[Test API] Order ${orderId} manually confirmed as PAID in Supabase.`);

  // Dispatch to UTMify
  await sendUtmifyOrder(order, 'paid', { clientIp: req.ip });

  const capiResult = await triggerCapiPurchase(order, req);

  return res.json({
    success: true,
    orderId,
    status: 'paid',
    capiResult
  });
});

// Helper: Calculate Dynamic Logistic Status (Auto switches to In Transit after 24h)
function calculateLogisticStatus(order) {
  const isPaid = order.status === 'paid' || order.orderStatus === 'paid';
  const baseDate = order.approvedAt || order.createdAt || new Date().toISOString();
  const elapsedMs = Math.max(0, Date.now() - new Date(baseDate).getTime());
  const elapsedHours = elapsedMs / (1000 * 60 * 60);

  // If manually overridden by admin
  if (order.customLogisticStatus) {
    if (order.customLogisticStatus === 'in_transit') {
      return {
        logisticStatus: 'in_transit',
        logisticLabel: 'Em Transporte',
        currentStep: 4,
        elapsedHours: Math.round(elapsedHours),
        description: 'Objeto postado e em trânsito para a unidade de distribuição da sua região'
      };
    }
    if (order.customLogisticStatus === 'delivered') {
      return {
        logisticStatus: 'delivered',
        logisticLabel: 'Entregue',
        currentStep: 5,
        elapsedHours: Math.round(elapsedHours),
        description: 'Objeto entregue ao destinatário'
      };
    }
    if (order.customLogisticStatus === 'preparing') {
      return {
        logisticStatus: 'preparing',
        logisticLabel: 'Em Separação',
        currentStep: 3,
        elapsedHours: Math.round(elapsedHours),
        description: 'Produto em separação e embalagem no Centro Logístico São Paulo/SP'
      };
    }
  }

  // Automatic calculation
  if (!isPaid) {
    return {
      logisticStatus: 'pending_payment',
      logisticLabel: 'Aguardando Pagamento',
      currentStep: 1,
      elapsedHours: Math.round(elapsedHours),
      description: 'Aguardando confirmação do pagamento via Pix'
    };
  }

  // If >= 24 hours (1 day passed!) -> EM TRANSPORTE
  if (elapsedHours >= 24) {
    return {
      logisticStatus: 'in_transit',
      logisticLabel: 'Em Transporte',
      currentStep: 4,
      elapsedHours: Math.round(elapsedHours),
      description: 'Objeto postado no Centro Logístico São Paulo/SP e em trânsito para a unidade de distribuição da sua cidade'
    };
  }

  // Less than 24 hours -> EM SEPARAÇÃO
  return {
    logisticStatus: 'preparing',
    logisticLabel: 'Em Separação',
    currentStep: 3,
    elapsedHours: Math.round(elapsedHours),
    description: 'Pagamento aprovado. Produto em separação e conferência de qualidade'
  };
}

function buildTrackingTimeline(order, logisticInfo) {
  const createdDate = new Date(order.createdAt || Date.now());
  const approvedDate = new Date(order.approvedAt || order.createdAt || Date.now());
  const dispatchDate = new Date(approvedDate.getTime() + 24 * 60 * 60 * 1000);

  return [
    {
      title: 'Pedido Recebido',
      description: 'Registrado e confirmado no sistema Miracle Brasil',
      date: createdDate.toLocaleString('pt-BR'),
      completed: true,
      step: 1
    },
    {
      title: 'Pagamento Confirmado',
      description: order.status === 'paid' ? 'Pagamento aprovado instantaneamente via Pix' : 'Aguardando compensação Pix',
      date: approvedDate.toLocaleString('pt-BR'),
      completed: order.status === 'paid',
      step: 2
    },
    {
      title: 'Em Separação & Embalagem',
      description: 'Conferência de qualidade e embalagem no Centro Logístico São Paulo/SP',
      date: approvedDate.toLocaleString('pt-BR'),
      completed: order.status === 'paid',
      isCurrent: logisticInfo.logisticStatus === 'preparing',
      step: 3
    },
    {
      title: 'Em Transporte',
      description: logisticInfo.logisticStatus === 'in_transit' || logisticInfo.logisticStatus === 'delivered'
        ? 'Objeto postado no Centro de Distribuição SP e em trânsito para sua cidade'
        : 'Aguardando despacho para transportadora (Previsão: 24h após confirmação)',
      date: logisticInfo.elapsedHours >= 24 ? dispatchDate.toLocaleString('pt-BR') : 'Em andamento (24h)',
      completed: logisticInfo.logisticStatus === 'in_transit' || logisticInfo.logisticStatus === 'delivered',
      isCurrent: logisticInfo.logisticStatus === 'in_transit',
      step: 4
    },
    {
      title: 'Entregue ao Destinatário',
      description: 'Entrega final no endereço cadastrado',
      date: 'Prazo estimado: 8 a 12 dias úteis',
      completed: logisticInfo.logisticStatus === 'delivered',
      isCurrent: logisticInfo.logisticStatus === 'delivered',
      step: 5
    }
  ];
}

// API 4: Tracking Lookup Endpoint
app.get('/api/orders/track/:query', async (req, res) => {
  const query = (req.params.query || '').trim().toUpperCase();
  const digitsOnly = query.replace(/\D/g, '');

  let foundOrder = null;

  // 1. Query Supabase
  if (db.supabase) {
    try {
      let sbQuery = db.supabase
        .from('orders')
        .select('*')
        .or(`id.ilike.%${query}%,tracking_reference.ilike.%${query}%`);

      if (digitsOnly.length >= 11) {
        sbQuery = db.supabase
          .from('orders')
          .select('*')
          .eq('customer_cpf', digitsOnly);
      }

      const { data, error } = await sbQuery.limit(1).maybeSingle();
      if (!error && data) {
        foundOrder = {
          id: data.id,
          trackingReference: data.tracking_reference,
          status: data.status,
          orderStatus: data.order_status,
          customer: {
            name: data.customer_name,
            email: data.customer_email,
            phone: data.customer_phone,
            cpf: data.customer_cpf
          },
          shipping: data.shipping_address,
          amount: Number(data.amount),
          createdAt: data.created_at,
          approvedAt: data.approved_at,
          items: data.items,
          customLogisticStatus: data.custom_logistic_status
        };
      }
    } catch (sbErr) {
      console.warn('[Supabase Tracking Error]:', sbErr.message);
    }
  }

  // 2. Fallback to Local/Memory DB
  if (!foundOrder) {
    const localDb = db.readDB();
    foundOrder = Object.values(localDb.orders || {}).find(o => 
      (o.trackingReference && o.trackingReference.toUpperCase() === query) ||
      (o.id && o.id.toUpperCase() === query) ||
      (o.customer?.cpf && o.customer.cpf.replace(/\D/g, '') === digitsOnly)
    );
  }

  if (!foundOrder) {
    return res.status(404).json({ error: 'Nenhum pedido encontrado com este código ou CPF.' });
  }

  const logisticInfo = calculateLogisticStatus(foundOrder);
  const timeline = buildTrackingTimeline(foundOrder, logisticInfo);

  return res.json({
    orderId: foundOrder.id,
    trackingReference: foundOrder.trackingReference || foundOrder.id,
    status: foundOrder.status,
    orderStatus: foundOrder.orderStatus,
    customerName: foundOrder.customer?.name,
    amount: foundOrder.amount,
    createdAt: foundOrder.createdAt,
    approvedAt: foundOrder.approvedAt,
    items: foundOrder.items,
    shipping: foundOrder.shipping,
    logisticStatus: logisticInfo.logisticStatus,
    logisticLabel: logisticInfo.logisticLabel,
    currentStep: logisticInfo.currentStep,
    elapsedHours: logisticInfo.elapsedHours,
    timeline
  });
});

// Admin Endpoint: Update Tracking Code & Logistic Status
app.post('/api/admin/orders/:orderId/tracking', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { trackingReference, customLogisticStatus } = req.body;

    const order = await db.getOrderAsync(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    if (trackingReference) {
      order.trackingReference = trackingReference.trim().toUpperCase();
    }
    if (customLogisticStatus) {
      order.customLogisticStatus = customLogisticStatus;
    }
    order.updatedAt = new Date().toISOString();

    await db.saveOrderAsync(order);

    const logisticInfo = calculateLogisticStatus(order);

    return res.json({
      success: true,
      orderId: order.id,
      trackingReference: order.trackingReference,
      customLogisticStatus: order.customLogisticStatus,
      logisticLabel: logisticInfo.logisticLabel
    });
  } catch (err) {
    console.error('Error updating tracking:', err);
    return res.status(500).json({ error: 'Erro ao atualizar código de rastreio.' });
  }
});

// ==============================================================================
// ADMIN DASHBOARD API ENDPOINTS (MIRACLE BRASIL)
// ==============================================================================

// API 5: Get All Orders & Live Stats for Admin Dashboard
app.get('/api/admin/orders', async (req, res) => {
  try {
    let allOrders = [];

    // 1. Fetch from Supabase
    if (db.supabase) {
      try {
        const { data, error } = await db.supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);

        if (!error && Array.isArray(data)) {
          allOrders = data.map(row => {
            const rawOrder = {
              id: row.id,
              trackingReference: row.tracking_reference,
              status: row.status,
              orderStatus: row.order_status,
              amount: Number(row.amount),
              customer: {
                name: row.customer_name,
                email: row.customer_email,
                phone: row.customer_phone,
                cpf: row.customer_cpf
              },
              shipping: row.shipping_address || row.shipping,
              items: row.items || [],
              utm: row.utm_params || {},
              pixResult: row.pix_result || {},
              pixCopied: row.pix_copied || row.pix_result?.pixCopied || false,
              pixCopiedAt: row.pix_copied_at || row.pix_result?.pixCopiedAt || null,
              createdAt: row.created_at,
              approvedAt: row.approved_at,
              customLogisticStatus: row.custom_logistic_status
            };
            const logInfo = calculateLogisticStatus(rawOrder);
            return {
              ...rawOrder,
              logisticStatus: logInfo.logisticStatus,
              logisticLabel: logInfo.logisticLabel,
              elapsedHours: logInfo.elapsedHours
            };
          });
        }
      } catch (sbErr) {
        console.warn('[Supabase Admin Orders Error]:', sbErr.message);
      }
    }

    // 2. Fallback to Local/Memory DB
    if (allOrders.length === 0) {
      const localDb = db.readDB();
      allOrders = Object.values(localDb.orders || {}).map(o => {
        const logInfo = calculateLogisticStatus(o);
        return {
          ...o,
          pixCopied: o.pixCopied || o.pixResult?.pixCopied || false,
          pixCopiedAt: o.pixCopiedAt || o.pixResult?.pixCopiedAt || null,
          logisticStatus: logInfo.logisticStatus,
          logisticLabel: logInfo.logisticLabel,
          elapsedHours: logInfo.elapsedHours
        };
      }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Calculate Real-Time Stats
    const paidOrders = allOrders.filter(o => o.status === 'paid');
    const pendingOrders = allOrders.filter(o => o.status === 'pending_payment');
    const totalRev = paidOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
    const avgTicket = paidOrders.length > 0 ? totalRev / paidOrders.length : 0;
    const convRate = allOrders.length > 0 ? (paidOrders.length / allOrders.length) * 100 : 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayRev = paidOrders
      .filter(o => (o.createdAt || '').startsWith(todayStr) || (o.approvedAt || '').startsWith(todayStr))
      .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

    return res.json({
      success: true,
      orders: allOrders,
      stats: {
        totalRevenue: totalRev,
        todayRevenue: todayRev,
        totalPaidOrders: paidOrders.length,
        totalPendingOrders: pendingOrders.length,
        averageTicket: avgTicket,
        conversionRate: convRate,
        dailyChart: []
      }
    });
  } catch (err) {
    console.error('[Admin Orders API Error]:', err);
    return res.status(500).json({ error: 'Erro ao buscar pedidos do painel admin.' });
  }
});

// API 6: Approve Order Manually from Admin Dashboard
app.post('/api/admin/orders/:orderId/approve', async (req, res) => {
  try {
    const { orderId } = req.params;
    let order = await db.getOrderAsync(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    order.status = 'paid';
    order.orderStatus = 'paid';
    order.approvedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    await db.saveOrderAsync(order);

    // Dispatch PAID Event to UTMify Server-Side
    const utmifyResult = await sendUtmifyOrder(order, 'paid', { force: true, clientIp: req.ip });

    // Trigger Meta CAPI Purchase
    const capiResult = await triggerCapiPurchase(order, req);

    console.log(`[Admin] Order ${orderId} manually APPROVED by Admin.`);

    return res.json({
      success: true,
      orderId,
      status: 'paid',
      utmify: utmifyResult,
      capi: capiResult
    });
  } catch (err) {
    console.error('[Admin Approve Error]:', err);
    return res.status(500).json({ error: 'Erro ao aprovar pedido.' });
  }
});

// API 7: Manual Sale Dispatch to UTMify from Admin Dashboard
app.post('/api/admin/utmify/manual-sale', async (req, res) => {
  try {
    const { amount, customerName, customerEmail, customerPhone, customerCpf, utmSource, utmCampaign } = req.body;

    const numAmount = Number(amount) || 79.90;
    const orderId = `ORD-2026-ADM-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const trackingRef = `MB-ADM${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const orderRecord = {
      id: orderId,
      trackingReference: trackingRef,
      status: 'paid',
      orderStatus: 'paid',
      amount: numAmount,
      customer: {
        name: customerName || 'Cliente Miracle Admin',
        email: customerEmail || 'cliente@miracle.com',
        phone: customerPhone ? customerPhone.replace(/\D/g, '') : '12982890411',
        cpf: customerCpf ? customerCpf.replace(/\D/g, '') : '05367570038'
      },
      items: [
        {
          id: 'MANUAL-DISPATCH-ITEM',
          title: 'Cinta Body Modelador Miracle Belt (Venda Manual)',
          unitPrice: Math.round(numAmount * 100),
          quantity: 1,
          tangible: true
        }
      ],
      utm: {
        utm_source: utmSource || 'admin_dashboard',
        utm_campaign: utmCampaign || 'escala_manual',
        utm_medium: 'cpc'
      },
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString()
    };

    // Save to database
    await db.saveOrderAsync(orderRecord);

    // Dispatch to UTMify
    const utmifyResult = await sendUtmifyOrder(orderRecord, 'paid', { force: true, clientIp: req.ip });

    console.log(`[Admin Manual Sale] Dispatched R$ ${numAmount} to UTMify. (Order: ${orderId})`);

    return res.json({
      success: true,
      orderId,
      amount: numAmount,
      utmify: utmifyResult
    });
  } catch (err) {
    console.error('[Admin Manual Sale Error]:', err);
    return res.status(500).json({ error: 'Erro ao disparar venda manual para UTMify.' });
  }
});

// Serve static frontend build if dist folder exists
const DIST_PATH = path.join(__dirname, 'dist');

if (fs.existsSync(DIST_PATH)) {
  app.use(express.static(DIST_PATH, { maxAge: '1h' }));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile('index.html', { root: DIST_PATH });
  });
}

app.listen(PORT, async () => {
  console.log(`🚀 Payment Backend Server running on http://localhost:${PORT}`);

  // Auto-reconcile known paid orders from AxxonPay
  try {
    const knownPaidOrderIds = ['ORD-2026-76F2B916', 'ORD-2026-5C6A3EC7'];
    for (const orderId of knownPaidOrderIds) {
      let order = await db.getOrderAsync(orderId);
      if (order && order.status !== 'paid') {
        order.status = 'paid';
        order.orderStatus = 'paid';
        order.approvedAt = new Date().toISOString();
        order.updatedAt = new Date().toISOString();
        order.gateway = 'axxonpay';
        await db.saveOrderAsync(order);
        console.log(`[Auto-Reconcile] Order ${orderId} confirmed as PAID. Dispatching to UTMify & TikTok...`);
        try {
          await sendUtmifyOrder(order, 'paid', { force: true });
        } catch (e) {
          console.error(`[Auto-Reconcile UTMify Error] ${orderId}:`, e.message);
        }
        try {
          await triggerCapiPurchase(order);
        } catch (e) {
          console.error(`[Auto-Reconcile CAPI Error] ${orderId}:`, e.message);
        }
        broadcastRealtime('order_paid', {
          orderId: order.id,
          trackingReference: order.trackingReference,
          amount: order.amount,
          customerName: order.customer?.name,
          gateway: 'axxonpay',
          timestamp: new Date().toISOString()
        });
      }
    }
  } catch (recErr) {
    console.warn('[Auto-Reconcile Warning]:', recErr.message);
  }
});
