import { and, eq, ilike } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { DataTable } from "@/components/ui/data-table";
import {
  PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { SearchInput } from "@/components/ui/search-input";
import { db } from "@/db";
import { patientsTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import AddPatientButton from "./_components/add-patient-button";
import { patientsTableColumns } from "./_components/table-columns";

interface PatientsPageProps {
  searchParams: Promise<{ q?: string }>;
}

const PatientsPage = async ({ searchParams }: PatientsPageProps) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/authentication");
  }
  if (!session.user.clinic) {
    redirect("/clinic-form");
  }

  const { q } = await searchParams;
  const searchQuery = q?.trim() || "";

  const whereConditions = [eq(patientsTable.clinicId, session.user.clinic.id)];

  if (searchQuery) {
    whereConditions.push(ilike(patientsTable.name, `%${searchQuery}%`));
  }

  const patients = await db.query.patientsTable.findMany({
    where: and(...whereConditions),
  });

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Pacientes</PageTitle>
          <PageDescription>
            Gerencie os pacientes da sua clínica
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <SearchInput placeholder="Buscar paciente..." className="mr-2 w-64" />
          <AddPatientButton />
        </PageActions>
      </PageHeader>
      <PageContent>
        <div className="w-full overflow-hidden">
          <DataTable data={patients} columns={patientsTableColumns} />
        </div>
      </PageContent>
    </PageContainer>
  );
};

export default PatientsPage;
