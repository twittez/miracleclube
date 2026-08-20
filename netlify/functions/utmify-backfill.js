const db = require('./lib/db');
const { sendUtmifyOrder } = require('./lib/utmify');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-backfill-secret',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // 1. Authentication Security Guard
  const BACKFILL_SECRET = process.env.BACKFILL_SECRET || 'miracle_backfill_2026_sec';
  const providedSecret =
    event.headers['x-backfill-secret'] ||
    event.queryStringParameters?.secret ||
    (event.body ? JSON.parse(event.body || '{}').secret : '');

  if (!providedSecret || providedSecret !== BACKFILL_SECRET) {
    console.warn('[MIRACLE][UTMIFY][BACKFILL] Unauthorized backfill access attempt.');
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({
        error: 'Unauthorized: missing or invalid BACKFILL_SECRET.'
      })
    };
  }

  try {
    let body = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch {}
    }

    const targetDateStr =
      body.date ||
      event.queryStringParameters?.date ||
      '2026-08-20';

    const specificOrderId =
      body.orderId ||
      event.queryStringParameters?.orderId;

    const userInformedAmount =
      typeof body.userInformedAmount === 'number'
        ? body.userInformedAmount
        : 4667.00;

    console.log(`[MIRACLE][UTMIFY][BACKFILL] Starting historical reconciliation for date: ${targetDateStr}...`);

    // 2. Fetch all orders from storage
    const allDbOrders = db.readDB().orders || {};
    let targetOrders = Object.values(allDbOrders);

    if (specificOrderId) {
      targetOrders = targetOrders.filter(o => o.id === specificOrderId);
    } else if (targetDateStr) {
      targetOrders = targetOrders.filter(o => {
        const orderDate = (o.createdAt || o.updatedAt || '').slice(0, 10);
        return orderDate === targetDateStr || o.createdAt?.startsWith(targetDateStr);
      });
    }

    // Filter only genuinely PAID orders
    const paidOrders = targetOrders.filter(o =>
      ['paid', 'approved', 'settled', 'completed', 'paid_out', 'success'].includes((o.status || o.orderStatus || '').toLowerCase())
    );

    // Calculate real sum of found paid orders
    const totalFoundAmount = paidOrders.reduce((acc, o) => acc + (Number(o.amount) || 0), 0);

    // 3. Inspect which orders already have a successful PAID event in UTMify
    let existingCount = 0;
    let missingOrders = [];

    for (const order of paidOrders) {
      const idempotencyKey = `miracle_${order.id}_paid`;
      const integration = db.getIntegrationEvent(idempotencyKey);

      if (integration && integration.status === 'success') {
        existingCount++;
      } else {
        missingOrders.push(order);
      }
    }

    // 4. Dispatch ONLY missing orders to UTMify (one by one)
    let sentCount = 0;
    let failedCount = 0;
    const dispatchResults = [];

    for (const missingOrder of missingOrders) {
      try {
        const res = await sendUtmifyOrder(missingOrder, 'paid', { force: false });
        if (res.success) {
          sentCount++;
          dispatchResults.push({ orderId: missingOrder.id, amount: missingOrder.amount, status: 'sent' });
        } else {
          failedCount++;
          dispatchResults.push({ orderId: missingOrder.id, amount: missingOrder.amount, status: 'failed', error: res.error });
        }
      } catch (err) {
        failedCount++;
        dispatchResults.push({ orderId: missingOrder.id, amount: missingOrder.amount, status: 'exception', error: err.message });
      }
    }

    const difference = Math.abs(userInformedAmount - totalFoundAmount);

    const report = {
      data: targetDateStr,
      pedidos_pagos_encontrados: paidOrders.length,
      valor_total_encontrado: `R$ ${totalFoundAmount.toFixed(2).replace('.', ',')}`,
      ja_existentes_na_utmify: existingCount,
      pedidos_ausentes: missingOrders.length,
      enviados_agora: sentCount,
      falhas: failedCount,
      valor_informado_pelo_usuario: `R$ ${userInformedAmount.toFixed(2).replace('.', ',')}`,
      diferenca_valor: `R$ ${difference.toFixed(2).replace('.', ',')}`,
      ids_dos_pedidos_analisados: paidOrders.map(o => ({
        id: o.id,
        amount: o.amount,
        status: o.status,
        createdAt: o.createdAt
      })),
      detalhes_envio: dispatchResults
    };

    console.log(`[MIRACLE][UTMIFY][BACKFILL] Completed: ${sentCount} sent, ${existingCount} already present.`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(report, null, 2)
    };
  } catch (err) {
    console.error('[MIRACLE][UTMIFY][BACKFILL][ERROR]:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
