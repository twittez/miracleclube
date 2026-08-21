import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createRequire } from 'module';
import { sendMetaCapiEvent } from './backend/services/metaConversionsApi.mjs';

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

// Helper to trigger CAPI Purchase with deduplication guard
async function triggerCapiPurchase(order, req) {
  if (!order || !order.id) return { success: false, reason: 'INVALID_ORDER' };

  if (order.meta_purchase_sent) {
    console.log(`[CAPI Guard] Purchase already sent for Order ${order.id} (ID: ${order.meta_purchase_event_id}). Skipping duplicate CAPI call.`);
    return { success: true, duplicate: true };
  }

  const purchaseEventId = `purchase_${order.id}`;
  order.meta_purchase_sent = true;
  order.meta_purchase_event_id = purchaseEventId;
  order.meta_purchase_sent_at = new Date().toISOString();

  const db = readDB();
  db.orders[order.id] = order;
  writeDB(db);

  return await sendMetaCapiEvent('Purchase', purchaseEventId, order, req);
}

// API 0: Log Card Declined Event (CarTapetes Conversion Funnel)
app.post('/api/payments/card-declined', (req, res) => {
  try {
    const { customer, cardBrand, amount } = req.body;
    console.log(`[Card Recusal Log] Lead: ${customer?.name} (${customer?.email}) - Card Brand: ${cardBrand} - Amount: R$ ${amount}`);
    return res.json({ logged: true, status: 'declined' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao registrar tentativa de cartão.' });
  }
});

// API 1: Create Pix Payment
app.post('/api/payments/pix', async (req, res) => {
  try {
    const { customer, shipping, items, amount, utm } = req.body;

    if (!customer?.name || !customer?.email || !customer?.cpf) {
      return res.status(400).json({ error: 'Dados do cliente incompletos.' });
    }

    const db = readDB();

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

    if (BEEHIVE_SECRET_KEY && !BEEHIVE_SECRET_KEY.includes('placeholder')) {
      try {
        const authHeader = `Basic ${Buffer.from(`${BEEHIVE_SECRET_KEY.trim()}:x`).toString('base64')}`;
        console.log(`[Beehive Request] Creating PIX for Order ${orderId}...`, { amount: calculatedAmountCentavos, email: customer.email });

        const bhResponse = await fetch('https://api.conta.paybeehive.com.br/v1/transactions', {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(beehivePayload)
        });

        const bhText = await bhResponse.text();
        console.log(`[Beehive Response] HTTP ${bhResponse.status}:`, bhText);

        if (bhResponse.ok) {
          const bhData = JSON.parse(bhText);
          const qrCodeUrl = bhData.pix?.qrcode || bhData.pix?.qrCodeUrl || bhData.pix?.qr_code || '';
          const copyPasteStr = bhData.pix?.copy_paste || bhData.pix?.copyPaste || bhData.pix?.qrcode || '';

          if (copyPasteStr) {
            pixResult = {
              transactionId: bhData.id || `BH-${Date.now()}`,
              qrCode: qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(copyPasteStr)}`,
              copyPaste: copyPasteStr,
              qrcode: qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(copyPasteStr)}`,
              copy_paste: copyPasteStr
            };
          }
        } else {
          console.error(`[Beehive API Error] Status ${bhResponse.status}:`, bhText);
        }
      } catch (e) {
        console.error('[Beehive API Exception]:', e.message);
      }
    } else {
      console.warn('[Beehive Warning] BEEHIVE_SECRET_KEY is missing or contains placeholder. Please set BEEHIVE_SECRET_KEY in your .env file.');
    }

    // Fallback Mock Pix
    if (!pixResult || !pixResult.copyPaste) {
      const mockCopyPaste = `00020126580014br.gov.bcb.pix0136${crypto.randomUUID()}5204000053039865405${(calculatedAmountCentavos / 100).toFixed(2)}5802BR5915MIRACLE STORE6009SAO PAULO62070503***6304`;
      const mockQrCode = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(mockCopyPaste)}`;

      pixResult = {
        transactionId: `BH-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
        qrCode: mockQrCode,
        copyPaste: mockCopyPaste,
        qrcode: mockQrCode,
        copy_paste: mockCopyPaste
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
      pixResult,
      utm: utm || {},
      meta_purchase_sent: false,
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

    return res.json({
      success: true,
      orderId,
      trackingReference: trackingRef,
      status: 'pending_payment',
      amount: orderRecord.amount,
      pix: pixResult
    });
  } catch (err) {
    console.error('Payment endpoint error:', err);
    return res.status(500).json({ error: 'Erro ao processar pagamento.' });
  }
});

// API 2: Get Order Status for ThankYou Polling
app.get('/api/orders/:orderId/status', async (req, res) => {
  const { orderId } = req.params;
  const order = await db.getOrderAsync(orderId);

  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }

  return res.json({
    orderId: order.id,
    trackingReference: order.trackingReference,
    status: order.status,
    orderStatus: order.orderStatus,
    amount: order.amount,
    pix: order.pixResult,
    createdAt: order.createdAt,
    meta_purchase_sent: !!order.meta_purchase_sent
  });
});

// API 3: Webhook Handler from Beehive
app.post('/api/webhooks/beehive', async (req, res) => {
  try {
    const event = req.body;
    const transactionId = event?.id || event?.transactionId || event?.data?.id;
    const eventStatus = event?.status || event?.data?.status;

    if (!transactionId) {
      return res.status(400).json({ error: 'ID de transação não informado.' });
    }

    let order = await db.getOrderByTransactionIdAsync(transactionId);
    if (!order && event?.metadata?.order_id) {
      order = await db.getOrderAsync(event.metadata.order_id);
    }

    if (order) {
      if (eventStatus === 'paid' || eventStatus === 'approved' || eventStatus === 'settled') {
        order.status = 'paid';
        order.orderStatus = 'paid';
        order.approvedAt = new Date().toISOString();
        order.updatedAt = new Date().toISOString();
        await db.saveOrderAsync(order);

        console.log(`Order ${order.id} updated to PAID via Webhook in Supabase`);

        // Dispatch PAID Event to UTMify Server-Side (with Idempotency Guard)
        await sendUtmifyOrder(order, 'paid', { clientIp: req.ip });

        // Trigger Meta CAPI Purchase with Deduplication Guard
        await triggerCapiPurchase(order, req);
      }
    }

    return res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Erro no processamento do webhook.' });
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

// API 4: Tracking Lookup Endpoint
app.get('/api/orders/track/:query', async (req, res) => {
  const query = (req.params.query || '').trim().toUpperCase();
  const digitsOnly = query.replace(/\D/g, '');

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
        return res.json({
          orderId: data.id,
          trackingReference: data.tracking_reference,
          status: data.status,
          orderStatus: data.order_status,
          customerName: data.customer_name,
          amount: Number(data.amount),
          createdAt: data.created_at,
          items: data.items
        });
      }
    } catch (sbErr) {
      console.warn('[Supabase Tracking Error]:', sbErr.message);
    }
  }

  // 2. Fallback to Local/Memory DB
  const localDb = db.readDB();
  const found = Object.values(localDb.orders || {}).find(o => 
    (o.trackingReference && o.trackingReference.toUpperCase() === query) ||
    (o.id && o.id.toUpperCase() === query) ||
    (o.customer?.cpf && o.customer.cpf.replace(/\D/g, '') === digitsOnly)
  );

  if (!found) {
    return res.status(404).json({ error: 'Nenhum pedido encontrado com este código ou CPF.' });
  }

  return res.json({
    orderId: found.id,
    trackingReference: found.trackingReference,
    status: found.status,
    orderStatus: found.orderStatus,
    customerName: found.customer?.name,
    amount: found.amount,
    createdAt: found.createdAt,
    items: found.items
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Payment Backend Server running on http://localhost:${PORT}`);
});
