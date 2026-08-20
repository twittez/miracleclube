const db = require('./lib/db');
const { sendUtmifyOrder } = require('./lib/utmify');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const BACKFILL_SECRET = process.env.BACKFILL_SECRET || 'miracle_backfill_2026_sec';
  const authHeader = event.headers['authorization'] || event.headers['x-backfill-secret'] || event.queryStringParameters?.secret;

  if (authHeader !== BACKFILL_SECRET && authHeader !== `Bearer ${BACKFILL_SECRET}`) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  try {
    if (event.httpMethod === 'GET') {
      const orderId = event.queryStringParameters?.orderId;
      if (!orderId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'orderId is required' })
        };
      }
      const order = db.getOrder(orderId);
      const pendingEvent = db.getIntegrationEvent(`miracle_${orderId}_waiting_payment`);
      const paidEvent = db.getIntegrationEvent(`miracle_${orderId}_paid`);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          order,
          utmify: {
            waiting_payment: pendingEvent,
            paid: paidEvent
          }
        })
      };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { orderId, status, force } = body;

      if (!orderId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'orderId is required' })
        };
      }

      const order = db.getOrder(orderId);
      if (!order) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Order not found in database' })
        };
      }

      const result = await sendUtmifyOrder(order, status || order.status || 'waiting_payment', { force: !!force });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result)
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
