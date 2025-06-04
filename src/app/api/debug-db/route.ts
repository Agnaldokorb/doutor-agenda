import { NextResponse } from "next/server";
import { db } from "@/db";

export async function GET() {
  try {
    console.log("🗄️ Testando conexão com banco...");
    
    // Teste simples de conexão - tentar executar uma query
    const result = await db.execute('SELECT 1 as test');
    
    console.log("✅ Banco conectado com sucesso");
    
    return NextResponse.json({
      status: "OK",
      message: "Conexão com banco funcionando",
      timestamp: new Date().toISOString(),
      queryResult: result.rows
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Erro na conexão com banco:", error);
    
    const errorInfo = {
      status: "ERROR",
      message: "Falha na conexão com banco",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined
    };

    return NextResponse.json(errorInfo, { status: 500 });
  }
} 