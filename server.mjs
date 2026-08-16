import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { sendMetaCapiEvent } from './backend/services/metaConversionsApi.mjs';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.SERVER_PORT || 3002;
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

    const beehivePayload = {
      amount: calculatedAmountCentavos,
      paymentMethod: 'pix',
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone ? customer.phone.replace(/\D/g, '') : '37991550358',
        document: {
          type: 'cpf',
          number: customer.cpf.replace(/\D/g, '')
        }
      },
      items: [
        {
          title: items?.[0]?.title || 'Cinta Body Modelador - Miracle Belt',
          unitPrice: calculatedAmountCentavos,
          quantity: 1,
          tangible: true
        }
      ],
      metadata: {
        provider: 'miracle',
        user_email: customer.email,
        order_id: orderId,
        ...(utm || {})
      },
      postbackUrl: 'https://miracleclube.netlify.app/.netlify/functions/webhook',
      pix: { expiresInSeconds: 1800 }
    };

    let pixResult = null;

    if (BEEHIVE_SECRET_KEY && !BEEHIVE_SECRET_KEY.includes('placeholder')) {
      try {
        const authHeader = `Basic ${Buffer.from(`${BEEHIVE_SECRET_KEY}:x`).toString('base64')}`;
        const bhResponse = await fetch('https://api.conta.paybeehive.com.br/v1/transactions', {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(beehivePayload)
        });

        const bhText = await bhResponse.text();
        console.log(`[Beehive Response] Status ${bhResponse.status}:`, bhText);

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
        }
      } catch (e) {
        console.error('Beehive Live API call error:', e);
      }
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

    db.orders[orderId] = orderRecord;
    db.transactions[pixResult.transactionId] = orderId;
    writeDB(db);

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
app.get('/api/orders/:orderId/status', (req, res) => {
  const { orderId } = req.params;
  const db = readDB();
  const order = db.orders[orderId];

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

    const db = readDB();
    const orderId = db.transactions[transactionId];

    if (orderId && db.orders[orderId]) {
      const order = db.orders[orderId];

      if (eventStatus === 'paid' || eventStatus === 'approved' || eventStatus === 'settled') {
        order.status = 'paid';
        order.orderStatus = 'paid';
        order.updatedAt = new Date().toISOString();
        db.orders[orderId] = order;
        writeDB(db);

        console.log(`Order ${orderId} updated to PAID via Webhook`);

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
  const db = readDB();
  const order = db.orders[orderId];

  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }

  order.status = 'paid';
  order.orderStatus = 'paid';
  order.updatedAt = new Date().toISOString();
  db.orders[orderId] = order;
  writeDB(db);

  console.log(`[Test API] Order ${orderId} manually confirmed as PAID.`);

  const capiResult = await triggerCapiPurchase(order, req);

  return res.json({
    success: true,
    orderId,
    status: 'paid',
    capiResult
  });
});

// API 4: Tracking Lookup Endpoint
app.get('/api/orders/track/:query', (req, res) => {
  const query = (req.params.query || '').trim().toUpperCase();
  const db = readDB();

  const found = Object.values(db.orders).find(o => 
    (o.trackingReference && o.trackingReference.toUpperCase() === query) ||
    (o.id && o.id.toUpperCase() === query) ||
    (o.customer?.cpf && o.customer.cpf.replace(/\D/g, '') === query.replace(/\D/g, ''))
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
