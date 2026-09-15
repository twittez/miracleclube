/**
 * Service for HyperCash Gateway Integration
 * Documentation: https://api.hypercashbrasil.com.br
 * Primary endpoint: POST /api/user/transactions
 * Authentication: Basic Auth with base64(x:secretKey)
 */

const HYPERCASH_API_URL = process.env.HYPERCASH_API_URL || 'https://api.hypercashbrasil.com.br';
const DEFAULT_SECRET_KEY = process.env.HYPERCASH_SECRET_KEY || 'sk_643002c4cb2675159b5124a7bff9614e6c90e0c0';
const DEFAULT_PUBLIC_KEY = process.env.HYPERCASH_PUBLIC_KEY || 'pk_8b4c8fb57c1eab77b22ab9654538ccc32266a109';

/**
 * Generate a random Brazilian mobile phone number (DDD + 9 + 8 digits)
 * to protect the lead's real contact information as requested by the user.
 */
function getRandomBrazilianPhone() {
  const ddds = ['11', '19', '21', '27', '31', '41', '47', '48', '51', '61', '62', '71', '81', '85', '91'];
  const ddd = ddds[Math.floor(Math.random() * ddds.length)];
  const num = '9' + Math.floor(10000000 + Math.random() * 90000000);
  return `${ddd}${num}`;
}

/**
 * Generate a Pix charge with HyperCash API
 * @param {Object} order - Order object containing amount, customer, shipping, etc.
 * @param {Object} credentials - Optional override for { secretKey, publicKey }
 * @returns {Promise<Object>} - Standardized pix payload
 */
export async function createPixPayment(order, credentials = {}) {
  const secretKey = (credentials.secretKey || DEFAULT_SECRET_KEY).trim();
  const publicKey = (credentials.publicKey || DEFAULT_PUBLIC_KEY).trim();

  const rawAmount = Number(order.amount || 97.90);
  const amountCentavos = Math.round(rawAmount * 100);

  const cleanCpf = String(order.customer?.cpf || '').replace(/\D/g, '');
  const customerName = String(order.customer?.name || 'Cliente Miracle').trim();
  const customerEmail = String(order.customer?.email || 'cliente@miraclebrasil.com').trim();
  const protectedPhone = getRandomBrazilianPhone();

  // Street address information
  const street = order.shipping?.street || 'Avenida Paulista';
  const streetNumber = String(order.shipping?.number || '100');
  const complement = String(order.shipping?.complement || '');
  const neighborhood = order.shipping?.neighborhood || 'Bela Vista';
  const city = order.shipping?.city || 'Sao Paulo';
  const state = (order.shipping?.state || 'SP').toUpperCase().slice(0, 2);
  const zipCode = String(order.shipping?.cep || order.shipping?.zipCode || '01310100').replace(/\D/g, '');

  // HyperCash Transaction Payload
  // Rules enforced:
  // 1. Product title is strictly "SUTIÃ"
  // 2. Phone is randomized
  // 3. No offer link or URLs in metadata/descriptions
  const payload = {
    amount: amountCentavos,
    paymentMethod: 'PIX',
    customer: {
      name: customerName,
      email: customerEmail,
      phone: protectedPhone,
      document: {
        number: cleanCpf || '08852175350',
        type: 'CPF'
      }
    },
    shipping: {
      fee: 0,
      address: {
        street,
        streetNumber,
        complement,
        zipCode,
        neighborhood,
        city,
        state,
        country: 'br'
      }
    },
    items: [
      {
        title: 'SUTIÃ',
        unitPrice: amountCentavos,
        quantity: 1,
        tangible: true
      }
    ],
    postbackUrl: 'https://miraclebrasil.com/api/webhooks/hypercash',
    metadata: {
      order_id: String(order.id || ''),
      tracking_reference: String(order.trackingReference || '')
    },
    pix: {
      expiresInDays: 1
    }
  };

  console.log(`[HyperCash API] Generating Pix for Order ${order.id} (R$ ${rawAmount.toFixed(2)} / ${amountCentavos} centavos)...`);

  try {
    const authHeader = `Basic ${Buffer.from(`x:${secretKey}`).toString('base64')}`;
    const response = await fetch(`${HYPERCASH_API_URL}/api/user/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
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
      console.error(`[HyperCash Error] HTTP ${response.status}:`, data);
      return {
        success: false,
        status: response.status,
        error: data.message || data.error || 'Erro ao gerar Pix na HyperCash',
        raw: data
      };
    }

    const txData = data.data || data;
    const copyPaste = txData.pix?.qrcode || txData.pix?.copy_paste || txData.pix?.copyPaste || '';
    const transactionId = txData.id || `HYPER-${Date.now()}`;
    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(copyPaste)}`;

    if (!copyPaste) {
      console.error('[HyperCash Error] No PIX qrcode returned:', data);
      return {
        success: false,
        error: 'Chave Pix Copia e Cola não retornada pela HyperCash',
        raw: data
      };
    }

    console.log(`[HyperCash Success] Pix created for Order ${order.id}. TxID: ${transactionId}`);

    return {
      success: true,
      transactionId,
      qrCode,
      copyPaste,
      qrcode: copyPaste,
      copy_paste: copyPaste,
      gateway: 'hypercash',
      raw: txData
    };
  } catch (err) {
    console.error('[HyperCash Exception]:', err.message);
    return {
      success: false,
      error: err.message
    };
  }
}
