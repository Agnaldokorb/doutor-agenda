import { NextResponse } from "next/server";
import { db, pool } from "@/db";

export async function GET() {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      DATABASE_URL_LENGTH: process.env.DATABASE_URL?.length || 0,
      DATABASE_URL_PREFIX: process.env.DATABASE_URL?.substring(0, 20) + "...",
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
    });

    console.error("❌ [DEBUG DB] Teste 4: Falhou", error);
  }

  console.log("🔍 [DEBUG DB] Diagnóstico concluído:", debugInfo);

  return NextResponse.json(debugInfo, {
    status: 200,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
