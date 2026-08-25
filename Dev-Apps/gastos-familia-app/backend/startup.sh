#!/bin/bash

echo "🔄 Sincronizando com GitHub..."
cd /root/gastos-familia-app 2>/dev/null || cd /home/runner/gastos-familia-app 2>/dev/null || cd .. 2>/dev/null
git pull origin main --force 2>/dev/null || true

echo "📦 Instalando dependências..."
cd backend
npm install

echo "🚀 Iniciando servidor..."
npm run dev
