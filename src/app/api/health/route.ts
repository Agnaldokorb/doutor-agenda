import { NextResponse } from "next/server";

export async function GET() {
  try {
    const timestamp = new Date().toISOString();
    const nodeEnv = process.env.NODE_ENV || "development";
    
    const healthData = {
      status: "OK",
      timestamp,
      environment: nodeEnv,
      url: process.env.NEXT_PUBLIC_APP_URL || "não configurada",
      hasAuthSecret: !!process.env.AUTH_SECRET,
      hasBetterAuthSecret: !!process.env.BETTER_AUTH_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasResendApiKey: !!process.env.RESEND_API_KEY,
    };

    console.log("🏥 Health check:", healthData);

    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    console.error("❌ Health check error:", error);
    return NextResponse.json(
      { 
        status: "ERROR", 
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 