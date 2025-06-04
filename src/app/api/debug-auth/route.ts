import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { usersTable } from "@/db/schema";

// Função auxiliar para testar endpoints
async function testEndpoint(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    
    return {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    const debug = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        hasBetterAuthSecret: !!process.env.BETTER_AUTH_SECRET,
        hasAuthSecret: !!process.env.AUTH_SECRET,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        // Verificar comprimento da secret (deve ter pelo menos 32 caracteres)
        betterAuthSecretLength: process.env.BETTER_AUTH_SECRET?.length || 0,
      },
      database: {
        connectionTest: "pending",
        tablesCheck: "pending",
        userCount: 0,
      },
      auth: {
        endpoints: {
          signInEmail: "pending",
          signUpEmail: "pending",
          session: "pending",
          googleAuth: "pending",
          signOut: "pending",
          health: "pending",
        },
      },
    };

    // Teste de conexão com banco
    try {
      await db.execute("SELECT 1");
      debug.database.connectionTest = "✅ success";
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      debug.database.connectionTest = `❌ failed: ${errorMessage}`;
    }

    // Verificar se as tabelas do BetterAuth existem
    try {
      const tables = await db.execute(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'sessions', 'accounts', 'verifications')
      `);
      debug.database.tablesCheck = `✅ found ${tables.rows.length} auth tables`;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      debug.database.tablesCheck = `❌ failed: ${errorMessage}`;
    }

    // Contar usuários existentes
    try {
      const userCountResult = await db.execute(
        "SELECT COUNT(*) as count FROM users",
      );
      debug.database.userCount = parseInt(
        String(userCountResult.rows[0]?.count || 0),
      );
    } catch (error) {
      debug.database.userCount = -1;
    }

    // Testar endpoints do BetterAuth
    const authEndpoints = [
      {
        name: "signInEmail",
        url: `${baseUrl}/api/auth/sign-in/email`,
        method: "POST",
        testData: { email: "test@example.com", password: "test123" },
      },
      {
        name: "signUpEmail", 
        url: `${baseUrl}/api/auth/sign-up/email`,
        method: "POST",
        testData: { email: "test@example.com", password: "test123", name: "Test User" },
      },
      {
        name: "session",
        url: `${baseUrl}/api/auth/session`,
        method: "GET",
      },
      {
        name: "googleAuth",
        url: `${baseUrl}/api/auth/sign-in/google`,
        method: "GET",
      },
      {
        name: "signOut",
        url: `${baseUrl}/api/auth/sign-out`,
        method: "POST",
      },
      {
        name: "health",
        url: `${baseUrl}/api/health`,
        method: "GET",
      },
    ];

    // Testar cada endpoint
    for (const endpoint of authEndpoints) {
      try {
        const result = await testEndpoint(endpoint.url, {
          method: endpoint.method,
          body: endpoint.testData ? JSON.stringify(endpoint.testData) : undefined,
        });

        if (result.error) {
          debug.auth.endpoints[endpoint.name as keyof typeof debug.auth.endpoints] = 
            `❌ connection failed: ${result.error}`;
        } else if (result.status === 0) {
          debug.auth.endpoints[endpoint.name as keyof typeof debug.auth.endpoints] = 
            "❌ endpoint unreachable";
        } else if (result.status >= 200 && result.status < 500) {
          // Para endpoints de auth, códigos 4xx são esperados sem dados válidos
          debug.auth.endpoints[endpoint.name as keyof typeof debug.auth.endpoints] = 
            `✅ responding (${result.status})`;
        } else {
          debug.auth.endpoints[endpoint.name as keyof typeof debug.auth.endpoints] = 
            `⚠️ server error (${result.status})`;
        }
      } catch (error) {
        debug.auth.endpoints[endpoint.name as keyof typeof debug.auth.endpoints] = 
          `❌ test failed: ${error instanceof Error ? error.message : String(error)}`;
      }
    }

    return NextResponse.json(debug);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: "Debug failed",
        message: errorMessage,
        stack: errorStack,
      },
      { status: 500 },
    );
  }
}

// Endpoint POST para testar autenticação
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 },
      );
    }

    // Verificar se usuário existe usando Drizzle query
    try {
      const users = await db
        .select({
          id: usersTable.id,
          email: usersTable.email,
          emailVerified: usersTable.emailVerified,
        })
        .from(usersTable)
        .where(eq(usersTable.email, email));

      if (users.length === 0) {
        return NextResponse.json({
          status: "user_not_found",
          message: "Usuário não encontrado. Crie uma conta primeiro.",
          suggestion: "Tente criar uma conta nova.",
        });
      }

      const user = users[0];
      return NextResponse.json({
        status: "user_exists",
        message: "Usuário encontrado no banco",
        user: {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return NextResponse.json(
        {
          error: "Database query failed",
          message: errorMessage,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Invalid request",
        message: errorMessage,
      },
      { status: 400 },
    );
  }
}
