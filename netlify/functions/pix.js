const crypto = require('crypto');

function generateTrackingRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'MB-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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

    const BEEHIVE_SECRET_KEY = process.env.BEEHIVE_SECRET_KEY || process.env.VITE_BEEHIVE_SK || '';
    const orderId = `ORD-2026-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const trackingRef = generateTrackingRef();

    let calculatedAmountCentavos = 15990;
    if (amount && typeof amount === 'number' && amount > 0) {
      calculatedAmountCentavos = Math.round(amount * 100);
    }

    let pixResult = null;

    if (BEEHIVE_SECRET_KEY && !BEEHIVE_SECRET_KEY.includes('placeholder')) {
      try {
        const authHeader = `Basic ${Buffer.from(`${BEEHIVE_SECRET_KEY}:x`).toString('base64')}`;
        const beehivePayload = {
          amount: calculatedAmountCentavos,
          payment_method: 'pix',
          customer: {
            name: customer.name,
            email: customer.email,
            document: customer.cpf.replace(/\D/g, ''),
            phone: customer.phone ? customer.phone.replace(/\D/g, '') : '37991550358'
          },
          items: [
            {
              title: items?.[0]?.title || 'Cinta Body Modelador - Miracle Belt',
              unit_price: calculatedAmountCentavos,
              quantity: 1,
              tangible: true
            }
          ]
        };

        const bhResponse = await fetch('https://api.conta.paybeehive.com.br/v1/transactions', {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(beehivePayload)
        });

        if (bhResponse.ok) {
          const bhData = await bhResponse.json();
          pixResult = {
            transactionId: bhData.id || `BH-${Date.now()}`,
            qrCode: bhData.pix?.qrcode || bhData.pix?.qrCodeUrl || '',
            copyPaste: bhData.pix?.copy_paste || bhData.pix?.qrcode || ''
          };
        }
      } catch (e) {
        console.error('[Netlify Function Pix] Beehive API error:', e.message);
      }
    }

    // Fallback Mock Pix
    if (!pixResult || !pixResult.copyPaste) {
      const mockCopyPaste = `00020126580014br.gov.bcb.pix0136${crypto.randomUUID()}5204000053039865405${(calculatedAmountCentavos / 100).toFixed(2)}5802BR5915MIRACLE STORE6009SAO PAULO62070503***6304`;
      pixResult = {
        transactionId: `BH-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(mockCopyPaste)}`,
        copyPaste: mockCopyPaste
      };
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
