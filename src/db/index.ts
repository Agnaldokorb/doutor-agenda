import "dotenv/config";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

// Configuração segura da conexão com PostgreSQL
const poolConfig = {
  connectionString: process.env.DATABASE_URL!,
  ssl:
    process.env.NODE_ENV === "production"
      ? {
          rejectUnauthorized: true,
          require: true,
        }
      : false,
  // Configurações de segurança
  max: 20, // máximo de conexões simultâneas
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

const pool = new Pool(poolConfig);

export const db = drizzle(pool, { schema });
