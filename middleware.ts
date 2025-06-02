import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pular middleware para arquivos estáticos e API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname === "/authentication"
  ) {
    return NextResponse.next();
  }

  // Headers de segurança específicos para conformidade LGPD
  const response = NextResponse.next();

  // Adicionar headers de segurança
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Header para prevenir cache de dados sensíveis
  if (
    pathname.includes("/patients") ||
    pathname.includes("/appointments") ||
    pathname.includes("/medical-records")
  ) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  try {
    // Verificar se o usuário está autenticado
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // Log de tentativa de acesso para auditoria LGPD
    if (session?.user && pathname !== "/authentication") {
      console.log(
        `🔍 [AUDIT] User ${session.user.email} accessed: ${pathname} from IP: ${request.ip || "unknown"}`,
      );
    }

    // Se não está logado e não está indo para autenticação
    if (!session?.user && !pathname.startsWith("/authentication")) {
      const authUrl = new URL("/authentication", request.url);
      return NextResponse.redirect(authUrl);
    }

    // Se está logado e tem sessão válida
    if (session?.user) {
      // Se está na página de autenticação mas já está logado, redireciona
      if (pathname === "/authentication") {
        const dashboardUrl = new URL("/dashboard", request.url);
        return NextResponse.redirect(dashboardUrl);
      }

      // Se precisa alterar a senha mas não está na página de alteração
      if (session.user.mustChangePassword && pathname !== "/change-password") {
        const changePasswordUrl = new URL("/change-password", request.url);
        return NextResponse.redirect(changePasswordUrl);
      }

      // Se está na página de alterar senha mas não precisa mais alterar
      if (!session.user.mustChangePassword && pathname === "/change-password") {
        const dashboardUrl = new URL("/dashboard", request.url);
        return NextResponse.redirect(dashboardUrl);
      }
    }
  } catch (error) {
    console.error("❌ [SECURITY] Erro no middleware:", error);
    // Log de erro de segurança para auditoria
    console.log(
      `🚨 [SECURITY ALERT] Middleware error for path: ${pathname} from IP: ${request.ip || "unknown"}`,
    );

    // Em caso de erro, redirecionar para autenticação apenas se não estiver já lá
    if (pathname !== "/authentication") {
      const authUrl = new URL("/authentication", request.url);
      return NextResponse.redirect(authUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
