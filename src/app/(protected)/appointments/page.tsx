import { and, eq, ilike,or } from "drizzle-orm";
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
import { appointmentsTable, doctorsTable, patientsTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import AddAppointmentButton from "./_components/add-appointment-button";
import { AppointmentsTable } from "./_components/table-columns";

interface AppointmentsPageProps {
  searchParams: Promise<{ q?: string }>;
}

const AppointmentsPage = async ({ searchParams }: AppointmentsPageProps) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/authentication");
  }
  if (!session.user.clinic) {
    redirect("/clinic-form");
  }

  // Aguardar os searchParams antes de usá-los
  const { q } = await searchParams;
  const searchQuery = q?.trim() || "";

  const patients = await db.query.patientsTable.findMany({
    where: eq(patientsTable.clinicId, session.user.clinic.id),
  });

  const doctors = await db.query.doctorsTable.findMany({
    where: eq(doctorsTable.clinicId, session.user.clinic.id),
  });

  // Base query conditions
  let appointmentsQuery = db.query.appointmentsTable.findMany({
    where: eq(appointmentsTable.clinicId, session.user.clinic.id),
    with: {
      patient: true,
      doctor: true,
    },
    orderBy: (appointments) => [appointments.date],
  });

  // If search query is provided, find matching patient and doctor IDs first
  if (searchQuery) {
    // Get patients matching the search query
    const matchingPatients = await db.query.patientsTable.findMany({
      where: and(
        eq(patientsTable.clinicId, session.user.clinic.id),
        ilike(patientsTable.name, `%${searchQuery}%`),
      ),
      columns: { id: true },
    });

    // Get doctors matching the search query
    const matchingDoctors = await db.query.doctorsTable.findMany({
      where: and(
        eq(doctorsTable.clinicId, session.user.clinic.id),
        ilike(doctorsTable.name, `%${searchQuery}%`),
      ),
      columns: { id: true },
    });

    // Extract IDs
    const patientIds = matchingPatients.map((p) => p.id);
    const doctorIds = matchingDoctors.map((d) => d.id);

    // If we have matching patients or doctors, filter appointments
    if (patientIds.length > 0 || doctorIds.length > 0) {
      const conditions = [];

      if (patientIds.length > 0) {
        conditions.push(
          patientIds.map((id) => eq(appointmentsTable.patientId, id)),
        );
      }

      if (doctorIds.length > 0) {
        conditions.push(
          doctorIds.map((id) => eq(appointmentsTable.doctorId, id)),
        );
      }

      // Get appointments with matching patient or doctor
      appointmentsQuery = db.query.appointmentsTable.findMany({
        where: and(
          eq(appointmentsTable.clinicId, session.user.clinic.id),
          or(...conditions.flat()),
        ),
        with: {
          patient: true,
          doctor: true,
        },
        orderBy: (appointments) => [appointments.date],
      });
    }
  }

  const appointments = await appointmentsQuery;

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Agendamentos</PageTitle>
          <PageDescription>
            Acesse o detalhamento completo dos seus agendamentos
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <SearchInput
            placeholder="Buscar por médico ou paciente..."
            className="mr-2 w-80"
          />
          <AddAppointmentButton patients={patients} doctors={doctors} />
        </PageActions>
      </PageHeader>
      <PageContent>
        <div className="w-full overflow-hidden">
          <AppointmentsTable
            data={appointments}
            patients={patients}
            doctors={doctors}
          />
        </div>
      </PageContent>
    </PageContainer>
  );
};

export default AppointmentsPage;
