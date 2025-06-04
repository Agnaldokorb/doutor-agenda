"use server";

import { z } from "zod";
import { actionClient } from "@/lib/next-safe-action";
import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { auth } from "@/lib/auth";

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token é obrigatório"),
    newPassword: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "A senha deve conter ao menos uma letra maiúscula, uma minúscula e um número",
      ),
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export const resetPassword = actionClient
  .schema(resetPasswordSchema)
  .action(async ({ parsedInput: { token, newPassword } }) => {
    try {
      // Primeiro validar se o token existe e é válido na nossa tabela
      const user = await db
        .select()
        .from(usersTable)
        .where(
          and(
            eq(usersTable.resetToken, token),
            gt(usersTable.resetTokenExpiry, new Date()),
          ),
        )
        .limit(1);

      if (user.length === 0) {
        return {
          success: false,
          message:
            "Token inválido ou expirado. Solicite uma nova recuperação de senha.",
        };
      }

      const userRecord = user[0];

      // Usar a API nativa do BetterAuth para resetar a senha
      // Baseado na documentação: https://www.better-auth.com/docs/authentication/email-password
      try {
        const resetResult = await auth.api.resetPassword({
          body: {
            token,
            newPassword,
          },
        });

        if (!resetResult) {
          throw new Error("Falha ao resetar senha via BetterAuth API");
        }

        console.log(
          "✅ Senha redefinida com sucesso via BetterAuth para:",
          userRecord.email,
        );
      } catch (betterAuthError) {
        console.error(
          "❌ Erro da API BetterAuth, tentando método manual:",
          betterAuthError,
        );

        // Se a API falhar, usar método manual como fallback
        const bcrypt = await import("bcryptjs");
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const { accountsTable } = await import("@/db/schema");
        await db
          .update(accountsTable)
          .set({
            password: hashedPassword,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(accountsTable.userId, userRecord.id),
              eq(accountsTable.providerId, "credential"),
            ),
          );

        console.log("✅ Senha redefinida manualmente para:", userRecord.email);
      }

      // Limpar token de recuperação independente do método usado
      await db
        .update(usersTable)
        .set({
          resetToken: null,
          resetTokenExpiry: null,
          mustChangePassword: false,
          updatedAt: new Date(),
        })
        .where(eq(usersTable.id, userRecord.id));

      return {
        success: true,
        message: "Senha redefinida com sucesso! Você já pode fazer login.",
      };
    } catch (error) {
      console.error("❌ Erro ao redefinir senha:", error);
      return {
        success: false,
        message: "Erro interno. Tente novamente mais tarde.",
      };
    }
  });

// Server action para validar token
export const validateResetToken = actionClient
  .schema(z.object({ token: z.string() }))
  .action(async ({ parsedInput: { token } }) => {
    try {
      const user = await db
        .select({
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
        })
        .from(usersTable)
        .where(
          and(
            eq(usersTable.resetToken, token),
            gt(usersTable.resetTokenExpiry, new Date()),
          ),
        )
        .limit(1);

      if (user.length === 0) {
        return {
          valid: false,
          message: "Token inválido ou expirado.",
        };
      }

      return {
        valid: true,
        user: user[0],
      };
    } catch (error) {
      console.error("❌ Erro ao validar token:", error);
      return {
        valid: false,
        message: "Erro interno ao validar token.",
      };
    }
  });
