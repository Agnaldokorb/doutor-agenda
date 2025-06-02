import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(1, { message: "Nome é obrigatório" }),
  email: z
    .string()
    .trim()
    .min(1, { message: "E-mail é obrigatório" })
    .email({ message: "E-mail inválido" }),
  password: z
    .string()
    .trim()
    .min(8, { message: "A senha deve ter pelo menos 8 caracteres" }),
  userType: z.enum(["admin", "atendente"], {
    message: "Tipo de usuário deve ser admin ou atendente",
  }),
});
