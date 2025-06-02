"use client";

import {
  BuildingIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EditIcon,
  LoaderIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

import { ClinicConfigurationForm } from "./clinic-configuration-form";

interface Clinic {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  website?: string;
  description?: string | null;
}

// Função para formatar telefone brasileiro
const formatPhoneNumber = (phone: string) => {
  if (!phone) return "";

  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, "");

  // Formatar telefone brasileiro (11) 99999-9999
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }

  // Formatar telefone com 10 dígitos (11) 9999-9999
  if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  // Se não tiver o formato esperado, retorna como está
  return phone;
};

export const ClinicConfigurationCard = () => {
  const [showForm, setShowForm] = useState(false);
  const [clinicData, setClinicData] = useState<Clinic | null>(null);
  const [isLoadingClinic, setIsLoadingClinic] = useState(true);
  const session = authClient.useSession();

  // Carregar dados da clínica ao montar componente
  useEffect(() => {
    const fetchClinicData = async () => {
      try {
        const response = await fetch("/api/clinic");
        if (response.ok) {
          const data = await response.json();
          if (data?.clinic) {
            setClinicData(data.clinic as Clinic);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados da clínica:", error);
        // Fallback para dados da sessão se houver erro
        setClinicData((session.data?.user?.clinic as Clinic) || null);
      } finally {
        setIsLoadingClinic(false);
      }
    };

    fetchClinicData();
  }, [session.data?.user?.clinic]);

  const handleCloseForm = () => {
    setShowForm(false);
    // Recarregar dados da clínica após salvar
    const fetchClinicData = async () => {
      try {
        const response = await fetch("/api/clinic");
        if (response.ok) {
          const data = await response.json();
          if (data?.clinic) {
            setClinicData(data.clinic as Clinic);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados da clínica:", error);
      }
    };

    fetchClinicData();
  };

  const clinic = clinicData || (session.data?.user?.clinic as Clinic);

  if (isLoadingClinic) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <BuildingIcon className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-900">
              Configurações da Clínica
            </CardTitle>
          </div>
          <CardDescription className="text-blue-700">
            Gerencie informações básicas e configurações da clínica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <LoaderIcon className="mx-auto h-6 w-6 animate-spin text-blue-600" />
              <p className="mt-2 text-sm text-gray-600">
                Carregando configurações...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
            onClick={() => setShowForm(!showForm)}
            className="border-blue-200 text-blue-700 hover:bg-blue-100"
          >
            <EditIcon className="mr-1 h-3 w-3" />
            {showForm ? "Ocultar" : "Editar"}
            {showForm ? (
              <ChevronUpIcon className="ml-1 h-3 w-3" />
            ) : (
              <ChevronDownIcon className="ml-1 h-3 w-3" />
            )}
          </Button>
        </div>
        <CardDescription className="text-blue-700">
          Gerencie informações básicas e configurações da clínica
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!showForm ? (
          <div className="space-y-4">
            {/* Status/Resumo da Clínica */}
            <div className="rounded-lg border border-blue-200 bg-white p-4">
              <h4 className="mb-3 font-semibold text-blue-900">
                Informações Básicas
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Nome da clínica:
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {clinic?.name || "Não configurado"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className="text-sm font-medium text-green-600">
                    ✅ Ativa
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Configuração:</span>
                  <span className="text-sm font-medium text-green-600">
                    {clinic?.name ? "✅ Configurada" : "⚠️ Pendente"}
                  </span>
                </div>
              </div>
            </div>

            {/* Informações de Contato */}
            <div className="rounded-lg border border-blue-200 bg-white p-4">
              <h4 className="mb-3 font-semibold text-blue-900">
                Informações de Contato
              </h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>📧 Email: {clinic?.email || "Não configurado"}</p>
                <p>
                  📞 Telefone:{" "}
                  {clinic?.phone
                    ? formatPhoneNumber(clinic.phone)
                    : "Não configurado"}
                </p>
                <p>
                  📍 Endereço:{" "}
                  {clinic?.address
                    ? `${clinic.address}${clinic.city ? `, ${clinic.city}` : ""}${clinic.state ? ` - ${clinic.state}` : ""}`
                    : "Não configurado"}
                </p>
                <p>🌐 Website: {clinic?.website || "Não configurado"}</p>
              </div>
            </div>

            {/* Informações Adicionais */}
            {clinic?.description && (
              <div className="rounded-lg border border-blue-200 bg-white p-4">
                <h4 className="mb-3 font-semibold text-blue-900">Descrição</h4>
                <p className="text-sm text-gray-600">{clinic.description}</p>
              </div>
            )}

            {/* Chamada para Ação */}
            {(!clinic?.name || !clinic?.email || !clinic?.phone) && (
              <div className="rounded-lg border border-blue-200 bg-blue-100 p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Dica:</strong> Complete as informações da clínica
                  para melhorar a experiência dos pacientes e ter acesso a todas
                  as funcionalidades do sistema.
                </p>
                <Button
                  onClick={() => setShowForm(true)}
                  className="mt-3 bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  Configurar Agora
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6">
            <ClinicConfigurationForm onSuccess={handleCloseForm} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
