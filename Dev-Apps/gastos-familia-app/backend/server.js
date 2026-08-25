/**
 * Servidor Backend - Gastos Família
 * Endpoints de pagamento e assinatura
 *
 * Instalação:
 *   npm install express stripe dotenv @supabase/supabase-js cors
 *
 * Variáveis de Ambiente (.env):
 *   PORT=3001
 *   NODE_ENV=development
 *   SUPABASE_URL=https://...
 *   SUPABASE_SERVICE_KEY=...
 *   STRIPE_SECRET_KEY=sk_test_...
 *   STRIPE_PUBLISHABLE_KEY=pk_test_...
 *
 * Iniciar:
 *   node server.js
 *
 * Testes:
 *   curl -X POST http://localhost:3001/api/create-payment-intent \
 *     -H "Content-Type: application/json" \
 *     -d '{"userId":"abc123","email":"test@example.com","amount":1499,"currency":"brl"}'
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { port, nodeEnv } = require('./config');
const paymentsRouter = require('./routes/payments');
const subscriptionsRouter = require('./routes/subscriptions');
const adminRouter = require('./routes/admin');
const webhooksRouter = require('./routes/webhooks');

const app = express();

// Definir caminhos absolutos
const backendDir = __dirname;
const srcDir = path.resolve(__dirname, '../src');

// ============================================
// MIDDLEWARE
// ============================================

// IMPORTANTE: Webhook do Stripe antes de express.json()
app.use('/api/webhook', webhooksRouter);

app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Servir arquivos estáticos com tipos corretos
app.use(express.static(backendDir)); // Servir admin.html, index.html, etc da pasta backend
app.use(express.static(srcDir)); // Servir index.html, checkout.html, etc da pasta src
app.use('/css', express.static(path.join(srcDir, 'css'))); // CSS
app.use('/js', express.static(path.join(srcDir, 'js'))); // JavaScript
app.use('/icons', express.static(path.join(srcDir, 'icons'))); // Ícones

// Rotas explícitas para HTML (fallback)
app.get('/index.html', (req, res) => {
  const filePath = path.join(srcDir, 'index.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'index.html não encontrado', path: filePath });
  }
});

app.get('/checkout.html', (req, res) => {
  const filePath = path.join(srcDir, 'checkout.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'checkout.html não encontrado', path: filePath });
  }
});

app.get('/admin.html', (req, res) => {
  const filePath = path.join(backendDir, 'admin.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'admin.html não encontrado', path: filePath });
  }
});

// ============================================
// ROTAS
// ============================================

app.use('/api', paymentsRouter);
app.use('/api', subscriptionsRouter);
app.use('/api', adminRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    backend_dir: backendDir,
    src_dir: srcDir,
    index_html_exists: fs.existsSync(path.join(srcDir, 'index.html')),
    checkout_html_exists: fs.existsSync(path.join(srcDir, 'checkout.html')),
    admin_html_exists: fs.existsSync(path.join(backendDir, 'admin.html'))
  });
});

// Debug route
app.get('/debug', (req, res) => {
  const debugInfo = {
    backendDir,
    srcDir,
    files_in_backend: fs.readdirSync(backendDir).filter(f => f.endsWith('.html')),
    files_in_src: fs.readdirSync(srcDir).filter(f => f.endsWith('.html'))
  };
  res.json(debugInfo);
});

// ============================================
// TRATAMENTO DE ERROS
// ============================================

app.use((err, req, res, next) => {
  console.error('❌ Erro:', err.message);
  res.status(500).json({
    error: nodeEnv === 'production'
      ? 'Erro interno do servidor'
      : err.message
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(port, () => {
  console.log(`
╔════════════════════════════════════════╗
║   Gastos Família - Backend Server      ║
╠════════════════════════════════════════╣
║  🚀 Servidor rodando                   ║
║  📍 http://localhost:${port}               ║
║  🌍 Ambiente: ${nodeEnv}                  ║
╠════════════════════════════════════════╣
║  Endpoints:                            ║
║  POST /api/create-payment-intent      ║
║  POST /api/create-subscription        ║
║  POST /api/cancel-subscription        ║
║  POST /api/pix-confirmation           ║
║  GET  /api/pending-pix-confirmations  ║
║  GET  /api/approved-pix-confirmations ║
║  POST /api/approve-pix                ║
║  GET  /health                         ║
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM recebido. Encerrando...');
  process.exit(0);
});
