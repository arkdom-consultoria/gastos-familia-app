# 🚀 Setup Gastos Família no Replit

## Passo 1: Variáveis de Ambiente

No Replit, vá em **Tools → Secrets** e adicione estas variáveis:

### Essenciais (sem estas não funciona):
```
SUPABASE_URL=https://zudgocuhhhtbczyjbfhf.supabase.co
SUPABASE_SERVICE_KEY=seu_service_key_aqui
STRIPE_SECRET_KEY=sk_test_seu_key_aqui
```

### Recomendado (para funcionalidades completas):
```
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://[seu-url-replit].spock.replit.dev
STRIPE_PUBLISHABLE_KEY=pk_test_seu_key_aqui
STRIPE_WEBHOOK_SECRET=whsec_seu_webhook_secret_aqui
EMAIL_USER=seu_email@gmail.com
EMAIL_PASSWORD=sua_app_password_16_caracteres
```

## Passo 2: Instalar Dependências

Na pasta `backend`, execute:
```bash
cd backend
npm install
```

## Passo 3: Iniciar Servidor

```bash
npm run dev
```

Você verá:
```
╔════════════════════════════════════════╗
║   Gastos Família - Backend Server      ║
╠════════════════════════════════════════╣
║  🚀 Servidor rodando                   ║
║  📍 http://localhost:3001               ║
║  🌍 Ambiente: production                ║
```

## Passo 4: Acessar a Aplicação

- **App Principal:** `https://[seu-url]/index.html`
- **Checkout:** `https://[seu-url]/checkout.html`
- **Admin Panel:** `https://[seu-url]/admin.html`
- **Health Check:** `https://[seu-url]/health`

## Troubleshooting

### ⚠️ Servidor não inicia
Verifique em **Tools → Logs** se aparecem erros sobre variáveis de ambiente.

### ⚠️ Telas em branco
- Verificar console do navegador (F12)
- Verificar se `/health` retorna `{"status":"ok"}`
- Verificar se Supabase está configurado

### ⚠️ Pagamentos não funcionam
Certificar que `STRIPE_SECRET_KEY` está correto em Secrets.

---

**Dúvidas?** Verifique `backend/.env.example` para descrição completa de cada variável.
