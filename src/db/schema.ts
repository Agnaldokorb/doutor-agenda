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

export const clinicsTableRelations = relations(clinicsTable, ({ many }) => ({
  doctors: many(doctorsTable),
  patients: many(patientsTable),
  appointments: many(appointmentsTable),
  usersToClinics: many(usersToClinicsTable),
  medicalRecords: many(medicalRecordsTable),
}));

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
    medicalRecords: many(medicalRecordsTable),
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
