"use client";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  FilterIcon,
  RefreshCwIcon,
  ShieldIcon,
  XCircleIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { getSecurityLogs } from "@/actions/get-security-logs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageContainer } from "@/components/ui/page-container";

dayjs.extend(relativeTime);

const SecurityLogsPage = () => {
  const router = useRouter();
  const [days, setDays] = useState(30);

  const getSecurityLogsAction = useAction(getSecurityLogs, {
    onSuccess: (data) => {
      console.log("✅ Logs de segurança carregados:", data?.logs?.length || 0);
    },
    onError: (error) => {
      console.error("❌ Erro ao carregar logs:", error);
      toast.error("Erro ao carregar logs de segurança");
    },
  });

  useEffect(() => {
    getSecurityLogsAction.execute({ days, limit: 100 });
  }, [days]);

  const logs = getSecurityLogsAction.result?.data?.logs || [];

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case "login":
      case "logout":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "failed_login":
        return "bg-red-100 text-red-800 border-red-200";
      case "password_change":
      case "configuration_change":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "user_created":
      case "user_updated":
        return "bg-green-100 text-green-800 border-green-200";
      case "user_deleted":
        return "bg-red-100 text-red-800 border-red-200";
      case "data_access":
      case "data_export":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getLogTypeIcon = (type: string, success: boolean) => {
    if (!success) {
      return <XCircleIcon className="h-4 w-4 text-red-500" />;
    }

    switch (type) {
      case "login":
      case "logout":
      case "data_access":
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case "failed_login":
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircleIcon className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLogTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      login: "Login",
      logout: "Logout",
      failed_login: "Login Falhou",
      password_change: "Senha Alterada",
      user_created: "Usuário Criado",
      user_deleted: "Usuário Removido",
      user_updated: "Usuário Atualizado",
      permission_change: "Permissão Alterada",
      data_access: "Acesso a Dados",
      data_export: "Exportação de Dados",
      system_access: "Acesso ao Sistema",
      configuration_change: "Configuração Alterada",
    };
    return labels[type] || type;
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center space-x-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Voltar</span>
            </Button>
            <div>
              <h1 className="flex items-center space-x-2 text-2xl font-bold text-gray-900">
                <ShieldIcon className="h-6 w-6 text-red-600" />
                <span>Logs de Segurança</span>
              </h1>
              <p className="text-gray-600">
                Histórico de atividades de segurança da clínica
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <FilterIcon className="mr-2 h-4 w-4" />
                  Últimos {days} dias
                  <ChevronDownIcon className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setDays(7)}>
                  Últimos 7 dias
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDays(30)}>
                  Últimos 30 dias
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDays(90)}>
                  Últimos 90 dias
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDays(365)}>
                  Último ano
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                getSecurityLogsAction.execute({ days, limit: 100 })
              }
              disabled={getSecurityLogsAction.isExecuting}
            >
              <RefreshCwIcon
                className={`mr-2 h-4 w-4 ${getSecurityLogsAction.isExecuting ? "animate-spin" : ""}`}
              />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="rounded-lg bg-blue-100 p-2">
                  <ShieldIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total de Logs
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {logs.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="rounded-lg bg-green-100 p-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Sucessos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {logs.filter((log) => log.success).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="rounded-lg bg-red-100 p-2">
                  <XCircleIcon className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Falhas</p>
                  <p className="text-2xl font-bold text-red-600">
                    {logs.filter((log) => !log.success).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="rounded-lg bg-orange-100 p-2">
                  <AlertTriangleIcon className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Logins Falharam
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {logs.filter((log) => log.type === "failed_login").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Atividades Registradas</CardTitle>
            <CardDescription>
              Lista detalhada de todas as atividades de segurança
            </CardDescription>
          </CardHeader>
          <CardContent>
            {getSecurityLogsAction.isExecuting ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <RefreshCwIcon className="mx-auto mb-2 h-8 w-8 animate-spin text-gray-400" />
                  <p className="text-gray-500">Carregando logs...</p>
                </div>
              </div>
            ) : logs.length === 0 ? (
              <div className="py-8 text-center">
                <ShieldIcon className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  Nenhum log encontrado
                </h3>
                <p className="text-gray-500">
                  Não há registros de atividade para o período selecionado.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      {getLogTypeIcon(log.type, log.success)}
                      <div className="flex-1">
                        <div className="mb-1 flex items-center space-x-2">
                          <Badge className={getLogTypeColor(log.type)}>
                            {getLogTypeLabel(log.type)}
                          </Badge>
                          {log.user && (
                            <span className="text-sm text-gray-600">
                              por {log.user.name}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {log.action}
                        </p>
                        {log.ipAddress && (
                          <p className="text-xs text-gray-500">
                            IP: {log.ipAddress}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {dayjs(log.createdAt).format("DD/MM/YYYY HH:mm")}
                      </p>
                      <p className="text-xs text-gray-500">
                        {dayjs(log.createdAt).fromNow()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default SecurityLogsPage;
