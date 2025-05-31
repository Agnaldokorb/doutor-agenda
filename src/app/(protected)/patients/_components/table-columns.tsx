"use client";

import { ColumnDef } from "@tanstack/react-table";
import { EditIcon, MoreVerticalIcon, TrashIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { patientsTable } from "@/db/schema";

type Patient = typeof patientsTable.$inferSelect;

export const patientsTableColumns: ColumnDef<Patient>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Nome",
    cell: ({ row }) => (
      <div className="max-w-[300px]">{row.getValue("name")}</div>
    ),
  },
  {
    id: "email",
    accessorKey: "email",
    header: "E-mail",
    cell: ({ row }) => (
      <div className="max-w-[250px]">{row.getValue("email")}</div>
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
        return <div className="max-w-[150px]">{`(${ddd}) ${firstPart}-${secondPart}`}</div>;
      } else if (phoneNumber.length === 10) {
        // Formato: (00) 0000-0000
        const firstPart = phoneNumber.substring(2, 6);
        const secondPart = phoneNumber.substring(6);
        return <div className="max-w-[150px]">{`(${ddd}) ${firstPart}-${secondPart}`}</div>;
      }
      
      // Se não for em nenhum dos formatos esperados, retorna sem formatação
      return <div className="max-w-[150px]">{phoneNumber}</div>;
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
    cell: (params) => {
        const patient = params.row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="icon">
              <MoreVerticalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
          <DropdownMenuLabel>
            {patient.name}
          </DropdownMenuLabel> 
          <DropdownMenuSeparator />
            <DropdownMenuItem>
                <EditIcon />
                Editar
            </DropdownMenuItem>
            <DropdownMenuItem>
                <TrashIcon />
                Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
