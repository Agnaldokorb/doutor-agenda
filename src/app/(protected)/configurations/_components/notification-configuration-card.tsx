"use client";

import {
  BellIcon,
  MailIcon,
  MessageSquareIcon,
  ToggleLeftIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
          Configure alertas e notificações do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="rounded-lg border border-yellow-200 bg-white p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MailIcon className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-900">
                    Email de agendamentos
                  </span>
                </div>
                <span className="text-sm font-medium text-green-600">
                  Ativo
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BellIcon className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-900">
                    Lembrete de consultas
                  </span>
                </div>
                <span className="text-sm font-medium text-green-600">
                  Ativo
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="border-yellow-200 text-yellow-700 hover:bg-yellow-100"
            >
              Configurar
            </Button>
            <Button
              variant="outline"
              className="border-yellow-200 text-yellow-700 hover:bg-yellow-100"
            >
              Templates
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
