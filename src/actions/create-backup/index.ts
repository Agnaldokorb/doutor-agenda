"use server";

import { eq } from "drizzle-orm";
import JSZip from "jszip";
import { headers } from "next/headers";

import { db } from "@/db";
import {
  appointmentsTable,
  clinicsTable,
  doctorsTable,
  medicalRecordsTable,
  patientsTable,
  securityConfigurationsTable,
  securityLogsTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

export const createBackup = actionClient.action(async () => {
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
    `💾 Criando backup compactado dos dados da clínica: ${session.user.clinic.id}`,
  );

  try {
    // Buscar todos os dados da clínica
    const [
      clinic,
      doctors,
      patients,
      appointments,
      medicalRecords,
      securityConfiguration,
      securityLogs,
    ] = await Promise.all([
      // Dados da clínica (sem dados sensíveis de outras clínicas)
      db.query.clinicsTable.findFirst({
        where: eq(clinicsTable.id, session.user.clinic.id),
      }),

      // Médicos
      db.query.doctorsTable.findMany({
        where: eq(doctorsTable.clinicId, session.user.clinic.id),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              userType: true,
              createdAt: true,
            },
          },
        },
      }),

      // Pacientes (dados pessoais conforme LGPD)
      db.query.patientsTable.findMany({
        where: eq(patientsTable.clinicId, session.user.clinic.id),
      }),

      // Agendamentos
      db.query.appointmentsTable.findMany({
        where: eq(appointmentsTable.clinicId, session.user.clinic.id),
      }),

      // Prontuários médicos (dados sensíveis conforme LGPD)
      db.query.medicalRecordsTable.findMany({
        where: eq(medicalRecordsTable.clinicId, session.user.clinic.id),
      }),

      // Configurações de segurança
      db.query.securityConfigurationsTable.findFirst({
        where: eq(securityConfigurationsTable.clinicId, session.user.clinic.id),
      }),

      // Logs de segurança (últimos 90 dias por padrão)
      db.query.securityLogsTable.findMany({
        where: eq(securityLogsTable.clinicId, session.user.clinic.id),
        orderBy: (logs, { desc }) => [desc(logs.createdAt)],
        limit: 1000, // Limitar logs para não gerar arquivos muito grandes
      }),
    ]);

    // Estrutura do backup seguindo boas práticas de LGPD
    const backupData = {
      metadata: {
        clinicId: session.user.clinic.id,
        clinicName: clinic?.name,
        backupDate: new Date().toISOString(),
        createdBy: {
          userId: session.user.id,
          userName: session.user.name,
          userEmail: session.user.email,
        },
        version: "1.0",
        description: "Backup completo dos dados da clínica conforme LGPD",
        dataClassification: "CONFIDENCIAL - Dados Pessoais e Sensíveis",
        retentionPolicy: "Conforme configuração da clínica",
        compression: "ZIP - Compactação para otimização de espaço",
        lgpdCompliance: {
          dataMinimization: "Apenas dados da clínica específica",
          purposeLimitation: "Backup e recuperação de dados",
          accuracyPrinciple: "Dados atuais no momento do backup",
          storageLimitation: "Sujeito às políticas de retenção",
          integrityConfidentiality: "Dados estruturados, seguros e compactados",
          accountability: `Backup realizado por ${session.user.name}`,
        },
      },

      // Dados da clínica
      clinic: clinic
        ? {
            ...clinic,
            // Remover dados sensíveis desnecessários se houver
          }
        : null,

      // Dados dos médicos
      doctors: doctors.map((doctor) => ({
        ...doctor,
        // Manter dados necessários para restauração
      })),

      // Dados dos pacientes (dados pessoais - LGPD Art. 5º, I)
      patients: patients.map((patient) => ({
        ...patient,
        // Todos os dados são necessários para continuidade do atendimento
        lgpdNote:
          "Dados pessoais necessários para prestação de serviços de saúde",
      })),

      // Agendamentos
      appointments: appointments.map((appointment) => ({
        ...appointment,
      })),

      // Prontuários médicos (dados sensíveis - LGPD Art. 5º, II)
      medicalRecords: medicalRecords.map((record) => ({
        ...record,
        lgpdNote:
          "Dados sensíveis sobre saúde - base legal: prestação de serviços de saúde",
      })),

      // Configurações de segurança
      securityConfiguration: securityConfiguration
        ? {
            ...securityConfiguration,
          }
        : null,

      // Logs de segurança (para auditoria)
      securityLogs: securityLogs.map((log) => ({
        ...log,
        lgpdNote: "Log de auditoria para compliance e segurança",
      })),

      // Estatísticas do backup
      statistics: {
        totalDoctors: doctors.length,
        totalPatients: patients.length,
        totalAppointments: appointments.length,
        totalMedicalRecords: medicalRecords.length,
        totalSecurityLogs: securityLogs.length,
      },
    };

    // Criar arquivo ZIP com os dados
    const zip = new JSZip();

    // Adicionar arquivo principal do backup
    const backupJson = JSON.stringify(backupData, null, 2);
    zip.file("backup-data.json", backupJson);

    // Adicionar arquivo README com instruções
    const readmeContent = `
# Backup da Clínica ${clinic?.name || "Desconhecida"}
Data do Backup: ${new Date().toLocaleString("pt-BR")}
Realizado por: ${session.user.name}

## Conformidade LGPD
Este backup contém dados pessoais e sensíveis conforme a Lei Geral de Proteção de Dados Pessoais (LGPD).

### Dados Incluídos:
- Dados da clínica
- Médicos e usuários (${doctors.length} registros)
- Pacientes - dados pessoais (${patients.length} registros)
- Agendamentos (${appointments.length} registros)
- Prontuários médicos - dados sensíveis (${medicalRecords.length} registros)
- Configurações de segurança
- Logs de auditoria (${securityLogs.length} registros)

### Instruções de Segurança:
1. Mantenha este arquivo em local seguro
2. Não compartilhe com terceiros não autorizados
3. Considere criptografar este arquivo
4. Exclua backups antigos conforme política de retenção
5. Este backup só pode ser restaurado na clínica de origem

### Para Restaurar:
1. Acesse o sistema Doutor Agenda
2. Vá em Configurações > Backup e Dados
3. Clique em "Restaurar"
4. Selecione este arquivo ZIP
5. Confirme a operação

Clínica ID: ${session.user.clinic.id}
Versão do Backup: 1.0
Compactação: ZIP
`.trim();

    zip.file("LEIA-ME.txt", readmeContent);

    // Gerar o arquivo ZIP como buffer
    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: {
        level: 9, // Máxima compressão
      },
    });

    // Calcular tamanhos para estatísticas
    const originalSize = Buffer.byteLength(backupJson, "utf8");
    const compressedSize = zipBuffer.length;
    const compressionRatio = (
      ((originalSize - compressedSize) / originalSize) *
      100
    ).toFixed(1);

    // Registrar log do backup
    await db.insert(securityLogsTable).values({
      clinicId: session.user.clinic.id,
      userId: session.user.id,
      type: "data_export",
      action: "Backup compactado dos dados da clínica criado",
      details: JSON.stringify({
        originalSize: `${(originalSize / 1024).toFixed(1)} KB`,
        compressedSize: `${(compressedSize / 1024).toFixed(1)} KB`,
        compressionRatio: `${compressionRatio}%`,
        format: "ZIP",
        tablesIncluded: [
          "clinic",
          "doctors",
          "patients",
          "appointments",
          "medicalRecords",
          "securityConfiguration",
          "securityLogs",
        ],
        totalRecords:
          backupData.statistics.totalDoctors +
          backupData.statistics.totalPatients +
          backupData.statistics.totalAppointments +
          backupData.statistics.totalMedicalRecords,
        lgpdCompliance: true,
        timestamp: new Date().toISOString(),
      }),
      success: true,
    });

    console.log("✅ Backup compactado criado com sucesso");
    console.log(`📊 Estatísticas: ${JSON.stringify(backupData.statistics)}`);
    console.log(
      `📦 Compressão: ${originalSize} bytes → ${compressedSize} bytes (${compressionRatio}% redução)`,
    );

    return {
      success: true,
      backup: zipBuffer.toString('base64'),
      filename: `backup-${clinic?.name?.replace(/[^a-zA-Z0-9]/g, "-")}-${new Date().toISOString().split("T")[0]}.zip`,
      statistics: {
        ...backupData.statistics,
        originalSize: `${(originalSize / 1024).toFixed(1)} KB`,
        compressedSize: `${(compressedSize / 1024).toFixed(1)} KB`,
        compressionRatio: `${compressionRatio}%`,
      },
    };
  } catch (error) {
    console.error("❌ Erro ao criar backup:", error);

    // Registrar log de erro
    try {
      await db.insert(securityLogsTable).values({
        clinicId: session.user.clinic.id,
        userId: session.user.id,
        type: "data_export",
        action: "Falha ao criar backup compactado dos dados",
        details: JSON.stringify({
          error: error instanceof Error ? error.message : "Erro desconhecido",
          timestamp: new Date().toISOString(),
        }),
        success: false,
      });
    } catch (logError) {
      console.error("❌ Erro ao registrar log de erro:", logError);
    }

    throw new Error(
      `Falha ao criar backup: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    );
  }
});
