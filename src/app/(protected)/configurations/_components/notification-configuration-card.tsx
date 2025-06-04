"use client";

import { BellIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const NotificationConfigurationCard = () => {
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
          Configure as notificações automáticas do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="rounded-lg border border-yellow-200 bg-white p-4">
            <p className="text-sm text-gray-600">
              As notificações são enviadas automaticamente via Resend quando configurado.
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Configure o Resend na seção de Email acima para ativar as notificações.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
