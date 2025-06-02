"use client";

import {
  CalendarIcon,
  ClockIcon,
  DollarSignIcon,
  EditIcon,
  TrashIcon,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { toast } from "sonner";

import { deleteDoctor } from "@/actions/delete-doctor";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { doctorsTable } from "@/db/schema";
import { formatCurrencyInCents } from "@/helpers/currency";

import { getAvailability } from "../_helpers/availability";

interface DoctorCardProps {
  doctor: typeof doctorsTable.$inferSelect;
}

const DoctorCard = ({ doctor }: DoctorCardProps) => {
  const deleteDoctorAction = useAction(deleteDoctor, {
    onSuccess: () => {
      toast.success("Médico deletado com sucesso.");
    },
    onError: (error) => {
      console.error("Erro:", error);

      // Verifica se há um erro do servidor
      if (error.error?.serverError) {
        toast.error(error.error.serverError);
        return;
      }

      // Mensagem genérica se nenhum erro específico for encontrado
      toast.error("Erro ao deletar médico.");
    },
  });

  const handleDeleteDoctorClick = () => {
    if (!doctor) return;
    deleteDoctorAction.execute({ id: doctor.id });
  };

  const doctorInitials = doctor.name
    .split(" ")
    .map((name) => name[0])
    .join("");

  const availability = getAvailability(doctor);

  // Obter resumo dos dias de atendimento
  const openDays = availability.schedule.filter((day) => day.isOpen);
  const getScheduleSummary = () => {
    if (openDays.length === 0) {
      return "Nenhum dia configurado";
    }

    if (openDays.length === 7) {
      return "Todos os dias";
    }

    if (openDays.length <= 3) {
      return openDays.map((day) => day.dayName).join(", ");
    }

    return `${openDays.length} dias por semana`;
  };

  // Obter horário mais comum ou primeiro horário
  const getMainSchedule = () => {
    if (openDays.length === 0) {
      return "Não configurado";
    }

    const firstDay = openDays[0];
    return `${firstDay.startTime} às ${firstDay.endTime}`;
  };

  return (
    <Card className="transition-shadow duration-200 hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10">
            {doctor.avatarImageUrl && (
              <AvatarImage
                src={doctor.avatarImageUrl}
                alt={`Foto de ${doctor.name}`}
              />
            )}
            <AvatarFallback>{doctorInitials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-medium">{doctor.name}</h3>
            <p className="text-muted-foreground truncate text-sm">
              {doctor.specialty}
            </p>
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-3">
        {/* Badge de dias de atendimento */}
        <div className="flex items-start gap-2">
          <CalendarIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">
              Dias de atendimento
            </p>
            <p className="text-xs text-gray-600">{getScheduleSummary()}</p>
          </div>
        </div>

        {/* Badge de horários */}
        <div className="flex items-start gap-2">
          <ClockIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">Horários</p>
            <p className="text-xs text-gray-600">{getMainSchedule()}</p>
            {availability.hasBusinessHours && openDays.length > 1 && (
              <p className="text-xs text-gray-500 italic">+ outros horários</p>
            )}
          </div>
        </div>

        {/* Badge de preço */}
        <div className="flex items-start gap-2">
          <DollarSignIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">
              Valor da consulta
            </p>
            <p className="text-xs text-gray-600">
              {formatCurrencyInCents(doctor.appointmentPriceInCents)}
            </p>
          </div>
        </div>

        {/* Status do sistema de horários */}
        <div className="pt-2">
          <Badge
            variant={availability.hasBusinessHours ? "default" : "secondary"}
            className="text-xs"
          >
            {availability.hasBusinessHours ? (
              <>
                <div className="mr-1.5 h-2 w-2 rounded-full bg-green-500"></div>
                Horários avançados
              </>
            ) : (
              <>
                <div className="mr-1.5 h-2 w-2 rounded-full bg-gray-400"></div>
                Sistema legado
              </>
            )}
          </Badge>
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="flex flex-col gap-2">
        <Link href={`/doctors/${doctor.id}/edit`} className="w-full">
          <Button className="w-full gap-2">
            <EditIcon className="h-4 w-4" />
            Editar médico
          </Button>
        </Link>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full gap-2">
              <TrashIcon className="h-4 w-4" />
              Deletar médico
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Tem certeza que deseja deletar esse médico?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Essa ação não pode ser revertida. Isso irá deletar o médico, seu
                usuário de acesso (se existir) e todas as consultas agendadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteDoctorClick}
                disabled={deleteDoctorAction.isExecuting}
              >
                {deleteDoctorAction.isExecuting ? "Deletando..." : "Deletar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
};

export default DoctorCard;
