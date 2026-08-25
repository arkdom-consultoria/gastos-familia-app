const nodemailer = require('nodemailer');

// Configurar transporter de email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'projetos@arkdom.com.br',
    pass: process.env.EMAIL_PASSWORD || ''
  }
});

/**
 * Enviar email de confirmação de pagamento Stripe
 */
async function sendStripeConfirmation(email, subscriptionId, expiryDate) {
  try {
    const expiryDateFormatted = new Date(expiryDate).toLocaleDateString('pt-BR');

    const mailOptions = {
      from: 'noreply@gastos-familia.com.br',
      to: email,
      subject: '✅ Pagamento Confirmado - Gastos Família',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #238636; text-align: center;">✅ Pagamento Confirmado!</h2>

          <div style="background: #f6f8fa; border: 1px solid #d0d7de; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p><strong>Seu acesso já foi ativado! 🎉</strong></p>
            <p>Sua assinatura anual do Gastos Família foi processada com sucesso.</p>
            <ul style="line-height: 1.8;">
              <li><strong>ID da Assinatura:</strong> ${subscriptionId}</li>
              <li><strong>Válida até:</strong> ${expiryDateFormatted}</li>
              <li><strong>Renovação automática:</strong> Sim (15 dias antes da expiração você receberá um aviso)</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://gastos-familia.vercel.app'}/index.html" style="background: #238636; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
              Acessar Gastos Família
            </a>
          </div>

          <div style="background: #f6f8fa; border-left: 4px solid #0969da; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 13px; color: #57606a;">
              <strong>Dados de Segurança:</strong> Seus dados são protegidos conforme a LGPD.
              Você sempre é o proprietário dos seus dados e pode exportar ou deletar sua conta a qualquer momento.
            </p>
          </div>

          <div style="text-align: center; font-size: 12px; color: #57606a; margin-top: 30px; border-top: 1px solid #d0d7de; padding-top: 20px;">
            <p>Gastos Família • Controle de Despesas Familiares</p>
            <p>Precisa de ajuda? <a href="mailto:projetos@arkdom.com.br" style="color: #0969da; text-decoration: none;">projetos@arkdom.com.br</a></p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email enviado para ${email}:`, result.response);
    return result;
  } catch (error) {
    console.error(`❌ Erro ao enviar email para ${email}:`, error.message);
    throw error;
  }
}

/**
 * Enviar email de confirmação de Pix (após admin aprovar)
 */
async function sendPixApprovalEmail(email, accessLink, confirmationCode) {
  try {
    const mailOptions = {
      from: 'noreply@gastos-familia.com.br',
      to: email,
      subject: '✅ Pix Confirmado - Seu Acesso Foi Liberado! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #238636; text-align: center;">✅ Pix Recebido e Confirmado!</h2>

          <div style="background: #f6f8fa; border: 1px solid #d0d7de; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p><strong>Obrigado pelo seu pagamento! 🙏</strong></p>
            <p>Seu Pix foi recebido e confirmado. Seu acesso foi ativado imediatamente.</p>

            <div style="background: white; border: 2px dashed #0969da; border-radius: 6px; padding: 15px; margin: 15px 0; text-align: center;">
              <p style="font-size: 12px; color: #57606a; margin: 0 0 8px;">Código de Confirmação:</p>
              <p style="font-size: 16px; font-weight: bold; color: #0969da; margin: 0; font-family: monospace;">${confirmationCode}</p>
            </div>

            <p style="margin-top: 20px;">Sua assinatura é válida por 12 meses com renovação automática.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${accessLink}" style="background: #238636; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
              Acessar Gastos Família Agora
            </a>
          </div>

          <div style="background: #f6f8fa; border-left: 4px solid #0969da; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 13px; color: #57606a;">
              <strong>Próximas Etapas:</strong> Você receberá um email de aviso 15 dias antes da renovação automática.
              Pode cancelar a qualquer momento no menu de Ajustes dentro do app.
            </p>
          </div>

          <div style="text-align: center; font-size: 12px; color: #57606a; margin-top: 30px; border-top: 1px solid #d0d7de; padding-top: 20px;">
            <p>Gastos Família • Controle de Despesas Familiares</p>
            <p>Precisa de ajuda? <a href="mailto:projetos@arkdom.com.br" style="color: #0969da; text-decoration: none;">projetos@arkdom.com.br</a></p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email Pix enviado para ${email}:`, result.response);
    return result;
  } catch (error) {
    console.error(`❌ Erro ao enviar email Pix para ${email}:`, error.message);
    throw error;
  }
}

module.exports = {
  sendStripeConfirmation,
  sendPixApprovalEmail
};
