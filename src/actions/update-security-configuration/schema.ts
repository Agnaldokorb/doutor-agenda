import { z } from "zod";

export const updateSecurityConfigurationSchema = z.object({
  // Configurações de log
  enableLoginLogging: z.boolean().optional(),
  enableDataAccessLogging: z.boolean().optional(),
  enableConfigurationLogging: z.boolean().optional(),
  logRetentionDays: z.number().min(1).max(365).optional(),

  // Configurações de sessão
  sessionTimeoutMinutes: z.number().min(30).max(1440).optional(), // 30 min a 24h
  maxConcurrentSessions: z.number().min(1).max(20).optional(),

  // Configurações de senha
  requirePasswordChange: z.boolean().optional(),
  passwordChangeIntervalDays: z.number().min(30).max(365).optional(),

  // Configurações de notificações de segurança
  notifyFailedLogins: z.boolean().optional(),
  notifyNewLogins: z.boolean().optional(),
});
