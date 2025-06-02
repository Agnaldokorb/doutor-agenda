import { z } from "zod";

export const upsertPatientSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, {
    message: "Nome é obrigatório.",
  }),
  email: z.string().trim().email({
    message: "E-mail inválido.",
  }),
  avatarImageUrl: z.string().url().optional().or(z.literal("")),
  phone_number: z.string().trim().min(10, {
    message: "Número de telefone deve ter pelo menos 10 dígitos.",
  }),
  sex: z.enum(["male", "female"], {
    required_error: "Sexo é obrigatório.",
  }),
});

export type UpsertPatientSchema = z.infer<typeof upsertPatientSchema>;
