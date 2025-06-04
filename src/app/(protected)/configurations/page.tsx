"use client";

import {
  AlertTriangleIcon,
  BuildingIcon,
  DatabaseIcon,
  LockIcon,
  SettingsIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageContainer } from "@/components/ui/page-container";
import { authClient } from "@/lib/auth-client";

import { ClinicConfigurationCard } from "./_components/clinic-configuration-card";
import { DatabaseBackupCard } from "./_components/database-backup-card";
import { HealthInsuranceManagementCard } from "./_components/health-insurance-management-card";
import { EmailConfigurationCard } from "./_components/email-configuration-card";
import { SecurityConfigurationCard } from "./_components/security-configuration-card";
import { UserManagementCard } from "./_components/user-management-card";
import { UserProfileCard } from "./_components/user-profile-card";

const ConfigurationsPage = () => {
  const router = useRouter();
  const session = authClient.useSession();

  // Refs para os cards principais
  const clinicCardRef = useRef<HTMLDivElement>(null);
  const userCardRef = useRef<HTMLDivElement>(null);
  const backupCardRef = useRef<HTMLDivElement>(null);

  // Estados para controlar abertura de modais/ações
  const [openClinicForm, setOpenClinicForm] = useState(false);
  const [openCreateUser, setOpenCreateUser] = useState(false);
  const [triggerBackup, setTriggerBackup] = useState(false);

  // Verificar se o usuário está logado e é administrador
  useEffect(() => {
    if (session.data && session.data.user?.userType !== "admin") {
      toast.error(
        "Acesso negado. Apenas administradores podem acessar esta página.",
      );
      router.push("/dashboard");
    }
  }, [session.data, router]);

  // Função para rolar até um card específico
  const scrollToCard = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Handlers para as ações rápidas
  const handleClinicDataClick = () => {
    scrollToCard(clinicCardRef);
    // Abrir formulário de edição da clínica
    setOpenClinicForm(true);
    // Reset após um tempo para permitir re-trigger
    setTimeout(() => setOpenClinicForm(false), 100);
  };

  const handleCreateUserClick = () => {
    scrollToCard(userCardRef);
    // Abrir modal de criação de usuário
    setOpenCreateUser(true);
    // Reset após um tempo para permitir re-trigger
    setTimeout(() => setOpenCreateUser(false), 100);
  };

  const handleBackupClick = () => {
    scrollToCard(backupCardRef);
    // Trigger backup manual
    setTriggerBackup(true);
    // Reset após um tempo para permitir re-trigger
    setTimeout(() => setTriggerBackup(false), 1000);
  };

  const handleSecurityLogsClick = () => {
    router.push("/configurations/security-logs");
  };

  // Loading state
  if (session.isPending) {
    return (
      <PageContainer>
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-3 border-blue-600"></div>
            <p className="mt-4 text-lg text-gray-600">
              Carregando configurações...
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Unauthorized access
  if (!session.data?.user || session.data.user.userType !== "admin") {
    return (
      <PageContainer>
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <AlertTriangleIcon className="mx-auto h-16 w-16 text-red-500" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Acesso Negado
            </h2>
            <p className="mt-2 text-gray-600">
              Apenas administradores podem acessar esta página.
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-white shadow-xl">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">
                  Configurações Administrativas
                </h1>
                <p className="mt-2 text-purple-100">
                  Gerencie todas as configurações do sistema e da clínica
                </p>
                <div className="mt-4 flex items-center space-x-2">
                  <Badge className="bg-white/20 text-white">
                    <ShieldIcon className="mr-1 h-3 w-3" />
                    Área Restrita
                  </Badge>
                  <Badge className="bg-white/20 text-white">
                    <UsersIcon className="mr-1 h-3 w-3" />
                    Administrador: {session.data.user.name}
                  </Badge>
                </div>
              </div>
              <div className="hidden md:block">
                <SettingsIcon className="h-24 w-24 text-white/30" />
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-white/10 to-transparent"></div>
        </div>

        {/* Configuration Categories */}
        <div className="space-y-6">
          {/* Ações Rápidas - Primeiro card */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <AlertTriangleIcon className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-orange-900">Ações Rápidas</CardTitle>
              </div>
              <CardDescription className="text-orange-700">
                Acesso rápido às configurações mais utilizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <button
                  onClick={handleClinicDataClick}
                  className="flex flex-col items-center space-y-2 rounded-lg border border-orange-200 bg-white p-4 text-center transition-all hover:bg-orange-100 hover:shadow-md"
                >
                  <BuildingIcon className="h-8 w-8 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">
                    Dados da Clínica
                  </span>
                </button>

                <button
                  onClick={handleCreateUserClick}
                  className="flex flex-col items-center space-y-2 rounded-lg border border-orange-200 bg-white p-4 text-center transition-all hover:bg-orange-100 hover:shadow-md"
                >
                  <UsersIcon className="h-8 w-8 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">
                    Criar Usuário
                  </span>
                </button>

                <button
                  onClick={handleBackupClick}
                  className="flex flex-col items-center space-y-2 rounded-lg border border-orange-200 bg-white p-4 text-center transition-all hover:bg-orange-100 hover:shadow-md"
                >
                  <DatabaseIcon className="h-8 w-8 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">
                    Backup Manual
                  </span>
                </button>

                <button
                  onClick={handleSecurityLogsClick}
                  className="flex flex-col items-center space-y-2 rounded-lg border border-orange-200 bg-white p-4 text-center transition-all hover:bg-orange-100 hover:shadow-md"
                >
                  <LockIcon className="h-8 w-8 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">
                    Logs de Segurança
                  </span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Grid de cards principais em 2 colunas */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Perfil do Usuário */}
            <UserProfileCard />

            {/* Configurações da Clínica */}
            <div ref={clinicCardRef}>
              <ClinicConfigurationCard forceEditMode={openClinicForm} />
            </div>

            {/* Gerenciamento de Usuários */}
            <div ref={userCardRef}>
              <UserManagementCard forceCreateModal={openCreateUser} />
            </div>

            {/* Configurações de Segurança */}
            <SecurityConfigurationCard />

            {/* Planos de Saúde */}
            <HealthInsuranceManagementCard />

            {/* Configurações de Email */}
            <EmailConfigurationCard />

            {/* Backup e Dados */}
            <div ref={backupCardRef}>
              <DatabaseBackupCard triggerBackup={triggerBackup} />
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default ConfigurationsPage;
