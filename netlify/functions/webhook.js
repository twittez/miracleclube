const crypto = require('crypto');

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
    const userEmail = body?.customer?.email || body?.data?.customer?.email || event.queryStringParameters?.email || 'cliente@exemplo.com.br';
    const userPhone = body?.customer?.phone || body?.data?.customer?.phone || '12982890411';
    const orderId = body?.metadata?.order_id || body?.orderId || `ORD-2026-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const amountVal = (body?.amount || body?.data?.amount || 7191) / 100;

    const META_PIXEL_ID = process.env.META_PIXEL_ID || process.env.VITE_META_PIXEL_ID || '2645703275845738';
    const META_CAPI_ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN || '';
    const META_TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE || '';

    const validStatuses = ['paid', 'approved', 'settled', 'completed', 'paid_out', 'success'];

    console.log(`[Beehive Webhook] Event status received: "${eventStatus}" for Order: ${orderId}`);

    if (validStatuses.includes(eventStatus.toLowerCase())) {
      if (!META_CAPI_ACCESS_TOKEN || META_CAPI_ACCESS_TOKEN.includes('PLACEHOLDER')) {
        console.warn('[Meta CAPI Warning] META_CAPI_ACCESS_TOKEN missing or placeholder in Netlify environment variables!');
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ received: true, capi: false, reason: 'META_CAPI_ACCESS_TOKEN_MISSING' })
        };
      }

      const eventId = `purchase_${orderId}`;
      const clientIp = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for']?.split(',')[0] || '127.0.0.1';
      const userAgent = event.headers['user-agent'] || '';

      const capiData = {
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
      };

      const capiPayload = {
        data: [capiData]
      };

      if (META_TEST_EVENT_CODE) {
        capiPayload.test_event_code = META_TEST_EVENT_CODE;
      }

      console.log(`[Meta CAPI] Dispatching Purchase for Order ${orderId} with value R$ ${amountVal}...`);

      const capiRes = await fetch(`https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${META_CAPI_ACCESS_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(capiPayload)
      });

      const capiResultText = await capiRes.text();
      console.log(`[Meta CAPI Response] Status ${capiRes.status}:`, capiResultText);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          received: true,
          capiSent: true,
          orderId,
          eventId,
          capiResponse: JSON.parse(capiResultText || '{}')
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true, capi: false, status: eventStatus })
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
