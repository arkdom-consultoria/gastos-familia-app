/**
 * Configuração Central
 * Variáveis de ambiente e conexões
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Validar variáveis necessárias
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'STRIPE_SECRET_KEY'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Variável de ambiente não encontrada: ${varName}`);
    process.exit(1);
  }
});

// Supabase Client (usar Service Key para operações do servidor)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Conexão verificada sob demanda (não bloqueia inicialização)

module.exports = {
  supabase,
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY
};
