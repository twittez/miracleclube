import crypto from 'crypto';

/**
 * TikTok Events API (Conversions API v1.3) Service
 * Strictly Server-Side. Access token is NEVER exposed to frontend.
 */

const TIKTOK_PIXEL_ID = process.env.TIKTOK_PIXEL_ID || 'DAB50ARC77UEOA3OAHCG';
const TIKTOK_ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN || '9eec830b89505ec914c07b60a0ffcaed5e50cc6d';
const TIKTOK_API_URL = 'https://business-api.tiktok.com/open_api/v1.3/event/track/';

function hashSHA256(value) {
  if (!value || typeof value !== 'string') return undefined;
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

function hashPhoneE164(phone) {
  if (!phone || typeof phone !== 'string') return undefined;
  let digits = phone.replace(/\D/g, '');
  if (!digits) return undefined;
  if (!digits.startsWith('55')) {
    digits = '55' + digits;
  }
  // TikTok expects E.164 format with leading '+'
  const e164 = '+' + digits;
  return crypto.createHash('sha256').update(e164).digest('hex');
}

/**
 * Send Event to TikTok Events API v1.3
 * 
 * @param {string} eventName - e.g. 'CompletePayment', 'PlaceAnOrder', 'InitiateCheckout'
 * @param {string} eventId - Unique ID for deduplication with browser pixel
 * @param {object} order - Order details containing customer, amount, utm, etc.
 * @param {object} [req] - Express request object for IP and User-Agent extraction
 */
export async function sendTikTokEvent(eventName, eventId, order, req) {
  try {
    if (!TIKTOK_ACCESS_TOKEN || TIKTOK_ACCESS_TOKEN.includes('PLACEHOLDER')) {
      console.log(`[TikTok Events API] Token is not configured. Event '${eventName}' (${eventId}) skipped dispatch.`);
      return { success: false, reason: 'NO_TOKEN' };
    }

    const { email, phone, cpf } = order.customer || {};

    const clientIp = req ? (req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || req.ip) : undefined;
    const userAgent = req ? req.headers['user-agent'] : (order.utm?.user_agent || undefined);
    const referer = req ? (req.headers['referer'] || 'https://miraclebrasil.com') : 'https://miraclebrasil.com';

    const userObj = {};
    if (email) userObj.email = hashSHA256(email);
    if (phone) userObj.phone_number = hashPhoneE164(phone);
    if (cpf) userObj.external_id = hashSHA256(cpf.replace(/\D/g, ''));
    if (order.utm?.ttclid) userObj.ttclid = order.utm.ttclid;
    if (order.utm?.ttp) userObj.ttp = order.utm.ttp;

    const contextObj = {};
    if (clientIp) contextObj.ip = clientIp;
    if (userAgent) contextObj.user_agent = userAgent;
    contextObj.page = { url: referer };

    const payload = {
      event_source: 'web',
      event_source_id: TIKTOK_PIXEL_ID,
      data: [
        {
          event: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          user: userObj,
          context: contextObj,
          properties: {
            currency: 'BRL',
            value: Number(order.amount || 0),
            content_type: 'product',
            contents: [
              {
                content_id: 'CMFBPM001-BFPP',
                content_type: 'product',
                content_name: 'Body Modelador Feminino Pré-Moldado',
                quantity: 1,
                price: Number(order.amount || 0)
              }
            ]
          }
        }
      ]
    };

    console.log(`[TikTok Events API Dispatching] Event: ${eventName} | EventID: ${eventId} | PixelID: ${TIKTOK_PIXEL_ID}`);

    const response = await fetch(TIKTOK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': TIKTOK_ACCESS_TOKEN
      },
      body: JSON.stringify(payload)
    });

    const resData = await response.json();

    if (response.ok && resData.code === 0) {
      console.log(`[TikTok Events API Success] Event: ${eventName} | EventID: ${eventId} | Code: ${resData.code} | Message: ${resData.message}`);
      return { success: true, resData };
    } else {
      console.error(`[TikTok Events API Error] Event: ${eventName} | EventID: ${eventId} | Status: ${response.status} | Response:`, resData);
      return { success: false, error: resData };
    }
  } catch (err) {
    console.error(`[TikTok Events API Exception] Event: ${eventName} | EventID: ${eventId} | Error:`, err);
    return { success: false, error: err.message };
  }
}
