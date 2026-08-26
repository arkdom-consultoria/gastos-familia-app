/**
 * Payment Routes
 * POST /api/create-payment-intent
 */

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

/**
 * POST /api/create-payment-intent
 * Cria um Payment Intent no Stripe
 *
 * Body:
 *   - userId: UUID do usuário
 *   - email: Email do usuário
 *   - amount: Valor em centavos (1499 = R$ 14,99)
 *   - currency: Moeda (brl)
 */
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { userId, email, amount, currency } = req.body;

    // Validar entrada
    if (!userId || !email || !amount) {
      return res.status(400).json({
        error: 'Missing required fields: userId, email, amount'
      });
    }

    // Validar que amount é número
    const amountInt = parseInt(amount);
    if (isNaN(amountInt) || amountInt < 50) {
      return res.status(400).json({
        error: 'Amount must be at least 50 cents'
      });
    }

    console.log(`💳 Criando Payment Intent: ${email} - R$ ${(amountInt / 100).toFixed(2)}`);

    // Criar Payment Intent no Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInt,
      currency: currency || 'brl',
      receipt_email: email,
      description: 'Gastos Família - Assinatura Anual',
      metadata: {
        userId: userId,
        plan: 'yearly',
        priceR$: '14.99'
      }
    });

    console.log(`✅ Payment Intent criado: ${paymentIntent.id}`);

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('❌ Erro ao criar Payment Intent:', error.message);
    res.status(500).json({
      error: error.message || 'Erro ao criar pagamento'
    });
  }
});

module.exports = router;
