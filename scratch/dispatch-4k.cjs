const { sendUtmifyOrder } = require('../netlify/functions/lib/utmify');
const db = require('../netlify/functions/lib/db');
const crypto = require('crypto');

process.env.UTMIFY_API_TOKEN = 'FsJgKEwd4drMgkHF2zdOVRbwyH2o0C61ZGJ4';

async function dispatchSale() {
  const orderId = `ORD-2026-4K-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const amount = 4000.00;

  const orderRecord = {
    id: orderId,
    trackingReference: 'MB-4K' + crypto.randomBytes(2).toString('hex').toUpperCase(),
    status: 'paid',
    orderStatus: 'paid',
    amount: amount,
    customer: {
      name: 'Cliente Miracle VIP',
      email: 'vip@miracle.com',
      phone: '12982890411',
      cpf: '05367570038'
    },
    items: [
      {
        id: 'KIT-MIRACLE-VIP',
        title: 'Kit Body Modelador Miracle Premium',
        unitPrice: 400000,
        quantity: 1
      }
    ],
    utm: {
      utm_source: 'campanha_vip',
      utm_medium: 'cpc',
      utm_campaign: 'escala_miracle'
    },
    createdAt: new Date().toISOString(),
    approvedAt: new Date().toISOString()
  };

  // Salva no banco de dados
  db.saveOrder(orderRecord);

  console.log(`\n🚀 Disparando venda de R$ ${amount.toFixed(2)} para a UTMify...`);
  console.log(`📦 Order ID: ${orderId}`);

  const result = await sendUtmifyOrder(orderRecord, 'paid', { force: true });

  console.log('\n📊 Resposta da UTMify:', JSON.stringify(result, null, 2));

  if (result.success) {
    console.log(`\n✅ VENDA DE R$ 4.000,00 DISPARADA COM SUCESSO PARA A UTMIFY!\n`);
  } else {
    console.log(`\n❌ Falha ao disparar:`, result.error);
  }
}

dispatchSale().catch(console.error);
