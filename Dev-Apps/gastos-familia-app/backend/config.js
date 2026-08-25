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

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.warn(`⚠️ Variáveis de ambiente faltando: ${missingVars.join(', ')}`);
  console.warn('⚠️ Funcionalidades de pagamento/database podem não funcionar');
}

// Supabase Client (usar Service Key para operações do servidor)
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
} else {
  console.warn('⚠️ Supabase não configurado - operações de database indisponíveis');
}

// Conexão verificada sob demanda (não bloqueia inicialização)

module.exports = {
  supabase,
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY
};
