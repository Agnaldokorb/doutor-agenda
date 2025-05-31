import { z } from "zod";

export const upsertAppointmentSchema = z.object({
  id: z.string().uuid().optional(),
  patientId: z.string().uuid({
    message: "Selecione um paciente.",
  }),
  doctorId: z.string().uuid({
    message: "Selecione um médico.",
  }),
  appointmentPriceInCents: z.number().min(1, {
    message: "Valor da consulta é obrigatório.",
  }),
  date: z.date({
    required_error: "Selecione uma data para o agendamento.",
  }),
  timeSlot: z.string().min(1, {
    message: "Selecione um horário para o agendamento.",
  }),
});

export type UpsertAppointmentSchema = z.infer<typeof upsertAppointmentSchema>;
