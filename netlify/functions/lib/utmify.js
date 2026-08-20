const db = require('./db');

const UTMIFY_API_URL = 'https://api.utmify.com.br/api-credentials/orders';

/**
 * Format a Date object or ISO string into 'YYYY-MM-DD HH:mm:ss' (UTC)
 */
function formatUtmifyDate(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return new Date().toISOString().replace('T', ' ').slice(0, 19);
  
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getUTCFullYear();
  const month = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const hours = pad(d.getUTCHours());
  const minutes = pad(d.getUTCMinutes());
  const seconds = pad(d.getUTCSeconds());
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Format and sanitize phone number (digits only)
 */
function sanitizePhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  return digits || null;
}

/**
 * Format and sanitize CPF/Document (digits only)
 */
function sanitizeDocument(doc) {
  if (!doc) return null;
  const digits = String(doc).replace(/\D/g, '');
  return digits || null;
}

/**
 * Map status to UTMify supported status enum:
 * 'waiting_payment' | 'paid' | 'refused' | 'refunded' | 'chargedback'
 */
function mapStatusToUtmify(rawStatus) {
  if (!rawStatus) return 'waiting_payment';
  const s = String(rawStatus).toLowerCase().trim();
  
  if (['paid', 'approved', 'settled', 'completed', 'paid_out', 'success'].includes(s)) {
    return 'paid';
  }
  if (['refunded', 'reimbursed'].includes(s)) {
    return 'refunded';
  }
  if (['refused', 'declined', 'cancelled', 'canceled', 'failed'].includes(s)) {
    return 'refused';
  }
  if (['chargedback', 'dispute'].includes(s)) {
    return 'chargedback';
  }
  return 'waiting_payment';
}

/**
 * Build UTMify compliant payload
 */
function buildUtmifyPayload(order, mappedStatus, options = {}) {
  const customer = order.customer || {};
  const utm = order.utm || {};
  
  // Calculate total in cents
  let totalInCents = 7990;
  if (typeof order.amount === 'number' && order.amount > 0) {
    totalInCents = Math.round(order.amount * 100);
  } else if (order.calculatedAmountCentavos) {
    totalInCents = order.calculatedAmountCentavos;
  }

  // Format products array
  const rawItems = Array.isArray(order.items) && order.items.length > 0
    ? order.items
    : [{ title: 'Cinta Body Modelador - Miracle Belt', unitPrice: totalInCents, quantity: 1 }];

  const products = rawItems.map((item, idx) => {
    const itemQty = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
    let itemPriceInCents = totalInCents;
    if (typeof item.unitPrice === 'number' && item.unitPrice > 0) {
      itemPriceInCents = item.unitPrice > 1000 ? item.unitPrice : Math.round(item.unitPrice * 100);
    }
    
    return {
      id: item.sku || item.productId || item.id || `PROD-MIRACLE-${idx + 1}`,
      name: item.title || item.name || 'Cinta Body Modelador - Miracle Belt',
      planId: null,
      planName: null,
      quantity: itemQty,
      priceInCents: itemPriceInCents
    };
  });

  const createdAtFormatted = formatUtmifyDate(order.createdAt);
  const isPaid = mappedStatus === 'paid';
  const approvedDateFormatted = isPaid ? formatUtmifyDate(order.approvedAt || order.updatedAt || new Date()) : null;

  const payload = {
    orderId: String(order.id),
    platform: 'Miracle',
    paymentMethod: order.paymentMethod || 'pix',
    status: mappedStatus,
    createdAt: createdAtFormatted,
    approvedDate: approvedDateFormatted,
    refundedAt: null,
    customer: {
      name: customer.name || 'Cliente Miracle',
      email: customer.email || 'cliente@miracle.com',
      phone: sanitizePhone(customer.phone) || '12982890411',
      document: sanitizeDocument(customer.cpf) || null,
      country: 'BR',
      ip: options.clientIp || customer.ip || '127.0.0.1'
    },
    products: products,
    trackingParameters: {
      src: utm.src || utm.utm_source || null,
      sck: utm.sck || null,
      utm_source: utm.utm_source || null,
      utm_campaign: utm.utm_campaign || null,
      utm_medium: utm.utm_medium || null,
      utm_content: utm.utm_content || null,
      utm_term: utm.utm_term || null
    },
    commission: {
      totalPriceInCents: totalInCents,
      gatewayFeeInCents: 0,
      userCommissionInCents: totalInCents,
      currency: 'BRL'
    },
    isTest: !!options.isTest
  };

  return payload;
}

/**
 * Centralized function to dispatch order events to UTMify with Idempotency Guard
 * 
 * @param {Object} order - Full order record
 * @param {string} targetStatus - 'pending' | 'waiting_payment' | 'paid' | 'approved'
 * @param {Object} options - { force: boolean, isTest: boolean, clientIp: string }
 */
async function sendUtmifyOrder(order, targetStatus, options = {}) {
  if (!order || !order.id) {
    console.error('[MIRACLE][UTMIFY][ERROR] Invalid order object passed to sendUtmifyOrder');
    return { success: false, error: 'INVALID_ORDER' };
  }

  const token = process.env.UTMIFY_API_TOKEN || 'FsJgKEwd4drMgkHF2zdOVRbwyH2o0C61ZGJ4';
  if (!token) {
    console.error('[MIRACLE][UTMIFY][ERROR] UTMIFY_API_TOKEN is missing in environment variables');
    return { success: false, error: 'UTMIFY_API_TOKEN_MISSING' };
  }

  const mappedStatus = mapStatusToUtmify(targetStatus);
  const idempotencyKey = `miracle_${order.id}_${mappedStatus}`;

  // 1. Idempotency Check: verify if already sent successfully
  const existingEvent = db.getIntegrationEvent(idempotencyKey);
  if (existingEvent && existingEvent.status === 'success' && !options.force) {
    console.log(`[MIRACLE][UTMIFY] order=${order.id} status=${mappedStatus} already_sent`);
    return {
      success: true,
      skipped: true,
      already_sent: true,
      idempotencyKey,
      sent_at: existingEvent.sent_at
    };
  }

  // 2. Build Payload
  const payload = buildUtmifyPayload(order, mappedStatus, options);

  // 3. Dispatch to UTMify API
  console.log(`[MIRACLE][UTMIFY] order=${order.id} status=${mappedStatus} sending`);

  try {
    const response = await fetch(UTMIFY_API_URL, {
      method: 'POST',
      headers: {
        'x-api-token': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let responseData = {};
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    if (response.ok) {
      console.log(`[MIRACLE][UTMIFY] order=${order.id} status=${mappedStatus} success`);

      // Record successful integration event
      db.saveIntegrationEvent({
        idempotency_key: idempotencyKey,
        provider: 'utmify',
        order_id: order.id,
        transaction_id: order.pixResult?.transactionId || order.transactionId || null,
        event_type: mappedStatus,
        payload: payload,
        status: 'success',
        response_status: response.status,
        response_body: responseData,
        error_message: null,
        sent_at: new Date().toISOString()
      });

      return {
        success: true,
        orderId: order.id,
        status: mappedStatus,
        httpStatus: response.status,
        response: responseData,
        idempotencyKey
      };
    } else {
      console.error(`[MIRACLE][UTMIFY][ERROR] order=${order.id} status=${mappedStatus} http=${response.status}`);

      // Record failed integration event for retry
      db.saveIntegrationEvent({
        idempotency_key: idempotencyKey,
        provider: 'utmify',
        order_id: order.id,
        transaction_id: order.pixResult?.transactionId || order.transactionId || null,
        event_type: mappedStatus,
        payload: payload,
        status: 'failed',
        response_status: response.status,
        response_body: responseData,
        error_message: `HTTP ${response.status}: ${responseText}`,
        sent_at: new Date().toISOString()
      });

      return {
        success: false,
        orderId: order.id,
        status: mappedStatus,
        httpStatus: response.status,
        error: responseText,
        idempotencyKey
      };
    }
  } catch (err) {
    console.error(`[MIRACLE][UTMIFY][ERROR] order=${order.id} status=${mappedStatus} exception=${err.message}`);

    db.saveIntegrationEvent({
      idempotency_key: idempotencyKey,
      provider: 'utmify',
      order_id: order.id,
      transaction_id: order.pixResult?.transactionId || order.transactionId || null,
      event_type: mappedStatus,
      payload: payload,
      status: 'failed',
      response_status: 0,
      response_body: null,
      error_message: err.message,
      sent_at: new Date().toISOString()
    });

    return {
      success: false,
      orderId: order.id,
      status: mappedStatus,
      error: err.message,
      idempotencyKey
    };
  }
}

module.exports = {
  sendUtmifyOrder,
  buildUtmifyPayload,
  mapStatusToUtmify,
  formatUtmifyDate
};
