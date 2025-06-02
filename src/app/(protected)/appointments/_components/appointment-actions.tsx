"use client";

import { MoreHorizontal } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { doctorsTable, patientsTable } from "@/db/schema";

import DeleteAppointmentDialog from "./delete-appointment-dialog";
import { Appointment } from "./table-columns";
import UpdateAppointmentStatusForm from "./update-appointment-status-form";
import UpsertAppointmentForm from "./upsert-appointment-form";

interface AppointmentActionsProps {
  appointment: Appointment;
  patients: (typeof patientsTable.$inferSelect)[];
  doctors: (typeof doctorsTable.$inferSelect)[];
  onSuccess?: () => void;
}

export function AppointmentActions({
  appointment,
  patients,
  doctors,
  onSuccess,
}: AppointmentActionsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted flex h-8 w-8 p-0"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsStatusDialogOpen(true)}>
            Atualizar Status
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)}>
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <UpsertAppointmentForm
          isOpen={isEditDialogOpen}
          patients={patients}
          doctors={doctors}
          appointment={appointment}
          onSuccess={() => {
            setIsEditDialogOpen(false);
            onSuccess?.();
          }}
        />
      </Dialog>

      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <UpdateAppointmentStatusForm
          appointment={appointment}
          onSuccess={() => {
            setIsStatusDialogOpen(false);
            onSuccess?.();
          }}
        />
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DeleteAppointmentDialog
          appointment={appointment}
          onSuccess={() => {
            setIsDeleteDialogOpen(false);
            onSuccess?.();
          }}
        />
      </Dialog>
    </>
  );
}
