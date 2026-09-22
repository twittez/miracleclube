/**
 * Service for WinnerPay Gateway Integration
 * Documentation: https://documentacao.winnerpayments.com.br/
 * Base URL: https://api.winnerpayments.com.br/api
 * Primary endpoints:
 *  - POST /financial/receber-pix
 *  - GET /dashboard/transactions/:transactionId
 * Authentication: Basic Auth with base64(clientId:clientSecret)
 */

const WINNERPAY_API_URL = process.env.WINNERPAY_API_URL || 'https://api.winnerpayments.com.br/api';
const DEFAULT_CLIENT_ID = process.env.WINNERPAY_CLIENT_ID || '14fdd5f1-98af-4344-ad0d-944bd0998001';
const DEFAULT_CLIENT_SECRET = process.env.WINNERPAY_CLIENT_SECRET || 'e11d80779f19927a26a443dacb3fa23c32304090617cc84563bca61a3295242f';

/**
 * Generate a Pix charge with WinnerPay API
 * @param {Object} order - Order object containing amount, customer, shipping, etc.
 * @param {Object} credentials - Optional override for { clientId, clientSecret }
 * @returns {Promise<Object>} - Standardized pix payload
 */
export async function createPixPayment(order, credentials = {}) {
  const clientId = (credentials.clientId || DEFAULT_CLIENT_ID).trim();
  const clientSecret = (credentials.clientSecret || DEFAULT_CLIENT_SECRET).trim();

  const rawAmount = Number(order.amount || 87.90);
  const cleanCpf = String(order.customer?.cpf || '').replace(/\D/g, '') || '05698635200';
  const customerName = String(order.customer?.name || 'Cliente Miracle').trim();
  const customerEmail = String(order.customer?.email || 'cliente@miraclebrasil.com').trim();
  const orderId = String(order.id || order.orderId || `ORD-${Date.now()}`);

  const payload = {
    amount: Number(rawAmount.toFixed(2)),
    description: `Pagamento Miracle Pedido ${orderId}`,
    postbackUrl: 'https://miraclebrasil.com/api/webhooks/winnerpay',
    include_qr_image: true,
    product_name: 'SUTIÃ',
    metadata: {
      order_id: orderId,
      tracking_reference: String(order.trackingReference || ''),
      product: {
        name: 'SUTIÃ'
      }
    },
    customer: {
      name: customerName,
      email: customerEmail,
      document: {
        type: 'CPF',
        number: cleanCpf
      }
    }
  };

  console.log(`[WinnerPay API] Generating Pix for Order ${orderId} (R$ ${rawAmount.toFixed(2)})...`);

  try {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch(`${WINNERPAY_API_URL}/financial/receber-pix`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'X-Client-Id': clientId,
        'X-Client-Secret': clientSecret,
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

    if (!response.ok) {
      console.error(`[WinnerPay Error] HTTP ${response.status}:`, data);
      return {
        success: false,
        status: response.status,
        error: data.message || data.error || 'Erro ao gerar Pix na WinnerPay',
        raw: data
      };
    }

    const copyPaste = data.pix_copia_e_cola || data.qr_code_data || data.transaction?.metadata?.pix_copia_e_cola || '';
    const transactionId = data.transaction?.transaction_id || `WINNER-${Date.now()}`;
    
    // Use returned Base64 QR code image if present, else fallback to QR Code generator URL
    let qrCode = '';
    if (data.qr_code_image) {
      qrCode = data.qr_code_image.startsWith('data:image')
        ? data.qr_code_image
        : `data:image/png;base64,${data.qr_code_image}`;
    } else if (copyPaste) {
      qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(copyPaste)}`;
    }

    if (!copyPaste) {
      console.error('[WinnerPay Error] No PIX copy-paste code returned:', data);
      return {
        success: false,
        error: 'Chave Pix Copia e Cola não retornada pela WinnerPay',
        raw: data
      };
    }

    console.log(`[WinnerPay Success] Pix created for Order ${orderId}. TxID: ${transactionId}`);

    return {
      success: true,
      transactionId,
      qrCode,
      copyPaste,
      qrcode: copyPaste,
      copy_paste: copyPaste,
      gateway: 'winnerpay',
      raw: data
    };
  } catch (err) {
    console.error('[WinnerPay Exception]:', err.message);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Check status of a transaction on WinnerPay
 * @param {string} transactionId
 * @param {Object} credentials
 * @returns {Promise<Object>}
 */
export async function checkTransactionStatus(transactionId, credentials = {}) {
  const clientId = (credentials.clientId || DEFAULT_CLIENT_ID).trim();
  const clientSecret = (credentials.clientSecret || DEFAULT_CLIENT_SECRET).trim();

  if (!transactionId) {
    return { success: false, error: 'transactionId obrigatório' };
  }

  try {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch(`${WINNERPAY_API_URL}/dashboard/transactions/${encodeURIComponent(transactionId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'X-Client-Id': clientId,
        'X-Client-Secret': clientSecret,
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
    console.error('[WinnerPay Status Check Exception]:', err.message);
    return { success: false, error: err.message };
  }
}
