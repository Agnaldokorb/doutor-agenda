"use client";

import "dayjs/locale/pt-br";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utcPlugin from "dayjs/plugin/utc";
import { and, eq, sql } from "drizzle-orm";
import { CalendarIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useMemo,useState } from "react";
import { useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";
import { z } from "zod";

import { upsertAppointment } from "@/actions/upsert-appointment";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from "@/db";
import { appointmentsTable,doctorsTable, patientsTable } from "@/db/schema";
import { cn } from "@/lib/utils";

import { Appointment } from ".//table-columns";

// Estender dayjs com os plugins necessários
dayjs.extend(utcPlugin);
dayjs.extend(timezonePlugin);
dayjs.locale("pt-br");

const formSchema = z.object({
  patientId: z.string().uuid({
    message: "Selecione um paciente.",
  }),
  doctorId: z.string().uuid({
    message: "Selecione um médico.",
  }),
  appointmentPriceInCents: z.number().min(1, {
    message: "Valor da consulta é obrigatório.",
  }),
  date: z.date({
    required_error: "Selecione uma data para o agendamento.",
  }),
  timeSlot: z.string().min(1, {
    message: "Selecione um horário para o agendamento.",
  }),
});

interface UpsertAppointmentFormProps {
  isOpen: boolean;
  patients: (typeof patientsTable.$inferSelect)[];
  doctors: (typeof doctorsTable.$inferSelect)[];
  appointment?: Appointment;
  onSuccess?: () => void;
}

const UpsertAppointmentForm = ({
  isOpen,
  patients,
  doctors,
  appointment,
  onSuccess,
}: UpsertAppointmentFormProps) => {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Extrair o horário da data do agendamento se existir
  const getTimeFromDate = (date?: Date): string => {
    if (!date) return "";
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}:00`;
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: appointment?.patientId || "",
      doctorId: appointment?.doctorId || "",
      appointmentPriceInCents: appointment?.doctor.appointmentPriceInCents || 0,
      date: appointment?.date ? new Date(appointment.date) : undefined,
      timeSlot: appointment?.date
        ? getTimeFromDate(new Date(appointment.date))
        : "",
    },
  });

  const watchPatientId = form.watch("patientId");
  const watchDoctorId = form.watch("doctorId");
  const watchDate = form.watch("date");

  // Busca o médico selecionado
  const selectedDoctor = useMemo(() => {
    return doctors.find((doc) => doc.id === watchDoctorId);
  }, [watchDoctorId, doctors]);

  // Buscar agendamentos existentes quando a data e o médico são selecionados
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!watchDoctorId || !watchDate) {
        setBookedSlots([]);
        return;
      }

      setIsLoadingSlots(true);
      try {
        // Criar data no início e fim do dia
        const selectedDate = dayjs(watchDate).format("YYYY-MM-DD");

        console.log("Buscando horários ocupados para:", {
          doctorId: watchDoctorId,
          date: selectedDate,
        });

        // Buscar todos os agendamentos do médico para a data selecionada
        const response = await fetch(
          `/api/appointments/booked-slots?doctorId=${watchDoctorId}&date=${selectedDate}`,
          {
            // Adicionar cabeçalho de cache para evitar problemas de cache
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache",
            },
          },
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Resposta da API não ok:", response.status, errorData);
          throw new Error(
            errorData.error || "Falha ao buscar horários ocupados",
          );
        }

        const data = await response.json();
        console.log("Horários ocupados recebidos:", data);
        setBookedSlots(data.bookedSlots || []);
      } catch (error) {
        console.error("Erro ao buscar horários ocupados:", error);
        toast.error(
          "Erro ao verificar disponibilidade de horários. Usando todos os horários disponíveis.",
        );
        // Em caso de erro, continuamos com a lista vazia para permitir a seleção de qualquer horário
        setBookedSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    // Definir um timeout para evitar chamadas muito frequentes à API
    const timeoutId = setTimeout(() => {
      fetchBookedSlots();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [watchDoctorId, watchDate]);

  // Função para verificar se um horário está ocupado
  const isTimeSlotBooked = (timeSlot: string) => {
    // Se for o horário do agendamento atual (em caso de edição), não considerar como ocupado
    if (
      appointment &&
      appointment.doctorId === watchDoctorId &&
      getTimeFromDate(new Date(appointment.date)) === timeSlot
    ) {
      return false;
    }

    return bookedSlots.includes(timeSlot);
  };

  // Gera os horários disponíveis com base no médico selecionado
  const availableTimeSlots = useMemo(() => {
    if (!selectedDoctor) return [];

    // Obter os horários de disponibilidade do médico
    const fromTimeStr = selectedDoctor.availableFromTime;
    const toTimeStr = selectedDoctor.availableToTime;

    // Verificar se os horários estão no formato esperado
    if (!fromTimeStr || !toTimeStr) return [];

    try {
      // Extrair horas, minutos e segundos
      const fromParts = fromTimeStr.split(":");
      const toParts = toTimeStr.split(":");

      if (fromParts.length < 2 || toParts.length < 2) {
        console.error("Formato de hora inválido:", fromTimeStr, toTimeStr);
        return [];
      }

      const fromHour = parseInt(fromParts[0], 10);
      const fromMinute = parseInt(fromParts[1], 10);

      const toHour = parseInt(toParts[0], 10);
      const toMinute = parseInt(toParts[1], 10);

      if (
        isNaN(fromHour) ||
        isNaN(fromMinute) ||
        isNaN(toHour) ||
        isNaN(toMinute)
      ) {
        console.error("Valores de hora inválidos:", fromTimeStr, toTimeStr);
        return [];
      }

      // Criar horários usando objetos Date em vez de dayjs.utc()
      const today = new Date();

      // Criar horário de início
      const startTime = new Date();
      startTime.setHours(fromHour, fromMinute, 0, 0);

      // Criar horário de término
      const endTime = new Date();
      endTime.setHours(toHour, toMinute, 0, 0);

      // Verificar se o horário final é maior que o inicial
      if (endTime <= startTime) {
        console.error(
          "Horário final deve ser maior que o inicial:",
          fromTimeStr,
          toTimeStr,
        );
        return [];
      }

      const slots = [];
      const currentTime = new Date(startTime);

      // Gerar slots de 30 minutos
      while (currentTime < endTime) {
        // Formatar o horário como string HH:MM:SS
        const hours = currentTime.getHours().toString().padStart(2, "0");
        const minutes = currentTime.getMinutes().toString().padStart(2, "0");
        const timeSlot = `${hours}:${minutes}:00`;

        // Verificar se o horário já está ocupado usando a função auxiliar
        if (!isTimeSlotBooked(timeSlot)) {
          slots.push(timeSlot);
        }

        // Avançar 30 minutos
        currentTime.setMinutes(currentTime.getMinutes() + 30);
      }

      return slots;
    } catch (error) {
      console.error("Erro ao processar horários:", error);
      return [];
    }
  }, [
    selectedDoctor,
    bookedSlots,
    appointment,
    watchDoctorId,
    isTimeSlotBooked,
  ]);

  // Função para verificar se uma data é válida com base na disponibilidade do médico
  const isDateAvailable = (date: Date): boolean => {
    if (!selectedDoctor) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Verificar se a data é hoje ou no futuro
    if (date < today) return false;

    const dayOfWeek = date.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado

    // Verificar se o dia da semana está dentro do intervalo de disponibilidade do médico
    const fromDay = selectedDoctor.availableFromWeekDay;
    const toDay = selectedDoctor.availableToWeekDay;

    // Lidar com intervalos que cruzam o fim de semana
    if (fromDay <= toDay) {
      return dayOfWeek >= fromDay && dayOfWeek <= toDay;
    } else {
      // Ex: disponível de sexta (5) a segunda (1)
      return dayOfWeek >= fromDay || dayOfWeek <= toDay;
    }
  };

  // Atualiza o valor da consulta quando um médico é selecionado
  useEffect(() => {
    if (watchDoctorId) {
      const doctor = doctors.find((doc) => doc.id === watchDoctorId);
      if (doctor) {
        form.setValue(
          "appointmentPriceInCents",
          doctor.appointmentPriceInCents,
        );
      }
    } else {
      form.setValue("appointmentPriceInCents", 0);
    }

    // Limpar a data e o horário quando o médico mudar
    form.setValue("date", undefined);
    form.setValue("timeSlot", "");
  }, [watchDoctorId, doctors, form]);

  // Resetar formulário quando o modal é aberto/fechado ou quando recebe um agendamento para editar
  useEffect(() => {
    if (isOpen) {
      if (appointment) {
        // Se estiver editando um agendamento existente
        form.reset({
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          appointmentPriceInCents: appointment.doctor.appointmentPriceInCents,
          date: new Date(appointment.date),
          timeSlot: getTimeFromDate(new Date(appointment.date)),
        });
      } else {
        // Se estiver criando um novo agendamento
        form.reset({
          patientId: "",
          doctorId: "",
          appointmentPriceInCents: 0,
          timeSlot: "",
        });
      }
    }
  }, [isOpen, appointment, form]);

  const upsertAppointmentAction = useAction(upsertAppointment, {
    onSuccess: () => {
      toast.success(
        appointment
          ? "Agendamento atualizado com sucesso!"
          : "Agendamento criado com sucesso!",
      );
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Erro:", error);

      // Verifica se há um erro do servidor
      if (error.error?.serverError) {
        toast.error(error.error.serverError);
        return;
      }

      // Verifica se há erros de validação
      if (error.error?.validationErrors) {
        const validationErrors = error.error.validationErrors;

        // Pega o primeiro erro de validação disponível
        const firstError =
          validationErrors._errors?.[0] ||
          validationErrors.patientId?._errors?.[0] ||
          validationErrors.doctorId?._errors?.[0] ||
          validationErrors.appointmentPriceInCents?._errors?.[0] ||
          validationErrors.date?._errors?.[0] ||
          validationErrors.timeSlot?._errors?.[0];

        if (firstError) {
          toast.error(firstError);
          return;
        }
      }

      // Mensagem genérica se nenhum erro específico for encontrado
      toast.error("Erro ao criar agendamento.");
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Valores do formulário:", values);

    // Criar a data completa combinando a data e o horário selecionado
    const appointmentDate = values.date;
    const [hours, minutes] = values.timeSlot.split(":").map(Number);

    appointmentDate.setHours(hours, minutes, 0, 0);

    upsertAppointmentAction.execute({
      ...values,
      id: appointment?.id, // Passa o ID se estiver editando
    });
  };

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>
          {appointment ? "Editar Agendamento" : "Novo Agendamento"}
        </DialogTitle>
        <DialogDescription>
          {appointment
            ? "Edite os dados do agendamento."
            : "Preencha os dados para criar um novo agendamento."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="patientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paciente</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um paciente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="doctorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Médico</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um médico" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name} - {doctor.specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="appointmentPriceInCents"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor da consulta</FormLabel>
                <NumericFormat
                  value={field.value / 100}
                  onValueChange={(value) => {
                    field.onChange(
                      value.floatValue ? value.floatValue * 100 : 0,
                    );
                  }}
                  decimalScale={2}
                  fixedDecimalScale
                  decimalSeparator=","
                  allowNegative={false}
                  allowLeadingZeros={false}
                  thousandSeparator="."
                  customInput={Input}
                  prefix="R$"
                  disabled={!watchDoctorId}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data</FormLabel>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                        disabled={!watchPatientId || !watchDoctorId}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        if (date) {
                          field.onChange(date);
                          setCalendarOpen(false);
                        }
                      }}
                      disabled={(date) => !isDateAvailable(date)}
                      initialFocus
                      locale={ptBR}
                      fromDate={new Date()} // Não permite datas anteriores a hoje
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timeSlot"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horário</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                  disabled={
                    !watchPatientId ||
                    !watchDoctorId ||
                    !watchDate ||
                    isLoadingSlots
                  }
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          isLoadingSlots
                            ? "Carregando horários..."
                            : "Selecione um horário"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableTimeSlots.length > 0 ? (
                      availableTimeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {/* Exibir apenas horas e minutos (sem segundos) */}
                          {time.substring(0, 5)}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-slots" disabled>
                        {isLoadingSlots
                          ? "Carregando horários..."
                          : "Nenhum horário disponível"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button type="submit" className="w-full">
              {appointment ? "Atualizar" : "Criar"} Agendamento
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default UpsertAppointmentForm;
