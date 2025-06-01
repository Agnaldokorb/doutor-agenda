import { z } from "zod";

export const upsertMedicalRecordSchema = z.object({
  id: z.string().uuid().optional(),
  patientId: z.string().uuid({
    message: "ID do paciente é obrigatório.",
  }),
  doctorId: z.string().uuid({
    message: "ID do médico é obrigatório.",
  }),
  appointmentId: z.string().uuid().optional(),
  symptoms: z.string().trim().min(1, {
    message: "Sintomas são obrigatórios.",
  }),
  diagnosis: z.string().trim().min(1, {
    message: "Diagnóstico é obrigatório.",
  }),
  treatment: z.string().trim().min(1, {
    message: "Tratamento é obrigatório.",
  }),
  medication: z.string().trim().min(1, {
    message: "Medicação é obrigatória.",
  }),
  medicalCertificate: z.boolean().default(false),
  certificateDays: z.number().min(0).max(365).optional(),
  observations: z.string().trim().optional(),
});
