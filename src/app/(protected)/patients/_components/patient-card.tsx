"use client";

import { MailIcon, PhoneIcon, UserIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { deletePatient } from "@/actions/delete-patient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { patientsTable } from "@/db/schema";

import UpsertPatientForm from "./upsert-patient-form";

interface PatientCardProps {
  patient: typeof patientsTable.$inferSelect;
}

const PatientCard = ({ patient }: PatientCardProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const deletePatientAction = useAction(deletePatient, {
    onSuccess: () => {
      toast.success("Paciente excluído com sucesso.");
    },
    onError: () => {
      toast.error("Erro ao excluir paciente.");
    },
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-primary/5 pb-2">
        <div className="flex items-center gap-2">
          <UserIcon className="h-5 w-5" />
          <h3 className="font-semibold">{patient.name}</h3>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MailIcon className="text-muted-foreground h-4 w-4" />
            <span className="text-sm">{patient.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <PhoneIcon className="text-muted-foreground h-4 w-4" />
            <span className="text-sm">{patient.phone_number}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Sexo:</span>
            <span className="text-sm">
              {patient.sex === "male" ? "Masculino" : "Feminino"}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/20 flex justify-end gap-2 border-t p-2">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button className="text-primary text-xs hover:underline">
              Editar
            </button>
          </DialogTrigger>
          <UpsertPatientForm
            patient={patient}
            onSuccess={() => {
              setIsDialogOpen(false);
              toast.success("Paciente atualizado com sucesso.");
            }}
            isOpen={isDialogOpen}
          />
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="text-destructive text-xs hover:underline">
              Excluir
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir paciente</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este paciente? Esta ação não pode
                ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletePatientAction.execute({ id: patient.id })}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletePatientAction.isPending ? "Excluindo..." : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
};

export default PatientCard;
