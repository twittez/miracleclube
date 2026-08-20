const db = require('./lib/db');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const orderId = event.queryStringParameters?.orderId || 'ORD-2026-DEMO';
  const order = db.getOrder(orderId);

  if (order) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        orderId: order.id,
        trackingReference: order.trackingReference,
        status: order.status,
        orderStatus: order.orderStatus,
        amount: order.amount,
        pix: order.pixResult,
        createdAt: order.createdAt
      })
    };
  }

  // Fallback for direct previews or demo orders
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      orderId,
      trackingReference: 'MB-8F3K92',
      status: 'pending_payment',
      orderStatus: 'pending_payment',
      amount: 143.91,
      createdAt: new Date().toISOString()
    })
  };
};
