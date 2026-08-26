const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const backendDir = __dirname;
const srcDir = path.resolve(__dirname, '../src');

// Middleware
app.use(express.json());
app.use(cors({ origin: '*' }));

// Log todas as requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// HTML simples para teste
const htmlTest = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Gastos Família - FUNCIONANDO!</title>
  <style>
    body { font-family: Arial; background: #222; color: #0f0; padding: 40px; }
    h1 { color: #0f0; }
    .status { padding: 20px; background: #111; border: 2px solid #0f0; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>✅ GASTOS FAMÍLIA - SERVIDOR FUNCIONANDO!</h1>
  <div class="status">
    <p><strong>Status:</strong> Online</p>
    <p><strong>Hora:</strong> ${new Date().toISOString()}</p>
    <p><strong>Ambiente:</strong> ${process.env.NODE_ENV || 'development'}</p>
    <p><strong>Porta:</strong> ${PORT}</p>
  </div>
  <h2>Endpoints disponíveis:</h2>
  <ul>
    <li>GET / - Esta página</li>
    <li>GET /health - Status JSON</li>
    <li>GET /api/health - API Health</li>
  </ul>
</body>
</html>`;

// ============ ROTAS HTML ============
app.get('/', (req, res) => {
  console.log('✅ Servidor enviando HTML para /');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(htmlTest);
});

app.get('/index.html', (req, res) => {
  console.log('✅ Servidor enviando HTML para /index.html');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(htmlTest);
});

// ============ ROTAS API ============
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT,
    env: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT,
    env: process.env.NODE_ENV || 'development'
  });
});

// ============ 404 ============
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada', path: req.path });
});

// ============ INICIAR ============
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   GASTOS FAMÍLIA - SERVIDOR LIMPO      ║
╠════════════════════════════════════════╣
║  ✅ Servidor rodando                   ║
║  📍 http://0.0.0.0:${PORT}                ║
║  🌍 Ambiente: ${(process.env.NODE_ENV || 'development').padEnd(25)}║
╠════════════════════════════════════════╣
║  Endpoints:                            ║
║  GET  /              → HTML teste      ║
║  GET  /health        → JSON status     ║
║  GET  /api/health    → API status      ║
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM - Encerrando...');
  process.exit(0);
});
