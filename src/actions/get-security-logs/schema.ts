import { z } from "zod";

export const getSecurityLogsSchema = z.object({
  limit: z.number().min(1).max(100).optional(),
  days: z.number().min(1).max(365).optional(),
});
