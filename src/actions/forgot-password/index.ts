"use server";

import { z } from "zod";
import { actionClient } from "@/lib/next-safe-action";
import { auth } from "@/lib/auth";

const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido").min(1, "E-mail é obrigatório"),
});

export const forgotPassword = actionClient
  .schema(forgotPasswordSchema)
  .action(async ({ parsedInput: { email } }) => {
    try {
      // Usar a API nativa do BetterAuth para forgot password
      const result = await auth.api.forgetPassword({
        body: {
          email,
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/authentication/reset-password`,
        },
      });

      console.log(
        "✅ Solicitação de recuperação processada via BetterAuth para:",
        email,
      );

      return {
        success: true,
        message:
          "Se o email estiver cadastrado, você receberá as instruções para recuperar sua senha.",
      };
    } catch (error) {
      console.error("❌ Erro na recuperação de senha via BetterAuth:", error);
      return {
        success: false,
        message: "Erro interno. Tente novamente mais tarde.",
      };
    }
  });
