/**
 * Subscription Routes
 * POST /api/create-subscription
 * POST /api/cancel-subscription
 */

const express = require('express');
const { supabase } = require('../config');
const { sendStripeConfirmation } = require('../services/emailService');

const router = express.Router();

/**
 * POST /api/create-subscription
 * Salva assinatura no Supabase após pagamento bem-sucedido
 *
 * Body:
 *   - userId: UUID do usuário
 *   - stripePaymentId: ID do Payment Intent (resultado do Stripe)
 *   - amount: Valor em centavos (1499 = R$ 14,99)
 *   - currency: Moeda (BRL)
 *   - planDays: Dias de vigência (365 para anual)
 */
router.post('/create-subscription', async (req, res) => {
  try {
    const { userId, stripePaymentId, amount, currency, planDays } = req.body;

    // Validar entrada
    if (!userId || !stripePaymentId || !planDays) {
      return res.status(400).json({
        error: 'Missing required fields: userId, stripePaymentId, planDays'
      });
    }

    console.log(`📅 Criando assinatura: ${userId} - ${planDays} dias`);

    // Calcular datas
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + parseInt(planDays));

    // Salvar assinatura no Supabase
    const { data, error } = await supabase
      .from('assinaturas')
      .insert([{
        usuario_id: userId,
        stripe_payment_id: stripePaymentId,
        valor: parseFloat(amount / 100), // Converter de centavos para reais
        moeda: currency || 'BRL',
        plano: 'yearly',
        data_inicio: startDate.toISOString(),
        data_expiracao: endDate.toISOString(),
        status: 'ativa',
        renovacao_automatica: true
      }]);

    if (error) {
      console.error('❌ Erro ao inserir no Supabase:', error);
      throw error;
    }

    const subscriptionId = data[0]?.id;
    console.log(`✅ Assinatura criada: ${subscriptionId}`);

    // Enviar email de confirmação (não bloqueia se falhar)
    if (userId) {
      try {
        await sendStripeConfirmation(userId, subscriptionId, endDate.toISOString());
      } catch (emailError) {
        console.warn('⚠️ Aviso: Email não enviado, mas assinatura foi criada');
      }
    }

    res.json({
      success: true,
      subscriptionId: subscriptionId,
      expiryDate: endDate.toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao criar assinatura:', error.message);
    res.status(500).json({
      error: error.message || 'Erro ao salvar assinatura'
    });
  }
});

/**
 * POST /api/cancel-subscription
 * Cancela assinatura (atualiza status)
 *
 * Body:
 *   - userId: UUID do usuário
 *   - reason: Motivo do cancelamento (opcional)
 */
router.post('/cancel-subscription', async (req, res) => {
  try {
    const { userId, reason } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    console.log(`❌ Cancelando assinatura: ${userId}`);

    // Atualizar status para cancelada
    const { data, error } = await supabase
      .from('assinaturas')
      .update({
        status: 'cancelada',
        data_cancelamento: new Date().toISOString(),
        razao_cancelamento: reason || 'Cancelado pelo usuário'
      })
      .eq('usuario_id', userId)
      .eq('status', 'ativa');

    if (error) throw error;

    console.log(`✅ Assinatura cancelada`);

    res.json({
      success: true,
      message: 'Assinatura cancelada. Acesso mantido até vencimento.'
    });

  } catch (error) {
    console.error('❌ Erro ao cancelar:', error.message);
    res.status(500).json({
      error: error.message || 'Erro ao cancelar assinatura'
    });
  }
});

module.exports = router;
