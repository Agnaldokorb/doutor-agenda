import { eq } from "drizzle-orm";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";
import { db } from "@/db";
import { doctorsTable } from "@/db/schema";

import UpsertDoctorForm from "../../_components/upsert-doctor-form";

interface EditDoctorPageProps {
  params: Promise<{ id: string }>;
}

const EditDoctorPage = async ({ params }: EditDoctorPageProps) => {
  const { id } = await params;

  // Buscar o médico no banco de dados
  const doctor = await db.query.doctorsTable.findFirst({
    where: eq(doctorsTable.id, id),
  });

  if (!doctor) {
    notFound();
  }

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
                Editar Médico: {doctor.name}
              </h1>
              <p className="text-gray-600">Atualize as informações do médico</p>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div className="mx-auto max-w-4xl">
          <UpsertDoctorForm doctor={doctor} isFullPage />
        </div>
      </div>
    </PageContainer>
  );
};

export default EditDoctorPage;
