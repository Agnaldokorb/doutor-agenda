import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { and, count, desc, eq, sql, sum } from "drizzle-orm";
import { CalendarClock, DollarSign, UserRound, Users } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PageActions,
  PageContainer,
  PageContent,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { db } from "@/db";
import { appointmentsTable, doctorsTable, patientsTable } from "@/db/schema";
import { formatCurrencyInCents } from "@/helpers/currency";
import { auth } from "@/lib/auth";

import DashboardChart from "./_components/dashboard-chart";
import MonthSelector from "./_components/month-selector";

interface DashboardPageProps {
  searchParams: Promise<{ month?: string }>;
}

const DashboardPage = async ({ searchParams }: DashboardPageProps) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/authentication");
  }
  if (!session.user.clinic) {
    redirect("/clinic-form");
  }

  // Aguardar os searchParams antes de usá-los
  const { month } = await searchParams;

  // Obter o mês selecionado ou usar o mês atual como padrão
  const currentDate = new Date();
  // Corrigir parsing para evitar problemas de fuso horário
  const selectedMonth = month
    ? startOfMonth(new Date(month + "T00:00:00"))
    : currentDate;

  const startOfSelectedMonth = startOfMonth(selectedMonth);
  const endOfSelectedMonth = endOfMonth(selectedMonth);

  // Formatar nome do mês para exibição
  const monthName = format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR });

  // Agendamentos do mês selecionado
  const totalAppointments = await db
    .select({ count: count() })
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.clinicId, session.user.clinic.id),
        sql`${appointmentsTable.date} >= ${startOfSelectedMonth}`,
        sql`${appointmentsTable.date} <= ${endOfSelectedMonth}`,
      ),
    );

  // Pacientes que tiveram agendamentos no mês selecionado
  const totalPatients = await db
    .selectDistinct({ patientId: appointmentsTable.patientId })
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.clinicId, session.user.clinic.id),
        sql`${appointmentsTable.date} >= ${startOfSelectedMonth}`,
        sql`${appointmentsTable.date} <= ${endOfSelectedMonth}`,
      ),
    );

  // Médicos que tiveram agendamentos no mês selecionado
  const totalDoctors = await db
    .selectDistinct({ doctorId: appointmentsTable.doctorId })
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.clinicId, session.user.clinic.id),
        sql`${appointmentsTable.date} >= ${startOfSelectedMonth}`,
        sql`${appointmentsTable.date} <= ${endOfSelectedMonth}`,
      ),
    );

  // Faturamento do mês selecionado (apenas agendamentos concluídos)
  const revenue = await db
    .select({
      total: sum(doctorsTable.appointmentPriceInCents),
    })
    .from(appointmentsTable)
    .innerJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
    .where(
      and(
        eq(appointmentsTable.clinicId, session.user.clinic.id),
        eq(appointmentsTable.status, "concluido"),
        sql`${appointmentsTable.date} >= ${startOfSelectedMonth}`,
        sql`${appointmentsTable.date} <= ${endOfSelectedMonth}`,
      ),
    );

  // Top médicos com mais agendamentos no mês selecionado
  const topDoctors = await db
    .select({
      id: doctorsTable.id,
      name: doctorsTable.name,
      specialty: doctorsTable.specialty,
      avatarImageUrl: doctorsTable.avatarImageUrl,
      appointmentCount: count(appointmentsTable.id),
    })
    .from(doctorsTable)
    .leftJoin(
      appointmentsTable,
      and(
        eq(doctorsTable.id, appointmentsTable.doctorId),
        sql`${appointmentsTable.date} >= ${startOfSelectedMonth}`,
        sql`${appointmentsTable.date} <= ${endOfSelectedMonth}`,
      ),
    )
    .where(eq(doctorsTable.clinicId, session.user.clinic.id))
    .groupBy(
      doctorsTable.id,
      doctorsTable.name,
      doctorsTable.specialty,
      doctorsTable.avatarImageUrl,
    )
    .orderBy(desc(count(appointmentsTable.id)))
    .limit(5);

  // Próximos agendamentos do mês selecionado
  const upcomingAppointments = await db.query.appointmentsTable.findMany({
    where: and(
      eq(appointmentsTable.clinicId, session.user.clinic.id),
      sql`${appointmentsTable.date} >= NOW()`,
      sql`${appointmentsTable.date} >= ${startOfSelectedMonth}`,
      sql`${appointmentsTable.date} <= ${endOfSelectedMonth}`,
      eq(appointmentsTable.status, "agendado"),
    ),
    with: {
      doctor: true,
      patient: true,
    },
    orderBy: appointmentsTable.date,
    limit: 5,
  });

  // Especialidades mais populares no mês selecionado
  const topSpecialties = await db
    .select({
      specialty: doctorsTable.specialty,
      count: count(),
    })
    .from(appointmentsTable)
    .innerJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
    .where(
      and(
        eq(appointmentsTable.clinicId, session.user.clinic.id),
        sql`${appointmentsTable.date} >= ${startOfSelectedMonth}`,
        sql`${appointmentsTable.date} <= ${endOfSelectedMonth}`,
      ),
    )
    .groupBy(doctorsTable.specialty)
    .orderBy(desc(count()))
    .limit(5);

  // Dados para o gráfico de agendamentos por dia da semana no mês selecionado
  const chartData = await db
    .select({
      weekday: sql`EXTRACT(DOW FROM ${appointmentsTable.date})::integer`,
      count: count(),
    })
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.clinicId, session.user.clinic.id),
        sql`${appointmentsTable.date} >= ${startOfSelectedMonth}`,
        sql`${appointmentsTable.date} <= ${endOfSelectedMonth}`,
      ),
    )
    .groupBy(sql`EXTRACT(DOW FROM ${appointmentsTable.date})::integer`)
    .orderBy(sql`EXTRACT(DOW FROM ${appointmentsTable.date})::integer`);

  // Mapear dias da semana para nomes abreviados em português
  const weekdayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const formattedChartData = Array(7)
    .fill(0)
    .map((_, index) => {
      const dayData = chartData.find((d) => d.weekday === index);
      return {
        name: weekdayNames[index],
        total: dayData?.count || 0,
      };
    });

  // Gerar lista de meses para o seletor (12 meses anteriores + atual)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const monthDate = subMonths(currentDate, i);
    return {
      value: format(startOfMonth(monthDate), "yyyy-MM-dd"),
      label: format(monthDate, "MMMM 'de' yyyy", { locale: ptBR }),
    };
  });

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Dashboard</PageTitle>
        </PageHeaderContent>
        <PageActions>
          <MonthSelector
            options={monthOptions}
            selectedMonth={format(startOfMonth(selectedMonth), "yyyy-MM-dd")}
          />
        </PageActions>
      </PageHeader>
      <PageContent>
        <div className="mb-4">
          <h2 className="text-muted-foreground text-lg font-medium">
            Dados de {monthName}
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Card de Faturamento */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
              <DollarSign className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrencyInCents(Number(revenue[0]?.total) || 0)}
              </div>
            </CardContent>
          </Card>

          {/* Card de Agendamentos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Agendamentos
              </CardTitle>
              <CalendarClock className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalAppointments[0]?.count || 0}
              </div>
            </CardContent>
          </Card>

          {/* Card de Pacientes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pacientes</CardTitle>
              <Users className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPatients.length}</div>
            </CardContent>
          </Card>

          {/* Card de Médicos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Médicos</CardTitle>
              <UserRound className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDoctors.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Gráfico */}
        <div className="mt-4">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Pacientes</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <DashboardChart data={formattedChartData} />
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Lista de Médicos */}
          <Card className="col-span-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Médicos</CardTitle>
              <Link
                href="/doctors"
                className="text-sm text-blue-500 hover:underline"
              >
                Ver todos
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topDoctors.map((doctor) => (
                  <div key={doctor.id} className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {doctor.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">Dr. {doctor.name}</div>
                      <div className="text-muted-foreground text-sm">
                        {doctor.specialty}
                      </div>
                    </div>
                    <div className="text-sm">
                      {doctor.appointmentCount} agend.
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lista de Especialidades */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Especialidades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topSpecialties.map((specialty, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="bg-primary h-2 w-2 rounded-full"></div>
                    <div className="flex-1 font-medium">
                      {specialty.specialty}
                    </div>
                    <div>
                      <Badge variant="outline">{specialty.count} agend.</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Agendamentos */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left font-medium">PACIENTE</th>
                    <th className="pb-2 text-left font-medium">DATA</th>
                    <th className="pb-2 text-left font-medium">MÉDICO</th>
                    <th className="pb-2 text-left font-medium">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingAppointments.map((appointment) => (
                    <tr key={appointment.id} className="border-b">
                      <td className="py-3">{appointment.patient.name}</td>
                      <td className="py-3">
                        {new Date(appointment.date).toLocaleDateString()}{" "}
                        {new Date(appointment.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3">Dr. {appointment.doctor.name}</td>
                      <td className="py-3">
                        <Badge
                          variant="outline"
                          className="border-blue-500 text-blue-500"
                        >
                          Agendado
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-center">
              <Link
                href="/appointments"
                className="text-sm text-blue-500 hover:underline"
              >
                Ver todos os agendamentos
              </Link>
            </div>
          </CardContent>
        </Card>
      </PageContent>
    </PageContainer>
  );
};

export default DashboardPage;
