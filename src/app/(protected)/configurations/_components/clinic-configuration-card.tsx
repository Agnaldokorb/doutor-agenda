"use client";

import {
  BuildingIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  EditIcon,
  ExternalLinkIcon,
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
import { authClient } from "@/lib/auth-client";

export const ClinicConfigurationCard = () => {
  const [isEditing, setIsEditing] = useState(false);
  const session = authClient.useSession();
  const clinic = session.data?.user?.clinic;

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BuildingIcon className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-900">
              Configurações da Clínica
            </CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="border-blue-200 text-blue-700 hover:bg-blue-100"
          >
            <EditIcon className="mr-1 h-3 w-3" />
            Editar
          </Button>
        </div>
        <CardDescription className="text-blue-700">
          Gerencie informações básicas e configurações da clínica
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Informações da Clínica */}
          <div className="rounded-lg border border-blue-200 bg-white p-4">
            <h4 className="mb-3 font-semibold text-blue-900">
              Informações Básicas
            </h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <BuildingIcon className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {clinic?.name || "Nome da clínica não definido"}
                  </p>
                  <p className="text-xs text-gray-500">Nome da clínica</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <MapPinIcon className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Endereço da clínica
                  </p>
                  <p className="text-xs text-gray-500">
                    Rua, número, bairro, cidade
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <PhoneIcon className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    (11) 99999-9999
                  </p>
                  <p className="text-xs text-gray-500">Telefone de contato</p>
                </div>
              </div>
            </div>
          </div>

          {/* Horários de Funcionamento */}
          <div className="rounded-lg border border-blue-200 bg-white p-4">
            <h4 className="mb-3 font-semibold text-blue-900">
              Horários de Funcionamento
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-3 w-3 text-blue-600" />
                  <span className="text-sm text-gray-700">Segunda a Sexta</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  08:00 - 18:00
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-3 w-3 text-blue-600" />
                  <span className="text-sm text-gray-700">Sábado</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  08:00 - 12:00
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-3 w-3 text-blue-600" />
                  <span className="text-sm text-gray-700">Domingo</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  Fechado
                </span>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="flex items-center space-x-2 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              <EditIcon className="h-4 w-4" />
              <span>Editar Dados</span>
            </Button>
            <Button
              variant="outline"
              className="flex items-center space-x-2 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              <ExternalLinkIcon className="h-4 w-4" />
              <span>Configurações</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
