import { NextRequest, NextResponse } from "next/server";
import { createAdminUser } from "@/actions/create-admin-user";

export async function POST(request: NextRequest) {
  try {
    console.log("👤 Debug: Iniciando criação de usuário...");
    
    const body = await request.json();
    console.log("📊 Debug: Dados recebidos:", {
      ...body,
      password: "***" // Não logar senha
    });

    // Validar dados básicos
    if (!body.name || !body.email || !body.password || !body.clinicName) {
      return NextResponse.json({
        status: "ERROR",
        message: "Dados obrigatórios faltando",
        missing: {
          name: !body.name,
          email: !body.email, 
          password: !body.password,
          clinicName: !body.clinicName
        }
      }, { status: 400 });
    }

    console.log("✅ Debug: Dados validados, chamando createAdminUser action...");
    
    // Tentar criar usuário usando a action
    const result = await createAdminUser({
      name: body.name,
      email: body.email,
      password: body.password,
      clinicName: body.clinicName,
      privacyPolicyAccepted: body.privacyPolicyAccepted || false
    });

    console.log("✅ Debug: Usuário criado com sucesso:", result);

    return NextResponse.json({
      status: "SUCCESS",
      message: "Usuário criado com sucesso",
      data: result,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Debug: Erro detalhado na criação de usuário:", error);
    
    // Capturar o máximo de informação sobre o erro
    const errorInfo = {
      status: "ERROR", 
      message: "Falha na criação de usuário",
      timestamp: new Date().toISOString(),
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        cause: error?.cause,
        // Campos específicos do BetterAuth
        statusCode: error?.statusCode,
        response: error?.response,
        // Se for erro de validação
        validationErrors: error?.validationErrors,
        // Se for erro de banco
        code: error?.code,
        detail: error?.detail,
        // Informações extras
        toString: error?.toString(),
      }
    };

    console.error("❌ Debug: Informações completas do erro:", errorInfo);

    return NextResponse.json(errorInfo, { 
      status: error?.statusCode || 500 
    });
  }
} 