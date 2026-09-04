import crypto from 'crypto';

/**
 * Service for AxxonPay Gateway Integration
 * Documentation: https://axxonpay.readme.io/reference/createdirectpayment
 * Primary endpoint: POST /api/v1/direct/payment
 * Authentication: axxon-gateway-publickey & axxon-gateway-secretkey
 */

const AXXONPAY_API_URL = process.env.AXXONPAY_API_URL || 'https://api.axxonpay.com.br';
const DEFAULT_SECRET_KEY = process.env.AXXONPAY_SECRET_KEY || 'sk_72642b2864b48ec909e1258a5ec9a8fee63bd57079ce26d3705b32cd43741365';
const DEFAULT_PUBLIC_KEY = process.env.AXXONPAY_PUBLIC_KEY || 'pk_8519c01597936f76f7d364735a5a36b0';

/**
 * Generate a Pix charge with AxxonPay Direct Payment API
 * @param {Object} order - Order object containing amount, customer, items, etc.
 * @param {Object} credentials - Optional override for { secretKey, publicKey }
 * @returns {Promise<Object>} - Standardized pix payload
 */
export async function createPixPayment(order, credentials = {}) {
  const secretKey = credentials.secretKey || DEFAULT_SECRET_KEY;
  const publicKey = credentials.publicKey || DEFAULT_PUBLIC_KEY;

  const rawAmount = Number(order.amount || 103.32);
  const amountCentavos = Math.round(rawAmount * 100);

  const cleanPhone = String(order.customer?.phone || '').replace(/\D/g, '');
  const cleanCpf = String(order.customer?.cpf || '').replace(/\D/g, '');
  const customerName = String(order.customer?.name || 'Cliente Miracle').trim();
  const customerEmail = String(order.customer?.email || 'cliente@miraclebrasil.com').trim();

  const payload = {
    amount: amountCentavos,
    paymentMethod: 'pix',
    description: order.items?.[0]?.title || `Pedido Miracle Belt #${order.id || order.trackingReference || 'MB'}`,
    postbackUrl: 'https://miraclebrasil.com/api/webhooks/axxonpay',
    customer: {
      name: customerName,
      email: customerEmail,
      phone: cleanPhone.length >= 10 ? cleanPhone : '11999999999',
      document: {
        number: cleanCpf || '08852175350',
        type: cleanCpf.length > 11 ? 'cnpj' : 'cpf'
      }
    },
    metadata: {
      orderId: order.id,
      trackingReference: order.trackingReference,
      attribution: {
        utm_source: order.utm?.utm_source || 'direct',
        utm_medium: order.utm?.utm_medium || '',
        utm_campaign: order.utm?.utm_campaign || '',
        utm_content: order.utm?.utm_content || ''
      }
    }
  };

  // Add address if provided
  if (order.shipping?.street) {
    payload.customer.address = {
      street: order.shipping.street,
      number: String(order.shipping.number || 'SN'),
      neighborhood: order.shipping.neighborhood || 'Centro',
      city: order.shipping.city || 'São Paulo',
      state: (order.shipping.state || 'SP').toUpperCase().slice(0, 2),
      zipCode: String(order.shipping.cep || '01310100').replace(/\D/g, '')
    };
  }

  console.log(`[AxxonPay Direct] Initiating Pix payment for Order ${order.id} (R$ ${rawAmount.toFixed(2)} / ${amountCentavos} centavos)...`);

  try {
    const response = await fetch(`${AXXONPAY_API_URL}/api/v1/direct/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'axxon-gateway-publickey': publicKey,
        'axxon-gateway-secretkey': secretKey
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    if (!response.ok) {
      console.error(`[AxxonPay Error] HTTP ${response.status}:`, data);
      return {
        success: false,
        status: response.status,
        error: data.message || data.errorMessage || 'Erro ao gerar Pix na AxxonPay',
        raw: data
      };
    }

    console.log('[AxxonPay Success]:', data);

    const paymentData = data.data || data;
    const copyPaste = paymentData.qrCode || paymentData.pix?.copyPaste || paymentData.pix?.qrcode || '';
    const qrCodeImage = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(copyPaste)}`;
    const transactionId = paymentData.id || paymentData.externalId || `AXXON-${Date.now()}`;

    return {
      success: true,
      gateway: 'axxonpay',
      transactionId,
      copyPaste,
      copy_paste: copyPaste,
      qrCode: qrCodeImage,
      qrcode: copyPaste,
      status: (paymentData.status || 'PENDING').toLowerCase(),
      amount: rawAmount,
      raw: data
    };
  } catch (err) {
    console.error('[AxxonPay Network Exception]:', err.message);
    return {
      success: false,
      error: `Falha na conexão com AxxonPay: ${err.message}`
    };
  }
}
