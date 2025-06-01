"use client";

import "dayjs/locale/pt-br";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  ArrowLeftIcon,
  CalendarIcon,
  FileTextIcon,
  UserIcon,
  PlusIcon,
  MailIcon,
  PhoneIcon,
  ClockIcon,
  ActivityIcon,
  TrendingUpIcon,
  CalendarDaysIcon,
  SearchIcon,
  EyeIcon,
  EditIcon,
  DownloadIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  StethoscopeIcon,
  PillIcon,
  HeartIcon,
  FileX2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState, useMemo, use } from "react";
import { toast } from "sonner";

import { getPatientMedicalRecords } from "@/actions/get-patient-medical-records";
import { getCurrentDoctor } from "@/actions/get-current-doctor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import UpsertMedicalRecordForm from "./_components/upsert-medical-record-form";

interface PatientPageProps {
  params: Promise<{
    patientId: string;
  }>;
}

dayjs.locale("pt-br");
dayjs.extend(relativeTime);

const PatientPage = ({ params }: PatientPageProps) => {
  const router = useRouter();
  const resolvedParams = use(params);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("todos");
  const [doctorFilter, setDoctorFilter] = useState("todos");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const getPatientMedicalRecordsAction = useAction(getPatientMedicalRecords, {
    onSuccess: (data) => {
      console.log("✅ Prontuários carregados:", data);
    },
    onError: (error) => {
      console.error("❌ Erro ao carregar prontuários:", error);
      toast.error("Erro ao carregar prontuários do paciente");
    },
  });

  const getCurrentDoctorAction = useAction(getCurrentDoctor, {
    onSuccess: (data) => {
      console.log("✅ Médico logado:", data);
    },
    onError: (error) => {
      console.error("❌ Erro ao buscar médico logado:", error);
      toast.error("Erro ao carregar dados do médico");
    },
  });

  useEffect(() => {
    getPatientMedicalRecordsAction.execute({
      patientId: resolvedParams.patientId,
    });
    getCurrentDoctorAction.execute();
  }, [resolvedParams.patientId]);

  const data = getPatientMedicalRecordsAction.result?.data;
  const medicalRecords = data?.medicalRecords || [];
  const patient = medicalRecords[0]?.patient;

  // Obter o ID do médico logado da sessão
  const currentDoctor = getCurrentDoctorAction.result?.data?.doctor;
  const currentDoctorId = currentDoctor?.id;

  // Lista únicos de médicos para o filtro
  const uniqueDoctors = useMemo(() => {
    const doctors = medicalRecords.map((record) => ({
      id: record.doctor.id,
      name: record.doctor.name,
      specialty: record.doctor.specialty,
    }));
    return doctors.filter(
      (doctor, index, self) =>
        index === self.findIndex((d) => d.id === doctor.id),
    );
  }, [medicalRecords]);

  // Filtrar prontuários
  const filteredRecords = useMemo(() => {
    return medicalRecords.filter((record) => {
      const matchesSearch =
        record.symptoms?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.treatment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.medication?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.doctor.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDoctor =
        doctorFilter === "todos" || record.doctor.id === doctorFilter;

      let matchesDate = true;
      const recordDate = dayjs(record.createdAt);
      const today = dayjs();

      switch (dateFilter) {
        case "hoje":
          matchesDate = recordDate.isSame(today, "day");
          break;
        case "semana":
          matchesDate = recordDate.isAfter(today.subtract(7, "days"));
          break;
        case "mes":
          matchesDate = recordDate.isAfter(today.subtract(30, "days"));
          break;
        case "ano":
          matchesDate = recordDate.isAfter(today.subtract(1, "year"));
          break;
        default:
          matchesDate = true;
      }

      return matchesSearch && matchesDoctor && matchesDate;
    });
  }, [medicalRecords, searchTerm, doctorFilter, dateFilter]);

  // Estatísticas calculadas
  const stats = {
    total: medicalRecords.length,
    withCertificate: medicalRecords.filter(
      (record) => record.medicalCertificate,
    ).length,
    thisMonth: medicalRecords.filter((record) =>
      dayjs(record.createdAt).isAfter(dayjs().subtract(30, "days")),
    ).length,
    thisYear: medicalRecords.filter((record) =>
      dayjs(record.createdAt).isAfter(dayjs().subtract(1, "year")),
    ).length,
    uniqueDoctors: uniqueDoctors.length,
    avgDays:
      medicalRecords.length > 0
        ? Math.round(
            dayjs().diff(
              dayjs(medicalRecords[medicalRecords.length - 1]?.createdAt),
              "days",
            ) / medicalRecords.length,
          )
        : 0,
  };

  const getSexIcon = (sex: string) => {
    return sex === "male" ? "👨" : "👩";
  };

  const getPatientAge = (birthDate?: string) => {
    if (!birthDate) return "Não informado";
    return dayjs().diff(dayjs(birthDate), "years") + " anos";
  };

  if (
    getPatientMedicalRecordsAction.isExecuting ||
    getCurrentDoctorAction.isExecuting
  ) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-3 border-blue-600"></div>
          <p className="mt-4 text-lg text-gray-600">Carregando prontuário...</p>
          <p className="text-sm text-gray-500">Organizando histórico médico</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header melhorado com navegação */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center space-x-2 shadow-sm"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Voltar à Agenda</span>
            </Button>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-2xl font-bold text-gray-900">
              Prontuário do Paciente
            </h1>
          </div>

          <Button
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg hover:shadow-xl"
            onClick={() => setIsCreateModalOpen(true)}
            disabled={!currentDoctorId}
          >
            <PlusIcon className="h-4 w-4" />
            <span>Nova Consulta</span>
          </Button>
        </div>

        {/* Card do paciente redesenhado */}
        {patient && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 to-blue-600 p-8 text-white shadow-xl">
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 text-4xl backdrop-blur-sm">
                    {getSexIcon(patient.sex)}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">{patient.name}</h2>
                    <div className="mt-2 flex items-center space-x-6 text-green-100">
                      <div className="flex items-center space-x-2">
                        <MailIcon className="h-4 w-4" />
                        <span>{patient.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <PhoneIcon className="h-4 w-4" />
                        <span>{patient.phone_number}</span>
                      </div>
                    </div>
                    <div className="mt-1 text-green-100">
                      {patient.sex === "male" ? "Masculino" : "Feminino"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-100">Paciente desde</p>
                  <p className="text-xl font-semibold">
                    {medicalRecords.length > 0
                      ? dayjs(
                          medicalRecords[medicalRecords.length - 1].createdAt,
                        ).format("MMM/YYYY")
                      : "Novo paciente"}
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-white/10 to-transparent"></div>
          </div>
        )}

        {/* Grid de estatísticas melhorado */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-wide text-blue-100 uppercase">
                    Total
                  </p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileTextIcon className="h-6 w-6 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-yellow-500 to-orange-600 text-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-wide text-yellow-100 uppercase">
                    Atestados
                  </p>
                  <p className="text-2xl font-bold">{stats.withCertificate}</p>
                </div>
                <CalendarDaysIcon className="h-6 w-6 text-yellow-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-wide text-purple-100 uppercase">
                    Este Mês
                  </p>
                  <p className="text-2xl font-bold">{stats.thisMonth}</p>
                </div>
                <TrendingUpIcon className="h-6 w-6 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-wide text-green-100 uppercase">
                    Este Ano
                  </p>
                  <p className="text-2xl font-bold">{stats.thisYear}</p>
                </div>
                <ActivityIcon className="h-6 w-6 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-wide text-indigo-100 uppercase">
                    Médicos
                  </p>
                  <p className="text-2xl font-bold">{stats.uniqueDoctors}</p>
                </div>
                <StethoscopeIcon className="h-6 w-6 text-indigo-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-wide text-teal-100 uppercase">
                    Última
                  </p>
                  <p className="text-lg font-bold">
                    {medicalRecords.length > 0
                      ? dayjs(medicalRecords[0].createdAt).fromNow()
                      : "Nunca"}
                  </p>
                </div>
                <ClockIcon className="h-6 w-6 text-teal-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seção do histórico com filtros */}
        <Card className="shadow-xl">
          <CardHeader className="border-b bg-gray-50">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div>
                <CardTitle className="flex items-center space-x-2 text-xl">
                  <FileTextIcon className="h-6 w-6 text-green-600" />
                  <span>Histórico de Consultas</span>
                </CardTitle>
                <CardDescription className="mt-1">
                  Acompanhe o histórico médico completo do paciente
                </CardDescription>
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar diagnóstico, sintoma..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64 pl-10"
                  />
                </div>

                <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Médico" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Médicos</SelectItem>
                    {uniqueDoctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        Dr(a). {doctor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="hoje">Hoje</SelectItem>
                    <SelectItem value="semana">7 dias</SelectItem>
                    <SelectItem value="mes">30 dias</SelectItem>
                    <SelectItem value="ano">Este ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {filteredRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                {medicalRecords.length === 0 ? (
                  <>
                    <FileX2Icon className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Nenhum prontuário encontrado
                    </h3>
                    <p className="mt-2 text-gray-500">
                      Este paciente ainda não possui consultas registradas.
                    </p>
                    <Button
                      className="mt-4 flex items-center space-x-2"
                      onClick={() => setIsCreateModalOpen(true)}
                      disabled={!currentDoctorId}
                    >
                      <PlusIcon className="h-4 w-4" />
                      <span>Criar Primeira Consulta</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <SearchIcon className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Nenhum resultado encontrado
                    </h3>
                    <p className="mt-2 text-gray-500">
                      Tente ajustar os filtros para ver mais resultados.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredRecords.map((record, index) => (
                  <Card
                    key={record.id}
                    className="border border-gray-200 transition-all duration-200 hover:border-green-300 hover:shadow-lg"
                  >
                    <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-green-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                            <span className="text-sm font-bold">
                              #{filteredRecords.length - index}
                            </span>
                          </div>
                          <div>
                            <CardTitle className="flex items-center space-x-2 text-lg">
                              <CalendarIcon className="h-5 w-5 text-green-600" />
                              <span>
                                {dayjs(record.createdAt).format(
                                  "dddd, DD [de] MMMM [de] YYYY",
                                )}
                              </span>
                            </CardTitle>
                            <CardDescription className="flex items-center space-x-4 text-sm">
                              <span className="flex items-center space-x-1">
                                <UserIcon className="h-3 w-3" />
                                <span>Dr(a). {record.doctor.name}</span>
                              </span>
                              <span className="text-gray-400">•</span>
                              <span>{record.doctor.specialty}</span>
                              {record.appointment && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <span className="flex items-center space-x-1">
                                    <ClockIcon className="h-3 w-3" />
                                    <span>
                                      {dayjs(record.appointment.date).format(
                                        "HH:mm",
                                      )}
                                    </span>
                                  </span>
                                </>
                              )}
                            </CardDescription>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {record.medicalCertificate && (
                            <Badge className="border-yellow-200 bg-yellow-100 text-yellow-800">
                              <AlertCircleIcon className="mr-1 h-3 w-3" />
                              Atestado: {record.certificateDays} dias
                            </Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-1"
                          >
                            <EyeIcon className="h-3 w-3" />
                            <span>Ver</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-1"
                            onClick={() => {
                              setSelectedRecord(record);
                              setIsEditModalOpen(true);
                            }}
                          >
                            <EditIcon className="h-3 w-3" />
                            <span>Editar</span>
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Sintomas */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <HeartIcon className="h-4 w-4 text-red-500" />
                            <h4 className="font-semibold text-gray-900">
                              Sintomas
                            </h4>
                          </div>
                          <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                            <p className="text-sm text-gray-700">
                              {record.symptoms}
                            </p>
                          </div>
                        </div>

                        {/* Diagnóstico */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            <h4 className="font-semibold text-gray-900">
                              Diagnóstico
                            </h4>
                          </div>
                          <div className="rounded-lg border border-green-100 bg-green-50 p-4">
                            <p className="text-sm text-gray-700">
                              {record.diagnosis}
                            </p>
                          </div>
                        </div>

                        {/* Tratamento */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <ActivityIcon className="h-4 w-4 text-blue-500" />
                            <h4 className="font-semibold text-gray-900">
                              Tratamento
                            </h4>
                          </div>
                          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                            <p className="text-sm text-gray-700">
                              {record.treatment}
                            </p>
                          </div>
                        </div>

                        {/* Medicação */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <PillIcon className="h-4 w-4 text-purple-500" />
                            <h4 className="font-semibold text-gray-900">
                              Medicação
                            </h4>
                          </div>
                          <div className="rounded-lg border border-purple-100 bg-purple-50 p-4">
                            <p className="text-sm text-gray-700">
                              {record.medication}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Observações */}
                      {record.observations && (
                        <div className="mt-6 space-y-2">
                          <div className="flex items-center space-x-2">
                            <FileTextIcon className="h-4 w-4 text-amber-500" />
                            <h4 className="font-semibold text-gray-900">
                              Observações
                            </h4>
                          </div>
                          <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                            <p className="text-sm text-gray-700">
                              {record.observations}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Footer com timestamps */}
                      <div className="mt-6 flex items-center justify-between border-t pt-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span>
                            Criado em:{" "}
                            {dayjs(record.createdAt).format(
                              "DD/MM/YYYY [às] HH:mm",
                            )}
                          </span>
                          {record.updatedAt !== record.createdAt && (
                            <span>
                              Atualizado em:{" "}
                              {dayjs(record.updatedAt).format(
                                "DD/MM/YYYY [às] HH:mm",
                              )}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center space-x-1 text-gray-500"
                        >
                          <DownloadIcon className="h-3 w-3" />
                          <span>Exportar</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal para criar novo prontuário */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <UpsertMedicalRecordForm
          patientId={resolvedParams.patientId}
          doctorId={currentDoctorId || ""}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            getPatientMedicalRecordsAction.execute({
              patientId: resolvedParams.patientId,
            });
          }}
        />
      </Dialog>

      {/* Modal para editar prontuário */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <UpsertMedicalRecordForm
          patientId={resolvedParams.patientId}
          doctorId={currentDoctorId || ""}
          medicalRecord={selectedRecord}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setSelectedRecord(null);
            getPatientMedicalRecordsAction.execute({
              patientId: resolvedParams.patientId,
            });
          }}
        />
      </Dialog>
    </div>
  );
};

export default PatientPage;
