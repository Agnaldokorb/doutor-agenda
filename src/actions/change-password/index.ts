"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { accountsTable, usersTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Senha atual é obrigatória"),
    newPassword: z
      .string()
      .min(6, "Nova senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

export const changePassword = actionClient
  .schema(changePasswordSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Usuário não autenticado");
    }

    const { currentPassword, newPassword } = parsedInput;

    try {
      // Buscar informações do usuário
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, session.user.id),
        columns: {
          id: true,
          mustChangePassword: true,
        },
      });

      if (!user) {
        throw new Error("Usuário não encontrado");
      }

      // Se não é alteração obrigatória, validar senha atual
      if (!user.mustChangePassword) {
        // Buscar a conta do usuário com senha
        const account = await db.query.accountsTable.findFirst({
          where: eq(accountsTable.userId, session.user.id),
          columns: {
            id: true,
            password: true,
          },
        });

        if (!account || !account.password) {
          throw new Error("Conta não encontrada ou sem senha definida");
        }

        // Verificar senha atual
        const isCurrentPasswordValid = await bcrypt.compare(
          currentPassword,
          account.password,
        );
        if (!isCurrentPasswordValid) {
          throw new Error("Senha atual incorreta");
        }
      }

      // Para alteração obrigatória (primeiro login), usamos o BetterAuth para alterar a senha
      // pois ele sabe como lidar com a criptografia correta
      await auth.api.changePassword({
        body: {
          newPassword,
          currentPassword,
        },
        headers: await headers(),
      });

      // Marcar que o usuário não precisa mais alterar a senha
      await db
        .update(usersTable)
        .set({
          mustChangePassword: false,
          updatedAt: new Date(),
        })
        .where(eq(usersTable.id, session.user.id));

      return {
        success: true,
        message: "Senha alterada com sucesso!",
      };
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      throw new Error(
        error instanceof Error ? error.message : "Erro ao alterar senha",
      );
    }
  });
