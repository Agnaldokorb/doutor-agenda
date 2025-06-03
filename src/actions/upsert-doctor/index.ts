"use server";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { doctorsTable, usersTable, usersToClinicsTable } from "@/db/schema";
import { convertBusinessHoursToUTC } from "@/helpers/timezone";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";
import { deleteFileByUrl } from "@/lib/utapi";

import { upsertDoctorSchema } from "./schema";

dayjs.extend(utc);

export const upsertDoctor = actionClient
  .schema(upsertDoctorSchema)
  .action(async ({ parsedInput }) => {
    console.log("📊 Dados recebidos:", parsedInput);

    // Calcular valores legados para compatibilidade
    let availableFromTimeUTC = "08:00:00";
    let availableToTimeUTC = "18:00:00";
    let availableFromWeekDay = 1; // Segunda
    let availableToWeekDay = 5; // Sexta

    // Se usando novo sistema de horários
    if (parsedInput.businessHours) {
      console.log("🕐 Convertendo horários de funcionamento para UTC");

      // Validar se todos os dias abertos têm startTime e endTime
      const validBusinessHours: Record<string, { startTime: string; endTime: string; isOpen: boolean }> = {};
      
      Object.entries(parsedInput.businessHours).forEach(([day, hours]) => {
        if (hours.isOpen && hours.startTime && hours.endTime) {
          validBusinessHours[day] = {
            startTime: hours.startTime,
            endTime: hours.endTime,
            isOpen: true,
          };
        } else {
          validBusinessHours[day] = {
            startTime: "",
            endTime: "",
            isOpen: false,
          };
        }
      });

      const businessHoursUTC = convertBusinessHoursToUTC(validBusinessHours);

      if (businessHoursUTC) {
        // Criar ou atualizar horários de funcionamento
        const daysOfWeek = [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ];

        for (const day of daysOfWeek) {
          const dayData = businessHoursUTC[day];
          if (dayData) {
            // Lógica para salvar os horários...
          }
        }
      }
    } else if (parsedInput.availableFromTime && parsedInput.availableToTime) {
      // Sistema legado - converter horários UTC-3 para UTC
      console.log("🕐 Usando sistema legado de horários...");

      const availableFromTimeLocal = parsedInput.availableFromTime;
      const availableToTimeLocal = parsedInput.availableToTime;

      const availableFromTimeUTCObj = dayjs()
        .set("hour", parseInt(availableFromTimeLocal.split(":")[0]))
        .set("minute", parseInt(availableFromTimeLocal.split(":")[1]))
        .set("second", parseInt(availableFromTimeLocal.split(":")[2] || "0"))
        .utc();

      const availableToTimeUTCObj = dayjs()
        .set("hour", parseInt(availableToTimeLocal.split(":")[0]))
        .set("minute", parseInt(availableToTimeLocal.split(":")[1]))
        .set("second", parseInt(availableToTimeLocal.split(":")[2] || "0"))
        .utc();

      availableFromTimeUTC = availableFromTimeUTCObj.format("HH:mm:ss");
      availableToTimeUTC = availableToTimeUTCObj.format("HH:mm:ss");
      availableFromWeekDay = parsedInput.availableFromWeekDay || 1;
      availableToWeekDay = parsedInput.availableToWeekDay || 5;
    }

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
    let oldAvatarUrl: string | null = null;

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
          .set({
            userType: "doctor",
            mustChangePassword: true, // Forçar alteração de senha no primeiro login
          })
          .where(eq(usersTable.id, userId));

        console.log(
          `✅ Tipo do usuário definido como doctor com alteração de senha obrigatória`,
        );

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

      // Armazenar URL da imagem antiga para possível exclusão
      oldAvatarUrl = existingDoctor.avatarImageUrl;

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
            .set({
              userType: "doctor",
              mustChangePassword: true, // Forçar alteração de senha no primeiro login
            })
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

    // Verificar se deve excluir imagem antiga
    if (
      oldAvatarUrl &&
      parsedInput.avatarImageUrl &&
      oldAvatarUrl !== parsedInput.avatarImageUrl
    ) {
      console.log(`🗑️ Excluindo imagem antiga: ${oldAvatarUrl}`);
      try {
        const deleted = await deleteFileByUrl(oldAvatarUrl);
        if (deleted) {
          console.log(`✅ Imagem antiga excluída com sucesso`);
        } else {
          console.log(`⚠️ Não foi possível excluir a imagem antiga`);
        }
      } catch (error) {
        console.error("❌ Erro ao excluir imagem antiga:", error);
        // Não falha a operação por causa disso
      }
    }

    // Preparar dados para salvar no banco
    const businessHoursJSON = parsedInput.businessHours
      ? (() => {
          const validBusinessHours: Record<string, { startTime: string; endTime: string; isOpen: boolean }> = {};
          
          Object.entries(parsedInput.businessHours).forEach(([day, hours]) => {
            if (hours.isOpen && hours.startTime && hours.endTime) {
              validBusinessHours[day] = {
                startTime: hours.startTime,
                endTime: hours.endTime,
                isOpen: true,
              };
            } else {
              validBusinessHours[day] = {
                startTime: "",
                endTime: "",
                isOpen: false,
              };
            }
          });

          return JSON.stringify(convertBusinessHoursToUTC(validBusinessHours));
        })()
      : null;

    // Agora criar/atualizar o médico com userId obrigatório
    console.log(`👨‍⚕️ Salvando médico na base de dados...`);

    await db
      .insert(doctorsTable)
      .values({
        id: parsedInput.id,
        name: parsedInput.name,
        email: parsedInput.email,
        avatarImageUrl: parsedInput.avatarImageUrl,
        specialty: parsedInput.specialty,
        appointmentPriceInCents: parsedInput.appointmentPriceInCents,
        userId: userId, // Sempre terá valor
        clinicId: session.user.clinic.id,
        availableFromWeekDay,
        availableToWeekDay,
        availableFromTime: availableFromTimeUTC,
        availableToTime: availableToTimeUTC,
        businessHours: businessHoursJSON,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [doctorsTable.id],
        set: {
          name: parsedInput.name,
          email: parsedInput.email,
          avatarImageUrl: parsedInput.avatarImageUrl,
          specialty: parsedInput.specialty,
          appointmentPriceInCents: parsedInput.appointmentPriceInCents,
          userId: userId, // Sempre terá valor
          availableFromWeekDay,
          availableToWeekDay,
          availableFromTime: availableFromTimeUTC,
          availableToTime: availableToTimeUTC,
          businessHours: businessHoursJSON,
          updatedAt: new Date(),
        },
      });

    console.log(`✅ Médico salvo com sucesso`);
    console.log(
      `🎉 Processo completo: Usuário ${userId} ↔ Médico ${parsedInput.name}`,
    );

    revalidatePath("/doctors");
  });
