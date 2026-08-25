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
const { execSync } = require('child_process');
require('dotenv').config();

// Force git pull on startup
try {
  console.log('🔄 Força sincronização com GitHub...');
  const result = execSync('git pull origin main 2>&1', { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
  console.log('✅ Sincronização concluída:', result);
} catch (e) {
  console.log('⚠️ Git pull falhou:', e.message);
}

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
// MIDDLEWARE BASE
// ============================================

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

// Middleware que redireciona / para /index.html
app.use((req, res, next) => {
  if (req.path === '/' && req.method === 'GET') {
    return res.redirect(301, '/index.html');
  }
  next();
});

// ============================================
// ROTAS DE ARQUIVOS ESTÁTICOS (HTML, CSS, JS)
// ============================================

// HTML inline para root (fallback se arquivo não existir)
const indexHTML = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1">
<title>Gastos Família — Controle na palma da mão</title>
<meta name="theme-color" content="#0f1117">
<link rel="manifest" href="manifest.webmanifest">
<link rel="stylesheet" href="css/style.css">
</head>
<body>
<div id="app" style="display:none">
  <header class="topbar">
    <div class="brand">
      <div class="brand-mark">R$</div>
      <div class="brand-text">
        <h1>Gastos Família</h1>
        <span>Controle na palma da mão</span>
      </div>
    </div>
  </header>
  <main id="views"><section class="view" id="view-dashboard"></section></main>
  <nav class="bottom-nav">
    <div class="bottom-nav-inner">
      <button class="nav-item active" data-view="dashboard">
        <span class="glyph">📊</span><span>Painel</span>
      </button>
    </div>
  </nav>
</div>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/license-config.js"></script>
<script src="js/supabase-adapter.js"></script>
<script src="js/app.js"></script>
</body>
</html>`;

// Rotas explícitas para HTML
app.get('/', (req, res) => {
  const filePath = path.join(backendDir, 'index.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.type('text/html').send(indexHTML);
  }
});

app.get('/index.html', (req, res) => {
  const filePath = path.join(backendDir, 'index.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.type('text/html').send(indexHTML);
  }
});

const checkoutHTML = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Gastos Família — Continuar Assinatura</title>
<script src="https://js.stripe.com/v3/"></script>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #0d1117 0%, #161b22 100%); color: #e6edf3; min-height: 100vh; padding: 40px 20px; margin: 0; }
.container { max-width: 600px; margin: 0 auto; }
.header { text-align: center; margin-bottom: 50px; }
.header h1 { font-size: 32px; font-weight: 700; background: linear-gradient(135deg, #58a6ff, #79c0ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.card { background: linear-gradient(135deg, #161b22 0%, #0d1117 100%); border: 1px solid #30363d; border-radius: 16px; padding: 40px 32px; margin-bottom: 24px; }
.payment-methods { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 32px; }
button { padding: 12px 24px; border-radius: 6px; font-weight: 600; cursor: pointer; border: none; background: #238636; color: white; }
button:hover { background: #2ea043; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🛒 Escolha sua Forma de Pagamento</h1>
    <p>Gastos Família - R$ 14,99/ano</p>
  </div>
  <div class="card">
    <div class="payment-methods">
      <button onclick="alert('Stripe: Pagamento com cartão')">💳 Cartão</button>
      <button onclick="alert('Pix: Transferência bancária')">🔐 Pix</button>
      <button onclick="alert('WhatsApp: Negociação')">💬 WhatsApp</button>
    </div>
  </div>
</div>
</body>
</html>`;

app.get('/checkout.html', (req, res) => {
  const filePath = path.join(srcDir, 'checkout.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.type('text/html').send(checkoutHTML);
  }
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(backendDir, 'admin.html'));
});

// Servir arquivos estáticos (CSS, JS, Icons, etc)
app.use(express.static(backendDir));
app.use(express.static(srcDir));
app.use('/css', express.static(path.join(srcDir, 'css')));
app.use('/js', express.static(path.join(srcDir, 'js')));
app.use('/icons', express.static(path.join(srcDir, 'icons')));

// ============================================
// ROTAS DE API
// ============================================

// Webhook ANTES de JSON parser
app.use('/api/webhook', webhooksRouter);

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

// Sync route (para forçar atualização no Replit)
app.get('/sync', (req, res) => {
  const { execSync } = require('child_process');
  try {
    console.log('🔄 Sincronizando com GitHub...');
    execSync('git pull origin main', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
    res.json({ status: 'synced', message: 'Repositório sincronizado com sucesso' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Hard restart route (mata e reinicia tudo)
app.get('/restart', (req, res) => {
  res.json({ status: 'restarting', message: 'Servidor reiniciando em 2 segundos...' });
  setTimeout(() => {
    console.log('💥 RESTART FORÇADO!');
    process.exit(1);
  }, 2000);
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
║   Gastos Família - Backend Server v2   ║
╠════════════════════════════════════════╣
║  🚀 Servidor rodando                   ║
║  📍 http://localhost:${port}               ║
║  🌍 Ambiente: ${nodeEnv}                  ║
║  📂 Backend: ${backendDir}               ║
║  📂 Src: ${srcDir}                       ║
╠════════════════════════════════════════╣
║  Endpoints:                            ║
║  GET  /                                ║
║  GET  /index.html                      ║
║  GET  /checkout.html                   ║
║  GET  /admin.html                      ║
║  POST /api/create-payment-intent      ║
║  POST /api/create-subscription        ║
║  POST /api/cancel-subscription        ║
║  POST /api/pix-confirmation           ║
║  GET  /api/pending-pix-confirmations  ║
║  GET  /api/approved-pix-confirmations ║
║  POST /api/approve-pix                ║
║  GET  /health                         ║
║  GET  /debug                          ║
║  GET  /sync                           ║
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM recebido. Encerrando...');
  process.exit(0);
});
