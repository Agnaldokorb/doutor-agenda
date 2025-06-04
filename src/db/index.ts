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
  // Configurações de segurança
  max: 20, // máximo de conexões simultâneas
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

console.log(`🗄️ [DATABASE] Configurando conexão para: ${process.env.NODE_ENV}`);
console.log(`🗄️ [DATABASE] SSL config:`, getSSLConfig());

const pool = new Pool(poolConfig);

export const db = drizzle(pool, { schema });
