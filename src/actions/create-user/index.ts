"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { doctorsTable,usersTable, usersToClinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { createUserSchema } from "./schema";

export const createUser = actionClient
  .schema(createUserSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    if (session.user.userType !== "admin") {
      throw new Error("Apenas administradores podem criar usuários");
    }

    if (!session?.user.clinic?.id) {
      throw new Error("Clinic not found");
    }

    try {
      console.log(
        `👤 Criando usuário: ${parsedInput.name} (${parsedInput.email}) - Tipo: ${parsedInput.userType}`,
      );

      // 1. Criar usuário no BetterAuth
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

      // 2. Atualizar o tipo do usuário na tabela users
      await db
        .update(usersTable)
        .set({ userType: parsedInput.userType })
        .where(eq(usersTable.id, userResponse.user.id));

      console.log(`✅ Tipo do usuário definido como ${parsedInput.userType}`);

      // 3. Associar usuário à clínica
      await db.insert(usersToClinicsTable).values({
        userId: userResponse.user.id,
        clinicId: session.user.clinic.id,
      });

      console.log(`✅ Usuário associado à clínica`);

      // 4. Se for médico, criar registro na tabela doctors
      if (parsedInput.userType === "doctor") {
        await db.insert(doctorsTable).values({
          clinicId: session.user.clinic.id,
          userId: userResponse.user.id,
          name: parsedInput.name,
          email: parsedInput.email,
          specialty: parsedInput.specialty!,
          appointmentPriceInCents: parsedInput.appointmentPriceInCents!,
          availableFromWeekDay: parsedInput.availableFromWeekDay!,
          availableToWeekDay: parsedInput.availableToWeekDay!,
          availableFromTime: parsedInput.availableFromTime!,
          availableToTime: parsedInput.availableToTime!,
        });

        console.log(`✅ Registro de médico criado`);
      }

      revalidatePath("/configurations");
      revalidatePath("/doctors");

      return {
        success: true,
        userId: userResponse.user.id,
        message: `Usuário ${parsedInput.userType} criado com sucesso!`,
      };
    } catch (error) {
      console.error("❌ Erro ao criar usuário:", error);

      if (error instanceof Error) {
        throw new Error(`Falha ao criar usuário: ${error.message}`);
      }

      throw new Error("Falha ao criar usuário: Erro desconhecido");
    }
  });
