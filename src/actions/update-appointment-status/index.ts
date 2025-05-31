"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { appointmentStatus } from "./types";

const updateAppointmentStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(appointmentStatus),
});

export const updateAppointmentStatus = actionClient
  .schema(updateAppointmentStatusSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    if (!session?.user.clinic?.id) {
      throw new Error("Clinic not found");
    }

    // Atualiza o status do agendamento
    await db
      .update(appointmentsTable)
      .set({
        status: parsedInput.status,
        updatedAt: new Date(),
      })
      .where(
        sql`${appointmentsTable.id} = ${parsedInput.id} AND ${appointmentsTable.clinicId} = ${session.user.clinic.id}`
      );

    revalidatePath("/appointments");
  }); 