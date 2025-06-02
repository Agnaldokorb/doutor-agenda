import { z } from "zod";

// Schema para horários de funcionamento por dia da semana
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

export const upsertDoctorSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1, {
      message: "Nome é obrigatório.",
    }),
    email: z.string().trim().email({
      message: "E-mail inválido.",
    }),
    avatarImageUrl: z.string().url().optional().or(z.literal("")),
    specialty: z.string().trim().min(1, {
      message: "Especialidade é obrigatória.",
    }),
    appointmentPriceInCents: z.number().min(1, {
      message: "Preço da consulta é obrigatório.",
    }),
    // Novos campos para horários detalhados
    businessHours: businessHoursSchema.optional(),
    // Campos legados para compatibilidade (manter por enquanto)
    availableFromWeekDay: z.number().min(0).max(6).optional(),
    availableToWeekDay: z.number().min(0).max(6).optional(),
    availableFromTime: z.string().optional(),
    availableToTime: z.string().optional(),
  })
  .refine(
    (data) => {
      // Se usar o sistema novo de horários, validar que pelo menos um dia está aberto
      if (data.businessHours) {
        const hasOpenDay = Object.values(data.businessHours).some(
          (day) => day.isOpen,
        );
        return hasOpenDay;
      }
      // Se usar o sistema legado, validar horários
      if (data.availableFromTime && data.availableToTime) {
        return data.availableFromTime < data.availableToTime;
      }
      return true;
    },
    {
      message: "Pelo menos um dia deve estar disponível para atendimento.",
      path: ["businessHours"],
    },
  );

export type UpsertDoctorSchema = z.infer<typeof upsertDoctorSchema>;
