import { NextResponse } from "next/server";
import { db, pool } from "@/db";

export async function GET() {
  const timestamp = new Date().toISOString();
  
  console.log("🔍 [DEBUG AUTH] Iniciando diagnóstico completo...");

  const environment = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    hasBetterAuthSecret: !!process.env.BETTER_AUTH_SECRET,
    hasAuthSecret: !!process.env.AUTH_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    betterAuthSecretLength: process.env.BETTER_AUTH_SECRET?.length || 0,
  };

  // Teste de conectividade do banco
  const database = {
    connectionTest: "⏳ testing...",
    tablesCheck: "⏳ testing...",
    userCount: -1,
    poolStats: {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    },
  };

  try {
    // Teste de conexão simples com timeout
    const connectionStart = Date.now();
    await Promise.race([
      db.execute('SELECT 1'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      )
    ]);
    const connectionTime = Date.now() - connectionStart;
    database.connectionTest = `✅ connected (${connectionTime}ms)`;
    
    // Verificação das tabelas
    try {
      const tablesResult = await db.execute(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'sessions', 'accounts', 'verifications')
      `);
      database.tablesCheck = `✅ found ${tablesResult.rows.length}/4 tables`;
      
      // Contar usuários
      const userCountResult = await db.execute('SELECT COUNT(*) as count FROM users');
      database.userCount = parseInt(userCountResult.rows[0]?.count as string || '0');
      
    } catch (tableError) {
      database.tablesCheck = `❌ failed: ${tableError instanceof Error ? tableError.message : 'Unknown error'}`;
    }
    
  } catch (connectionError) {
    database.connectionTest = `❌ failed: ${connectionError instanceof Error ? connectionError.message : 'Unknown error'}`;
  }

  // Teste dos endpoints de autenticação
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://med.novocode.com.br";
  const auth = {
    endpoints: {} as Record<string, string>,
  };

  const endpointsToTest = [
    { name: "signInEmail", path: "/api/auth/sign-in/email" },
    { name: "signUpEmail", path: "/api/auth/sign-up/email" },
    { name: "session", path: "/api/auth/session" },
    { name: "googleAuth", path: "/api/auth/sign-in/google" },
    { name: "signOut", path: "/api/auth/sign-out" },
    { name: "health", path: "/api/health" },
  ];

  for (const endpoint of endpointsToTest) {
    try {
      const response = await fetch(`${baseUrl}${endpoint.path}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        // Timeout de 5 segundos
        signal: AbortSignal.timeout(5000),
      });
      
      if (response.status >= 500) {
        auth.endpoints[endpoint.name] = `⚠️ server error (${response.status})`;
      } else {
        auth.endpoints[endpoint.name] = `✅ responding (${response.status})`;
      }
    } catch (fetchError) {
      if (fetchError instanceof Error) {
        if (fetchError.name === 'TimeoutError' || fetchError.message.includes('timeout')) {
          auth.endpoints[endpoint.name] = "⏱️ timeout";
        } else {
          auth.endpoints[endpoint.name] = `❌ ${fetchError.message}`;
        }
      } else {
        auth.endpoints[endpoint.name] = "❌ unknown error";
      }
    }
  }

  const result = {
    timestamp,
    environment,
    database,
    auth,
  };

  console.log("🔍 [DEBUG AUTH] Diagnóstico concluído:", result);

  return NextResponse.json(result, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
