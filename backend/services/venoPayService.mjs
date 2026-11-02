/**
 * Service for VenoPay (Venopayments) Gateway Integration
 * Documentation: https://beta.venopayments.com/docs
 * Base URL: https://beta.venopayments.com/api/v1
 * Primary endpoints:
 *  - POST /api/v1/pix (Create Pix deposit)
 *  - GET /api/v1/pix/:id/status (Check Pix status)
 *  - GET /api/v1/seller (Check account information)
 * Authentication: Header Authorization: Bearer {apiKey}
 */

const VENOPAY_API_URL = process.env.VENOPAY_API_URL || 'https://beta.venopayments.com/api/v1';
const DEFAULT_API_KEY = process.env.VENOPAY_API_KEY || 'veno_live_87f38b23b9b66f651e4b29b58f86e2a5845b486e685601c7';
const DEFAULT_ACCOUNT_ID = process.env.VENOPAY_ACCOUNT_ID || '019fe90c-c9e7-7518-ae22-700751c0f7d1';

function isValidCpf(cpf) {
  cpf = String(cpf || '').replace(/\D/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  let soma = 0;
  for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;
  soma = 0;
  for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;
  return true;
}

/**
 * Generate a Pix charge with VenoPay API
 * @param {Object} order - Order object containing amount, customer, shipping, etc.
 * @param {Object} credentials - Optional override for { apiKey, accountId }
 * @returns {Promise<Object>} - Standardized pix payload
 */
export async function createPixPayment(order, credentials = {}) {
  const apiKey = (credentials.apiKey || credentials.secretKey || DEFAULT_API_KEY).trim();
  const orderId = String(order.id || order.orderId || `ORD-${Date.now()}`);

  // Calculate amount in cents (integer)
  const rawAmountNumber = Number(order.amount || 81.61);
  const amountInCents = Math.round(rawAmountNumber * 100);

  // Customer / Payer details with CPF validation
  const rawCpf = String(order.customer?.cpf || '').replace(/\D/g, '');
  const cleanCpf = isValidCpf(rawCpf) ? rawCpf : '05367570038';
  const customerName = String(order.customer?.name || 'Cliente Miracle').trim();
  const customerEmail = String(order.customer?.email || 'cliente@miraclebrasil.com').trim();

  const phoneDigits = String(order.customer?.phone || '').replace(/\D/g, '');
  const cleanPhone = phoneDigits.length >= 10 && phoneDigits.length <= 15 ? phoneDigits : '11999998888';

  // Construct Products array (Sum of price * quantity MUST equal amountInCents)
  let products = [];
  if (Array.isArray(order.items) && order.items.length > 0) {
    let sum = 0;
    const mapped = order.items.map((item, idx) => {
      let unitPrice = Number(item.unitPrice || 0);
      if (unitPrice < 100 && amountInCents >= 1000) {
        unitPrice = Math.round(unitPrice * 100);
      }
      const qty = Number(item.quantity) || 1;
      sum += unitPrice * qty;
      return {
        external_ref: `prod-${orderId}-${idx + 1}`,
        name: String(item.title || item.name || 'Produto').trim().slice(0, 100),
        price: unitPrice,
        quantity: qty
      };
    });

    if (sum === amountInCents) {
      products = mapped;
    } else {
      // If item sum differs due to order bumps, shipping or discounts, consolidate into 1 product
      const combinedTitle = order.items.map(i => i.title || i.name).filter(Boolean).join(' + ') || 'Cinta Modeladora Miracle';
      products = [
        {
          external_ref: `prod-${orderId}`,
          name: combinedTitle.slice(0, 100),
          price: amountInCents,
          quantity: 1
        }
      ];
    }
  } else {
    products = [
      {
        external_ref: `prod-${orderId}`,
        name: 'Cinta Modeladora Miracle',
        price: amountInCents,
        quantity: 1
      }
    ];
  }

  // Payer object
  const payer = {
    name: customerName,
    email: customerEmail,
    document: cleanCpf,
    phone: cleanPhone
  };

  // Optional shipping/address fields
  const street = String(order.shipping?.street || order.shipping?.address || '').trim();
  const number = String(order.shipping?.number || '').trim();
  if (street) {
    payer.address = `${street}${number ? ', ' + number : ''}`;
  }
  if (order.shipping?.city) {
    payer.city = String(order.shipping.city).trim();
  }
  const stateRaw = String(order.shipping?.state || '').trim().toUpperCase().slice(0, 2);
  if (stateRaw.length === 2) {
    payer.state = stateRaw;
  }
  const zipDigits = String(order.shipping?.zipcode || order.shipping?.zipCode || order.shipping?.cep || '').replace(/\D/g, '');
  if (zipDigits.length === 8) {
    payer.zip_code = zipDigits;
  }

  // Tracking Parameters
  const utmObj = order.trackingParameters || order.utms || order.utm || {};
  const utm_source = String(utmObj.utm_source || utmObj.src || '').trim();
  const utm_medium = String(utmObj.utm_medium || '').trim();
  const utm_campaign = String(utmObj.utm_campaign || '').trim();
  const utm_content = String(utmObj.utm_content || '').trim();
  const utm_term = String(utmObj.utm_term || '').trim();
  const src = String(utmObj.src || '').trim();
  const sck = String(utmObj.sck || '').trim();

  const payload = {
    amount: amountInCents,
    description: `Pedido ${orderId} - Miracle Brasil`,
    external_id: orderId,
    callback_url: 'https://miraclebrasil.com/api/webhooks/venopay',
    payer,
    products
  };

  if (utm_source) payload.utm_source = utm_source;
  if (utm_medium) payload.utm_medium = utm_medium;
  if (utm_campaign) payload.utm_campaign = utm_campaign;
  if (utm_content) payload.utm_content = utm_content;
  if (utm_term) payload.utm_term = utm_term;
  if (src) payload.src = src;
  if (sck) payload.sck = sck;

  console.log(`[VenoPay API] Generating Pix for Order ${orderId} (R$ ${rawAmountNumber.toFixed(2)} / ${amountInCents} centavos)...`);

  try {
    const response = await fetch(`${VENOPAY_API_URL}/pix`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
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

    if (!response.ok || (data && data.code && data.code !== 201 && data.code !== 200)) {
      console.error(`[VenoPay Error] HTTP ${response.status}:`, data);
      return {
        success: false,
        status: response.status,
        error: data.message || data.error || data.code || 'Erro ao gerar Pix na VenoPay',
        raw: data
      };
    }

    const copyPaste = data.pix_copy_paste || data.qr_code_image || data.qr_code || '';
    const transactionId = data.id || data.txid || `VENO-${Date.now()}`;

    if (!copyPaste) {
      console.error('[VenoPay Error] No PIX copy-paste code returned:', data);
      return {
        success: false,
        error: 'Chave Pix Copia e Cola não retornada pela VenoPay',
        raw: data
      };
    }

    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(copyPaste)}`;

    console.log(`[VenoPay Success] Pix created for Order ${orderId}. TxID: ${transactionId}`);

    return {
      success: true,
      transactionId,
      txid: data.txid || transactionId,
      id: data.id,
      qrCode,
      copyPaste,
      qrcode: copyPaste,
      copy_paste: copyPaste,
      expiresAt: data.expires_at,
      gateway: 'venopay',
      raw: data
    };
  } catch (err) {
    console.error('[VenoPay Exception]:', err.message);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Check status of a transaction on VenoPay Gateway
 * @param {string} transactionId - Internal transaction UUID or txid
 * @param {Object} credentials - { apiKey }
 * @returns {Promise<Object>}
 */
export async function checkTransactionStatus(transactionId, credentials = {}) {
  const apiKey = (credentials.apiKey || credentials.secretKey || DEFAULT_API_KEY).trim();

  if (!transactionId) {
    return { success: false, error: 'transactionId obrigatório' };
  }

  try {
    const response = await fetch(`${VENOPAY_API_URL}/pix/${encodeURIComponent(transactionId)}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return { success: false, status: response.status };
    }

    const data = await response.json();
    const status = String(data.status || '').toLowerCase().trim();
    const isPaid = status === 'paid' || status === 'completed' || status === 'captured';

    return {
      success: true,
      status,
      isPaid,
      transaction: data
    };
  } catch (err) {
    console.error('[VenoPay Status Check Exception]:', err.message);
    return { success: false, error: err.message };
  }
}
