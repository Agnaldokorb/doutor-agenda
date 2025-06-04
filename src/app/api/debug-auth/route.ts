import { NextResponse } from "next/server";

import { db } from "@/db";

export async function GET() {
  try {
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
      },
      database: {
        connectionTest: "pending",
        tablesCheck: "pending",
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
