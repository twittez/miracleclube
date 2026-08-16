import crypto from 'crypto';

/**
 * Meta Conversions API (CAPI) Service
 * Strictly Server-Side. Access token is NEVER sent to frontend.
 */

const META_PIXEL_ID = process.env.META_PIXEL_ID || '2645703275845738';
const META_CAPI_ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN || '';
const META_TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE || '';

function hashSHA256(value) {
  if (!value || typeof value !== 'string') return undefined;
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

function hashPhone(phone) {
  if (!phone || typeof phone !== 'string') return undefined;
  let digits = phone.replace(/\D/g, '');
  if (!digits.startsWith('55')) {
    digits = '55' + digits;
  }
  return crypto.createHash('sha256').update(digits).digest('hex');
}

function extractNames(fullName) {
  if (!fullName || typeof fullName !== 'string') return { firstName: '', lastName: '' };
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';
  return { firstName, lastName };
}

/**
 * Send Event to Meta Conversions API
 */
export async function sendMetaCapiEvent(eventName, eventId, order, req) {
  try {
    if (!META_CAPI_ACCESS_TOKEN || META_CAPI_ACCESS_TOKEN.includes('PLACEHOLDER')) {
      console.log(`[CAPI Info] META_CAPI_ACCESS_TOKEN is not configured. Event '${eventName}' (${eventId}) skipped CAPI dispatch.`);
      return { success: false, reason: 'NO_TOKEN' };
    }

    const { name, email, phone } = order.customer || {};
    const { firstName, lastName } = extractNames(name);

    const clientIp = req ? (req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || req.ip) : undefined;
    const userAgent = req ? req.headers['user-agent'] : (order.utm?.user_agent || undefined);

    const userData = {
      em: email ? [hashSHA256(email)] : undefined,
      ph: phone ? [hashPhone(phone)] : undefined,
      fn: firstName ? [hashSHA256(firstName)] : undefined,
      ln: lastName ? [hashSHA256(lastName)] : undefined,
      client_ip_address: clientIp || undefined,
      client_user_agent: userAgent || undefined,
      fbp: order.utm?.fbp || undefined,
      fbc: order.utm?.fbc || undefined
    };

    // Remove undefined fields
    Object.keys(userData).forEach(key => {
      if (userData[key] === undefined) delete userData[key];
    });

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          action_source: 'website',
          event_source_url: req ? (req.headers['referer'] || 'https://miraclebelt.com.br') : 'https://miraclebelt.com.br',
          user_data: userData,
          custom_data: {
            currency: 'BRL',
            value: Number(order.amount),
            order_id: order.id,
            content_type: 'product',
            content_ids: ['CMFBPM001-BFPP']
          },
          test_event_code: META_TEST_EVENT_CODE || undefined
        }
      ]
    };

    console.log(`[CAPI Dispatching] Event: ${eventName} | ID: ${eventId} | PixelID: ${META_PIXEL_ID}`);

    const endpointUrl = `https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${META_CAPI_ACCESS_TOKEN}`;

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const resData = await response.json();

    if (response.ok) {
      console.log(`[CAPI Success] Event: ${eventName} | EventID: ${eventId} | Events Received: ${resData.events_received}`);
      return { success: true, resData };
    } else {
      console.error(`[CAPI Error] Event: ${eventName} | EventID: ${eventId} | Response:`, resData);
      return { success: false, error: resData };
    }
  } catch (err) {
    console.error(`[CAPI Exception] Event: ${eventName} | EventID: ${eventId} | Error:`, err);
    return { success: false, error: err.message };
  }
}
