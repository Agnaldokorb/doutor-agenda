"use client";

import {
  CalendarIcon,
  ClockIcon,
  MailIcon,
  SettingsIcon,
  ToggleRightIcon,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export const SystemConfigurationCard = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SettingsIcon className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-purple-900">
              Configurações do Sistema
            </CardTitle>
          </div>
        </div>
        <CardDescription className="text-purple-700">
          Configure parâmetros gerais e funcionais do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Configurações de Agendamento */}
          <div className="rounded-lg border border-purple-200 bg-white p-4">
            <h4 className="mb-3 font-semibold text-purple-900">
              Configurações de Agendamento
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Duração da consulta
                    </p>
                    <p className="text-xs text-gray-500">
                      Tempo padrão por consulta
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium text-purple-600">
                  30 min
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Antecedência máxima
                    </p>
                    <p className="text-xs text-gray-500">
                      Dias máximos para agendamento
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium text-purple-600">
                  90 dias
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Cancelamento mínimo
                    </p>
                    <p className="text-xs text-gray-500">
                      Horas mínimas para cancelar
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium text-purple-600">24h</span>
              </div>
            </div>
          </div>

          {/* Configurações de Sistema */}
          <div className="rounded-lg border border-purple-200 bg-white p-4">
            <h4 className="mb-3 font-semibold text-purple-900">
              Configurações Gerais
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MailIcon className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Notificações por email
                    </p>
                    <p className="text-xs text-gray-500">
                      Enviar emails automáticos
                    </p>
                  </div>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <SettingsIcon className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Backup automático
                    </p>
                    <p className="text-xs text-gray-500">
                      Backup diário dos dados
                    </p>
                  </div>
                </div>
                <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ToggleRightIcon className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Modo manutenção
                    </p>
                    <p className="text-xs text-gray-500">
                      Desabilitar acesso temporariamente
                    </p>
                  </div>
                </div>
                <Switch
                  checked={maintenanceMode}
                  onCheckedChange={setMaintenanceMode}
                />
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="flex items-center space-x-2 border-purple-200 text-purple-700 hover:bg-purple-100"
            >
              <SettingsIcon className="h-4 w-4" />
              <span>Configurar</span>
            </Button>
            <Button
              variant="outline"
              className="flex items-center space-x-2 border-purple-200 text-purple-700 hover:bg-purple-100"
            >
              <ClockIcon className="h-4 w-4" />
              <span>Horários</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
