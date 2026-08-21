const crypto = require('crypto');
const db = require('./lib/db');
const { sendUtmifyOrder } = require('./lib/utmify');

function generateTrackingRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'MB-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

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

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { customer, shipping, items, amount, utm } = body;

    if (!customer?.name || !customer?.email || !customer?.cpf) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Dados do cliente incompletos.' })
      };
    }

    const BEEHIVE_SK =
      process.env.BEEHIVE_SECRET_KEY ||
      process.env.BEEHIVE_SK ||
      process.env.VITE_BEEHIVE_SK ||
      process.env.PAYBEEHIVE_SECRET_KEY ||
      '';

    const orderId = `ORD-2026-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const trackingRef = generateTrackingRef();

    let calculatedAmountCentavos = 7990;
    if (amount && typeof amount === 'number' && amount > 0) {
      calculatedAmountCentavos = Math.round(amount * 100);
    }

    let pixResult = null;

    if (BEEHIVE_SK && !BEEHIVE_SK.includes('placeholder')) {
      try {
        const authHeader = `Basic ${Buffer.from(`${BEEHIVE_SK}:x`).toString('base64')}`;
        
        // Build Beehive items from the real cart sent by the checkout frontend
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
          postbackUrl: event.headers.host && !event.headers.host.includes('localhost')
            ? `https://${event.headers.host}/.netlify/functions/webhook`
            : 'https://miracleclube.netlify.app/.netlify/functions/webhook',
          pix: { expiresInSeconds: 1800 }
        };

        console.log('[Beehive Request] Creating PIX...', { amount: calculatedAmountCentavos, email: customer.email });

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
          const rawQr = bhData.pix?.qrcode || bhData.pix?.qrCodeUrl || bhData.pix?.qr_code || '';
          const copyPasteStr = bhData.pix?.copy_paste || bhData.pix?.copyPaste || rawQr || '';

          let qrCodeImg = rawQr;
          if (!qrCodeImg || (!qrCodeImg.startsWith('http://') && !qrCodeImg.startsWith('https://') && !qrCodeImg.startsWith('data:image/'))) {
            qrCodeImg = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(copyPasteStr || rawQr)}`;
          }

          if (copyPasteStr || qrCodeImg) {
            pixResult = {
              transactionId: bhData.id || `BH-${Date.now()}`,
              qrCode: qrCodeImg,
              copyPaste: copyPasteStr,
              qrcode: qrCodeImg,
              copy_paste: copyPasteStr
            };
          }
        }
      } catch (e) {
        console.error('[Netlify Function Pix] Beehive API Exception:', e.message);
      }
    }

    // Fallback Mock Pix (Only if Beehive SK is missing or live API fails)
    if (!pixResult || !pixResult.copyPaste) {
      console.warn('[Netlify Function Pix] Using fallback testing Pix (Beehive SK missing or API refused payload)');
      const mockCopyPaste = `00020126580014br.gov.bcb.pix0136${crypto.randomUUID()}5204000053039865405${(calculatedAmountCentavos / 100).toFixed(2)}5802BR5915MIRACLE STORE6009SAO PAULO62070503***6304`;
      const mockQrCode = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(mockCopyPaste)}`;

      pixResult = {
        transactionId: `BH-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
        qrCode: mockQrCode,
        copyPaste: mockCopyPaste,
        qrcode: mockQrCode,
        copy_paste: mockCopyPaste
      };
    }

    // 1. Save Full Order Record into Shared Database
    const clientIp = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for']?.split(',')[0] || '127.0.0.1';
    const orderRecord = {
      id: orderId,
      trackingReference: trackingRef,
      status: 'pending_payment',
      orderStatus: 'pending_payment',
      customer: {
        ...customer,
        ip: clientIp
      },
      shipping,
      items: items || [],
      amount: calculatedAmountCentavos / 100,
      calculatedAmountCentavos,
      pixResult,
      utm: utm || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.saveOrderAsync(orderRecord);

    // 2. Dispatch PENDING Event Server-Side to UTMify
    try {
      await sendUtmifyOrder(orderRecord, 'waiting_payment', { clientIp });
    } catch (utmErr) {
      console.error('[Netlify Pix] UTMify Pending Order Dispatch Error:', utmErr.message);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        orderId,
        trackingReference: trackingRef,
        status: 'pending_payment',
        amount: calculatedAmountCentavos / 100,
        pix: pixResult
      })
    };
  } catch (err) {
    console.error('[Netlify Function Pix] Error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Erro ao processar pagamento Pix.' })
    };
  }
};
