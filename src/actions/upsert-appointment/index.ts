"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { upsertAppointmentSchema } from "./schema";

export const upsertAppointment = actionClient
  .schema(upsertAppointmentSchema)
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

    console.log("Dados recebidos do agendamento:", parsedInput);

    // Combinamos a data com o horário
    const dateTime = new Date(parsedInput.date);
    const [hours, minutes] = parsedInput.timeSlot.split(":").map(Number);
    dateTime.setHours(hours, minutes);

    await db
      .insert(appointmentsTable)
      .values({
        id: parsedInput.id,
        clinicId: session.user.clinic.id,
        patientId: parsedInput.patientId,
        doctorId: parsedInput.doctorId,
        date: dateTime,
        status: "agendado",
      })
      .onConflictDoUpdate({
        target: [appointmentsTable.id],
        set: {
          patientId: parsedInput.patientId,
          doctorId: parsedInput.doctorId,
          date: dateTime,
        },
      });

    revalidatePath("/appointments");
  });
