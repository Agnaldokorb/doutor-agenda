"use client";

import { BellIcon, LoaderIcon, MailIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useEffect, useState } from "react";

import { checkEmailStatus } from "@/actions/check-email-status";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface EmailStatus {
  emailService: boolean;
  reminderService: boolean;
  message: string;
  details?: unknown;
}

export const NotificationConfigurationCard = () => {
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);

  const { execute: executeCheckStatus, isExecuting: isChecking } = useAction(
    checkEmailStatus,
    {
      onSuccess: ({ data }) => {
        if (data) {
          setEmailStatus(data);
        }
      },
      onError: ({ error }) => {
        console.error("Erro ao verificar status:", error);
        setEmailStatus({
          emailService: false,
          reminderService: false,
          message: "Erro ao verificar status do serviço",
        });
      },
    },
  );

  // Função para verificar status
  const checkStatus = useCallback(() => {
    executeCheckStatus();
  }, [executeCheckStatus]);

  // Verificar status quando o componente carregar
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Função para determinar a cor do badge
  const getBadgeVariant = (isActive: boolean) => {
    return isActive ? "default" : "destructive";
  };

  // Função para determinar o texto do status
  const getStatusText = (isActive: boolean) => {
    return isActive ? "Ativo" : "Inativo";
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <BellIcon className="h-5 w-5 text-yellow-600" />
          <CardTitle className="text-yellow-900">
            Configurações de Notificações
          </CardTitle>
        </div>
        <CardDescription className="text-yellow-700">
          Configure alertas e notificações do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status das Notificações */}
          <div className="rounded-lg border border-yellow-200 bg-white p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MailIcon className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-900">
                    Email de agendamentos
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {isChecking && (
                    <LoaderIcon className="h-4 w-4 animate-spin text-gray-400" />
                  )}
                  <Badge
                    variant={getBadgeVariant(
                      emailStatus?.emailService ?? false,
                    )}
                    className={
                      emailStatus?.emailService
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-red-500 hover:bg-red-600"
                    }
                  >
                    {getStatusText(emailStatus?.emailService ?? false)}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BellIcon className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-900">
                    Lembrete de consultas
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {isChecking && (
                    <LoaderIcon className="h-4 w-4 animate-spin text-gray-400" />
                  )}
                  <Badge
                    variant={getBadgeVariant(
                      emailStatus?.reminderService ?? false,
                    )}
                    className={
                      emailStatus?.reminderService
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-red-500 hover:bg-red-600"
                    }
                  >
                    {getStatusText(emailStatus?.reminderService ?? false)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Mensagem de status */}
            {emailStatus && (
              <div className="mt-3 border-t border-gray-200 pt-3">
                <p
                  className={`text-xs ${
                    emailStatus.emailService && emailStatus.reminderService
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  {emailStatus.message}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
