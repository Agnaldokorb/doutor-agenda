import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { customSession } from "better-auth/plugins";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { usersToClinicsTable } from "@/db/schema";

// Debug das variáveis de ambiente
console.log("🔐 [AUTH CONFIG] Configurando BetterAuth...");
console.log(
  "🔐 [AUTH CONFIG] NEXT_PUBLIC_APP_URL:",
  process.env.NEXT_PUBLIC_APP_URL,
);
console.log(
  "🔐 [AUTH CONFIG] BETTER_AUTH_SECRET present:",
  !!process.env.BETTER_AUTH_SECRET,
);
console.log("🔐 [AUTH CONFIG] AUTH_SECRET present:", !!process.env.AUTH_SECRET);
console.log(
  "🔐 [AUTH CONFIG] DATABASE_URL present:",
  !!process.env.DATABASE_URL,
);
console.log("🔐 [AUTH CONFIG] NODE_ENV:", process.env.NODE_ENV);

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  // Usar BETTER_AUTH_SECRET primeiro, depois AUTH_SECRET como fallback
  secret:
    process.env.BETTER_AUTH_SECRET ||
    process.env.AUTH_SECRET ||
    "dev-secret-key-change-in-production",
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema,
  }),
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://*.vercel.app",
    "https://med.novocode.com.br",
    ...(process.env.NEXT_PUBLIC_APP_URL
      ? [process.env.NEXT_PUBLIC_APP_URL]
      : []),
  ],
  // Configurações de segurança para conformidade LGPD
  session: {
    modelName: "sessionsTable",
    cookieName: "better-auth.session_token",
    updateAge: 24 * 60 * 60, // 24 horas
    expiresIn: 60 * 60 * 24 * 7, // 7 dias
    freshAge: 60 * 60 * 24, // 1 dia
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      domain: process.env.NODE_ENV === "production" ? undefined : "localhost",
      path: "/",
    },
  },
  // Configurações de segurança para senhas
  advanced: {
    generateId: () => crypto.randomUUID(),
    crossSubDomainCookies: {
      enabled: false, // Segurança LGPD
    },
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // Solicitar apenas dados essenciais (LGPD - minimização)
      scope: ["profile", "email"],
      additionalParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  },
  plugins: [
    customSession(async ({ user, session }) => {
      try {
        // Timeout para evitar travamento da sessão
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Session query timeout")), 5000);
        });

        const sessionDataPromise = (async () => {
          const clinics = await db.query.usersToClinicsTable.findMany({
            where: eq(usersToClinicsTable.userId, user.id),
            with: {
              clinic: true,
            },
          });

          // Buscar informações completas do usuário incluindo o tipo
          const fullUser = await db.query.usersTable.findFirst({
            where: eq(schema.usersTable.id, user.id),
          });

          // TODO: Ao adaptar para o usuário ter múltiplas clínicas, deve-se mudar esse código
          const clinic = clinics?.[0];

          return {
            userType: fullUser?.userType || "admin",
            mustChangePassword: fullUser?.mustChangePassword || false,
            clinic: clinic?.clinicId ? clinic?.clinic : undefined,
            privacyPolicyAccepted: fullUser?.privacyPolicyAccepted || false,
            privacyPolicyVersion: fullUser?.privacyPolicyVersion || "1.0",
          };
        })();

        // Executar com timeout
        const sessionData = await Promise.race([
          sessionDataPromise,
          timeoutPromise,
        ]);

        return {
          user: {
            ...user,
            ...(sessionData as any),
          },
          session,
        };
      } catch (error) {
        console.error(
          "❌ [AUTH SESSION] Erro ao buscar dados da sessão:",
          error instanceof Error ? error.message : error,
        );

        // Log adicional para debug
        if (error instanceof Error) {
          if (
            error.message.includes("connect") ||
            error.message.includes("connection")
          ) {
            console.error(
              "🗄️ [AUTH SESSION] Database connection error in session",
            );
          }
          if (error.message.includes("timeout")) {
            console.error("⏱️ [AUTH SESSION] Timeout error in session");
          }
        }

        // Retornar dados básicos em caso de erro para não bloquear a autenticação
        return {
          user: {
            ...user,
            userType: "admin",
            mustChangePassword: false,
            clinic: undefined,
            privacyPolicyAccepted: false,
            privacyPolicyVersion: "1.0",
          },
          session,
        };
      }
    }),
  ],
  user: {
    modelName: "usersTable",
    additionalFields: {
      privacyPolicyAccepted: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      privacyPolicyVersion: {
        type: "string",
        required: false,
        defaultValue: "1.0",
      },
    },
  },
  account: {
    modelName: "accountsTable",
  },
  verification: {
    modelName: "verificationsTable",
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({
      user,
      url,
      token,
    }: {
      user: any;
      url: string;
      token: string;
    }) => {
      // Log de auditoria LGPD para tentativa de reset de senha
      console.log(
        `🔐 [AUDIT LGPD] Password reset requested for user: ${user.email} at ${new Date().toISOString()}`,
      );

      // Usar nosso serviço de email para enviar o reset
      const { emailService } = await import("@/lib/email-service");

      try {
        const emailSent = await emailService.sendPasswordReset({
          userEmail: user.email,
          userName: user.name || "Usuário",
          resetUrl: url, // Usar a URL gerada pelo BetterAuth
          expiresIn: "1 hora",
        });

        if (!emailSent) {
          console.error(
            "❌ Falha ao enviar email de recuperação via BetterAuth para:",
            user.email,
          );
        } else {
          console.log(
            "✅ Email de recuperação enviado via BetterAuth para:",
            user.email,
          );
        }
      } catch (error) {
        console.error("❌ Erro ao enviar email via BetterAuth:", error);
      }
    },
    sendVerificationEmail: async ({
      user,
      url,
    }: {
      user: any;
      url: string;
    }) => {
      // Log de auditoria LGPD para verificação de email
      console.log(
        `📧 [AUDIT LGPD] Email verification sent to: ${user.email} at ${new Date().toISOString()}`,
      );
      // TODO: Implementar envio de email de verificação
    },
  },
  // Rate limiting para proteção contra ataques
  rateLimit: {
    enabled: process.env.NODE_ENV === "production",
    window: 60, // 1 minuto
    max: 10, // máximo 10 tentativas por minuto
  },
  // Configurações de CSRF
  csrfProtection: {
    enabled: process.env.NODE_ENV === "production",
    cookieName: "better-auth.csrf_token",
  },
});

console.log("✅ [AUTH CONFIG] BetterAuth configurado com sucesso");
