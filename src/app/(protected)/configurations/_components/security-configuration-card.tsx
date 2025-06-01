"use client";

import { ShieldIcon, LockIcon, EyeIcon, AlertTriangleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const SecurityConfigurationCard = () => {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <ShieldIcon className="h-5 w-5 text-red-600" />
          <CardTitle className="text-red-900">
            Configurações de Segurança
          </CardTitle>
        </div>
        <CardDescription className="text-red-700">
          Gerencie aspectos de segurança e autenticação
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="rounded-lg border border-red-200 bg-white p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <LockIcon className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-gray-900">
                    Sessões ativas
                  </span>
                </div>
                <span className="text-sm font-medium text-red-600">
                  3 usuários
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <EyeIcon className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-gray-900">
                    Logs de acesso
                  </span>
                </div>
                <span className="text-sm font-medium text-red-600">
                  157 entradas
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-100"
            >
              Ver Logs
            </Button>
            <Button
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-100"
            >
              Configurar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
