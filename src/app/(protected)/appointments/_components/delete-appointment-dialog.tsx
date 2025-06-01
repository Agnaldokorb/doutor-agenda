"use client";

import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { deleteAppointment } from "@/actions/delete-appointment";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Appointment } from "./table-columns";

interface DeleteAppointmentDialogProps {
  appointment: Appointment;
  onSuccess?: () => void;
}

const DeleteAppointmentDialog = ({
  appointment,
  onSuccess,
}: DeleteAppointmentDialogProps) => {
  const deleteAppointmentAction = useAction(deleteAppointment, {
    onSuccess: () => {
      toast.success("Agendamento excluído com sucesso!");
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Erro:", error);

      // Verifica se há um erro do servidor
      if (error.error?.serverError) {
        toast.error(error.error.serverError);
        return;
      }

      // Mensagem genérica se nenhum erro específico for encontrado
      toast.error("Erro ao excluir agendamento.");
    },
  });

  const handleDelete = () => {
    deleteAppointmentAction.execute({ id: appointment.id });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Excluir Agendamento</DialogTitle>
        <DialogDescription>
          Tem certeza que deseja excluir este agendamento? Esta ação não pode
          ser desfeita.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button variant="destructive" onClick={handleDelete}>
          Excluir
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default DeleteAppointmentDialog;
