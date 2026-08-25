#!/bin/bash
echo "🛑 Matando todos os processos Node..."
pkill -9 node || pkill -9 npm || true
sleep 2

echo "🔄 Sincronizando com GitHub..."
git pull origin main --force

echo "📦 Instalando dependências..."
cd backend
npm install --omit=dev

echo "🚀 Iniciando novo servidor..."
npm start
