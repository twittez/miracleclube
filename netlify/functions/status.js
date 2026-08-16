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
