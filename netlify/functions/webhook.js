const crypto = require('crypto');
const db = require('./lib/db');
const { sendUtmifyOrder } = require('./lib/utmify');

function hashSHA256(val) {
  if (!val || typeof val !== 'string') return undefined;
  return crypto.createHash('sha256').update(val.trim().toLowerCase()).digest('hex');
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const isTestTrigger = event.queryStringParameters?.test === 'true';
    const body = event.body ? JSON.parse(event.body) : {};

    const transactionId = body?.id || body?.transactionId || body?.data?.id || `TEST-${Date.now()}`;
    const eventStatus = isTestTrigger ? 'paid' : (body?.status || body?.data?.status || '');
    const metaOrderId = body?.metadata?.order_id || body?.orderId;
    
    // 1. Locate order by transaction ID or Order ID
    let order = await db.getOrderByTransactionIdAsync(transactionId);
    if (!order && metaOrderId) {
      order = await db.getOrderAsync(metaOrderId);
    }

    const orderId = order?.id || metaOrderId || `ORD-2026-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const amountVal = order?.amount || (body?.amount || body?.data?.amount || 7990) / 100;
    const userEmail = order?.customer?.email || body?.customer?.email || body?.data?.customer?.email || 'cliente@miracle.com';
    const userPhone = order?.customer?.phone || body?.data?.customer?.phone || '12982890411';

    const validPaidStatuses = ['paid', 'approved', 'settled', 'completed', 'paid_out', 'success'];
    const isPaidEvent = validPaidStatuses.includes(eventStatus.toLowerCase());

    console.log(`[Gateway Webhook] Event status received: "${eventStatus}" for Order: ${orderId} (Tx: ${transactionId})`);

    if (isPaidEvent) {
      // 2. Check Idempotency: if already processed and sent to UTMify, avoid duplicate work
      const idempotencyKey = `miracle_${orderId}_paid`;
      const existingIntegration = await db.getIntegrationEventAsync(idempotencyKey);
      if (existingIntegration && existingIntegration.status === 'success') {
        console.log(`[Gateway Webhook] Order ${orderId} already processed (idempotency key: ${idempotencyKey}). Skipping duplicate execution.`);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            received: true,
            already_processed: true,
            orderId,
            idempotencyKey
          })
        };
      }

      // 3. Update order in database to PAID
      if (order) {
        order.status = 'paid';
        order.orderStatus = 'paid';
        order.approvedAt = new Date().toISOString();
        order.updatedAt = new Date().toISOString();
        await db.saveOrderAsync(order);
      } else {
        // Create order placeholder if webhook came without prior local record
        order = {
          id: orderId,
          status: 'paid',
          orderStatus: 'paid',
          amount: amountVal,
          customer: {
            name: body?.customer?.name || 'Cliente Miracle',
            email: userEmail,
            phone: userPhone,
            cpf: body?.customer?.document?.number || body?.customer?.cpf || ''
          },
          items: [{ title: 'Cinta Body Modelador - Miracle Belt', unitPrice: Math.round(amountVal * 100), quantity: 1 }],
          utm: body?.metadata || {},
          approvedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        await db.saveOrderAsync(order);
      }

      // 4. Dispatch PAID Event to UTMify Server-Side
      const utmifyResult = await sendUtmifyOrder(order, 'paid', {
        clientIp: event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for']?.split(',')[0] || '127.0.0.1'
      });

      // 5. Dispatch Meta CAPI Purchase Server-Side (with deduplication guard)
      const META_PIXEL_ID = process.env.META_PIXEL_ID || process.env.VITE_META_PIXEL_ID || '2645703275845738';
      const META_CAPI_ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN || '';
      const META_TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE || '';

      let capiSent = false;
      if (META_CAPI_ACCESS_TOKEN && !META_CAPI_ACCESS_TOKEN.includes('PLACEHOLDER')) {
        try {
          const clientIp = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for']?.split(',')[0] || '127.0.0.1';
          const userAgent = event.headers['user-agent'] || '';
          const eventId = `purchase_${orderId}`;

          const capiPayload = {
            data: [
              {
                event_name: 'Purchase',
                event_time: Math.floor(Date.now() / 1000),
                event_id: eventId,
                action_source: 'website',
                event_source_url: 'https://miraclebelt.com.br/obrigado',
                user_data: {
                  em: userEmail ? [hashSHA256(userEmail)] : undefined,
                  ph: userPhone ? [hashSHA256(userPhone)] : undefined,
                  client_ip_address: clientIp,
                  client_user_agent: userAgent
                },
                custom_data: {
                  currency: 'BRL',
                  value: amountVal,
                  order_id: orderId,
                  content_type: 'product',
                  content_ids: ['CMFBPM001-BFPP']
                }
              }
            ]
          };

          if (META_TEST_EVENT_CODE) {
            capiPayload.test_event_code = META_TEST_EVENT_CODE;
          }

          console.log(`[Meta CAPI] Dispatching Purchase for Order ${orderId} value R$ ${amountVal}...`);

          const capiRes = await fetch(`https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${META_CAPI_ACCESS_TOKEN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(capiPayload)
          });
          capiSent = capiRes.ok;
        } catch (capiErr) {
          console.error('[Meta CAPI Webhook Error]:', capiErr.message);
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          received: true,
          processed: true,
          orderId,
          status: 'paid',
          utmify: utmifyResult,
          capiSent
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true, status: eventStatus, processed: false })
    };
  } catch (err) {
    console.error('[Netlify Webhook Error]:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
