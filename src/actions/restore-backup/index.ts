"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import JSZip from "jszip";

import { db } from "@/db";
import {
  appointmentsTable,
  doctorsTable,
  medicalRecordsTable,
  patientsTable,
  securityLogsTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

const restoreBackupSchema = z.object({
  backupData: z.string().min(1, "Dados do backup são obrigatórios"),
  isZipFile: z.boolean().default(false),
});

export const restoreBackup = actionClient
  .schema(restoreBackupSchema)
  .action(async ({ parsedInput: { backupData, isZipFile } }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    if (!session?.user.clinic?.id) {
      throw new Error("Clinic not found");
    }

    console.log(
      `🔄 Restaurando backup ${isZipFile ? "compactado (ZIP)" : "JSON"} para a clínica: ${session.user.clinic.id}`,
    );

    try {
      let parsedBackup;

      if (isZipFile) {
        // Processar arquivo ZIP
        try {
          console.log("📦 Descompactando arquivo ZIP...");

          // Converter base64 para buffer se necessário
          const zipBuffer = Buffer.from(backupData, "base64");

          // Carregar o arquivo ZIP
          const zip = await JSZip.loadAsync(zipBuffer);

          // Buscar o arquivo de dados principal
          const backupFile = zip.file("backup-data.json");
          if (!backupFile) {
            throw new Error("Arquivo backup-data.json não encontrado no ZIP");
          }

          // Extrair o conteúdo JSON
          const backupContent = await backupFile.async("string");
          parsedBackup = JSON.parse(backupContent);

          console.log("✅ Arquivo ZIP descompactado com sucesso");
        } catch (error) {
          console.error("❌ Erro ao descompactar ZIP:", error);
          throw new Error(
            `Arquivo ZIP inválido ou corrompido: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          );
        }
      } else {
        // Processar arquivo JSON diretamente (compatibilidade com backups antigos)
        try {
          parsedBackup = JSON.parse(backupData);
        } catch {
          throw new Error("Arquivo de backup JSON inválido ou corrompido");
        }
      }

      // Validar estrutura do backup
      if (!parsedBackup.metadata || !parsedBackup.metadata.clinicId) {
        throw new Error("Backup não contém metadados válidos");
      }

      // Verificar se o backup é da mesma clínica (LGPD - isolamento de dados)
      if (parsedBackup.metadata.clinicId !== session.user.clinic.id) {
        throw new Error(
          "Backup pertence a outra clínica. Operação não permitida por segurança.",
        );
      }

      // Log de início da restauração
      await db.insert(securityLogsTable).values({
        clinicId: session.user.clinic.id,
        userId: session.user.id,
        type: "data_import",
        action: `Início da restauração de backup ${isZipFile ? "ZIP" : "JSON"}`,
        details: JSON.stringify({
          backupDate: parsedBackup.metadata.backupDate,
          originalClinicId: parsedBackup.metadata.clinicId,
          backupVersion: parsedBackup.metadata.version,
          backupFormat: isZipFile ? "ZIP" : "JSON",
          compression: parsedBackup.metadata.compression || "N/A",
          requestedBy: session.user.name,
          timestamp: new Date().toISOString(),
        }),
        success: true,
      });

      // Contadores para estatísticas
      const restoredCounts = {
        doctors: 0,
        patients: 0,
        appointments: 0,
        medicalRecords: 0,
      };

      // Restaurar médicos (se existirem no backup)
      if (parsedBackup.doctors && Array.isArray(parsedBackup.doctors)) {
        for (const doctor of parsedBackup.doctors) {
          try {
            // Verificar se o médico já existe
            const existingDoctor = await db.query.doctorsTable.findFirst({
              where: eq(doctorsTable.id, doctor.id),
            });

            if (!existingDoctor) {
              // Inserir novo médico (remover campos de relation)
              const doctorData = { ...doctor };
              delete doctorData.user;
              await db.insert(doctorsTable).values({
                ...doctorData,
                clinicId: session.user.clinic.id, // Garantir que seja da clínica correta
              });
              restoredCounts.doctors++;
            }
          } catch (error) {
            console.warn(`⚠️ Erro ao restaurar médico ${doctor.id}:`, error);
          }
        }
      }

      // Restaurar pacientes
      if (parsedBackup.patients && Array.isArray(parsedBackup.patients)) {
        for (const patient of parsedBackup.patients) {
          try {
            const existingPatient = await db.query.patientsTable.findFirst({
              where: eq(patientsTable.id, patient.id),
            });

            if (!existingPatient) {
              // Remover campos LGPD que não devem ser inseridos
              const patientData = { ...patient };
              delete patientData.lgpdNote;
              await db.insert(patientsTable).values({
                ...patientData,
                clinicId: session.user.clinic.id,
              });
              restoredCounts.patients++;
            }
          } catch (error) {
            console.warn(`⚠️ Erro ao restaurar paciente ${patient.id}:`, error);
          }
        }
      }

      // Restaurar agendamentos
      if (
        parsedBackup.appointments &&
        Array.isArray(parsedBackup.appointments)
      ) {
        for (const appointment of parsedBackup.appointments) {
          try {
            const existingAppointment =
              await db.query.appointmentsTable.findFirst({
                where: eq(appointmentsTable.id, appointment.id),
              });

            if (!existingAppointment) {
              await db.insert(appointmentsTable).values({
                ...appointment,
                clinicId: session.user.clinic.id,
              });
              restoredCounts.appointments++;
            }
          } catch (error) {
            console.warn(
              `⚠️ Erro ao restaurar agendamento ${appointment.id}:`,
              error,
            );
          }
        }
      }

      // Restaurar prontuários médicos
      if (
        parsedBackup.medicalRecords &&
        Array.isArray(parsedBackup.medicalRecords)
      ) {
        for (const record of parsedBackup.medicalRecords) {
          try {
            const existingRecord = await db.query.medicalRecordsTable.findFirst(
              {
                where: eq(medicalRecordsTable.id, record.id),
              },
            );

            if (!existingRecord) {
              const recordData = { ...record };
              delete recordData.lgpdNote;
              await db.insert(medicalRecordsTable).values({
                ...recordData,
                clinicId: session.user.clinic.id,
              });
              restoredCounts.medicalRecords++;
            }
          } catch (error) {
            console.warn(
              `⚠️ Erro ao restaurar prontuário ${record.id}:`,
              error,
            );
          }
        }
      }

      // Log de sucesso da restauração
      await db.insert(securityLogsTable).values({
        clinicId: session.user.clinic.id,
        userId: session.user.id,
        type: "data_import",
        action: `Backup ${isZipFile ? "ZIP" : "JSON"} restaurado com sucesso`,
        details: JSON.stringify({
          backupDate: parsedBackup.metadata.backupDate,
          backupFormat: isZipFile ? "ZIP" : "JSON",
          restoredCounts,
          totalRestored: Object.values(restoredCounts).reduce(
            (a, b) => a + b,
            0,
          ),
          lgpdCompliance: true,
          timestamp: new Date().toISOString(),
        }),
        success: true,
      });

      console.log("✅ Restauração concluída com sucesso");
      console.log(`📊 Registros restaurados:`, restoredCounts);

      return {
        success: true,
        restoredCounts,
        message: `Backup ${isZipFile ? "ZIP" : "JSON"} restaurado com sucesso!`,
        format: isZipFile ? "ZIP" : "JSON",
      };
    } catch (error) {
      console.error("❌ Erro ao restaurar backup:", error);

      // Log de erro na restauração
      try {
        await db.insert(securityLogsTable).values({
          clinicId: session.user.clinic.id,
          userId: session.user.id,
          type: "data_import",
          action: `Falha na restauração de backup ${isZipFile ? "ZIP" : "JSON"}`,
          details: JSON.stringify({
            error: error instanceof Error ? error.message : "Erro desconhecido",
            backupFormat: isZipFile ? "ZIP" : "JSON",
            timestamp: new Date().toISOString(),
          }),
          success: false,
        });
      } catch (logError) {
        console.error("❌ Erro ao registrar log de erro:", logError);
      }

      throw new Error(
        `Falha ao restaurar backup: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      );
    }
  });
