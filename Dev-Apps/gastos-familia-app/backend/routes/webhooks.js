/**
 * Stripe Webhooks
 * Recebe confirmações do Stripe em tempo real
 * NUNCA confiar no cliente - sempre verificar no servidor
 */

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { supabase } = require('../config');
const { sendStripeConfirmation } = require('../services/emailService');

const router = express.Router();

/**
 * Webhook Stripe
 * Eventos: payment_intent.succeeded, payment_intent.payment_failed
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('❌ Erro ao verificar webhook Stripe:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  // Processar eventos
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      console.log(`✅ Payment Intent SUCCEEDED: ${paymentIntent.id}`);

      try {
        const { userId } = paymentIntent.metadata || {};
        const email = paymentIntent.receipt_email;

        if (!userId) {
          console.warn('⚠️ Payment Intent sem userId no metadata:', paymentIntent.id);
          return res.json({ received: true });
        }

        // 1. Criar subscription no Supabase
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 365);

        const { data, error } = await supabase
          .from('assinaturas')
          .insert([{
            usuario_id: userId,
            stripe_payment_id: paymentIntent.id,
            valor: paymentIntent.amount / 100,
            moeda: paymentIntent.currency.toUpperCase(),
            plano: 'yearly',
            data_inicio: startDate.toISOString(),
            data_expiracao: endDate.toISOString(),
            status: 'ativa',
            renovacao_automatica: true
          }])
          .select();

        if (error) {
          console.error('❌ Erro ao criar subscription:', error);
          throw error;
        }

        const subscriptionId = data[0]?.id;
        console.log(`✅ Subscription criada: ${subscriptionId}`);

        // 2. Enviar email de confirmação
        if (email) {
          try {
            await sendStripeConfirmation(email, subscriptionId, endDate.toISOString());
            console.log(`✅ Email enviado para ${email}`);
          } catch (emailError) {
            console.warn('⚠️ Email não enviado (mas subscription foi criada):', emailError.message);
          }
        }

        res.json({ received: true });
      } catch (error) {
        console.error('❌ Erro ao processar webhook de sucesso:', error.message);
        // Ainda responder 200 ao Stripe (senão ele tenta novamente)
        res.json({ received: true });
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      console.log(`❌ Payment Intent FAILED: ${paymentIntent.id}`);
      console.log(`   Motivo: ${paymentIntent.last_payment_error?.message}`);

      // Não fazer nada - o cliente já recebeu o erro
      res.json({ received: true });
      break;
    }

    case 'charge.dispute.created': {
      const charge = event.data.object;
      console.log(`⚠️ DISPUTA: ${charge.payment_intent_id}`);
      console.log(`   Razão: ${charge.reason}`);
      console.log(`   Valor: R$ ${charge.amount / 100}`);

      // TODO: Notificar admin de disputa
      res.json({ received: true });
      break;
    }

    default:
      // Eventos que não processamos
      console.log(`⏭️  Evento não processado: ${event.type}`);
      res.json({ received: true });
  }
});

module.exports = router;
