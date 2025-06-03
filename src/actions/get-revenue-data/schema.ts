import { z } from "zod";

export const getRevenueDataSchema = z.object({
  startDate: z.string().min(1, "Data inicial é obrigatória"),
  endDate: z.string().min(1, "Data final é obrigatória"),
  paymentMethod: z.string().optional(),
  period: z.enum(["day", "week", "month", "year"]).default("month"),
});
