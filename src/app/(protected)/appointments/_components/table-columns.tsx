"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { CheckCircle, ClipboardCheck, XCircle } from "lucide-react";

import { AppointmentStatus } from "@/actions/update-appointment-status/types";
import { DataTable } from "@/components/ui/data-table";
import {
  appointmentsTable,
  doctorsTable,
  healthInsurancePlansTable,
  patientsTable,
} from "@/db/schema";
import { formatCurrencyInCents } from "@/helpers/currency";
import { convertUTCToUTCMinus3 } from "@/helpers/timezone";

import { AppointmentActions } from "./appointment-actions";

export type Appointment = typeof appointmentsTable.$inferSelect & {
  patient: typeof patientsTable.$inferSelect;
  doctor: typeof doctorsTable.$inferSelect;
  healthInsurancePlan?: typeof healthInsurancePlansTable.$inferSelect | null;
};

// Função para obter o ícone e cor do status
const getStatusDisplay = (status: AppointmentStatus) => {
  switch (status) {
    case "agendado":
      return {
        icon: <ClipboardCheck className="mr-2 h-4 w-4 text-blue-500" />,
        text: "Agendado",
        color: "text-blue-500",
      };
    case "confirmado":
      return {
        icon: <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />,
        text: "Confirmado",
        color: "text-emerald-500",
      };
    case "cancelado":
      return {
        icon: <XCircle className="mr-2 h-4 w-4 text-red-500" />,
        text: "Cancelado",
        color: "text-red-500",
      };
    case "concluido":
      return {
        icon: <CheckCircle className="mr-2 h-4 w-4 text-purple-500" />,
        text: "Concluído",
        color: "text-purple-500",
      };
    default:
      return {
        icon: <ClipboardCheck className="mr-2 h-4 w-4 text-blue-500" />,
        text: "Agendado",
        color: "text-blue-500",
      };
  }
};

// Este componente cliente adiciona ações interativas às colunas
export function AppointmentsTable({
  data,
  patients,
  doctors,
}: {
  data: Appointment[];
  patients: (typeof patientsTable.$inferSelect)[];
  doctors: (typeof doctorsTable.$inferSelect)[];
}) {
  const columns: ColumnDef<Appointment>[] = [
    {
      id: "patient",
      header: "PACIENTE",
      cell: ({ row }) => {
        const appointment = row.original;
        return <div className="font-medium">{appointment.patient.name}</div>;
      },
    },
    {
      id: "date",
      header: "DATA",
      cell: ({ row }) => {
        const appointment = row.original;
        // Converter UTC para UTC-3 para exibição
        const utcDate = new Date(appointment.date);
        const localDate = convertUTCToUTCMinus3(utcDate);
        return (
          <div className="whitespace-nowrap">
            {format(localDate, "dd/MM/yy, HH:mm")}
          </div>
        );
      },
    },
    {
      id: "doctor",
      header: "MÉDICO",
      cell: ({ row }) => {
        const appointment = row.original;
        return <div>{appointment.doctor.name}</div>;
      },
    },
    {
      id: "specialty",
      header: "ESPECIALIDADE",
      cell: ({ row }) => {
        const appointment = row.original;
        return <div>{appointment.doctor.specialty}</div>;
      },
    },
    {
      id: "healthInsurance",
      header: "PLANO DE SAÚDE",
      cell: ({ row }) => {
        const appointment = row.original;
        return (
          <div className="whitespace-nowrap">
            {appointment.healthInsurancePlan?.name || "Particular"}
          </div>
        );
      },
    },
    {
      id: "price",
      header: "VALOR",
      cell: ({ row }) => {
        const appointment = row.original;
        // Se tem plano de saúde, mostrar valor do plano
        // Se não tem plano (particular), mostrar valor do médico
        const valueInCents = appointment.healthInsurancePlan
          ? appointment.healthInsurancePlan.reimbursementValueInCents
          : appointment.doctor.appointmentPriceInCents;

        return (
          <div className="whitespace-nowrap">
            {formatCurrencyInCents(valueInCents)}
          </div>
        );
      },
    },
    {
      id: "status",
      header: "STATUS",
      cell: ({ row }) => {
        const appointment = row.original;
        // Tratamento para agendamentos que podem não ter status ainda (dados antigos)
        const status = appointment.status || "agendado";
        const { icon, text, color } = getStatusDisplay(
          status as AppointmentStatus,
        );

        return (
          <div className={`flex items-center ${color}`}>
            {icon}
            <span>{text}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const appointment = row.original;
        return (
          <AppointmentActions
            appointment={appointment}
            patients={patients}
            doctors={doctors}
          />
        );
      },
    },
  ];

  return (
    <div className="w-full max-w-full overflow-x-auto rounded-md bg-white shadow">
      <DataTable data={data} columns={columns} />
    </div>
  );
}
