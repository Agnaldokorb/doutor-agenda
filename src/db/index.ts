import "dotenv/config";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

// Função para determinar configuração SSL baseada na URL do banco
function getSSLConfig() {
  const databaseUrl = process.env.DATABASE_URL!;

  console.log(
    `🔍 [DATABASE] Analisando URL do banco: ${databaseUrl.substring(0, 30)}...`,
  );

  // Para localhost (desenvolvimento local), sem SSL
  if (databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1")) {
    console.log(`🔍 [DATABASE] Detectado localhost - SSL desabilitado`);
    return false;
  }

  // Detectar diferentes provedores cloud
  if (
    databaseUrl.includes("neon.") ||
    databaseUrl.includes("supabase.") ||
    databaseUrl.includes("render.")
  ) {
    console.log(`🔍 [DATABASE] Detectado provedor cloud - configurando SSL`);
    return {
      rejectUnauthorized: false,
      require: true,
    };
  }

  // Para provedores cloud (Neon, Supabase, etc.), usar SSL mas aceitar certificados
  if (process.env.NODE_ENV === "production") {
    console.log(`🔍 [DATABASE] Produção detectada - configurando SSL padrão`);
    return {
      rejectUnauthorized: false, // Aceita certificados auto-assinados de provedores
      require: true,
    };
  }

  // Em desenvolvimento com banco remoto
  console.log(
    `🔍 [DATABASE] Desenvolvimento com banco remoto - SSL com rejectUnauthorized false`,
  );
  return {
    rejectUnauthorized: false,
    require: true,
  };
}

// Função para criar configuração de pool mais robusta
function createPoolConfig() {
  const databaseUrl = process.env.DATABASE_URL!;
  const sslConfig = getSSLConfig();

  // Configuração base
  const config = {
    connectionString: databaseUrl,
    ssl: sslConfig,
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

  console.log(`🗄️ [DATABASE] Configuração da pool:`, {
    ssl: sslConfig,
    max: config.max,
    min: config.min,
    connectionTimeoutMillis: config.connectionTimeoutMillis,
  });

  return config;
}

console.log(`🗄️ [DATABASE] Configurando conexão para: ${process.env.NODE_ENV}`);

const poolConfig = createPoolConfig();
const pool = new Pool(poolConfig);

// Adicionar tratamento de erros da pool
pool.on("error", (err) => {
  console.error("❌ [DATABASE] Erro inesperado na conexão do pool:", {
    message: err.message,
    code: (err as any).code,
    errno: (err as any).errno,
    syscall: (err as any).syscall,
  });
});

pool.on("connect", (client) => {
  console.log("✅ [DATABASE] Nova conexão estabelecida");
  // Log da versão do PostgreSQL na primeira conexão
  client.query("SELECT version()", (err, result) => {
    if (!err && result?.rows?.[0]) {
      console.log(
        "🐘 [DATABASE] PostgreSQL:",
        result.rows[0].version.substring(0, 50) + "...",
      );
    }
  });
});

pool.on("acquire", () => {
  console.log("🔄 [DATABASE] Conexão adquirida da pool");
});

pool.on("release", () => {
  console.log("🔄 [DATABASE] Conexão liberada para a pool");
});

// Teste de conectividade no início (melhorado)
async function testConnection() {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      console.log(
        `🔍 [DATABASE] Tentativa ${attempts}/${maxAttempts} de conexão...`,
      );

      const client = await pool.connect();
      console.log("✅ [DATABASE] Conexão com a pool estabelecida");

      const result = await client.query(
        "SELECT NOW() as current_time, version() as version",
      );
      console.log("✅ [DATABASE] Query de teste executada:", {
        currentTime: result.rows[0]?.current_time,
        version: result.rows[0]?.version?.substring(0, 50) + "...",
      });

      client.release();
      console.log("✅ [DATABASE] Teste de conectividade bem-sucedido");
      return;
    } catch (error) {
      console.error(`❌ [DATABASE] Tentativa ${attempts} falhou:`, {
        message: error instanceof Error ? error.message : String(error),
        code: (error as any)?.code,
        errno: (error as any)?.errno,
        syscall: (error as any)?.syscall,
      });

      if (attempts === maxAttempts) {
        console.error("❌ [DATABASE] Todas as tentativas de conexão falharam");
        // Em produção, não devemos falhar completamente, mas logar o erro
        if (process.env.NODE_ENV !== "production") {
          throw error;
        }
      } else {
        // Aguardar antes da próxima tentativa
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }
}

// Executar teste apenas em development para não impactar o build
if (process.env.NODE_ENV === "development") {
  testConnection();
}

export const db = drizzle(pool, { schema });

// Export da pool para uso em debug se necessário
export { pool };
