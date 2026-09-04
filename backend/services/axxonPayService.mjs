import crypto from 'crypto';

/**
 * Service for AxxonPay Gateway Integration
 * Host: https://api.axxonpay.com.br
 * Primary endpoint: POST /api/v1/payments
 */

const AXXONPAY_API_URL = process.env.AXXONPAY_API_URL || 'https://api.axxonpay.com.br';
const DEFAULT_SECRET_KEY = process.env.AXXONPAY_SECRET_KEY || 'sk_72642b2864b48ec909e1258a5ec9a8fee63bd57079ce26d3705b32cd43741365';
const DEFAULT_PUBLIC_KEY = process.env.AXXONPAY_PUBLIC_KEY || 'pk_8519c01597936f76f7d364735a5a36b0';

/**
 * Generate a Pix charge with AxxonPay
 * @param {Object} order - Order object containing amount, customer, items, etc.
 * @param {Object} credentials - Optional override for { secretKey, publicKey }
 * @returns {Promise<Object>} - Standardized pix payload
 */
export async function createPixPayment(order, credentials = {}) {
  const secretKey = credentials.secretKey || DEFAULT_SECRET_KEY;
  const publicKey = credentials.publicKey || DEFAULT_PUBLIC_KEY;

  const rawAmount = Number(order.amount || 103.32);
  const amount = Number(rawAmount.toFixed(2));

  const cleanPhone = String(order.customer?.phone || '').replace(/\D/g, '');
  const cleanCpf = String(order.customer?.cpf || '').replace(/\D/g, '');
  const customerName = String(order.customer?.name || 'Cliente Miracle').trim();
  const customerEmail = String(order.customer?.email || 'cliente@miraclebrasil.com').trim();

  const orderUuid = crypto.randomUUID();

  const payload = {
    paymentMethod: 'pix',
    amount: amount,
    quantity: 1,
    currency: 'BRL',
    country: 'BRA',
    sellerId: publicKey,
    orderId: orderUuid,
    description: order.items?.[0]?.title || `Pedido Miracle Belt #${order.id || order.trackingReference || 'MB'}`,
    postBackUrl: 'https://miraclebrasil.com/api/webhooks/axxonpay',
    metadata: JSON.stringify({
      orderId: order.id,
      trackingReference: order.trackingReference,
      internalOrderId: orderUuid
    }),
    customer: {
      name: customerName,
      email: customerEmail,
      phone: cleanPhone.length === 11 ? cleanPhone : `11${cleanPhone.slice(-9)}`,
      document: {
        number: cleanCpf || '05284345105',
        type: cleanCpf.length > 11 ? 'cnpj' : 'cpf'
      }
    }
  };

  // Add address if provided
  if (order.shipping?.street) {
    payload.customer.address = {
      street: order.shipping.street,
      number: order.shipping.number || 'SN',
      complement: order.shipping.complement || '',
      neighborhood: order.shipping.neighborhood || 'Centro',
      city: order.shipping.city || 'São Paulo',
      state: (order.shipping.state || 'SP').toUpperCase().slice(0, 2),
      postalCode: String(order.shipping.cep || '01310100').replace(/\D/g, '')
    };
  }

  console.log(`[AxxonPay] Initiating Pix payment for Order ${order.id} (R$ ${amount})...`);

  try {
    const response = await fetch(`${AXXONPAY_API_URL}/api/v1/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secretKey}`,
        'x-api-key': secretKey,
        'x-secret-key': secretKey,
        'x-public-key': publicKey
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

    // Extract Pix QR Code and Copy/Paste code from various potential response schemas
    const copyPaste = 
      data.pix?.copyPaste || 
      data.pix?.copy_paste || 
      data.pix?.emv || 
      data.pix?.payload ||
      data.pix?.code ||
      data.copyPaste || 
      data.copy_paste || 
      data.emv || 
      data.qrcode || 
      data.qrCode || 
      data.pixCode || 
      '';

    const qrCode = 
      data.pix?.qrCodeUrl || 
      data.pix?.qrCode || 
      data.qrCodeUrl || 
      data.qrCode || 
      copyPaste;

    const transactionId = 
      data.transactionId || 
      data.id || 
      data.paymentId || 
      data.pix?.transactionId || 
      orderUuid;

    return {
      success: true,
      gateway: 'axxonpay',
      transactionId,
      copyPaste,
      copy_paste: copyPaste,
      qrCode,
      qrcode: copyPaste,
      status: data.status || 'pending',
      amount: amount,
      orderUuid,
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
