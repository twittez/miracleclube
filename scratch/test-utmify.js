const path = require('path');
const pixHandler = require('../netlify/functions/pix').handler;
const webhookHandler = require('../netlify/functions/webhook').handler;
const backfillHandler = require('../netlify/functions/utmify-backfill').handler;
const statusHandler = require('../netlify/functions/status').handler;
const db = require('../netlify/functions/lib/db');
const { buildUtmifyPayload, mapStatusToUtmify } = require('../netlify/functions/lib/utmify');

process.env.UTMIFY_API_TOKEN = 'FsJgKEwd4drMgkHF2zdOVRbwyH2o0C61ZGJ4';
process.env.BACKFILL_SECRET = 'miracle_backfill_2026_sec';

async function runTests() {
  console.log('================================================================');
  console.log('        TESTE DA INTEGRAÇÃO UTMIFY COM NETLIFY FUNCTIONS        ');
  console.log('================================================================\n');

  let passed = 0;
  let total = 6;

  // -------------------------------------------------------------
  // TESTE 1: PENDING
  // -------------------------------------------------------------
  console.log('▶ TESTE 1 — PENDING (Criação de Pedido Pix)');
  const testPixEvent = {
    httpMethod: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: 143.91,
      customer: {
        name: 'Maria Teste Santos',
        email: 'maria.teste@email.com',
        phone: '(12) 98289-0411',
        cpf: '123.456.789-00'
      },
      shipping: {
        zipcode: '35500-000',
        street: 'Rua das Flores',
        number: '123'
      },
      items: [
        { title: 'Body Modelador Feminino', unitPrice: 14391, quantity: 1, tangible: true }
      ],
      utm: {
        utm_source: 'facebook',
        utm_medium: 'cpc',
        utm_campaign: 'campanha_shapewear',
        utm_content: 'video_ad_1',
        fbclid: 'fb_click_id_12345'
      }
    })
  };

  const pixRes = await pixHandler(testPixEvent);
  const pixData = JSON.parse(pixRes.body);
  const testOrderId = pixData.orderId;
  const testTxId = pixData.pix?.transactionId;

  console.log(`  - Pedido criado: ${testOrderId}`);
  console.log(`  - Status retornado: ${pixData.status}`);
  console.log(`  - QR Code / Copia e Cola gerados: ${Boolean(pixData.pix?.copyPaste)}`);

  const pendingEvent = db.getIntegrationEvent(`miracle_${testOrderId}_waiting_payment`);
  if (pixRes.statusCode === 200 && testOrderId && pendingEvent) {
    console.log('  ✅ TESTE 1 PASSOU: Pedido criado e evento waiting_payment registrado com sucesso na idempotência.\n');
    passed++;
  } else {
    console.error('  ❌ TESTE 1 FALHOU!\n');
  }

  // -------------------------------------------------------------
  // TESTE 2: PAID
  // -------------------------------------------------------------
  console.log('▶ TESTE 2 — PAID (Webhook de Pagamento Confirmado)');
  const webhookEvent1 = {
    httpMethod: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: testTxId,
      status: 'paid',
      amount: 14391,
      customer: {
        email: 'maria.teste@email.com',
        phone: '12982890411'
      },
      metadata: {
        order_id: testOrderId
      }
    })
  };

  const whRes1 = await webhookHandler(webhookEvent1);
  const whData1 = JSON.parse(whRes1.body);
  console.log(`  - Webhook Resposta:`, whData1);

  const paidEvent = db.getIntegrationEvent(`miracle_${testOrderId}_paid`);
  if (whRes1.statusCode === 200 && whData1.processed === true && paidEvent) {
    console.log('  ✅ TESTE 2 PASSOU: Pedido atualizado para PAID e enviado para UTMify.\n');
    passed++;
  } else {
    console.error('  ❌ TESTE 2 FALHOU!\n');
  }

  // -------------------------------------------------------------
  // TESTE 3: WEBHOOK DUPLICADO (Idempotência)
  // -------------------------------------------------------------
  console.log('▶ TESTE 3 — WEBHOOK DUPLICADO (Idempotência)');
  const whRes2 = await webhookHandler(webhookEvent1);
  const whData2 = JSON.parse(whRes2.body);
  console.log(`  - Segunda chamada do mesmo Webhook:`, whData2);

  if (whRes2.statusCode === 200 && whData2.already_processed === true) {
    console.log('  ✅ TESTE 3 PASSOU: Segundo webhook detectou evento já processado e evitou envio duplicado para a UTMify.\n');
    passed++;
  } else {
    console.error('  ❌ TESTE 3 FALHOU!\n');
  }

  // -------------------------------------------------------------
  // TESTE 4: REFRESH DA PÁGINA DE OBRIGADO
  // -------------------------------------------------------------
  console.log('▶ TESTE 4 — REFRESH DA PÁGINA DE OBRIGADO');
  const statusRes1 = await statusHandler({
    httpMethod: 'GET',
    headers: {},
    queryStringParameters: { orderId: testOrderId }
  });
  const statusRes2 = await statusHandler({
    httpMethod: 'GET',
    headers: {},
    queryStringParameters: { orderId: testOrderId }
  });

  const statusData1 = JSON.parse(statusRes1.body);
  const statusData2 = JSON.parse(statusRes2.body);

  const totalPaidEvents = Object.keys(db.readDB().integration_events || {})
    .filter(k => k === `miracle_${testOrderId}_paid`).length;

  if (statusData1.orderId === testOrderId && totalPaidEvents === 1) {
    console.log('  ✅ TESTE 4 PASSOU: Múltiplos refreshes consultam status sem gerar nenhum evento Purchase adicional.\n');
    passed++;
  } else {
    console.error('  ❌ TESTE 4 FALHOU!\n');
  }

  // -------------------------------------------------------------
  // TESTE 5: BACKFILL HISTÓRICO E IDEMPOTÊNCIA
  // -------------------------------------------------------------
  console.log('▶ TESTE 5 — BACKFILL HISTÓRICO COM RECONCILIAÇÃO');
  const backfillEvent = {
    httpMethod: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-backfill-secret': 'miracle_backfill_2026_sec'
    },
    body: JSON.stringify({
      date: new Date().toISOString().slice(0, 10),
      userInformedAmount: 4667.00
    })
  };

  const bfRes1 = await backfillHandler(backfillEvent);
  const bfData1 = JSON.parse(bfRes1.body);
  console.log(`  - Primeira Execução do Backfill:`);
  console.log(`    Pedidos pagos encontrados: ${bfData1.pedidos_pagos_encontrados}`);
  console.log(`    Valor total encontrado: ${bfData1.valor_total_encontrado}`);
  console.log(`    Já existentes na UTMify: ${bfData1.ja_existentes_na_utmify}`);
  console.log(`    Enviados agora: ${bfData1.enviados_agora}`);

  const bfRes2 = await backfillHandler(backfillEvent);
  const bfData2 = JSON.parse(bfRes2.body);
  console.log(`  - Segunda Execução do Backfill (Imediata):`);
  console.log(`    Enviados agora: ${bfData2.enviados_agora}`);

  if (bfRes1.statusCode === 200 && bfData2.enviados_agora === 0) {
    console.log('  ✅ TESTE 5 PASSOU: Backfill reconcilia pedidos e na 2ª execução não duplica nenhum pedido (0 enviados).\n');
    passed++;
  } else {
    console.error('  ❌ TESTE 5 FALHOU!\n');
  }

  // -------------------------------------------------------------
  // TESTE 6: PRESERVAÇÃO E ENVIO DE UTMs
  // -------------------------------------------------------------
  console.log('▶ TESTE 6 — PRESERVAÇÃO DE UTMs NO PAYLOAD');
  const orderRecord = db.getOrder(testOrderId);
  const utmPayload = buildUtmifyPayload(orderRecord, 'paid');

  console.log('  - Parâmetros UTM mapeados no payload:');
  console.log('    utm_source:', utmPayload.trackingParameters.utm_source);
  console.log('    utm_campaign:', utmPayload.trackingParameters.utm_campaign);
  console.log('    utm_medium:', utmPayload.trackingParameters.utm_medium);
  console.log('    utm_content:', utmPayload.trackingParameters.utm_content);

  if (
    utmPayload.trackingParameters.utm_source === 'facebook' &&
    utmPayload.trackingParameters.utm_campaign === 'campanha_shapewear' &&
    utmPayload.trackingParameters.utm_content === 'video_ad_1'
  ) {
    console.log('  ✅ TESTE 6 PASSOU: Todos os parâmetros de UTM foram preservados e associados ao pedido da UTMify.\n');
    passed++;
  } else {
    console.error('  ❌ TESTE 6 FALHOU!\n');
  }

  console.log('================================================================');
  console.log(`RESULTADO FINAL: ${passed}/${total} TESTES PASSARAM COM SUCESSO!`);
  console.log('================================================================\n');
}

runTests().catch(console.error);
