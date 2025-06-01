"use client";

import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { updateAppointmentStatus } from "@/actions/update-appointment-status";
import { AppointmentStatus } from "@/actions/update-appointment-status/types";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Appointment } from "./table-columns";

interface UpdateAppointmentStatusFormProps {
  appointment: Appointment;
  onSuccess?: () => void;
}

const statusOptions: {
  value: AppointmentStatus;
  label: string;
  color: string;
}[] = [
  { value: "agendado", label: "Agendado", color: "text-blue-500" },
  { value: "confirmado", label: "Confirmado", color: "text-emerald-500" },
  { value: "cancelado", label: "Cancelado", color: "text-red-500" },
  { value: "concluido", label: "Concluído", color: "text-purple-500" },
];

const UpdateAppointmentStatusForm = ({
  appointment,
  onSuccess,
}: UpdateAppointmentStatusFormProps) => {
  const [status, setStatus] = useState<AppointmentStatus>(
    (appointment.status as AppointmentStatus) || "agendado",
  );

  const updateStatusAction = useAction(updateAppointmentStatus, {
    onSuccess: () => {
      toast.success("Status do agendamento atualizado com sucesso!");
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
      toast.error("Erro ao atualizar status do agendamento.");
    },
  });

  const handleSubmit = () => {
    updateStatusAction.execute({
      id: appointment.id,
      status,
    });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Atualizar Status</DialogTitle>
        <DialogDescription>
          Altere o status do agendamento para o paciente{" "}
          {appointment.patient.name}.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as AppointmentStatus)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className={option.color}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit}>Salvar</Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default UpdateAppointmentStatusForm;
