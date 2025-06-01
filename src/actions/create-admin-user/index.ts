"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { clinicsTable,usersTable, usersToClinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

const createAdminUserSchema = z.object({
  name: z.string().trim().min(1, { message: "Nome é obrigatório" }),
  email: z
    .string()
    .trim()
    .min(1, { message: "E-mail é obrigatório" })
    .email({ message: "E-mail inválido" }),
  password: z
    .string()
    .trim()
    .min(8, { message: "A senha deve ter pelo menos 8 caracteres" }),
  clinicName: z
    .string()
    .trim()
    .min(1, { message: "Nome da clínica é obrigatório" }),
});

export const createAdminUser = actionClient
  .schema(createAdminUserSchema)
  .action(async ({ parsedInput }) => {
    try {
      console.log(
        `🏥 Criando usuário administrativo: ${parsedInput.name} (${parsedInput.email})`,
      );

      // 1. Criar usuário no BetterAuth com tipo admin
      const userResponse = await auth.api.signUpEmail({
        body: {
          name: parsedInput.name,
          email: parsedInput.email,
          password: parsedInput.password,
        },
      });

      if (!userResponse?.user?.id) {
        throw new Error("Falha ao criar usuário no sistema de autenticação");
      }

      console.log(`✅ Usuário criado no BetterAuth: ${userResponse.user.id}`);

      // 2. Atualizar o tipo do usuário para admin (já é o padrão, mas garantindo)
      await db
        .update(usersTable)
        .set({ userType: "admin" })
        .where(eq(usersTable.id, userResponse.user.id));

      console.log(`✅ Tipo do usuário definido como admin`);

      // 3. Criar a clínica
      const clinicResult = await db
        .insert(clinicsTable)
        .values({
          name: parsedInput.clinicName,
        })
        .returning();

      const clinic = clinicResult[0];
      console.log(`✅ Clínica criada: ${clinic.id}`);

      // 4. Associar usuário à clínica
      await db.insert(usersToClinicsTable).values({
        userId: userResponse.user.id,
        clinicId: clinic.id,
      });

      console.log(`✅ Usuário associado à clínica`);

      revalidatePath("/dashboard");

      return {
        success: true,
        userId: userResponse.user.id,
        clinicId: clinic.id,
      };
    } catch (error) {
      console.error("❌ Erro ao criar usuário administrativo:", error);
      throw error;
    }
  });
