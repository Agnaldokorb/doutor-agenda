"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { clinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";
import { deleteFileByUrl } from "@/lib/utapi";

import { upsertClinicSchema } from "./schema";

export const upsertClinic = actionClient
  .schema(upsertClinicSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    let oldLogoUrl: string | null = null;

    try {
      if (parsedInput.id) {
        // Atualizar clínica existente
        console.log(`📝 Atualizando clínica: ${parsedInput.name}`);

        const existingClinic = await db.query.clinicsTable.findFirst({
          where: eq(clinicsTable.id, parsedInput.id),
        });

        if (!existingClinic) {
          throw new Error("Clínica não encontrada");
        }

        // Armazenar URL da logo antiga para possível exclusão
        oldLogoUrl = existingClinic.logoUrl;

        // Converter businessHours para JSON string se fornecido
        const businessHoursJson = parsedInput.businessHours
          ? JSON.stringify(parsedInput.businessHours)
          : null;

        await db
          .update(clinicsTable)
          .set({
            name: parsedInput.name,
            logoUrl: parsedInput.logoUrl || null,
            email: parsedInput.email || null,
            phone: parsedInput.phone || null,
            address: parsedInput.address || null,
            city: parsedInput.city || null,
            state: parsedInput.state || null,
            zipCode: parsedInput.zipCode || null,
            cnpj: parsedInput.cnpj || null,
            description: parsedInput.description || null,
            website: parsedInput.website || null,
            businessHours: businessHoursJson,
            appointmentDurationMinutes: parsedInput.appointmentDurationMinutes,
            allowOnlineBooking: parsedInput.allowOnlineBooking,
            requireEmailConfirmation: parsedInput.requireEmailConfirmation,
            autoConfirmAppointments: parsedInput.autoConfirmAppointments,
            updatedAt: new Date(),
          })
          .where(eq(clinicsTable.id, parsedInput.id));

        console.log(`✅ Clínica atualizada com sucesso`);
      } else {
        // Criar nova clínica
        console.log(`🏥 Criando nova clínica: ${parsedInput.name}`);

        // Converter businessHours para JSON string se fornecido
        const businessHoursJson = parsedInput.businessHours
          ? JSON.stringify(parsedInput.businessHours)
          : null;

        await db.insert(clinicsTable).values({
          name: parsedInput.name,
          logoUrl: parsedInput.logoUrl || null,
          email: parsedInput.email || null,
          phone: parsedInput.phone || null,
          address: parsedInput.address || null,
          city: parsedInput.city || null,
          state: parsedInput.state || null,
          zipCode: parsedInput.zipCode || null,
          cnpj: parsedInput.cnpj || null,
          description: parsedInput.description || null,
          website: parsedInput.website || null,
          businessHours: businessHoursJson,
          appointmentDurationMinutes: parsedInput.appointmentDurationMinutes,
          allowOnlineBooking: parsedInput.allowOnlineBooking,
          requireEmailConfirmation: parsedInput.requireEmailConfirmation,
          autoConfirmAppointments: parsedInput.autoConfirmAppointments,
        });

        console.log(`✅ Clínica criada com sucesso`);
      }

      // Verificar se deve excluir logo antiga
      if (
        oldLogoUrl &&
        parsedInput.logoUrl &&
        oldLogoUrl !== parsedInput.logoUrl
      ) {
        console.log(`🗑️ Excluindo logo antiga: ${oldLogoUrl}`);
        try {
          const deleted = await deleteFileByUrl(oldLogoUrl);
          if (deleted) {
            console.log(`✅ Logo antiga excluída com sucesso`);
          } else {
            console.log(`⚠️ Não foi possível excluir a logo antiga`);
          }
        } catch (error) {
          console.error("❌ Erro ao excluir logo antiga:", error);
          // Não falha a operação por causa disso
        }
      }

      // Revalidar páginas relevantes
      revalidatePath("/configurations");
      revalidatePath("/dashboard");

      return {
        message: parsedInput.id
          ? "Configurações da clínica atualizadas com sucesso!"
          : "Clínica criada com sucesso!",
      };
    } catch (error) {
      console.error("❌ Erro na operação da clínica:", error);
      throw new Error(
        `Erro ao ${parsedInput.id ? "atualizar" : "criar"} clínica: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`,
      );
    }
  });

export const getClinic = actionClient.action(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (!session?.user.clinic?.id) {
    throw new Error("Clínica não encontrada na sessão");
  }

  try {
    const clinic = await db.query.clinicsTable.findFirst({
      where: eq(clinicsTable.id, session.user.clinic.id),
    });

    if (!clinic) {
      throw new Error("Clínica não encontrada no banco de dados");
    }

    // Converter businessHours de JSON string para objeto se existir
    let businessHours = null;
    if (clinic.businessHours) {
      try {
        businessHours = JSON.parse(clinic.businessHours);
      } catch (error) {
        console.error("Erro ao parsear businessHours:", error);
        businessHours = null;
      }
    }

    return {
      clinic: {
        ...clinic,
        businessHours,
      },
    };
  } catch (error) {
    console.error("❌ Erro ao buscar clínica:", error);
    throw new Error(
      `Erro ao buscar dados da clínica: ${
        error instanceof Error ? error.message : "Erro desconhecido"
      }`,
    );
  }
});
