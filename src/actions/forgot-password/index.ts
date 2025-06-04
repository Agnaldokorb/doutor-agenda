"use server";

import { z } from "zod";
import { actionClient } from "@/lib/next-safe-action";
import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { emailService } from "@/lib/email-service";
import crypto from "crypto";

const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido").min(1, "E-mail é obrigatório"),
});

export const forgotPassword = actionClient
  .schema(forgotPasswordSchema)
  .action(async ({ parsedInput: { email } }) => {
    try {
      // Buscar usuário pelo email
      const user = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);

      // Sempre retornar sucesso por segurança (não revelar se o email existe)
      if (user.length === 0) {
        return {
          success: true,
          message:
            "Se o email estiver cadastrado, você receberá as instruções para recuperar sua senha.",
        };
      }

      const userRecord = user[0];

      // Gerar token de recuperação
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

      // Atualizar usuário com token de recuperação
      await db
        .update(usersTable)
        .set({
          resetToken,
          resetTokenExpiry,
        })
        .where(eq(usersTable.id, userRecord.id));

      // Montar URL de reset
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/authentication/reset-password?token=${resetToken}`;

      // Enviar email de recuperação
      const emailSent = await emailService.sendPasswordReset({
        userEmail: email,
        userName: userRecord.name || "Usuário",
        resetUrl,
        expiresIn: "1 hora",
      });

      if (!emailSent) {
        console.error("❌ Falha ao enviar email de recuperação para:", email);
        return {
          success: false,
          message: "Erro interno. Tente novamente mais tarde.",
        };
      }

      console.log("✅ Email de recuperação enviado para:", email);

      return {
        success: true,
        message:
          "Se o email estiver cadastrado, você receberá as instruções para recuperar sua senha.",
      };
    } catch (error) {
      console.error("❌ Erro na recuperação de senha:", error);
      return {
        success: false,
        message: "Erro interno. Tente novamente mais tarde.",
      };
    }
  });
