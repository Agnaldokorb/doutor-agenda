import { and, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    console.log("API - Iniciando busca de horários ocupados");

    // Verificar autenticação usando headers() aguardado
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    console.log("API - Status da sessão:", !!session?.user);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Obter parâmetros da query
    const searchParams = request.nextUrl.searchParams;
    const doctorId = searchParams.get("doctorId");
    const dateStr = searchParams.get("date");

    console.log("API - Parâmetros recebidos:", { doctorId, dateStr });

    if (!doctorId || !dateStr) {
      return NextResponse.json(
        { error: "Parâmetros inválidos" },
        { status: 400 },
      );
    }

    try {
      // Converter a string de data para objeto Date
      const [year, month, day] = dateStr.split("-").map(Number);

      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return NextResponse.json(
          { error: "Formato de data inválido" },
          { status: 400 },
        );
      }

      // Verificar se o médico pertence à clínica do usuário logado
      if (!session.user.clinic?.id) {
        return NextResponse.json(
          { error: "Clínica não encontrada" },
          { status: 400 },
        );
      }

      // Corrigindo a consulta SQL para usar a API do Drizzle corretamente
      const bookedAppointments = await db
        .select()
        .from(appointmentsTable)
        .where(
          and(
            eq(appointmentsTable.doctorId, doctorId),
            eq(appointmentsTable.clinicId, session.user.clinic.id),
            sql`DATE(${appointmentsTable.date}) = ${dateStr}`,
            sql`${appointmentsTable.status} != 'cancelado'`,
          ),
        );

      console.log("API - Agendamentos encontrados:", bookedAppointments.length);

      // Extrair os horários ocupados
      const bookedSlots = bookedAppointments.map((appointment) => {
        const appointmentDate = new Date(appointment.date);
        const hours = appointmentDate.getHours().toString().padStart(2, "0");
        const minutes = appointmentDate
          .getMinutes()
          .toString()
          .padStart(2, "0");
        return `${hours}:${minutes}:00`;
      });

      console.log("API - Horários ocupados:", bookedSlots);

      return NextResponse.json({ bookedSlots });
    } catch (dateError) {
      console.error("API - Erro ao processar datas:", dateError);
      return NextResponse.json(
        { error: "Erro ao processar datas" },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("API - Erro ao buscar horários ocupados:", error);
    return NextResponse.json(
      { error: "Erro ao buscar horários ocupados" },
      { status: 500 },
    );
  }
}
