import { format } from "date-fns";
import dayjs from "dayjs";
import { and, count, eq, ilike, or } from "drizzle-orm";
import {
  BriefcaseIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  TrendingUpIcon,
  UserIcon,
  XCircleIcon,
} from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { db } from "@/db";
import { appointmentsTable, doctorsTable, patientsTable } from "@/db/schema";
import { formatCurrencyInCents } from "@/helpers/currency";
import { convertUTCToUTCMinus3 } from "@/helpers/timezone";
import { auth } from "@/lib/auth";

import AddAppointmentButton from "./_components/add-appointment-button";
import { AppointmentActions } from "./_components/appointment-actions";

interface AppointmentsPageProps {
  searchParams: Promise<{ q?: string }>;
}

// Função para obter a configuração visual do status
const getStatusConfig = (status: string) => {
  switch (status) {
    case "agendado":
      return {
        label: "Agendado",
        variant: "secondary" as const,
        className: "bg-blue-50 text-blue-700 border-blue-200",
      };
    case "confirmado":
      return {
        label: "Confirmado",
        variant: "secondary" as const,
        className: "bg-green-50 text-green-700 border-green-200",
      };
    case "cancelado":
      return {
        label: "Cancelado",
        variant: "secondary" as const,
        className: "bg-red-50 text-red-700 border-red-200",
      };
    case "concluido":
      return {
        label: "Concluído",
        variant: "secondary" as const,
        className: "bg-purple-50 text-purple-700 border-purple-200",
      };
    default:
      return {
        label: "Agendado",
        variant: "secondary" as const,
        className: "bg-blue-50 text-blue-700 border-blue-200",
      };
  }
};

const AppointmentsPage = async ({ searchParams }: AppointmentsPageProps) => {
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
  const { q } = await searchParams;
  const searchQuery = q?.trim() || "";

  const patients = await db.query.patientsTable.findMany({
    where: eq(patientsTable.clinicId, session.user.clinic.id),
  });

  const doctors = await db.query.doctorsTable.findMany({
    where: eq(doctorsTable.clinicId, session.user.clinic.id),
  });

  // Base query conditions
  let appointmentsQuery = db.query.appointmentsTable.findMany({
    where: eq(appointmentsTable.clinicId, session.user.clinic.id),
    with: {
      patient: true,
      doctor: true,
      healthInsurancePlan: true,
    },
    orderBy: (appointments) => [appointments.date],
  });

  // If search query is provided, find matching patient and doctor IDs first
  if (searchQuery) {
    // Get patients matching the search query
    const matchingPatients = await db.query.patientsTable.findMany({
      where: and(
        eq(patientsTable.clinicId, session.user.clinic.id),
        ilike(patientsTable.name, `%${searchQuery}%`),
      ),
      columns: { id: true },
    });

    // Get doctors matching the search query
    const matchingDoctors = await db.query.doctorsTable.findMany({
      where: and(
        eq(doctorsTable.clinicId, session.user.clinic.id),
        ilike(doctorsTable.name, `%${searchQuery}%`),
      ),
      columns: { id: true },
    });

    // Extract IDs
    const patientIds = matchingPatients.map((p) => p.id);
    const doctorIds = matchingDoctors.map((d) => d.id);

    // If we have matching patients or doctors, filter appointments
    if (patientIds.length > 0 || doctorIds.length > 0) {
      const conditions = [];

      if (patientIds.length > 0) {
        conditions.push(
          patientIds.map((id) => eq(appointmentsTable.patientId, id)),
        );
      }

      if (doctorIds.length > 0) {
        conditions.push(
          doctorIds.map((id) => eq(appointmentsTable.doctorId, id)),
        );
      }

      // Get appointments with matching patient or doctor
      appointmentsQuery = db.query.appointmentsTable.findMany({
        where: and(
          eq(appointmentsTable.clinicId, session.user.clinic.id),
          or(...conditions.flat()),
        ),
        with: {
          patient: true,
          doctor: true,
          healthInsurancePlan: true,
        },
        orderBy: (appointments) => [appointments.date],
      });
    }
  }

  const appointments = await appointmentsQuery;

  // Estatísticas dos agendamentos
  const totalAppointments = await db
    .select({ count: count() })
    .from(appointmentsTable)
    .where(eq(appointmentsTable.clinicId, session.user.clinic.id));

  const confirmedAppointments = await db
    .select({ count: count() })
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.clinicId, session.user.clinic.id),
        eq(appointmentsTable.status, "confirmado"),
      ),
    );

  const completedAppointments = await db
    .select({ count: count() })
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.clinicId, session.user.clinic.id),
        eq(appointmentsTable.status, "concluido"),
      ),
    );

  const cancelledAppointments = await db
    .select({ count: count() })
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.clinicId, session.user.clinic.id),
        eq(appointmentsTable.status, "cancelado"),
      ),
    );

  // Receita total (agendamentos confirmados e completos)
  const revenueAppointments = await db.query.appointmentsTable.findMany({
    where: and(
      eq(appointmentsTable.clinicId, session.user.clinic.id),
      or(
        eq(appointmentsTable.status, "confirmado"),
        eq(appointmentsTable.status, "concluido"),
      ),
    ),
    with: {
      doctor: true,
      healthInsurancePlan: true,
    },
  });

  const totalRevenue = revenueAppointments.reduce((sum, appointment) => {
    // Se tem plano de saúde, usar valor do plano
    // Se não tem plano (particular), usar valor do médico
    const valueInCents = appointment.healthInsurancePlan
      ? appointment.healthInsurancePlan.reimbursementValueInCents
      : appointment.doctor?.appointmentPriceInCents || 0;

    return sum + valueInCents;
  }, 0);

  // Próximos agendamentos
  const upcomingAppointments = await db.query.appointmentsTable.findMany({
    where: and(
      eq(appointmentsTable.clinicId, session.user.clinic.id),
      eq(appointmentsTable.status, "confirmado"),
    ),
    with: {
      patient: true,
      doctor: true,
      healthInsurancePlan: true,
    },
    orderBy: (appointments) => [appointments.date],
    limit: 5,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header melhorado */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 p-8 text-white shadow-xl">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                  <CalendarIcon className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Gestão de Agendamentos</h1>
                  <p className="text-xl text-purple-100">
                    Controle completo dos agendamentos da sua clínica
                  </p>
                  <p className="text-purple-200">
                    {totalAppointments[0]?.count || 0} agendamentos registrados
                  </p>
                </div>
              </div>
              <div className="text-right">
                <AddAppointmentButton patients={patients} doctors={doctors} />
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-white/10 to-transparent"></div>
        </div>

        {/* Grid de estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-wide text-purple-100 uppercase">
                    Total
                  </p>
                  <p className="text-2xl font-bold">
                    {totalAppointments[0]?.count || 0}
                  </p>
                </div>
                <CalendarIcon className="h-6 w-6 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-wide text-green-100 uppercase">
                    Confirmados
                  </p>
                  <p className="text-2xl font-bold">
                    {confirmedAppointments[0]?.count || 0}
                  </p>
                </div>
                <CheckCircleIcon className="h-6 w-6 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-wide text-blue-100 uppercase">
                    Concluídos
                  </p>
                  <p className="text-2xl font-bold">
                    {completedAppointments[0]?.count || 0}
                  </p>
                </div>
                <CheckCircleIcon className="h-6 w-6 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-wide text-red-100 uppercase">
                    Cancelados
                  </p>
                  <p className="text-2xl font-bold">
                    {cancelledAppointments[0]?.count || 0}
                  </p>
                </div>
                <XCircleIcon className="h-6 w-6 text-red-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-wide text-emerald-100 uppercase">
                    Receita Total
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrencyInCents(totalRevenue)}
                  </p>
                </div>
                <TrendingUpIcon className="h-6 w-6 text-emerald-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Lista de Agendamentos */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl">
              <CardHeader className="border-b bg-gray-50">
                <CardTitle className="flex items-center space-x-2 text-xl">
                  <CalendarIcon className="h-6 w-6 text-purple-600" />
                  <span>Lista de Agendamentos</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-6">
                  <SearchInput
                    placeholder="Buscar por médico ou paciente..."
                    className="w-full"
                  />
                </div>

                {/* Lista de Cards dos Agendamentos */}
                <div className="space-y-4">
                  {appointments.length === 0 ? (
                    <div className="py-12 text-center">
                      <CalendarIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                      <p className="text-lg text-gray-500">
                        Nenhum agendamento encontrado
                      </p>
                      <p className="text-sm text-gray-400">
                        {searchQuery
                          ? "Tente uma busca diferente"
                          : "Comece agendando sua primeira consulta"}
                      </p>
                    </div>
                  ) : (
                    appointments.map((appointment) => {
                      const utcDate = new Date(appointment.date);
                      const localDate = convertUTCToUTCMinus3(utcDate);
                      const statusConfig = getStatusConfig(
                        appointment.status || "agendado",
                      );

                      return (
                        <Card
                          key={appointment.id}
                          className="border-l-4 border-l-purple-500 transition-shadow hover:shadow-md"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              {/* Informações principais */}
                              <div className="flex min-w-0 flex-1 items-start gap-4">
                                {/* Avatar do paciente */}
                                <Avatar className="h-12 w-12 flex-shrink-0">
                                  {appointment.patient?.avatarImageUrl && (
                                    <AvatarImage
                                      src={appointment.patient.avatarImageUrl}
                                      alt={appointment.patient.name}
                                    />
                                  )}
                                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-violet-600 font-semibold text-white">
                                    {appointment.patient?.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>

                                {/* Detalhes do agendamento */}
                                <div className="min-w-0 flex-1">
                                  <div className="mb-2 flex items-start justify-between gap-4">
                                    <div>
                                      <h3 className="truncate font-semibold text-gray-900">
                                        {appointment.patient?.name}
                                      </h3>
                                      <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                                        <UserIcon className="h-4 w-4" />
                                        <span className="truncate">
                                          Dr. {appointment.doctor?.name}
                                        </span>
                                      </div>
                                    </div>
                                    <Badge className={statusConfig.className}>
                                      {statusConfig.label}
                                    </Badge>
                                  </div>

                                  <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-3">
                                    <div className="flex items-center gap-2">
                                      <CalendarIcon className="h-4 w-4 text-purple-500" />
                                      <span>
                                        {format(localDate, "dd/MM/yy")}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <ClockIcon className="h-4 w-4 text-purple-500" />
                                      <span>{format(localDate, "HH:mm")}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <BriefcaseIcon className="h-4 w-4 text-purple-500" />
                                      <span className="truncate">
                                        {appointment.doctor?.specialty}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Plano de saúde */}
                                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                                    <span className="font-medium">Plano:</span>
                                    <span className="text-blue-600 font-medium">
                                      {appointment.healthInsurancePlan?.name || "Particular"}
                                    </span>
                                  </div>

                                  <div className="mt-2 flex items-center justify-between">
                                    <span className="text-lg font-semibold text-green-600">
                                      {(() => {
                                        // Se tem plano de saúde, usar valor do plano
                                        // Se não tem plano (particular), usar valor do médico
                                        const valueInCents = appointment.healthInsurancePlan
                                          ? appointment.healthInsurancePlan.reimbursementValueInCents
                                          : (appointment.doctor?.appointmentPriceInCents || 0);
                                        
                                        return formatCurrencyInCents(valueInCents);
                                      })()}
                                    </span>
                                    <AppointmentActions
                                      appointment={appointment}
                                      patients={patients}
                                      doctors={doctors}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Próximos Agendamentos */}
          <Card className="shadow-xl">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="flex items-center space-x-2 text-xl">
                <ClockIcon className="h-6 w-6 text-purple-600" />
                <span>Próximos Agendamentos</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {upcomingAppointments.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-gray-500">
                      Nenhum agendamento confirmado
                    </p>
                  </div>
                ) : (
                  upcomingAppointments.map((appointment, index) => (
                    <div
                      key={appointment.id}
                      className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-600">
                        #{index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            {appointment.patient?.avatarImageUrl && (
                              <AvatarImage
                                src={appointment.patient.avatarImageUrl}
                                alt={appointment.patient.name}
                              />
                            )}
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-violet-600 text-xs font-semibold text-white">
                              {appointment.patient?.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="truncate text-sm font-semibold text-gray-900">
                            {appointment.patient?.name}
                          </div>
                        </div>
                        <div className="truncate text-xs text-gray-500">
                          Dr. {appointment.doctor?.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {dayjs(appointment.date).format("DD/MM/YYYY HH:mm")}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge
                          variant="outline"
                          className="border-purple-200 bg-purple-50 text-xs whitespace-nowrap text-purple-700"
                        >
                          {appointment.status === "confirmado"
                            ? "Confirmado"
                            : appointment.status === "concluido"
                              ? "Concluído"
                              : appointment.status === "cancelado"
                                ? "Cancelado"
                                : "Pendente"}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Estatísticas de status */}
              <div className="mt-6 border-t pt-6">
                <h4 className="mb-3 font-semibold text-gray-900">
                  Status dos Agendamentos
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Taxa de Confirmação
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {totalAppointments[0]?.count > 0
                        ? Math.round(
                            ((confirmedAppointments[0]?.count || 0) /
                              totalAppointments[0].count) *
                              100,
                          )
                        : 0}
                      %
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Taxa de Conclusão
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {totalAppointments[0]?.count > 0
                        ? Math.round(
                            ((completedAppointments[0]?.count || 0) /
                              totalAppointments[0].count) *
                              100,
                          )
                        : 0}
                      %
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Taxa de Cancelamento
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {totalAppointments[0]?.count > 0
                        ? Math.round(
                            ((cancelledAppointments[0]?.count || 0) /
                              totalAppointments[0].count) *
                              100,
                          )
                        : 0}
                      %
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AppointmentsPage;
