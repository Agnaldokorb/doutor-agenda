"use client";

import { ColumnDef } from "@tanstack/react-table";
import { EditIcon, MoreVerticalIcon, TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { patientsTable } from "@/db/schema";

import UpsertPatientForm from "./upsert-patient-form";

type Patient = typeof patientsTable.$inferSelect;

// Componente para as ações da tabela
const PatientActions = ({ patient }: { patient: Patient }) => {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const deletePatientAction = useAction(deletePatient, {
    onSuccess: () => {
      toast.success(`Paciente ${patient.name} excluído com sucesso.`);
      router.refresh();
    },
    onError: (error) => {
      toast.error(
        error.error?.serverError ||
          "Ocorreu um erro ao excluir o paciente. Tente novamente.",
      );
    },
  });

  const handleDelete = async () => {
    deletePatientAction.execute({ id: patient.id });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVerticalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>{patient.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setIsEditDialogOpen(true);
            }}
          >
            <EditIcon className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setIsDeleteDialogOpen(true);
                }}
              >
                <TrashIcon className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir o paciente {patient.name}? Esta
                  ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <UpsertPatientForm
          patient={patient}
          isOpen={isEditDialogOpen}
          onSuccess={() => {
            setIsEditDialogOpen(false);
            router.refresh();
          }}
        />
      </Dialog>
    </>
  );
};

export const patientsTableColumns: ColumnDef<Patient>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Nome",
    cell: ({ row }) => (
      <div className="max-w-[400px] truncate">{row.getValue("name")}</div>
    ),
  },
  {
    id: "email",
    accessorKey: "email",
    header: "E-mail",
    cell: ({ row }) => (
      <div className="max-w-[400px] truncate">{row.getValue("email")}</div>
    ),
  },
  {
    id: "phoneNumber",
    accessorKey: "phone_number",
    header: "Telefone",
    cell: ({ row }) => {
      const phoneNumber = row.getValue("phoneNumber") as string;
      if (!phoneNumber) return null;

      // Formatação do telefone
      const ddd = phoneNumber.substring(0, 2);

      // Verifica se o número tem 11 dígitos (com 9 na frente) ou 10 dígitos
      if (phoneNumber.length === 11) {
        // Formato: (00) 00000-0000
        const firstPart = phoneNumber.substring(2, 7);
        const secondPart = phoneNumber.substring(7);
        return (
          <div className="max-w-[200px]">{`(${ddd}) ${firstPart}-${secondPart}`}</div>
        );
      } else if (phoneNumber.length === 10) {
        // Formato: (00) 0000-0000
        const firstPart = phoneNumber.substring(2, 6);
        const secondPart = phoneNumber.substring(6);
        return (
          <div className="max-w-[200px]">{`(${ddd}) ${firstPart}-${secondPart}`}</div>
        );
      }

      // Se não for em nenhum dos formatos esperados, retorna sem formatação
      return <div className="max-w-[200px]">{phoneNumber}</div>;
    },
  },
  {
    id: "sex",
    accessorKey: "sex",
    header: "Sexo",
    cell: ({ row }) => {
      const patient = row.original;
      return patient.sex === "male" ? "Masculino" : "Feminino";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const patient = row.original;
      return <PatientActions patient={patient} />;
    },
  },
];
