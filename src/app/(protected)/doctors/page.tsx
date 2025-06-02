import { and, count, eq, ilike } from "drizzle-orm";
import {
  BriefcaseIcon,
  DollarSignIcon,
  TrendingUpIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { db } from "@/db";
import { appointmentsTable, doctorsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { formatCurrencyInCents } from "@/helpers/currency";

import AddDoctorButton from "./_components/add-doctor-button";
import DoctorCard from "./_components/doctor-card";

interface DoctorsPageProps {
  searchParams: Promise<{ q?: string }>;
}

const DoctorsPage = async ({ searchParams }: DoctorsPageProps) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/authentication");
  }
  if (!session.user.clinic) {
    redirect("/clinic-form");
  }

  const { q } = await searchParams;
  const searchQuery = q?.trim() || "";

  const whereConditions = [eq(doctorsTable.clinicId, session.user.clinic.id)];

  if (searchQuery) {
    whereConditions.push(ilike(doctorsTable.name, `%${searchQuery}%`));
  }

  // Buscar médicos
  const doctors = await db.query.doctorsTable.findMany({
    where: and(...whereConditions),
    orderBy: doctorsTable.name,
  });

  // Estatísticas dos médicos
  const totalDoctors = await db
    .select({ count: count() })
    .from(doctorsTable)
    .where(eq(doctorsTable.clinicId, session.user.clinic.id));

  // Especialidades mais comuns
  const specialtiesCount = await db
    .select({
      specialty: doctorsTable.specialty,
      count: count(),
    })
    .from(doctorsTable)
    .where(eq(doctorsTable.clinicId, session.user.clinic.id))
    .groupBy(doctorsTable.specialty)
    .orderBy(count())
    .limit(3);

  // Preço médio das consultas
  const avgPrice =
    doctors.length > 0
      ? doctors.reduce(
          (sum, doctor) => sum + doctor.appointmentPriceInCents,
          0,
        ) / doctors.length
      : 0;

  // Médicos com mais agendamentos
  const doctorsWithAppointments = await db
    .select({
      doctorId: doctorsTable.id,
      doctorName: doctorsTable.name,
      doctorSpecialty: doctorsTable.specialty,
      doctorAvatar: doctorsTable.avatarImageUrl,
      appointmentCount: count(appointmentsTable.id),
    })
    .from(doctorsTable)
    .leftJoin(
      appointmentsTable,
      eq(doctorsTable.id, appointmentsTable.doctorId),
    )
    .where(eq(doctorsTable.clinicId, session.user.clinic.id))
    .groupBy(
      doctorsTable.id,
      doctorsTable.name,
      doctorsTable.specialty,
      doctorsTable.avatarImageUrl,
    )
    .orderBy(count(appointmentsTable.id))
    .limit(5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header melhorado */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white shadow-xl">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                  <BriefcaseIcon className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Gestão de Médicos</h1>
                  <p className="text-xl text-blue-100">
                    Gerencie todos os médicos da sua clínica
                  </p>
                  <p className="text-blue-200">
                    {totalDoctors[0]?.count || 0} médicos cadastrados
                  </p>
                </div>
              </div>
              <div className="text-right">
                <AddDoctorButton />
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-white/10 to-transparent"></div>
        </div>

        {/* Grid de estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-wide text-blue-100 uppercase">
                    Total de Médicos
                  </p>
                  <p className="text-2xl font-bold">
                    {totalDoctors[0]?.count || 0}
                  </p>
                </div>
                <BriefcaseIcon className="h-6 w-6 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-wide text-indigo-100 uppercase">
                    Especialidades
                  </p>
                  <p className="text-2xl font-bold">
                    {specialtiesCount.length}
                  </p>
                </div>
                <UserIcon className="h-6 w-6 text-indigo-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-wide text-purple-100 uppercase">
                    Preço Médio
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrencyInCents(avgPrice)}
                  </p>
                </div>
                <DollarSignIcon className="h-6 w-6 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-wide text-emerald-100 uppercase">
                    Filtrados
                  </p>
                  <p className="text-2xl font-bold">{doctors.length}</p>
                </div>
                <TrendingUpIcon className="h-6 w-6 text-emerald-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Lista de Médicos */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl">
              <CardHeader className="border-b bg-gray-50">
                <CardTitle className="flex items-center space-x-2 text-xl">
                  <BriefcaseIcon className="h-6 w-6 text-blue-600" />
                  <span>Lista de Médicos</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-6">
                  <SearchInput
                    placeholder="Buscar médico..."
                    className="w-full"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {doctors.map((doctor) => (
                    <DoctorCard key={doctor.id} doctor={doctor} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Médicos Mais Ativos */}
          <Card className="shadow-xl">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="flex items-center space-x-2 text-xl">
                <TrendingUpIcon className="h-6 w-6 text-blue-600" />
                <span>Médicos Mais Ativos</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {doctorsWithAppointments.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-gray-500">Nenhum dado disponível</p>
                  </div>
                ) : (
                  doctorsWithAppointments.map((doctor, index) => (
                    <div
                      key={doctor.doctorId}
                      className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                        #{index + 1}
                      </div>
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        {doctor.doctorAvatar && (
                          <AvatarImage
                            src={doctor.doctorAvatar}
                            alt={`Foto de ${doctor.doctorName}`}
                          />
                        )}
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 font-semibold text-white">
                          {doctor.doctorName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-gray-900">
                          {doctor.doctorName}
                        </div>
                        <div className="truncate text-sm text-gray-500">
                          {doctor.doctorSpecialty}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge
                          variant="outline"
                          className="border-blue-200 bg-blue-50 text-xs whitespace-nowrap text-blue-700"
                        >
                          {doctor.appointmentCount} consultas
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Especialidades mais comuns */}
              {specialtiesCount.length > 0 && (
                <div className="mt-6 border-t pt-6">
                  <h4 className="mb-3 font-semibold text-gray-900">
                    Especialidades Principais
                  </h4>
                  <div className="space-y-2">
                    {specialtiesCount.map((specialty, index) => (
                      <div
                        key={specialty.specialty}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-600">
                          {specialty.specialty}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {specialty.count} médico
                          {specialty.count !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DoctorsPage;
