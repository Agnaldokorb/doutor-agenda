import "dotenv/config";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

// Função para determinar configuração SSL baseada na URL do banco
function getSSLConfig() {
  const databaseUrl = process.env.DATABASE_URL!;

  // Para localhost (desenvolvimento local), sem SSL
  if (databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1")) {
    return false;
  }

  // Para provedores cloud (Neon, Supabase, etc.), usar SSL mas aceitar certificados
  if (process.env.NODE_ENV === "production") {
    return {
      rejectUnauthorized: false, // Aceita certificados auto-assinados de provedores
      require: true,
    };
  }

  // Em desenvolvimento com banco remoto
  return {
    rejectUnauthorized: false,
    require: true,
  };
}

// Configuração segura da conexão com PostgreSQL
const poolConfig = {
  connectionString: process.env.DATABASE_URL!,
  ssl: getSSLConfig(),
  // Configurações de segurança e estabilidade
  max: 20, // máximo de conexões simultâneas
  min: 2, // mínimo de conexões mantidas
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  acquireTimeoutMillis: 10000,
  // Configurações para produção
  query_timeout: 30000,
  statement_timeout: 30000,
  idle_in_transaction_session_timeout: 30000,
};

console.log(`🗄️ [DATABASE] Configurando conexão para: ${process.env.NODE_ENV}`);
console.log(`🗄️ [DATABASE] SSL config:`, getSSLConfig());

const pool = new Pool(poolConfig);

// Adicionar tratamento de erros da pool
pool.on('error', (err) => {
  console.error('❌ [DATABASE] Erro inesperado na conexão do pool:', err);
});

pool.on('connect', () => {
  console.log('✅ [DATABASE] Nova conexão estabelecida');
});

// Teste de conectividade no início
async function testConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✅ [DATABASE] Teste de conectividade bem-sucedido');
  } catch (error) {
    console.error('❌ [DATABASE] Falha no teste de conectividade:', error);
    // Em produção, não devemos falhar completamente, mas logar o erro
    if (process.env.NODE_ENV !== 'production') {
      throw error;
    }
  }
}

// Executar teste apenas em development para não impactar o build
if (process.env.NODE_ENV === 'development') {
  testConnection();
}

export const db = drizzle(pool, { schema });

// Export da pool para uso em debug se necessário
export { pool };
