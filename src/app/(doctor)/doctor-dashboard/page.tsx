"use client";

import "dayjs/locale/pt-br";

import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  ActivityIcon,
  CalendarDaysIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon as Clock4Icon,
  ClockIcon,
  MailIcon,
  PhoneIcon,
  SearchIcon,
  TrendingUpIcon,
  UserIcon,
  XCircleIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { getDoctorAppointments } from "@/actions/get-doctor-appointments";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

dayjs.locale("pt-br");
dayjs.extend(relativeTime);
dayjs.extend(isBetween);

const DoctorDashboardPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [dateFilter, setDateFilter] = useState("todos");

  const getDoctorAppointmentsAction = useAction(getDoctorAppointments, {
    onSuccess: (data) => {
      console.log("✅ Agendamentos carregados:", data);
    },
    onError: (error) => {
      console.error("❌ Erro ao carregar agendamentos:", error);
      toast.error("Erro ao carregar agendamentos");
    },
  });

  const router = useRouter();

  useEffect(() => {
    getDoctorAppointmentsAction.execute();
  }, [getDoctorAppointmentsAction]);

  const data = getDoctorAppointmentsAction.result?.data;
  const doctor = data?.doctor;

  // Memorizar appointments para evitar dependências instáveis no useMemo
  const appointments = useMemo(() => {
    return data?.appointments || [];
  }, [data?.appointments]);

  // Filtrar agendamentos
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const matchesSearch =
        appointment.patient.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        appointment.patient.email
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "todos" || appointment.status === statusFilter;

      let matchesDate = true;
      const appointmentDate = dayjs(appointment.date);
      const today = dayjs();

      switch (dateFilter) {
        case "hoje":
          matchesDate = appointmentDate.isSame(today, "day");
          break;
        case "semana":
          matchesDate = appointmentDate.isBetween(
            today.startOf("week"),
            today.endOf("week"),
            null,
            "[]",
          );
          break;
        case "mes":
          matchesDate = appointmentDate.isSame(today, "month");
          break;
        default:
          matchesDate = true;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [appointments, searchTerm, statusFilter, dateFilter]);

  // Agrupar agendamentos filtrados por data
  const appointmentsByDate = filteredAppointments.reduce(
    (acc, appointment) => {
      const date = dayjs(appointment.date).format("YYYY-MM-DD");
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(appointment);
      return acc;
    },
    {} as Record<string, typeof appointments>,
  );

  // Ordenar datas
  const sortedDates = Object.keys(appointmentsByDate).sort();

  // Estatísticas calculadas
  const today = dayjs().format("YYYY-MM-DD");
  const thisWeekStart = dayjs().startOf("week");
  const thisWeekEnd = dayjs().endOf("week");
  const thisMonthStart = dayjs().startOf("month");
  const thisMonthEnd = dayjs().endOf("month");

  const stats = {
    total: appointments.length,
    today: appointments.filter(
      (apt) => dayjs(apt.date).format("YYYY-MM-DD") === today,
    ).length,
    thisWeek: appointments.filter((apt) =>
      dayjs(apt.date).isBetween(thisWeekStart, thisWeekEnd, null, "[]"),
    ).length,
    thisMonth: appointments.filter((apt) =>
      dayjs(apt.date).isBetween(thisMonthStart, thisMonthEnd, null, "[]"),
    ).length,
    completed: appointments.filter((apt) => apt.status === "concluido").length,
    confirmed: appointments.filter((apt) => apt.status === "confirmado").length,
    scheduled: appointments.filter((apt) => apt.status === "agendado").length,
    cancelled: appointments.filter((apt) => apt.status === "cancelado").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "agendado":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "confirmado":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelado":
        return "bg-red-100 text-red-800 border-red-200";
      case "concluido":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmado":
        return <CheckCircleIcon className="h-3 w-3" />;
      case "cancelado":
        return <XCircleIcon className="h-3 w-3" />;
      case "concluido":
        return <CheckCircleIcon className="h-3 w-3" />;
      default:
        return <Clock4Icon className="h-3 w-3" />;
    }
  };

  const getSexIcon = (sex: string) => {
    return sex === "male" ? "👨" : "👩";
  };

  const getGreeting = () => {
    const hour = dayjs().hour();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  if (getDoctorAppointmentsAction.isExecuting) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-3 border-blue-600"></div>
          <p className="mt-4 text-lg text-gray-600">Carregando sua agenda...</p>
          <p className="text-sm text-gray-500">Organizando seus compromissos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header melhorado com saudação */}
        {doctor && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white shadow-xl">
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                    <UserIcon className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <p className="text-blue-100">{getGreeting()},</p>
                    <h1 className="text-3xl font-bold">{doctor.name}</h1>
                    <p className="text-xl text-blue-100">{doctor.specialty}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-blue-100">Hoje é</p>
                  <p className="text-xl font-semibold">
                    {dayjs().format("dddd, DD [de] MMMM")}
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-white/10 to-transparent"></div>
          </div>
        )}

        {/* Grid de estatísticas melhorado */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-wide text-blue-100 uppercase">
                    Total
                  </p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <CalendarDaysIcon className="h-6 w-6 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-wide text-emerald-100 uppercase">
                    Hoje
                  </p>
                  <p className="text-2xl font-bold">{stats.today}</p>
                </div>
                <ClockIcon className="h-6 w-6 text-emerald-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-wide text-purple-100 uppercase">
                    Semana
                  </p>
                  <p className="text-2xl font-bold">{stats.thisWeek}</p>
                </div>
                <TrendingUpIcon className="h-6 w-6 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-wide text-orange-100 uppercase">
                    Mês
                  </p>
                  <p className="text-2xl font-bold">{stats.thisMonth}</p>
                </div>
                <ActivityIcon className="h-6 w-6 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-wide text-green-100 uppercase">
                    Concluídas
                  </p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
                <CheckCircleIcon className="h-6 w-6 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-wide text-indigo-100 uppercase">
                    Confirmadas
                  </p>
                  <p className="text-2xl font-bold">{stats.confirmed}</p>
                </div>
                <CheckCircleIcon className="h-6 w-6 text-indigo-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seção da agenda com filtros */}
        <Card className="shadow-xl">
          <CardHeader className="border-b bg-gray-50">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div>
                <CardTitle className="flex items-center space-x-2 text-xl">
                  <CalendarIcon className="h-6 w-6 text-blue-600" />
                  <span>Minha Agenda</span>
                </CardTitle>
                <CardDescription className="mt-1">
                  Gerencie seus agendamentos e consultas
                </CardDescription>
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar paciente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64 pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos Status</SelectItem>
                    <SelectItem value="agendado">Agendado</SelectItem>
                    <SelectItem value="confirmado">Confirmado</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="hoje">Hoje</SelectItem>
                    <SelectItem value="semana">Esta Semana</SelectItem>
                    <SelectItem value="mes">Este Mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {sortedDates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarIcon className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Nenhum agendamento encontrado
                </h3>
                <p className="mt-2 text-gray-500">
                  {searchTerm ||
                  statusFilter !== "todos" ||
                  dateFilter !== "todos"
                    ? "Tente ajustar os filtros para ver mais resultados."
                    : "Você não possui agendamentos no momento."}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedDates.map((date) => (
                  <div key={date} className="space-y-4">
                    {/* Header da data */}
                    <div className="flex items-center space-x-3 border-b border-gray-200 pb-2">
                      <CalendarIcon className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {dayjs(date).format("dddd, DD [de] MMMM [de] YYYY")}
                      </h3>
                      <Badge variant="secondary" className="ml-auto">
                        {appointmentsByDate[date].length} consulta
                        {appointmentsByDate[date].length !== 1 ? "s" : ""}
                      </Badge>
                    </div>

                    {/* Lista de agendamentos do dia */}
                    <div className="space-y-3">
                      {appointmentsByDate[date]
                        .sort(
                          (a, b) =>
                            new Date(a.date).getTime() -
                            new Date(b.date).getTime(),
                        )
                        .map((appointment) => (
                          <Card
                            key={appointment.id}
                            className="cursor-pointer border border-gray-200 transition-all duration-200 hover:scale-[1.02] hover:border-blue-300 hover:shadow-md"
                            onClick={() => {
                              router.push(`/patient/${appointment.patient.id}`);
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-2xl">
                                    {getSexIcon(appointment.patient.sex)}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900">
                                      {appointment.patient.name}
                                    </h4>
                                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                                      <div className="flex items-center space-x-1">
                                        <MailIcon className="h-3 w-3" />
                                        <span>{appointment.patient.email}</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <PhoneIcon className="h-3 w-3" />
                                        <span>
                                          {appointment.patient.phone_number}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col items-end space-y-2">
                                  <div className="text-lg font-semibold text-gray-900">
                                    {(() => {
                                      const utcDate = new Date(
                                        appointment.date,
                                      );
                                      const localDate = new Date(
                                        utcDate.getTime() - 3 * 60 * 60 * 1000,
                                      );
                                      return dayjs(localDate).format("HH:mm");
                                    })()}
                                  </div>
                                  <Badge
                                    className={`${getStatusColor(appointment.status)} flex items-center space-x-1`}
                                    variant="secondary"
                                  >
                                    {getStatusIcon(appointment.status)}
                                    <span className="capitalize">
                                      {appointment.status}
                                    </span>
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorDashboardPage;
