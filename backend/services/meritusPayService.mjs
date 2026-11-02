/**
 * Service for Meritus Hub Gateway Integration (MeritusPay)
 * Documentation: https://app.meritushub.app/docs
 * Base URL: https://api.meritushub.app/v1
 * Primary endpoints:
 *  - POST /payments/pix
 *  - GET /payments/status?payment_id=:payment_id
 * Authentication: Bearer <API_KEY>
 */

const MERITUS_API_URL = process.env.MERITUS_API_URL || 'https://api.meritushub.app/v1';
const DEFAULT_API_KEY = process.env.MERITUS_API_KEY || '';

/**
 * Generate a Pix charge with Meritus Hub API
 * @param {Object} order - Order object containing amount, customer, shipping, etc.
 * @param {Object} credentials - Optional override for { apiKey }
 * @returns {Promise<Object>} - Standardized pix payload
 */
export async function createPixPayment(order, credentials = {}) {
  const apiKey = (credentials.apiKey || DEFAULT_API_KEY).trim();

  const rawAmount = Number(order.amount || 87.90);
  const cleanCpf = String(order.customer?.cpf || '').replace(/\D/g, '') || '11570583960';
  const customerName = String(order.customer?.name || 'Cliente Miracle').trim();
  const customerEmail = String(order.customer?.email || 'cliente@miraclebrasil.com').trim();
  const rawPhone = String(order.customer?.phone || '11999999999').replace(/\D/g, '');
  const cleanPhone = rawPhone.length >= 10 ? rawPhone.slice(-11) : '11999999999';
  const orderId = String(order.id || order.orderId || `ORD-${Date.now()}`);

  const payload = {
    amount: Number(rawAmount.toFixed(2)),
    customer_name: customerName,
    customer_email: customerEmail,
    customer_document: cleanCpf,
    customer_phone: cleanPhone,
    description: `Pedido ${orderId} - Miracle Store`,
    metadata: {
      order_id: orderId,
      tracking_reference: String(order.trackingReference || '')
    }
  };

  console.log(`[MeritusPay API] Generating Pix for Order ${orderId} (R$ ${rawAmount.toFixed(2)})...`);

  try {
    const response = await fetch(`${MERITUS_API_URL}/payments/pix`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
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

    if (!response.ok || !data.success) {
      console.error(`[MeritusPay Error] HTTP ${response.status}:`, data);
      return {
        success: false,
        status: response.status,
        error: data.error || data.message || 'Erro ao gerar Pix na Meritus Hub',
        raw: data
      };
    }

    const copyPaste = data.pix_qr_code || data.pix_copia_e_cola || '';
    const paymentId = data.payment_id || `MERITUS-${Date.now()}`;
    let qrCode = data.pix_qr_code_image || '';

    if (!qrCode && copyPaste) {
      qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(copyPaste)}`;
    }

    if (!copyPaste) {
      console.error('[MeritusPay Error] No PIX copy-paste code returned:', data);
      return {
        success: false,
        error: 'Chave Pix Copia e Cola não retornada pela Meritus Hub',
        raw: data
      };
    }

    console.log(`[MeritusPay Success] Pix created for Order ${orderId}. PaymentID: ${paymentId}`);

    return {
      success: true,
      transactionId: paymentId,
      paymentId: paymentId,
      qrCode,
      copyPaste,
      qrcode: copyPaste,
      copy_paste: copyPaste,
      gateway: 'meritus',
      amount: data.amount || rawAmount,
      expiresAt: data.expires_at,
      raw: data
    };
  } catch (err) {
    console.error('[MeritusPay Exception]:', err.message);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Check status of a transaction on Meritus Hub
 * @param {string} paymentId
 * @param {Object} credentials
 * @returns {Promise<Object>}
 */
export async function checkTransactionStatus(paymentId, credentials = {}) {
  const apiKey = (credentials.apiKey || DEFAULT_API_KEY).trim();

  if (!paymentId) {
    return { success: false, error: 'paymentId obrigatório' };
  }

  try {
    const response = await fetch(`${MERITUS_API_URL}/payments/status?payment_id=${encodeURIComponent(paymentId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return { success: false, status: response.status };
    }

    const resData = await response.json();
    const data = resData.data || resData;
    const status = String(data.status || '').toLowerCase().trim();
    const isPaid = status === 'paid' || data.is_paid === true;

    return {
      success: true,
      status,
      isPaid,
      paidAt: data.paid_at,
      transaction: data
    };
  } catch (err) {
    console.error('[MeritusPay Status Check Exception]:', err.message);
    return { success: false, error: err.message };
  }
}
