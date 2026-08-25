/**
 * Admin Routes
 * GET /api/pending-pix-confirmations
 * POST /api/approve-pix
 */

const express = require('express');
const { supabase } = require('../config');
const { sendPixApprovalEmail } = require('../services/emailService');
const router = express.Router();

// Armazenar confirmações de Pix em memória (em produção, usar banco de dados)
let pixConfirmations = [];

/**
 * POST /api/pix-confirmation
 * Registra nova confirmação de Pix
 */
router.post('/pix-confirmation', (req, res) => {
  try {
    const { confirmationCode, email, amount, timestamp } = req.body;

    const confirmation = {
      id: confirmationCode,
      code: confirmationCode,
      email: email,
      amount: amount,
      timestamp: timestamp,
      status: 'pending',
      approvedAt: null
    };

    pixConfirmations.push(confirmation);

    console.log(`📲 Pix confirmation registrado: ${confirmationCode} - ${email}`);

    res.json({
      success: true,
      message: 'Confirmação registrada. Aguardando aprovação.',
      code: confirmationCode
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/pending-pix-confirmations
 * Lista todas as confirmações pendentes
 */
router.get('/pending-pix-confirmations', (req, res) => {
  try {
    const pending = pixConfirmations.filter(c => c.status === 'pending');
    res.json({
      success: true,
      count: pending.length,
      confirmations: pending.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    });
  } catch (error) {
    console.error('❌ Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/approve-pix
 * Aprova um Pix e libera acesso
 */
router.post('/approve-pix', async (req, res) => {
  try {
    const { confirmationCode, email } = req.body;

    if (!confirmationCode || !email) {
      return res.status(400).json({ error: 'Código e email são obrigatórios' });
    }

    // Encontrar confirmação
    const confirmation = pixConfirmations.find(c => c.code === confirmationCode);
    if (!confirmation) {
      return res.status(404).json({ error: 'Confirmação não encontrada' });
    }

    // Marcar como aprovada
    confirmation.status = 'approved';
    confirmation.approvedAt = new Date().toISOString();

    console.log(`✅ Pix aprovado: ${confirmationCode} - ${email}`);

    // Enviar email com link de acesso
    try {
      const accessLink = `${process.env.FRONTEND_URL || 'https://gastos-familia.vercel.app'}/index.html`;
      await sendPixApprovalEmail(email, accessLink, confirmationCode);
    } catch (emailError) {
      console.warn('⚠️ Aviso: Email não enviado, mas Pix foi aprovado');
    }

    // TODO: Criar registro em assinaturas com status ativa
    // TODO: Associar confirmação de Pix a uma subscription no Supabase

    res.json({
      success: true,
      message: 'Pix aprovado! Email enviado ao cliente.',
      code: confirmationCode,
      email: email
    });

  } catch (error) {
    console.error('❌ Erro ao aprovar:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/approved-pix-confirmations
 * Lista confirmações aprovadas
 */
router.get('/approved-pix-confirmations', (req, res) => {
  try {
    const approved = pixConfirmations.filter(c => c.status === 'approved');
    res.json({
      success: true,
      count: approved.length,
      confirmations: approved.sort((a, b) => new Date(b.approvedAt) - new Date(a.approvedAt))
    });
  } catch (error) {
    console.error('❌ Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
