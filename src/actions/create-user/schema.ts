import { z } from "zod";

export const createUserSchema = z
  .object({
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
    userType: z.enum(["admin", "doctor", "atendente"], {
      message: "Tipo de usuário deve ser admin, doctor ou atendente",
    }),
    // Campos específicos para médicos
    specialty: z.string().trim().optional(),
    appointmentPriceInCents: z.number().min(0).optional(),
    availableFromWeekDay: z.number().min(0).max(6).optional(),
    availableToWeekDay: z.number().min(0).max(6).optional(),
    availableFromTime: z.string().optional(),
    availableToTime: z.string().optional(),
  })
  .refine(
    (data) => {
      // Se for médico, campos específicos são obrigatórios
      if (data.userType === "doctor") {
        return (
          data.specialty &&
          data.appointmentPriceInCents !== undefined &&
          data.availableFromWeekDay !== undefined &&
          data.availableToWeekDay !== undefined &&
          data.availableFromTime &&
          data.availableToTime
        );
      }
      return true;
    },
    {
      message: "Campos específicos são obrigatórios para médicos",
      path: ["specialty"],
    },
  );
