"use client";

import { Edit, RefreshCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { doctorsTable, patientsTable } from "@/db/schema";

import DeleteAppointmentDialog from "./delete-appointment-dialog";
import { Appointment } from "./table-columns";
import UpdateAppointmentStatusForm from "./update-appointment-status-form";
import UpsertAppointmentForm from "./upsert-appointment-form";

interface AppointmentActionsProps {
  appointment: Appointment;
  patients: (typeof patientsTable.$inferSelect)[];
  doctors: (typeof doctorsTable.$inferSelect)[];
}

export function AppointmentActions({
  appointment,
  patients,
  doctors,
}: AppointmentActionsProps) {
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {/* Botão Editar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Editar agendamento</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Editar agendamento</p>
          </TooltipContent>
        </Tooltip>

        {/* Botão Atualizar Status */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
              onClick={() => setIsStatusDialogOpen(true)}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="sr-only">Atualizar status</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Atualizar status</p>
          </TooltipContent>
        </Tooltip>

        {/* Botão Excluir */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Excluir agendamento</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Excluir agendamento</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Dialogs */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <UpsertAppointmentForm
          isOpen={isEditDialogOpen}
          patients={patients}
          doctors={doctors}
          appointment={appointment}
          onSuccess={() => {
            setIsEditDialogOpen(false);
            handleSuccess();
          }}
        />
      </Dialog>

      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <UpdateAppointmentStatusForm
          appointment={appointment}
          onSuccess={() => {
            setIsStatusDialogOpen(false);
            handleSuccess();
          }}
        />
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DeleteAppointmentDialog
          appointment={appointment}
          onSuccess={() => {
            setIsDeleteDialogOpen(false);
            handleSuccess();
          }}
        />
      </Dialog>
    </TooltipProvider>
  );
}
