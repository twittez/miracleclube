/**
 * Service for Codefy Gateway Integration
 * Documentation: https://usecodefy.com/docs
 * Base URL: https://usecodefy.com/api/v1/gateway
 * Primary endpoints:
 *  - POST /api/v1/gateway/pix/receive
 *  - GET /api/v1/gateway/transactions/:id
 * Authentication: Headers x-public-key and x-secret-key
 */

const CODEFY_API_URL = process.env.CODEFY_API_URL || 'https://usecodefy.com/api/v1/gateway';
const DEFAULT_PUBLIC_KEY = process.env.CODEFY_PUBLIC_KEY || 'cfy_pk_1886de78123150db78112664da';
const DEFAULT_SECRET_KEY = process.env.CODEFY_SECRET_KEY || 'cfy_sk_3bae319a5ac126443d61e8fab5058450d1cb6b';

/**
 * Generate a Pix charge with Codefy Gateway API
 * @param {Object} order - Order object containing amount, customer, shipping, etc.
 * @param {Object} credentials - Optional override for { publicKey, secretKey }
 * @returns {Promise<Object>} - Standardized pix payload
 */
export async function createPixPayment(order, credentials = {}) {
  const publicKey = (credentials.publicKey || DEFAULT_PUBLIC_KEY).trim();
  const secretKey = (credentials.secretKey || DEFAULT_SECRET_KEY).trim();

  const rawAmount = Number(order.amount || 87.90);
  const cleanCpf = String(order.customer?.cpf || '').replace(/\D/g, '') || '05698635200';
  const customerName = String(order.customer?.name || 'Cliente Miracle').trim();
  const customerEmail = String(order.customer?.email || 'cliente@miracleclube.online').trim();
  const orderId = String(order.id || order.orderId || `ORD-${Date.now()}`);

  const phoneDigits = String(order.customer?.phone || '').replace(/\D/g, '');
  const cleanPhone = phoneDigits.length >= 10 && phoneDigits.length <= 20 ? phoneDigits : '11999998888';

  // Tracking Parameters
  const trackingParameters = {
    utm_source: String(order.trackingParameters?.utm_source || order.utms?.utm_source || order.utm_source || '').trim(),
    utm_medium: String(order.trackingParameters?.utm_medium || order.utms?.utm_medium || order.utm_medium || '').trim(),
    utm_campaign: String(order.trackingParameters?.utm_campaign || order.utms?.utm_campaign || order.utm_campaign || '').trim(),
    utm_content: String(order.trackingParameters?.utm_content || order.utms?.utm_content || order.utm_content || '').trim(),
    utm_term: String(order.trackingParameters?.utm_term || order.utms?.utm_term || order.utm_term || '').trim(),
    sck: String(order.trackingParameters?.sck || order.utms?.sck || order.sck || '').trim()
  };

  const payload = {
    amount: Number(rawAmount.toFixed(2)),
    description: `Cinta Modeladora Miracle Pedido ${orderId}`,
    origin_url: 'https://miracleclube.online',
    external_id: orderId,
    callbackUrl: 'https://miracleclube.online/api/webhooks/codefy',
    customer: {
      name: customerName,
      cpf: cleanCpf,
      email: customerEmail,
      phone: cleanPhone
    },
    trackingParameters
  };

  // Address validation: UF must be 2 characters, CEP must be 8 digits
  const stateRaw = String(order.shipping?.state || '').trim().toUpperCase().slice(0, 2);
  const zipRaw = String(order.shipping?.cep || order.shipping?.zipCode || order.shipping?.zip || '').replace(/\D/g, '');
  if (stateRaw.length === 2 && zipRaw.length === 8) {
    payload.customer.address = {
      street: String(order.shipping?.street || order.shipping?.address || 'Rua Principal').trim(),
      number: String(order.shipping?.number || 'S/N').trim(),
      complement: String(order.shipping?.complement || '').trim(),
      neighborhood: String(order.shipping?.neighborhood || 'Centro').trim(),
      city: String(order.shipping?.city || 'São Paulo').trim(),
      state: stateRaw,
      zip: zipRaw
    };
  }

  console.log(`[Codefy API] Generating Pix for Order ${orderId} (R$ ${rawAmount.toFixed(2)})...`);

  try {
    const response = await fetch(`${CODEFY_API_URL}/pix/receive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-public-key': publicKey,
        'x-secret-key': secretKey
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

    if (!response.ok || (data && data.success === false)) {
      console.error(`[Codefy Error] HTTP ${response.status}:`, data);
      return {
        success: false,
        status: response.status,
        error: data.message || data.error || 'Erro ao gerar Pix na Codefy',
        raw: data
      };
    }

    const tx = data.transaction || data;
    const copyPaste = tx.pix_code || tx.qr_code || data.pix_code || '';
    const transactionId = tx.id || tx.external_id || `CODEFY-${Date.now()}`;

    let qrCode = '';
    if (tx.qr_code_url && typeof tx.qr_code_url === 'string' && tx.qr_code_url.startsWith('http')) {
      qrCode = tx.qr_code_url;
    } else if (copyPaste) {
      qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(copyPaste)}`;
    }

    if (!copyPaste) {
      console.error('[Codefy Error] No PIX copy-paste code returned:', data);
      return {
        success: false,
        error: 'Chave Pix Copia e Cola não retornada pela Codefy',
        raw: data
      };
    }

    console.log(`[Codefy Success] Pix created for Order ${orderId}. TxID: ${transactionId}`);

    return {
      success: true,
      transactionId,
      qrCode,
      copyPaste,
      qrcode: copyPaste,
      copy_paste: copyPaste,
      gateway: 'codefy',
      raw: data
    };
  } catch (err) {
    console.error('[Codefy Exception]:', err.message);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Check status of a transaction on Codefy Gateway
 * @param {string} transactionId - Internal transaction ID (UUID) or external_id
 * @param {Object} credentials - { publicKey, secretKey }
 * @returns {Promise<Object>}
 */
export async function checkTransactionStatus(transactionId, credentials = {}) {
  const publicKey = (credentials.publicKey || DEFAULT_PUBLIC_KEY).trim();
  const secretKey = (credentials.secretKey || DEFAULT_SECRET_KEY).trim();

  if (!transactionId) {
    return { success: false, error: 'transactionId obrigatório' };
  }

  try {
    const response = await fetch(`${CODEFY_API_URL}/transactions/${encodeURIComponent(transactionId)}`, {
      method: 'GET',
      headers: {
        'x-public-key': publicKey,
        'x-secret-key': secretKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return { success: false, status: response.status };
    }

    const data = await response.json();
    const tx = data.transaction || data;
    const status = String(tx.status || '').toLowerCase().trim();
    const validPaid = ['paid', 'completed', 'approved', 'settled', 'success'];

    return {
      success: true,
      status,
      isPaid: validPaid.includes(status),
      transaction: tx
    };
  } catch (err) {
    console.error('[Codefy Status Check Exception]:', err.message);
    return { success: false, error: err.message };
  }
}
