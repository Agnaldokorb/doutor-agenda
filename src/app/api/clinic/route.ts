import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { clinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session?.user.clinic?.id) {
      return NextResponse.json(
        { error: "Clínica não encontrada na sessão" },
        { status: 400 },
      );
    }

    const clinic = await db.query.clinicsTable.findFirst({
      where: eq(clinicsTable.id, session.user.clinic.id),
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "Clínica não encontrada no banco de dados" },
        { status: 404 },
      );
    }

    // Converter businessHours de JSON string para objeto se existir
    let businessHours = null;
    if (clinic.businessHours) {
      try {
        businessHours = JSON.parse(clinic.businessHours);
      } catch (error) {
        console.error("Erro ao parsear businessHours:", error);
        businessHours = null;
      }
    }

    return NextResponse.json({
      clinic: {
        ...clinic,
        businessHours,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao buscar clínica:", error);

    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    );
  }
}
