import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth"; // path to your auth file

const handler = toNextJsHandler(auth);

// Wrapper para adicionar CORS e debug
async function wrappedHandler(req: NextRequest) {
  const startTime = Date.now();
  const method = req.method;
  const url = new URL(req.url);
  const pathname = url.pathname;
  
  console.log(`🔐 [AUTH API] ${method} ${pathname} - Started`);
  
  try {
    // Verificar se o handler existe para o método
    const methodHandler = handler[method as keyof typeof handler];
    if (!methodHandler) {
      console.log(`❌ [AUTH API] Method ${method} not supported`);
      return new NextResponse("Method not allowed", { status: 405 });
    }

    const response = await methodHandler(req);

    if (response) {
      // Adicionar headers CORS
      response.headers.set("Access-Control-Allow-Origin", "*");
      response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization",
      );

      const duration = Date.now() - startTime;
      console.log(`✅ [AUTH API] ${method} ${pathname} - Status: ${response.status} - Duration: ${duration}ms`);

      return response;
    }

    console.log(`❌ [AUTH API] ${method} ${pathname} - No response from handler`);
    return new NextResponse("Internal server error", { status: 500 });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log detalhado do erro
    console.error(`❌ [AUTH API] ${method} ${pathname} - Error after ${duration}ms:`);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      cause: error instanceof Error ? error.cause : undefined,
    });

    // Verificar se é erro de banco de dados
    if (error instanceof Error) {
      if (error.message.includes('connect') || error.message.includes('connection')) {
        console.error('🗄️ [AUTH API] Database connection error detected');
      }
      if (error.message.includes('timeout')) {
        console.error('⏱️ [AUTH API] Timeout error detected');
      }
    }

    return new NextResponse(
      JSON.stringify({
        error: "Internal server error",
        timestamp: new Date().toISOString(),
        path: pathname,
        method: method,
        // Em desenvolvimento, incluir mais detalhes
        ...(process.env.NODE_ENV === 'development' && {
          details: error instanceof Error ? error.message : String(error),
        }),
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export const POST = wrappedHandler;
export const GET = wrappedHandler;
export const OPTIONS = async (req: NextRequest) => {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
};
