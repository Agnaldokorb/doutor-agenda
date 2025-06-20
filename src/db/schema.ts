import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const userTypeEnum = pgEnum("user_type", [
  "admin",
  "doctor",
  "atendente",
]);

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  userType: userTypeEnum("user_type").notNull().default("admin"),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  // Campos LGPD
  privacyPolicyAccepted: boolean("privacy_policy_accepted")
    .notNull()
    .default(false),
  privacyPolicyAcceptedAt: timestamp("privacy_policy_accepted_at"),
  privacyPolicyVersion: text("privacy_policy_version").default("1.0"),
  // Campos de recuperação de senha
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const usersTableRelations = relations(usersTable, ({ many }) => ({
  usersToClinics: many(usersToClinicsTable),
}));

export const sessionsTable = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
});

export const accountsTable = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verificationsTable = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const clinicsTable = pgTable("clinics", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  cnpj: text("cnpj"),
  description: text("description"),
  website: text("website"),
  // Horários de funcionamento (JSON)
  businessHours: text("business_hours"), // Armazenará JSON com horários
  // Configurações
  appointmentDurationMinutes: integer("appointment_duration_minutes").default(
    30,
  ),
  allowOnlineBooking: boolean("allow_online_booking").default(true),
  requireEmailConfirmation: boolean("require_email_confirmation").default(true),
  autoConfirmAppointments: boolean("auto_confirm_appointments").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const usersToClinicsTable = pgTable("users_to_clinics", {
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const usersToClinicsTableRelations = relations(
  usersToClinicsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [usersToClinicsTable.userId],
      references: [usersTable.id],
    }),
    clinic: one(clinicsTable, {
      fields: [usersToClinicsTable.clinicId],
      references: [clinicsTable.id],
    }),
  }),
);

export const clinicsTableRelations = relations(
  clinicsTable,
  ({ many, one }) => ({
    doctors: many(doctorsTable),
    patients: many(patientsTable),
    appointments: many(appointmentsTable),
    usersToClinics: many(usersToClinicsTable),
    medicalRecords: many(medicalRecordsTable),
    healthInsurancePlans: many(healthInsurancePlansTable),
  }),
);

export const doctorsTable = pgTable("doctors", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  avatarImageUrl: text("avatar_image_url"),
  // 1 - Monday, 2 - Tuesday, 3 - Wednesday, 4 - Thursday, 5 - Friday, 6 - Saturday, 0 - Sunday
  availableFromWeekDay: integer("available_from_week_day").notNull(),
  availableToWeekDay: integer("available_to_week_day").notNull(),
  availableFromTime: time("available_from_time").notNull(),
  availableToTime: time("available_to_time").notNull(),
  // Novo campo para horários detalhados (JSON)
  businessHours: text("business_hours"), // Armazenará JSON com horários por dia da semana
  specialty: text("specialty").notNull(),
  appointmentPriceInCents: integer("appointment_price_in_cents").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const doctorsTableRelations = relations(
  doctorsTable,
  ({ many, one }) => ({
    clinic: one(clinicsTable, {
      fields: [doctorsTable.clinicId],
      references: [clinicsTable.id],
    }),
    user: one(usersTable, {
      fields: [doctorsTable.userId],
      references: [usersTable.id],
    }),
    appointments: many(appointmentsTable),
    availableTimeSlots: many(availableTimeSlotsTable),
    medicalRecords: many(medicalRecordsTable),
  }),
);

export const patientSexEnum = pgEnum("patient_sex", ["male", "female"]);

export const patientsTable = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  avatarImageUrl: text("avatar_image_url"),
  phone_number: text("phone_number").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  sex: patientSexEnum("sex").notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const patientsTableRelations = relations(
  patientsTable,
  ({ one, many }) => ({
    clinic: one(clinicsTable, {
      fields: [patientsTable.clinicId],
      references: [clinicsTable.id],
    }),
    appointments: many(appointmentsTable),
    medicalRecords: many(medicalRecordsTable),
  }),
);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "agendado",
  "confirmado",
  "cancelado",
  "concluido",
]);

// Tabela de planos de saúde
export const healthInsurancePlansTable = pgTable("health_insurance_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  reimbursementValueInCents: integer("reimbursement_value_in_cents")
    .notNull()
    .default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const healthInsurancePlansTableRelations = relations(
  healthInsurancePlansTable,
  ({ one, many }) => ({
    clinic: one(clinicsTable, {
      fields: [healthInsurancePlansTable.clinicId],
      references: [clinicsTable.id],
    }),
    appointments: many(appointmentsTable),
  }),
);

export const appointmentsTable = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: timestamp("date").notNull(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patientsTable.id, { onDelete: "cascade" }),
  doctorId: uuid("doctor_id")
    .notNull()
    .references(() => doctorsTable.id, { onDelete: "cascade" }),
  healthInsurancePlanId: uuid("health_insurance_plan_id").references(
    () => healthInsurancePlansTable.id,
    { onDelete: "set null" },
  ),
  appointmentPriceInCents: integer("appointment_price_in_cents")
    .notNull()
    .default(0),
  status: appointmentStatusEnum("status").default("agendado").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const appointmentsTableRelations = relations(
  appointmentsTable,
  ({ one, many }) => ({
    clinic: one(clinicsTable, {
      fields: [appointmentsTable.clinicId],
      references: [clinicsTable.id],
    }),
    patient: one(patientsTable, {
      fields: [appointmentsTable.patientId],
      references: [patientsTable.id],
    }),
    doctor: one(doctorsTable, {
      fields: [appointmentsTable.doctorId],
      references: [doctorsTable.id],
    }),
    healthInsurancePlan: one(healthInsurancePlansTable, {
      fields: [appointmentsTable.healthInsurancePlanId],
      references: [healthInsurancePlansTable.id],
    }),
    medicalRecords: many(medicalRecordsTable),
    payment: one(appointmentPaymentsTable),
  }),
);

// Nova tabela para gerenciar horários disponíveis dos médicos
export const availableTimeSlotsTable = pgTable("available_time_slots", {
  id: uuid("id").defaultRandom().primaryKey(),
  doctorId: uuid("doctor_id")
    .notNull()
    .references(() => doctorsTable.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  slotDurationMinutes: integer("slot_duration_minutes").notNull().default(30),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Relações para a tabela de horários disponíveis
export const availableTimeSlotsTableRelations = relations(
  availableTimeSlotsTable,
  ({ one }) => ({
    doctor: one(doctorsTable, {
      fields: [availableTimeSlotsTable.doctorId],
      references: [doctorsTable.id],
    }),
  }),
);

// Nova tabela para prontuários médicos
export const medicalRecordsTable = pgTable("medical_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patientsTable.id, { onDelete: "cascade" }),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  doctorId: uuid("doctor_id")
    .notNull()
    .references(() => doctorsTable.id, { onDelete: "cascade" }),
  appointmentId: uuid("appointment_id").references(() => appointmentsTable.id, {
    onDelete: "set null",
  }),
  symptoms: text("symptoms").notNull(),
  diagnosis: text("diagnosis").notNull(),
  treatment: text("treatment").notNull(),
  medication: text("medication").notNull(),
  medicalCertificate: boolean("medical_certificate").notNull().default(false),
  certificateDays: integer("certificate_days"),
  observations: text("observations"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Relações para a tabela de prontuários
export const medicalRecordsTableRelations = relations(
  medicalRecordsTable,
  ({ one }) => ({
    patient: one(patientsTable, {
      fields: [medicalRecordsTable.patientId],
      references: [patientsTable.id],
    }),
    clinic: one(clinicsTable, {
      fields: [medicalRecordsTable.clinicId],
      references: [clinicsTable.id],
    }),
    doctor: one(doctorsTable, {
      fields: [medicalRecordsTable.doctorId],
      references: [doctorsTable.id],
    }),
    appointment: one(appointmentsTable, {
      fields: [medicalRecordsTable.appointmentId],
      references: [appointmentsTable.id],
    }),
  }),
);

// Enum para tipos de log de segurança
export const securityLogTypeEnum = pgEnum("security_log_type", [
  "login",
  "logout",
  "failed_login",
  "password_change",
  "user_created",
  "user_deleted",
  "user_updated",
  "permission_change",
  "data_access",
  "data_export",
  "data_import",
  "data_creation",
  "data_update",
  "data_deletion",
  "system_access",
  "configuration_change",
]);

// Nova tabela para logs de segurança
export const securityLogsTable = pgTable("security_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  type: securityLogTypeEnum("type").notNull(),
  action: text("action").notNull(), // Descrição da ação realizada
  details: text("details"), // Detalhes adicionais em JSON
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  success: boolean("success").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relações para a tabela de logs de segurança
export const securityLogsTableRelations = relations(
  securityLogsTable,
  ({ one }) => ({
    clinic: one(clinicsTable, {
      fields: [securityLogsTable.clinicId],
      references: [clinicsTable.id],
    }),
    user: one(usersTable, {
      fields: [securityLogsTable.userId],
      references: [usersTable.id],
    }),
  }),
);

// Nova tabela para configurações de segurança da clínica
export const securityConfigurationsTable = pgTable("security_configurations", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" })
    .unique(), // Uma configuração por clínica

  // Configurações de log
  enableLoginLogging: boolean("enable_login_logging").notNull().default(true),
  enableDataAccessLogging: boolean("enable_data_access_logging")
    .notNull()
    .default(true),
  enableConfigurationLogging: boolean("enable_configuration_logging")
    .notNull()
    .default(true),
  logRetentionDays: integer("log_retention_days").notNull().default(90),

  // Configurações de sessão
  sessionTimeoutMinutes: integer("session_timeout_minutes")
    .notNull()
    .default(480), // 8 horas
  maxConcurrentSessions: integer("max_concurrent_sessions")
    .notNull()
    .default(5),

  // Configurações de senha
  requirePasswordChange: boolean("require_password_change")
    .notNull()
    .default(false),
  passwordChangeIntervalDays: integer("password_change_interval_days").default(
    90,
  ),

  // Configurações de notificações de segurança
  notifyFailedLogins: boolean("notify_failed_logins").notNull().default(true),
  notifyNewLogins: boolean("notify_new_logins").notNull().default(false),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Relações para a tabela de configurações de segurança
export const securityConfigurationsTableRelations = relations(
  securityConfigurationsTable,
  ({ one }) => ({
    clinic: one(clinicsTable, {
      fields: [securityConfigurationsTable.clinicId],
      references: [clinicsTable.id],
    }),
  }),
);

// Enum para métodos de pagamento
export const paymentMethodEnum = pgEnum("payment_method", [
  "dinheiro",
  "cartao_credito",
  "cartao_debito",
  "pix",
  "cheque",
  "transferencia_eletronica",
]);

// Enum para status de pagamento do agendamento
export const paymentStatusEnum = pgEnum("payment_status", [
  "pendente",
  "pago",
  "parcial",
  "cancelado",
]);

// Nova tabela para controle de pagamentos dos agendamentos
export const appointmentPaymentsTable = pgTable("appointment_payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  appointmentId: uuid("appointment_id")
    .notNull()
    .references(() => appointmentsTable.id, { onDelete: "cascade" }),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  totalAmountInCents: integer("total_amount_in_cents").notNull(),
  paidAmountInCents: integer("paid_amount_in_cents").notNull().default(0),
  remainingAmountInCents: integer("remaining_amount_in_cents").notNull(),
  changeAmountInCents: integer("change_amount_in_cents").notNull().default(0),
  status: paymentStatusEnum("status").notNull().default("pendente"),
  processedByUserId: text("processed_by_user_id")
    .notNull()
    .references(() => usersTable.id),
  notes: text("notes"), // Observações sobre o pagamento
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Nova tabela para registrar cada método de pagamento usado
export const paymentTransactionsTable = pgTable("payment_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  appointmentPaymentId: uuid("appointment_payment_id")
    .notNull()
    .references(() => appointmentPaymentsTable.id, { onDelete: "cascade" }),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  amountInCents: integer("amount_in_cents").notNull(),
  transactionReference: text("transaction_reference"), // ID da transação, número do cheque, referência do PIX, etc.
  notes: text("notes"), // Observações específicas da transação
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relações para a tabela de pagamentos de agendamentos
export const appointmentPaymentsTableRelations = relations(
  appointmentPaymentsTable,
  ({ one, many }) => ({
    appointment: one(appointmentsTable, {
      fields: [appointmentPaymentsTable.appointmentId],
      references: [appointmentsTable.id],
    }),
    clinic: one(clinicsTable, {
      fields: [appointmentPaymentsTable.clinicId],
      references: [clinicsTable.id],
    }),
    processedByUser: one(usersTable, {
      fields: [appointmentPaymentsTable.processedByUserId],
      references: [usersTable.id],
    }),
    transactions: many(paymentTransactionsTable),
  }),
);

// Relações para a tabela de transações de pagamento
export const paymentTransactionsTableRelations = relations(
  paymentTransactionsTable,
  ({ one }) => ({
    appointmentPayment: one(appointmentPaymentsTable, {
      fields: [paymentTransactionsTable.appointmentPaymentId],
      references: [appointmentPaymentsTable.id],
    }),
  }),
);

// ===== VIEWS PARA FATURAMENTO =====

// View para relatórios de faturamento diário
export const dailyRevenueView = pgTable("daily_revenue_view", {
  date: timestamp("date").notNull(),
  clinicId: uuid("clinic_id").notNull(),
  totalAmountInCents: integer("total_amount_in_cents").notNull(),
  totalTransactions: integer("total_transactions").notNull(),
  averageTransactionInCents: integer("average_transaction_in_cents"),
});

// View para relatórios de faturamento por método de pagamento
export const paymentMethodRevenueView = pgTable("payment_method_revenue_view", {
  date: timestamp("date").notNull(),
  clinicId: uuid("clinic_id").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  totalAmountInCents: integer("total_amount_in_cents").notNull(),
  transactionCount: integer("transaction_count").notNull(),
});

// View para relatórios mensais de faturamento
export const monthlyRevenueView = pgTable("monthly_revenue_view", {
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  clinicId: uuid("clinic_id").notNull(),
  totalAmountInCents: integer("total_amount_in_cents").notNull(),
  totalTransactions: integer("total_transactions").notNull(),
  totalDoctors: integer("total_doctors"),
  totalPatients: integer("total_patients"),
});

// View para top médicos por faturamento
export const doctorRevenueView = pgTable("doctor_revenue_view", {
  doctorId: uuid("doctor_id").notNull(),
  doctorName: text("doctor_name").notNull(),
  specialty: text("specialty").notNull(),
  clinicId: uuid("clinic_id").notNull(),
  totalAmountInCents: integer("total_amount_in_cents").notNull(),
  totalAppointments: integer("total_appointments").notNull(),
  averageAppointmentValueInCents: integer("average_appointment_value_in_cents"),
  lastAppointmentDate: timestamp("last_appointment_date"),
});
