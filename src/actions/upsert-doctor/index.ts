"use server";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { doctorsTable, usersTable,usersToClinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { upsertDoctorSchema } from "./schema";

dayjs.extend(utc);

export const upsertDoctor = actionClient
  .schema(upsertDoctorSchema)
  .action(async ({ parsedInput }) => {
    const availableFromTime = parsedInput.availableFromTime; // 15:30:00
    const availableToTime = parsedInput.availableToTime; // 16:00:00

    const availableFromTimeUTC = dayjs()
      .set("hour", parseInt(availableFromTime.split(":")[0]))
      .set("minute", parseInt(availableFromTime.split(":")[1]))
      .set("second", parseInt(availableFromTime.split(":")[2]))
      .utc();
    const availableToTimeUTC = dayjs()
      .set("hour", parseInt(availableToTime.split(":")[0]))
      .set("minute", parseInt(availableToTime.split(":")[1]))
      .set("second", parseInt(availableToTime.split(":")[2]))
      .utc();

    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    if (!session?.user.clinic?.id) {
      throw new Error("Clinic not found");
    }

    let userId: string;

    // Se for criação de novo médico (não tem ID)
    if (!parsedInput.id) {
      console.log(
        `🏥 Criando novo médico: ${parsedInput.name} (${parsedInput.email})`,
      );

      // OBRIGATÓRIO: Criar usuário primeiro
      try {
        console.log(`👤 Criando usuário obrigatório para: ${parsedInput.name}`);

        const user = await auth.api.signUpEmail({
          body: {
            email: parsedInput.email,
            password: "123456789", // Senha padrão
            name: parsedInput.name,
          },
        });

        if (!user?.user?.id) {
          throw new Error("Falha ao criar usuário no sistema de autenticação");
        }

        userId = user.user.id;
        console.log(`✅ Usuário criado: ${userId}`);

        // Definir tipo do usuário como "doctor"
        await db
          .update(usersTable)
          .set({ userType: "doctor" })
          .where(eq(usersTable.id, userId));

        console.log(`✅ Tipo do usuário definido como doctor`);

        // Associar usuário à clínica
        await db.insert(usersToClinicsTable).values({
          userId: userId,
          clinicId: session.user.clinic.id,
        });

        console.log(`✅ Usuário associado à clínica`);
      } catch (error) {
        console.error("❌ Erro ao criar usuário:", error);
        throw new Error(
          `Falha ao criar usuário para o médico: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        );
      }
    } else {
      // Se for edição, busca o usuário existente
      console.log(
        `📝 Editando médico existente: ${parsedInput.name} (${parsedInput.email})`,
      );

      const existingDoctor = await db.query.doctorsTable.findFirst({
        where: eq(doctorsTable.id, parsedInput.id),
      });

      if (!existingDoctor) {
        throw new Error("Médico não encontrado");
      }

      if (existingDoctor.userId) {
        // Se já tem usuário, atualiza
        userId = existingDoctor.userId;
        console.log(`👤 Atualizando usuário existente: ${userId}`);

        try {
          await db
            .update(usersTable)
            .set({
              name: parsedInput.name,
              email: parsedInput.email,
              userType: "doctor", // Garante que é doctor
              updatedAt: new Date(),
            })
            .where(eq(usersTable.id, userId));

          console.log(`✅ Usuário ${userId} atualizado`);
        } catch (error) {
          console.error("❌ Erro ao atualizar usuário:", error);
          throw new Error(
            `Falha ao atualizar usuário: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          );
        }
      } else {
        // Se não tem usuário, OBRIGATÓRIO criar
        console.log(
          `👤 Médico sem usuário associado, criando obrigatoriamente`,
        );

        try {
          const user = await auth.api.signUpEmail({
            body: {
              email: parsedInput.email,
              password: "123456789",
              name: parsedInput.name,
            },
          });

          if (!user?.user?.id) {
            throw new Error(
              "Falha ao criar usuário no sistema de autenticação",
            );
          }

          userId = user.user.id;
          console.log(`✅ Usuário criado para médico existente: ${userId}`);

          // Definir tipo como doctor
          await db
            .update(usersTable)
            .set({ userType: "doctor" })
            .where(eq(usersTable.id, userId));

          // Associar à clínica
          await db.insert(usersToClinicsTable).values({
            userId: userId,
            clinicId: session.user.clinic.id,
          });

          console.log(`✅ Usuário associado à clínica`);
        } catch (error) {
          console.error(
            "❌ Erro ao criar usuário para médico existente:",
            error,
          );
          throw new Error(
            `Falha ao criar usuário para médico existente: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          );
        }
      }
    }

    // Agora criar/atualizar o médico com userId obrigatório
    console.log(`👨‍⚕️ Salvando médico na base de dados...`);

    await db
      .insert(doctorsTable)
      .values({
        ...parsedInput,
        id: parsedInput.id,
        userId: userId, // Sempre terá valor
        clinicId: session.user.clinic.id,
        availableFromTime: availableFromTimeUTC.format("HH:mm:ss"),
        availableToTime: availableToTimeUTC.format("HH:mm:ss"),
      })
      .onConflictDoUpdate({
        target: [doctorsTable.id],
        set: {
          ...parsedInput,
          userId: userId, // Sempre terá valor
          availableFromTime: availableFromTimeUTC.format("HH:mm:ss"),
          availableToTime: availableToTimeUTC.format("HH:mm:ss"),
        },
      });

    console.log(`✅ Médico salvo com sucesso`);
    console.log(
      `🎉 Processo completo: Usuário ${userId} ↔ Médico ${parsedInput.name}`,
    );

    revalidatePath("/doctors");
  });
