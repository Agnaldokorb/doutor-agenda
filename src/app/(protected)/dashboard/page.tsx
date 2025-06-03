import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { and, count, desc, eq, sql, sum } from "drizzle-orm";
import {
  ActivityIcon,
  CalendarClock,
  CalendarIcon,
  ClockIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  UserRound,
  Users,
} from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { appointmentsTable, doctorsTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import DashboardChart from "./_components/dashboard-chart";
import MonthSelector from "./_components/month-selector";
import RevenueCards from "./_components/revenue-cards";

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
  const revenueAppointments = await db.query.appointmentsTable.findMany({
    where: and(
      eq(appointmentsTable.clinicId, session.user.clinic.id),
      eq(appointmentsTable.status, "concluido"),
      sql`${appointmentsTable.date} >= ${startOfSelectedMonth}`,
      sql`${appointmentsTable.date} <= ${endOfSelectedMonth}`,
    ),
    with: {
      doctor: true,
      healthInsurancePlan: true,
    },
  });

  const monthlyRevenue = revenueAppointments.reduce((sum, appointment) => {
    // Se tem plano de saúde, usar valor do plano
    // Se não tem plano (particular), usar valor do médico
    const valueInCents = appointment.healthInsurancePlan
      ? appointment.healthInsurancePlan.reimbursementValueInCents
      : appointment.doctor?.appointmentPriceInCents || 0;

    return sum + valueInCents;
  }, 0);

  // Faturamento do dia atual (apenas se estiver visualizando o mês atual)
  const isCurrentMonth =
    selectedMonth.getMonth() === currentDate.getMonth() &&
    selectedMonth.getFullYear() === currentDate.getFullYear();

  let todayRevenue = 0;
  if (isCurrentMonth) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayRevenueAppointments = await db.query.appointmentsTable.findMany({
      where: and(
        eq(appointmentsTable.clinicId, session.user.clinic.id),
        eq(appointmentsTable.status, "concluido"),
        sql`${appointmentsTable.date} >= ${startOfToday}`,
        sql`${appointmentsTable.date} <= ${endOfToday}`,
      ),
      with: {
        doctor: true,
        healthInsurancePlan: true,
      },
    });

    todayRevenue = todayRevenueAppointments.reduce((sum, appointment) => {
      // Se tem plano de saúde, usar valor do plano
      // Se não tem plano (particular), usar valor do médico
      const valueInCents = appointment.healthInsurancePlan
        ? appointment.healthInsurancePlan.reimbursementValueInCents
        : appointment.doctor?.appointmentPriceInCents || 0;

      return sum + valueInCents;
    }, 0);
  }

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
      sql`${appointmentsTable.date} >= ${startOfSelectedMonth}`,
      sql`${appointmentsTable.date} <= ${endOfSelectedMonth}`,
      // Excluir agendamentos cancelados e concluídos
      sql`${appointmentsTable.status} IN ('agendado', 'confirmado')`,
    ),
    with: {
      doctor: true,
      patient: true,
    },
    orderBy: appointmentsTable.date,
    limit: 10, // Aumentar o limite para mostrar mais agendamentos
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header melhorado com saudação */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white shadow-xl">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <Avatar className="h-20 w-20 border-4 border-white/30">
                  {session.user.image && (
                    <AvatarImage
                      src={session.user.image}
                      alt={`Foto de ${session.user.name}`}
                    />
                  )}
                  <AvatarFallback className="bg-white/20 text-2xl font-bold text-white backdrop-blur-sm">
                    <ShieldCheckIcon className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-indigo-100">{getGreeting()},</p>
                  <h1 className="text-3xl font-bold">{session.user.name}</h1>
                  <p className="text-xl text-indigo-100">
                    Painel Administrativo
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-indigo-100">Período</p>
                <p className="text-xl font-semibold capitalize">{monthName}</p>
                <div className="mt-2">
                  <MonthSelector
                    options={monthOptions}
                    selectedMonth={format(
                      startOfMonth(selectedMonth),
                      "yyyy-MM-dd",
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-white/10 to-transparent"></div>
        </div>

        {/* Grid de estatísticas melhorado */}
        <div
          className={`grid gap-4 ${isCurrentMonth ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-6" : "grid-cols-2 md:grid-cols-5"}`}
        >
          <RevenueCards
            monthlyRevenue={monthlyRevenue}
            todayRevenue={todayRevenue}
            isCurrentMonth={isCurrentMonth}
          />

          <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-wide text-blue-100 uppercase">
                    Agendamentos
                  </p>
                  <p className="text-2xl font-bold">
                    {totalAppointments[0]?.count || 0}
                  </p>
                </div>
                <CalendarClock className="h-6 w-6 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-wide text-purple-100 uppercase">
                    Pacientes
                  </p>
                  <p className="text-2xl font-bold">{totalPatients.length}</p>
                </div>
                <Users className="h-6 w-6 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-wide text-orange-100 uppercase">
                    Médicos
                  </p>
                  <p className="text-2xl font-bold">{totalDoctors.length}</p>
                </div>
                <UserRound className="h-6 w-6 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Gráfico */}
        <Card className="shadow-xl">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="flex items-center space-x-2 text-xl">
              <TrendingUpIcon className="h-6 w-6 text-blue-600" />
              <span>Distribuição de Agendamentos por Dia da Semana</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-6">
              <DashboardChart data={formattedChartData} />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          {/* Lista de Médicos */}
          <Card className="col-span-4 shadow-xl">
            <CardHeader className="border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2 text-xl">
                  <UserRound className="h-6 w-6 text-blue-600" />
                  <span>Top Médicos</span>
                </CardTitle>
                <Link
                  href="/doctors"
                  className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-800"
                >
                  Ver todos →
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {topDoctors.map((doctor, index) => (
                  <div
                    key={doctor.id}
                    className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                      #{index + 1}
                    </div>
                    <Avatar className="h-12 w-12">
                      {doctor.avatarImageUrl && (
                        <AvatarImage
                          src={doctor.avatarImageUrl}
                          alt={`Foto de Dr. ${doctor.name}`}
                        />
                      )}
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 font-semibold text-white">
                        {doctor.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        Dr. {doctor.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {doctor.specialty}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {doctor.appointmentCount}
                      </div>
                      <div className="text-xs text-gray-500">agendamentos</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lista de Especialidades */}
          <Card className="col-span-3 shadow-xl">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="flex items-center space-x-2 text-xl">
                <ActivityIcon className="h-6 w-6 text-blue-600" />
                <span>Especialidades Populares</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {topSpecialties.map((specialty, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-bold text-white">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {specialty.specialty}
                      </div>
                    </div>
                    <div>
                      <Badge
                        variant="outline"
                        className="border-purple-200 bg-purple-50 font-medium text-purple-700"
                      >
                        {specialty.count} agend.
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Agendamentos */}
        <Card className="shadow-xl">
          <CardHeader className="border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2 text-xl">
                <CalendarIcon className="h-6 w-6 text-blue-600" />
                <span>Agendamentos do Período</span>
              </CardTitle>
              <Link
                href="/appointments"
                className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-800"
              >
                Ver todos →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {upcomingAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarIcon className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Nenhum agendamento encontrado
                </h3>
                <p className="mt-2 text-gray-500">
                  Não há agendamentos para o período selecionado.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((appointment) => {
                  // Definir cores baseadas no status
                  const getStatusStyles = (status: string) => {
                    switch (status) {
                      case "agendado":
                        return {
                          cardClass: "border-red-200 bg-red-50/50",
                          badgeClass: "bg-red-100 text-red-700 border-red-200",
                          iconBg: "bg-red-100",
                          iconColor: "text-red-600",
                        };
                      case "confirmado":
                        return {
                          cardClass: "border-green-200 bg-green-50/50",
                          badgeClass:
                            "bg-green-100 text-green-700 border-green-200",
                          iconBg: "bg-green-100",
                          iconColor: "text-green-600",
                        };
                      default:
                        return {
                          cardClass: "border-gray-200 bg-gray-50/50",
                          badgeClass:
                            "bg-gray-100 text-gray-700 border-gray-200",
                          iconBg: "bg-gray-100",
                          iconColor: "text-gray-600",
                        };
                    }
                  };

                  const statusStyles = getStatusStyles(appointment.status);

                  return (
                    <div
                      key={appointment.id}
                      className={`flex items-center justify-between rounded-lg border p-4 transition-all duration-200 hover:shadow-md ${statusStyles.cardClass}`}
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          {appointment.patient.avatarImageUrl && (
                            <AvatarImage
                              src={appointment.patient.avatarImageUrl}
                              alt={`Foto de ${appointment.patient.name}`}
                            />
                          )}
                          <AvatarFallback
                            className={`${statusStyles.iconBg} ${statusStyles.iconColor} font-semibold`}
                          >
                            <Users className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {appointment.patient.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Dr. {appointment.doctor.name} •{" "}
                            {appointment.doctor.specialty}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <CalendarIcon className="h-4 w-4" />
                            <span>
                              {(() => {
                                const utcDate = new Date(appointment.date);
                                const localDate = new Date(
                                  utcDate.getTime() - 3 * 60 * 60 * 1000,
                                );
                                return localDate.toLocaleDateString("pt-BR");
                              })()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <ClockIcon className="h-4 w-4" />
                            <span>
                              {(() => {
                                const utcDate = new Date(appointment.date);
                                const localDate = new Date(
                                  utcDate.getTime() - 3 * 60 * 60 * 1000,
                                );
                                return localDate.toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                });
                              })()}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`font-medium capitalize ${statusStyles.badgeClass}`}
                        >
                          {appointment.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
