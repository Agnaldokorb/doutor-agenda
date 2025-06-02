/**
 * Helper para logs de auditoria em conformidade com LGPD
 * Registra todas as ações relacionadas a dados pessoais
 */

import { headers } from "next/headers";

import { db } from "@/db";
import { securityLogsTable } from "@/db/schema";

interface AuditLogData {
  userId?: string;
  clinicId: string;
  action: string;
  type:
    | "login"
    | "logout"
    | "failed_login"
    | "password_change"
    | "user_created"
    | "user_deleted"
    | "user_updated"
    | "permission_change"
    | "data_access"
    | "data_export"
    | "system_access"
    | "configuration_change";
  details?: Record<string, any>;
  success?: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog({
  userId,
  clinicId,
  action,
  type,
  details = {},
  success = true,
  ipAddress,
  userAgent,
}: AuditLogData) {
  try {
    // Obter headers de requisição se não fornecidos
    let requestIP = ipAddress;
    let requestUserAgent = userAgent;

    if (!requestIP || !requestUserAgent) {
      try {
        const headersList = await headers();
        requestIP =
          requestIP ||
          headersList.get("x-forwarded-for") ||
          headersList.get("x-real-ip") ||
          "unknown";
        requestUserAgent =
          requestUserAgent || headersList.get("user-agent") || "unknown";
      } catch {
        // Headers podem não estar disponíveis em todos os contextos
        requestIP = requestIP || "unknown";
        requestUserAgent = requestUserAgent || "unknown";
      }
    }

    // Sanitizar dados sensíveis dos detalhes
    const sanitizedDetails = sanitizeLogDetails(details);

    await db.insert(securityLogsTable).values({
      userId,
      clinicId,
      action,
      type,
      details: JSON.stringify(sanitizedDetails),
      success,
      ipAddress: requestIP,
      userAgent: requestUserAgent,
    });

    // Log para auditoria interna
    console.log(
      `🔍 [AUDIT LGPD] ${type}: ${action} | User: ${userId || "anonymous"} | Clinic: ${clinicId} | Success: ${success} | IP: ${requestIP}`,
    );
  } catch (error) {
    console.error("❌ [AUDIT ERROR] Falha ao criar log de auditoria:", error);
    // Não lançar erro para não afetar a operação principal
  }
}

/**
 * Remove dados sensíveis dos logs de auditoria
 */
function sanitizeLogDetails(details: Record<string, any>): Record<string, any> {
  const sensitiveFields = ["password", "token", "secret", "key", "cpf", "rg"];
  const sanitized = { ...details };

  function sanitizeValue(obj: any, key: string): any {
    if (
      typeof obj[key] === "string" &&
      sensitiveFields.includes(key.toLowerCase())
    ) {
      return "***REDACTED***";
    }
    if (typeof obj[key] === "object" && obj[key] !== null) {
      return sanitizeObject(obj[key]);
    }
    return obj[key];
  }

  function sanitizeObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) =>
        typeof item === "object" ? sanitizeObject(item) : item,
      );
    }

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = sanitizeValue(obj, key);
    }
    return result;
  }

  return sanitizeObject(sanitized);
}

/**
 * Log específico para acesso a dados pessoais (LGPD Art. 37)
 */
export async function logDataAccess({
  userId,
  clinicId,
  dataType,
  recordId,
  action = "visualizar",
  success = true,
}: {
  userId: string;
  clinicId: string;
  dataType: "patient" | "appointment" | "medical_record" | "user";
  recordId: string;
  action?: string;
  success?: boolean;
}) {
  await createAuditLog({
    userId,
    clinicId,
    action: `${action} ${dataType}`,
    type: "data_access",
    details: {
      dataType,
      recordId,
      timestamp: new Date().toISOString(),
    },
    success,
  });
}

/**
 * Log específico para alterações de configuração
 */
export async function logConfigurationChange({
  userId,
  clinicId,
  configType,
  changes,
  success = true,
}: {
  userId: string;
  clinicId: string;
  configType: string;
  changes: Record<string, any>;
  success?: boolean;
}) {
  await createAuditLog({
    userId,
    clinicId,
    action: `Alteração de configuração: ${configType}`,
    type: "configuration_change",
    details: {
      configType,
      changes: sanitizeLogDetails(changes),
      timestamp: new Date().toISOString(),
    },
    success,
  });
}

/**
 * Log específico para operações de dados (criar, atualizar, deletar)
 */
export async function logDataOperation({
  userId,
  clinicId,
  operation,
  dataType,
  recordId,
  changes,
  success = true,
}: {
  userId: string;
  clinicId: string;
  operation: "create" | "update" | "delete";
  dataType: "patient" | "appointment" | "medical_record" | "user" | "doctor";
  recordId?: string;
  changes?: Record<string, any>;
  success?: boolean;
}) {
  await createAuditLog({
    userId,
    clinicId,
    action: `${operation} ${dataType}`,
    type:
      operation === "create"
        ? "user_created"
        : operation === "update"
          ? "user_updated"
          : "user_deleted",
    details: {
      operation,
      dataType,
      recordId,
      changes: changes ? sanitizeLogDetails(changes) : undefined,
      timestamp: new Date().toISOString(),
    },
    success,
  });
}
