import { NextResponse } from "next/server";
import { db, pool } from "@/db";
import { Pool } from "pg";

export async function GET() {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      DATABASE_URL_LENGTH: process.env.DATABASE_URL?.length || 0,
      DATABASE_URL_PREFIX: process.env.DATABASE_URL?.substring(0, 50) + "...",
      IS_SUPABASE: process.env.DATABASE_URL?.includes("supabase.co") || false,
      HAS_SSLMODE: process.env.DATABASE_URL?.includes("sslmode=") || false,
      FULL_HOSTNAME: extractHostname(process.env.DATABASE_URL || ""),
    },
    pool: {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    },
    tests: [] as Array<{
      name: string;
      status: string;
      duration: number;
      error?: string;
      details?: any;
    }>,
  };

  // Teste 0: DNS Resolution (novo)
  try {
    console.log("🗄️ [DEBUG DB] Teste 0: DNS Resolution...");
    const start = Date.now();
    const hostname = extractHostname(process.env.DATABASE_URL || "");

    if (hostname) {
      // Simulação de teste DNS usando fetch para um endpoint público
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        await fetch(`https://${hostname}`, {
          method: "HEAD",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const duration = Date.now() - start;

        debugInfo.tests.push({
          name: "dns_resolution",
          status: "✅ success",
          duration,
          details: { hostname, message: "Host is reachable" },
        });
      } catch (fetchError) {
        const duration = Date.now() - start;
        const errorMessage =
          fetchError instanceof Error ? fetchError.message : String(fetchError);

        debugInfo.tests.push({
          name: "dns_resolution",
          status: "❌ failed",
          duration,
          error: errorMessage,
          details: {
            hostname,
            suggestion: errorMessage.includes("ENOTFOUND")
              ? "Hostname not found - check if Supabase project is active"
              : "Connection issue - check network/firewall",
          },
        });
      }
    }

    console.log("✅ [DEBUG DB] Teste 0: Concluído");
  } catch (error) {
    debugInfo.tests.push({
      name: "dns_resolution",
      status: "❌ failed",
      duration: 0,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Teste 1: Conexão simples
  try {
    console.log("🗄️ [DEBUG DB] Teste 1: Conexão simples...");
    const start = Date.now();
    const result = await db.execute("SELECT 1 as test");
    const duration = Date.now() - start;

    debugInfo.tests.push({
      name: "simple_connection",
      status: "✅ success",
      duration,
      details: { rowCount: result.rows.length, firstRow: result.rows[0] },
    });

    console.log("✅ [DEBUG DB] Teste 1: Sucesso");
  } catch (error) {
    const duration = Date.now() - Date.now();
    debugInfo.tests.push({
      name: "simple_connection",
      status: "❌ failed",
      duration,
      error: error instanceof Error ? error.message : String(error),
      details: {
        errorName: error instanceof Error ? error.name : "Unknown",
        errorStack:
          error instanceof Error ? error.stack?.split("\n")[0] : undefined,
        errorCause: error instanceof Error ? error.cause : undefined,
        suggestion: getErrorSuggestion(error),
      },
    });

    console.error("❌ [DEBUG DB] Teste 1: Falhou", error);
  }

  // Teste 2: Pool de conexões direta
  try {
    console.log("🗄️ [DEBUG DB] Teste 2: Pool direta...");
    const start = Date.now();
    const client = await pool.connect();
    const result = await client.query(
      "SELECT NOW() as current_time, version() as pg_version",
    );
    client.release();
    const duration = Date.now() - start;

    debugInfo.tests.push({
      name: "pool_connection",
      status: "✅ success",
      duration,
      details: {
        currentTime: result.rows[0]?.current_time,
        pgVersion: result.rows[0]?.pg_version?.substring(0, 50) + "...",
      },
    });

    console.log("✅ [DEBUG DB] Teste 2: Sucesso");
  } catch (error) {
    const duration = Date.now() - Date.now();
    debugInfo.tests.push({
      name: "pool_connection",
      status: "❌ failed",
      duration,
      error: error instanceof Error ? error.message : String(error),
      details: {
        errorName: error instanceof Error ? error.name : "Unknown",
        errorStack:
          error instanceof Error
            ? error.stack?.split("\n").slice(0, 3)
            : undefined,
        suggestion: getErrorSuggestion(error),
      },
    });

    console.error("❌ [DEBUG DB] Teste 2: Falhou", error);
  }

  // Teste 3: Verificação de tabelas
  try {
    console.log("🗄️ [DEBUG DB] Teste 3: Verificação de tabelas...");
    const start = Date.now();
    const result = await db.execute(`
      SELECT 
        schemaname,
        tablename,
        tableowner
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
      LIMIT 10
    `);
    const duration = Date.now() - start;

    debugInfo.tests.push({
      name: "table_check",
      status: "✅ success",
      duration,
      details: {
        tableCount: result.rows.length,
        tables: result.rows.map((row: any) => row.tablename),
      },
    });

    console.log("✅ [DEBUG DB] Teste 3: Sucesso");
  } catch (error) {
    const duration = Date.now() - Date.now();
    debugInfo.tests.push({
      name: "table_check",
      status: "❌ failed",
      duration,
      error: error instanceof Error ? error.message : String(error),
      details: {
        errorName: error instanceof Error ? error.name : "Unknown",
        suggestion: getErrorSuggestion(error),
      },
    });

    console.error("❌ [DEBUG DB] Teste 3: Falhou", error);
  }

  // Teste 4: Timeout de conexão
  try {
    console.log("🗄️ [DEBUG DB] Teste 4: Timeout de conexão...");
    const start = Date.now();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Connection timeout (5s)")), 5000),
    );

    const queryPromise = db.execute(
      "SELECT pg_sleep(1), 'timeout_test' as test",
    );

    const result = await Promise.race([queryPromise, timeoutPromise]);
    const duration = Date.now() - start;

    debugInfo.tests.push({
      name: "timeout_test",
      status: "✅ success",
      duration,
      details: { message: "Query completed within timeout" },
    });

    console.log("✅ [DEBUG DB] Teste 4: Sucesso");
  } catch (error) {
    const duration = Date.now() - Date.now();
    debugInfo.tests.push({
      name: "timeout_test",
      status: "❌ failed",
      duration,
      error: error instanceof Error ? error.message : String(error),
      details: {
        suggestion: getErrorSuggestion(error),
      },
    });

    console.error("❌ [DEBUG DB] Teste 4: Falhou", error);
  }

  // Teste 5: Supabase específico (se aplicável)
  if (process.env.DATABASE_URL?.includes("supabase.co")) {
    try {
      console.log("🗄️ [DEBUG DB] Teste 5: Supabase específico...");
      const start = Date.now();

      // Teste com pool alternativa para Supabase
      const supabasePool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
        },
        max: 5,
        connectionTimeoutMillis: 20000,
        idleTimeoutMillis: 30000,
        allowExitOnIdle: true,
      });

      const client = await supabasePool.connect();
      const result = await client.query(
        "SELECT current_setting('server_version') as version, current_database() as db_name",
      );
      client.release();
      await supabasePool.end();

      const duration = Date.now() - start;

      debugInfo.tests.push({
        name: "supabase_specific",
        status: "✅ success",
        duration,
        details: {
          serverVersion: result.rows[0]?.version,
          databaseName: result.rows[0]?.db_name,
        },
      });

      console.log("✅ [DEBUG DB] Teste 5: Sucesso");
    } catch (error) {
      const duration = Date.now() - Date.now();
      debugInfo.tests.push({
        name: "supabase_specific",
        status: "❌ failed",
        duration,
        error: error instanceof Error ? error.message : String(error),
        details: {
          errorName: error instanceof Error ? error.name : "Unknown",
          errorCode: (error as any)?.code,
          suggestion: getErrorSuggestion(error),
        },
      });

      console.error("❌ [DEBUG DB] Teste 5: Falhou", error);
    }
  }

  console.log("🔍 [DEBUG DB] Diagnóstico concluído:", debugInfo);

  return NextResponse.json(debugInfo, {
    status: 200,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}

// Função auxiliar para extrair hostname da URL
function extractHostname(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    // Fallback para URLs postgresql://
    const match = url.match(/@([^:]+):/);
    return match ? match[1] : "";
  }
}

// Função auxiliar para sugestões de erro
function getErrorSuggestion(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("ENOTFOUND")) {
      return "🔍 Sugestão: Verifique se o projeto Supabase está ativo e o hostname está correto. Projetos inativos podem ser pausados automaticamente.";
    }
    if (error.message.includes("ECONNREFUSED")) {
      return "🔍 Sugestão: Servidor recusou a conexão. Verifique firewall e configurações de rede.";
    }
    if (error.message.includes("timeout")) {
      return "🔍 Sugestão: Timeout de conexão. Tente aumentar os timeouts ou verifique a latência de rede.";
    }
    if (error.message.includes("authentication")) {
      return "🔍 Sugestão: Problema de autenticação. Verifique usuário, senha e permissões do banco.";
    }
    if (error.message.includes("SSL")) {
      return "🔍 Sugestão: Problema de SSL. Verifique as configurações SSL e certificados.";
    }
  }
  return "🔍 Sugestão: Erro desconhecido. Verifique logs detalhados e configurações gerais.";
}
