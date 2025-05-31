import { and, eq, ilike } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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
import { doctorsTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import AddDoctorButton from "./_components/add-doctor-button";
import DoctorCard from "./_components/doctor-card";

interface DoctorsPageProps {
  searchParams: { q?: string };
}

const DoctorsPage = async ({ searchParams }: DoctorsPageProps) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/authentication");
  }
  if (!session.user.clinic) {
    redirect("/clinic-form");
  }

  const searchQuery = searchParams.q?.trim();

  const whereConditions = [eq(doctorsTable.clinicId, session.user.clinic.id)];

  if (searchQuery) {
    whereConditions.push(ilike(doctorsTable.name, `%${searchQuery}%`));
  }

  const doctors = await db.query.doctorsTable.findMany({
    where: and(...whereConditions),
  });

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Médicos</PageTitle>
          <PageDescription>Gerencie os médicos da sua clínica</PageDescription>
        </PageHeaderContent>
        <PageActions>
          <SearchInput placeholder="Buscar médico..." className="mr-2 w-64" />
          <AddDoctorButton />
        </PageActions>
      </PageHeader>
      <PageContent>
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      </PageContent>
    </PageContainer>
  );
};

export default DoctorsPage;
