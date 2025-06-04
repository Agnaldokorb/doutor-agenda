"use server";

import { z } from "zod";
import { actionClient } from "@/lib/next-safe-action";
import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";

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
      // Buscar usuário pelo token válido
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

      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Atualizar senha e limpar token de recuperação
      await db
        .update(usersTable)
        .set({
          resetToken: null,
          resetTokenExpiry: null,
          mustChangePassword: false,
          updatedAt: new Date(),
        })
        .where(eq(usersTable.id, userRecord.id));

      // Buscar account do usuário para atualizar senha
      const accounts = await db.execute(`
        SELECT id FROM accounts 
        WHERE user_id = '${userRecord.id}' AND provider_id = 'credential'
        LIMIT 1
      `);

      if (accounts.rows && accounts.rows.length > 0) {
        await db.execute(`
          UPDATE accounts 
          SET password = '${hashedPassword}', updated_at = NOW() 
          WHERE user_id = '${userRecord.id}' AND provider_id = 'credential'
        `);
      }

      console.log("✅ Senha redefinida com sucesso para:", userRecord.email);

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
