import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth"; // path to your auth file

const handler = toNextJsHandler(auth);

// Wrapper para adicionar CORS e debug
async function wrappedHandler(req: NextRequest) {
  console.log(`🔐 [AUTH API] ${req.method} ${req.url}`);
  console.log("📋 Headers:", Object.fromEntries(req.headers.entries()));

  try {
    const response = await handler[req.method as keyof typeof handler]?.(req);

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

      console.log(`✅ [AUTH API] Response status: ${response.status}`);

      return response;
    }

    return new NextResponse("Method not allowed", { status: 405 });
  } catch (error) {
    console.error("❌ [AUTH API] Error:", error);
    return new NextResponse("Internal server error", { status: 500 });
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
