import { NextResponse } from "next/server";
import { db } from "@/db";

interface DatabaseCheck {
  status: "healthy" | "unhealthy" | "unknown";
  responseTime: number;
  error?: string;
}

interface EnvironmentCheck {
  status: "healthy" | "unhealthy" | "unknown";
  missing?: string[];
}

export async function GET() {
  const startTime = Date.now();

  const health = {
    status: "healthy" as "healthy" | "unhealthy",
    timestamp: new Date().toISOString(),
    checks: {
      database: { status: "unknown", responseTime: 0 } as DatabaseCheck,
      environment: { status: "unknown" } as EnvironmentCheck,
    },
    version: process.env.npm_package_version || "unknown",
    environment: process.env.NODE_ENV,
    responseTime: 0,
  };

  // Verificar banco de dados
  try {
    const dbStart = Date.now();
    await db.execute("SELECT 1");
    const dbTime = Date.now() - dbStart;

    health.checks.database = {
      status: "healthy",
      responseTime: dbTime,
    };
  } catch (error) {
    health.status = "unhealthy";
    health.checks.database = {
      status: "unhealthy",
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }

  // Verificar variáveis de ambiente críticas
  const requiredEnvVars = [
    "DATABASE_URL",
    "BETTER_AUTH_SECRET",
    "NEXT_PUBLIC_APP_URL",
  ];

  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar],
  );

  if (missingEnvVars.length > 0) {
    health.status = "unhealthy";
    health.checks.environment = {
      status: "unhealthy",
      missing: missingEnvVars,
    };
  } else {
    health.checks.environment = {
      status: "healthy",
    };
  }

  const totalTime = Date.now() - startTime;
  health.responseTime = totalTime;

  const statusCode = health.status === "healthy" ? 200 : 503;

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
