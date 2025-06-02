import { and, count, eq, ilike } from "drizzle-orm";
import {
  MailIcon,
  PhoneIcon,
  TrendingUpIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { db } from "@/db";
import { appointmentsTable, patientsTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import AddPatientButton from "./_components/add-patient-button";
import { patientsTableColumns } from "./_components/table-columns";

interface PatientsPageProps {
  searchParams: Promise<{ q?: string }>;
}

const PatientsPage = async ({ searchParams }: PatientsPageProps) => {
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

  const whereConditions = [eq(patientsTable.clinicId, session.user.clinic.id)];

  if (searchQuery) {
    whereConditions.push(ilike(patientsTable.name, `%${searchQuery}%`));
  }

  // Buscar pacientes
  const patients = await db.query.patientsTable.findMany({
    where: and(...whereConditions),
    orderBy: patientsTable.name,
  });

  // Estatísticas dos pacientes
  const totalPatients = await db
    .select({ count: count() })
    .from(patientsTable)
    .where(eq(patientsTable.clinicId, session.user.clinic.id));

  const malePatients = await db
    .select({ count: count() })
    .from(patientsTable)
    .where(
      and(
        eq(patientsTable.clinicId, session.user.clinic.id),
        eq(patientsTable.sex, "male"),
      ),
    );

  const femalePatients = await db
    .select({ count: count() })
    .from(patientsTable)
    .where(
      and(
        eq(patientsTable.clinicId, session.user.clinic.id),
        eq(patientsTable.sex, "female"),
      ),
    );

  // Pacientes com mais agendamentos
  const patientsWithAppointments = await db
    .select({
      patientId: patientsTable.id,
      patientName: patientsTable.name,
      patientEmail: patientsTable.email,
      patientAvatar: patientsTable.avatarImageUrl,
      appointmentCount: count(appointmentsTable.id),
    })
    .from(patientsTable)
    .leftJoin(
      appointmentsTable,
      eq(patientsTable.id, appointmentsTable.patientId),
    )
    .where(eq(patientsTable.clinicId, session.user.clinic.id))
    .groupBy(
      patientsTable.id,
      patientsTable.name,
      patientsTable.email,
      patientsTable.avatarImageUrl,
    )
    .orderBy(count(appointmentsTable.id))
    .limit(5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header melhorado */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white shadow-xl">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                  <UsersIcon className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Gestão de Pacientes</h1>
                  <p className="text-xl text-emerald-100">
                    Gerencie todos os pacientes da sua clínica
                  </p>
                  <p className="text-emerald-200">
                    {totalPatients[0]?.count || 0} pacientes cadastrados
                  </p>
                </div>
              </div>
              <div className="text-right">
                <AddPatientButton />
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
                    Total de Pacientes
                  </p>
                  <p className="text-2xl font-bold">
                    {totalPatients[0]?.count || 0}
                  </p>
                </div>
                <UsersIcon className="h-6 w-6 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-wide text-indigo-100 uppercase">
                    Pacientes Masculinos
                  </p>
                  <p className="text-2xl font-bold">
                    {malePatients[0]?.count || 0}
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
                    Pacientes Femininos
                  </p>
                  <p className="text-2xl font-bold">
                    {femalePatients[0]?.count || 0}
                  </p>
                </div>
                <UserIcon className="h-6 w-6 text-purple-200" />
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
                  <p className="text-2xl font-bold">{patients.length}</p>
                </div>
                <TrendingUpIcon className="h-6 w-6 text-emerald-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Lista de Pacientes */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl">
              <CardHeader className="border-b bg-gray-50">
                <CardTitle className="flex items-center space-x-2 text-xl">
                  <UsersIcon className="h-6 w-6 text-blue-600" />
                  <span>Lista de Pacientes</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-6">
                  <SearchInput 
                    placeholder="Buscar paciente..." 
                    className="w-full" 
                  />
                </div>
                <div className="w-full overflow-hidden">
                  <DataTable data={patients} columns={patientsTableColumns} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pacientes Mais Ativos */}
          <Card className="shadow-xl">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="flex items-center space-x-2 text-xl">
                <TrendingUpIcon className="h-6 w-6 text-blue-600" />
                <span>Pacientes Mais Ativos</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {patientsWithAppointments.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-gray-500">Nenhum dado disponível</p>
                  </div>
                ) : (
                  patientsWithAppointments.map((patient, index) => (
                    <div
                      key={patient.patientId}
                      className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                        #{index + 1}
                      </div>
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        {patient.patientAvatar && (
                          <AvatarImage
                            src={patient.patientAvatar}
                            alt={`Foto de ${patient.patientName}`}
                          />
                        )}
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 font-semibold text-white">
                          {patient.patientName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-gray-900">
                          {patient.patientName}
                        </div>
                        <div className="truncate text-sm text-gray-500">
                          {patient.patientEmail}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge
                          variant="outline"
                          className="border-blue-200 bg-blue-50 text-xs whitespace-nowrap text-blue-700"
                        >
                          {patient.appointmentCount} consultas
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PatientsPage;
