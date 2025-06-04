import "dotenv/config";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

// Função para determinar configuração SSL baseada na URL do banco
function getSSLConfig() {
  const databaseUrl = process.env.DATABASE_URL!;
  
  // Se estiver em produção, sempre usar SSL seguro
  if (process.env.NODE_ENV === "production") {
    return {
      rejectUnauthorized: true,
      require: true,
    };
  }
  
  // Em desenvolvimento, sempre aceitar certificados auto-assinados se SSL for necessário
  if (databaseUrl.includes("://") && !databaseUrl.includes("localhost")) {
    return {
      rejectUnauthorized: false, // Aceita certificados auto-assinados
      require: true,
    };
  }
  
  // Para localhost em desenvolvimento, SSL desabilitado
  return false;
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

const pool = new Pool(poolConfig);

export const db = drizzle(pool, { schema });
