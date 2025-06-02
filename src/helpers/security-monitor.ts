/**
 * Sistema de Monitoramento de Segurança LGPD
 * Monitora logs de segurança e gera alertas em tempo real
 */

import { eq, gte, sql } from "drizzle-orm";

import { db } from "@/db";
import { securityLogsTable } from "@/db/schema";
import { emailService } from "@/lib/email-service";

interface SecurityAlert {
  type:
    | "failed_login_attempts"
    | "unusual_access_pattern"
    | "data_breach_attempt"
    | "configuration_change";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  details: Record<string, any>;
  clinicId: string;
  userId?: string;
  timestamp: Date;
}

interface MonitoringConfig {
  maxFailedLogins: number;
  timeWindowMinutes: number;
  alertOnConfigChanges: boolean;
  alertOnDataAccess: boolean;
  enableEmailAlerts: boolean;
  dpoEmail?: string;
}

const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  maxFailedLogins: 5,
  timeWindowMinutes: 15,
  alertOnConfigChanges: true,
  alertOnDataAccess: false,
  enableEmailAlerts: true,
};

/**
 * Monitora tentativas de login falhadas
 */
export async function monitorFailedLogins(
  clinicId: string,
  userId?: string,
): Promise<SecurityAlert[]> {
  const alerts: SecurityAlert[] = [];
  const timeWindow = new Date(Date.now() - 15 * 60 * 1000); // 15 minutos atrás

  try {
    // Buscar tentativas de login falhadas recentes
    const failedLogins = await db
      .select({
        count: sql<number>`count(*)`,
        userId: securityLogsTable.userId,
        ipAddress: securityLogsTable.ipAddress,
      })
      .from(securityLogsTable)
      .where(
        sql`${securityLogsTable.clinicId} = ${clinicId} 
            AND ${securityLogsTable.type} = 'failed_login' 
            AND ${securityLogsTable.createdAt} >= ${timeWindow}
            ${userId ? sql`AND ${securityLogsTable.userId} = ${userId}` : sql``}`,
      )
      .groupBy(securityLogsTable.userId, securityLogsTable.ipAddress);

    // Verificar se há muitas tentativas falhadas
    for (const record of failedLogins) {
      if (record.count >= DEFAULT_MONITORING_CONFIG.maxFailedLogins) {
        alerts.push({
          type: "failed_login_attempts",
          severity: record.count >= 10 ? "critical" : "high",
          message: `${record.count} tentativas de login falhadas detectadas`,
          details: {
            userId: record.userId,
            ipAddress: record.ipAddress,
            attempts: record.count,
            timeWindow: "15 minutos",
          },
          clinicId,
          userId: record.userId || undefined,
          timestamp: new Date(),
        });
      }
    }

    return alerts;
  } catch (error) {
    console.error("❌ Erro ao monitorar tentativas de login:", error);
    return [];
  }
}

/**
 * Monitora padrões de acesso suspeitos
 */
export async function monitorUnusualAccessPatterns(
  clinicId: string,
): Promise<SecurityAlert[]> {
  const alerts: SecurityAlert[] = [];
  const timeWindow = new Date(Date.now() - 60 * 60 * 1000); // 1 hora atrás

  try {
    // Buscar acessos recentes por usuário
    const userAccess = await db
      .select({
        userId: securityLogsTable.userId,
        count: sql<number>`count(*)`,
        distinctIPs: sql<number>`count(distinct ${securityLogsTable.ipAddress})`,
      })
      .from(securityLogsTable)
      .where(
        sql`${securityLogsTable.clinicId} = ${clinicId} 
            AND ${securityLogsTable.type} = 'data_access' 
            AND ${securityLogsTable.createdAt} >= ${timeWindow}
            AND ${securityLogsTable.userId} IS NOT NULL`,
      )
      .groupBy(securityLogsTable.userId);

    // Verificar padrões suspeitos
    for (const access of userAccess) {
      // Muitos acessos em pouco tempo
      if (access.count > 100) {
        alerts.push({
          type: "unusual_access_pattern",
          severity: "medium",
          message: `Usuário com ${access.count} acessos em 1 hora`,
          details: {
            userId: access.userId,
            accessCount: access.count,
            timeWindow: "1 hora",
          },
          clinicId,
          userId: access.userId || undefined,
          timestamp: new Date(),
        });
      }

      // Acessos de múltiplos IPs
      if (access.distinctIPs > 3) {
        alerts.push({
          type: "unusual_access_pattern",
          severity: "high",
          message: `Usuário acessando de ${access.distinctIPs} IPs diferentes`,
          details: {
            userId: access.userId,
            distinctIPs: access.distinctIPs,
            timeWindow: "1 hora",
          },
          clinicId,
          userId: access.userId || undefined,
          timestamp: new Date(),
        });
      }
    }

    return alerts;
  } catch (error) {
    console.error("❌ Erro ao monitorar padrões de acesso:", error);
    return [];
  }
}

/**
 * Monitora alterações de configuração críticas
 */
export async function monitorConfigurationChanges(
  clinicId: string,
): Promise<SecurityAlert[]> {
  const alerts: SecurityAlert[] = [];
  const timeWindow = new Date(Date.now() - 30 * 60 * 1000); // 30 minutos atrás

  try {
    const configChanges = await db.query.securityLogsTable.findMany({
      where: sql`${securityLogsTable.clinicId} = ${clinicId} 
                 AND ${securityLogsTable.type} = 'configuration_change' 
                 AND ${securityLogsTable.createdAt} >= ${timeWindow}`,
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: (logs, { desc }) => [desc(logs.createdAt)],
    });

    for (const change of configChanges) {
      alerts.push({
        type: "configuration_change",
        severity: "medium",
        message: `Configuração alterada: ${change.action}`,
        details: {
          action: change.action,
          userId: change.userId,
          userName: change.user?.name,
          userEmail: change.user?.email,
          timestamp: change.createdAt,
          details: change.details,
        },
        clinicId,
        userId: change.userId || undefined,
        timestamp: new Date(),
      });
    }

    return alerts;
  } catch (error) {
    console.error("❌ Erro ao monitorar alterações de configuração:", error);
    return [];
  }
}

/**
 * Monitora tentativas de acesso a dados não autorizados
 */
export async function monitorDataBreachAttempts(
  clinicId: string,
): Promise<SecurityAlert[]> {
  const alerts: SecurityAlert[] = [];
  const timeWindow = new Date(Date.now() - 30 * 60 * 1000); // 30 minutos atrás

  try {
    // Buscar acessos que falharam
    const failedAccess = await db.query.securityLogsTable.findMany({
      where: sql`${securityLogsTable.clinicId} = ${clinicId} 
                 AND ${securityLogsTable.success} = false 
                 AND ${securityLogsTable.type} IN ('data_access', 'user_created', 'user_updated', 'user_deleted')
                 AND ${securityLogsTable.createdAt} >= ${timeWindow}`,
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (failedAccess.length > 0) {
      alerts.push({
        type: "data_breach_attempt",
        severity: "high",
        message: `${failedAccess.length} tentativas de acesso não autorizado detectadas`,
        details: {
          attempts: failedAccess.length,
          actions: failedAccess.map((access) => ({
            action: access.action,
            userId: access.userId,
            ipAddress: access.ipAddress,
            timestamp: access.createdAt,
          })),
        },
        clinicId,
        timestamp: new Date(),
      });
    }

    return alerts;
  } catch (error) {
    console.error("❌ Erro ao monitorar tentativas de violação:", error);
    return [];
  }
}

/**
 * Executa monitoramento completo de segurança
 */
export async function runSecurityMonitoring(
  clinicId: string,
): Promise<SecurityAlert[]> {
  const allAlerts: SecurityAlert[] = [];

  try {
    // Executar todos os monitores em paralelo
    const [
      failedLoginAlerts,
      accessPatternAlerts,
      configChangeAlerts,
      breachAttemptAlerts,
    ] = await Promise.all([
      monitorFailedLogins(clinicId),
      monitorUnusualAccessPatterns(clinicId),
      monitorConfigurationChanges(clinicId),
      monitorDataBreachAttempts(clinicId),
    ]);

    allAlerts.push(
      ...failedLoginAlerts,
      ...accessPatternAlerts,
      ...configChangeAlerts,
      ...breachAttemptAlerts,
    );

    // Processar alertas críticos
    const criticalAlerts = allAlerts.filter(
      (alert) => alert.severity === "critical",
    );
    if (criticalAlerts.length > 0) {
      await handleCriticalAlerts(criticalAlerts);
    }

    // Log do resumo de monitoramento
    if (allAlerts.length > 0) {
      console.log(
        `🚨 [SECURITY MONITORING] ${allAlerts.length} alertas detectados para clínica ${clinicId}:`,
      );
      allAlerts.forEach((alert) => {
        console.log(`  - ${alert.severity.toUpperCase()}: ${alert.message}`);
      });
    }

    return allAlerts;
  } catch (error) {
    console.error("❌ Erro no monitoramento de segurança:", error);
    return [];
  }
}

/**
 * Processa alertas críticos
 */
async function handleCriticalAlerts(alerts: SecurityAlert[]): Promise<void> {
  for (const alert of alerts) {
    try {
      // Log crítico
      console.error(
        `🚨 [CRITICAL SECURITY ALERT] ${alert.message}`,
        alert.details,
      );

      // Enviar email para o DPO (se configurado)
      if (DEFAULT_MONITORING_CONFIG.enableEmailAlerts) {
        await sendSecurityAlert(alert);
      }

      // Aqui você pode adicionar outras ações:
      // - Bloquear usuário temporariamente
      // - Enviar notificação push
      // - Integrar com sistemas de SIEM
    } catch (error) {
      console.error("❌ Erro ao processar alerta crítico:", error);
    }
  }
}

/**
 * Envia alerta de segurança por email
 */
async function sendSecurityAlert(alert: SecurityAlert): Promise<void> {
  try {
    const dpoEmail = process.env.DPO_EMAIL || "dpo@doutoragenda.com.br";

    await emailService.sendSecurityAlert({
      to: dpoEmail,
      alertType: alert.type,
      severity: alert.severity,
      message: alert.message,
      details: alert.details,
      timestamp: alert.timestamp,
      clinicId: alert.clinicId,
    });

    console.log(`📧 Alerta de segurança enviado para: ${dpoEmail}`);
  } catch (error) {
    console.error("❌ Erro ao enviar alerta por email:", error);
  }
}

/**
 * Gera relatório de segurança resumido
 */
export async function generateSecurityReport(
  clinicId: string,
  days: number = 7,
): Promise<any> {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    // Estatísticas por tipo de log
    const logStats = await db
      .select({
        type: securityLogsTable.type,
        total: sql<number>`count(*)`,
        successful: sql<number>`sum(case when ${securityLogsTable.success} then 1 else 0 end)`,
        failed: sql<number>`sum(case when not ${securityLogsTable.success} then 1 else 0 end)`,
      })
      .from(securityLogsTable)
      .where(
        sql`${securityLogsTable.clinicId} = ${clinicId} 
            AND ${securityLogsTable.createdAt} >= ${startDate}`,
      )
      .groupBy(securityLogsTable.type);

    // Usuários mais ativos
    const topUsers = await db
      .select({
        userId: securityLogsTable.userId,
        actions: sql<number>`count(*)`,
      })
      .from(securityLogsTable)
      .where(
        sql`${securityLogsTable.clinicId} = ${clinicId} 
            AND ${securityLogsTable.createdAt} >= ${startDate}
            AND ${securityLogsTable.userId} IS NOT NULL`,
      )
      .groupBy(securityLogsTable.userId)
      .orderBy(sql`count(*) desc`)
      .limit(10);

    // IPs mais frequentes
    const topIPs = await db
      .select({
        ipAddress: securityLogsTable.ipAddress,
        requests: sql<number>`count(*)`,
      })
      .from(securityLogsTable)
      .where(
        sql`${securityLogsTable.clinicId} = ${clinicId} 
            AND ${securityLogsTable.createdAt} >= ${startDate}
            AND ${securityLogsTable.ipAddress} IS NOT NULL`,
      )
      .groupBy(securityLogsTable.ipAddress)
      .orderBy(sql`count(*) desc`)
      .limit(10);

    return {
      period: {
        startDate,
        endDate: new Date(),
        days,
      },
      statistics: {
        logsByType: logStats,
        topUsers,
        topIPs,
      },
      summary: {
        totalLogs: logStats.reduce((sum, stat) => sum + stat.total, 0),
        successfulActions: logStats.reduce(
          (sum, stat) => sum + stat.successful,
          0,
        ),
        failedActions: logStats.reduce((sum, stat) => sum + stat.failed, 0),
      },
    };
  } catch (error) {
    console.error("❌ Erro ao gerar relatório de segurança:", error);
    throw error;
  }
}
