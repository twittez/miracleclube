const crypto = require('crypto');

function hashSHA256(val) {
  if (!val || typeof val !== 'string') return undefined;
  return crypto.createHash('sha256').update(val.trim().toLowerCase()).digest('hex');
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const transactionId = body?.id || body?.transactionId || body?.data?.id;
    const eventStatus = body?.status || body?.data?.status;

    const META_PIXEL_ID = process.env.META_PIXEL_ID || '2645703275845738';
    const META_CAPI_ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN || '';

    if (eventStatus === 'paid' || eventStatus === 'approved' || eventStatus === 'settled') {
      if (META_CAPI_ACCESS_TOKEN && !META_CAPI_ACCESS_TOKEN.includes('PLACEHOLDER')) {
        const orderId = body.orderId || `ORD-${Date.now()}`;
        const eventId = `purchase_${orderId}`;

        const payload = {
          data: [
            {
              event_name: 'Purchase',
              event_time: Math.floor(Date.now() / 1000),
              event_id: eventId,
              action_source: 'website',
              event_source_url: 'https://miraclebelt.com.br/obrigado',
              user_data: {
                em: body.customer?.email ? [hashSHA256(body.customer.email)] : undefined,
                client_ip_address: event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for']?.split(',')[0]
              },
              custom_data: {
                currency: 'BRL',
                value: (body.amount || 14391) / 100,
                order_id: orderId,
                content_type: 'product',
                content_ids: ['CMFBPM001-BFPP']
              }
            }
          ]
        };

        await fetch(`https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${META_CAPI_ACCESS_TOKEN}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(e => console.error('[Netlify Webhook CAPI Error]:', e));
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
