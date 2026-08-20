const fs = require('fs');
const path = require('path');

// Local fallback DB file (for local development and fallback)
const DB_FILE = path.resolve(process.cwd(), 'orders_db.json');

// In-memory cache for serverless invocations
let memoryDb = {
  orders: {},
  transactions: {},
  integration_events: {}
};

function readDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      memoryDb.orders = { ...data.orders, ...memoryDb.orders };
      memoryDb.transactions = { ...data.transactions, ...memoryDb.transactions };
      memoryDb.integration_events = { ...(data.integration_events || {}), ...memoryDb.integration_events };
      return {
        orders: memoryDb.orders,
        transactions: memoryDb.transactions,
        integration_events: memoryDb.integration_events
      };
    }
  } catch (e) {
    console.error('[DB] Error reading orders_db.json:', e.message);
  }
  return memoryDb;
}

function writeDB(data) {
  try {
    memoryDb = {
      orders: { ...memoryDb.orders, ...(data.orders || {}) },
      transactions: { ...memoryDb.transactions, ...(data.transactions || {}) },
      integration_events: { ...memoryDb.integration_events, ...(data.integration_events || {}) }
    };
    if (fs.existsSync(path.dirname(DB_FILE))) {
      fs.writeFileSync(DB_FILE, JSON.stringify(memoryDb, null, 2), 'utf8');
    }
  } catch (e) {
    // In serverless read-only filesystem, silently keep memory state
  }
}

/**
 * Get an order by ID or Tracking Reference
 */
function getOrder(orderId) {
  if (!orderId) return null;
  const db = readDB();
  return db.orders[orderId] || null;
}

/**
 * Get an order by transaction ID (from payment gateway)
 */
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
 * Save or update an order
 */
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
function getIntegrationEvent(idempotencyKey) {
  if (!idempotencyKey) return null;
  const db = readDB();
  return db.integration_events?.[idempotencyKey] || null;
}

/**
 * Record an integration event (UTMify / Meta / Webhook) with idempotency key
 */
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
 * Get all orders in a date range or list
 */
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

module.exports = {
  readDB,
  writeDB,
  getOrder,
  getOrderByTransactionId,
  saveOrder,
  getIntegrationEvent,
  saveIntegrationEvent,
  listOrders
};
