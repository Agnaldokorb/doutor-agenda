import { eq, and, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    console.log("API - Iniciando busca de horários ocupados");

    // Verificar autenticação usando headers()
    const session = await auth.api.getSession({
      headers: headers(),
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

      // Buscar agendamentos existentes para o médico na data selecionada usando SQL bruto
      // para maior compatibilidade e evitar problemas de conversão de data
      const bookedAppointments = await db.execute(sql`
        SELECT * FROM ${appointmentsTable}
        WHERE 
          ${appointmentsTable.doctorId} = ${doctorId}
          AND ${appointmentsTable.clinicId} = ${session.user.clinic.id}
          AND DATE(${appointmentsTable.date}) = ${dateStr}
          AND ${appointmentsTable.status} != 'cancelado'
      `);

      console.log(
        "API - Agendamentos encontrados:",
        bookedAppointments.rows.length,
      );

      // Extrair os horários ocupados
      const bookedSlots = bookedAppointments.rows.map((appointment: any) => {
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
