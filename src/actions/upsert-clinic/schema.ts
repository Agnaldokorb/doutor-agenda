import { z } from "zod";

const businessHoursSchema = z.object({
  monday: z.object({
    isOpen: z.boolean(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }),
  tuesday: z.object({
    isOpen: z.boolean(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }),
  wednesday: z.object({
    isOpen: z.boolean(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }),
  thursday: z.object({
    isOpen: z.boolean(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }),
  friday: z.object({
    isOpen: z.boolean(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }),
  saturday: z.object({
    isOpen: z.boolean(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }),
  sunday: z.object({
    isOpen: z.boolean(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }),
});

export const upsertClinicSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, {
    message: "Nome da clínica é obrigatório.",
  }),
  logoUrl: z.string().url().optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  cnpj: z.string().optional(),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  businessHours: businessHoursSchema.optional(),
  appointmentDurationMinutes: z.number().min(15).max(120).default(30),
  allowOnlineBooking: z.boolean().default(true),
  requireEmailConfirmation: z.boolean().default(true),
  autoConfirmAppointments: z.boolean().default(false),
});

export type UpsertClinicSchema = z.infer<typeof upsertClinicSchema>; 