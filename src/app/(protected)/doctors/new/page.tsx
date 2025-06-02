import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";

import UpsertDoctorForm from "../_components/upsert-doctor-form";

const NewDoctorPage = () => {
  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header com botão de voltar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/doctors">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeftIcon className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Adicionar Novo Médico
              </h1>
              <p className="text-gray-600">
                Preencha as informações para adicionar um novo médico à clínica
              </p>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div className="mx-auto max-w-4xl">
          <UpsertDoctorForm isFullPage />
        </div>
      </div>
    </PageContainer>
  );
};

export default NewDoctorPage;
