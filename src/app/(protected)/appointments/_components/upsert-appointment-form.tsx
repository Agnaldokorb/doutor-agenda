"use client";

import "dayjs/locale/pt-br";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { CalendarIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";
import { z } from "zod";

import { getHealthInsurancePlans } from "@/actions/get-health-insurance-plans";
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
import { doctorsTable, patientsTable } from "@/db/schema";
import { convertBusinessHoursFromUTC } from "@/helpers/timezone";
import { cn } from "@/lib/utils";

import { Appointment } from "./table-columns";

// Estender dayjs com os plugins necessários
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("pt-br");

const formSchema = z.object({
  patientId: z.string().uuid({
    message: "Selecione um paciente.",
  }),
  doctorId: z.string().uuid({
    message: "Selecione um médico.",
  }),
  healthInsurancePlanId: z.string().uuid().optional(),
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
  const [healthInsurancePlans, setHealthInsurancePlans] = useState<
    Array<{
      id: string;
      name: string;
      reimbursementValueInCents: number;
      isActive: boolean;
    }>
  >([]);
  const [dailyBookedCounts, setDailyBookedCounts] = useState<
    Record<string, number>
  >({});

  // Extrair o horário da data do agendamento se existir (convertendo UTC para UTC-3)
  const getTimeFromDate = (date?: Date): string => {
    if (!date) return "";
    // Converter UTC para UTC-3 para exibição no formulário
    const utcDate = new Date(date);
    const localDate = new Date(utcDate.getTime() - 3 * 60 * 60 * 1000);
    const hours = localDate.getUTCHours().toString().padStart(2, "0");
    const minutes = localDate.getUTCMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}:00`;
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: appointment?.patientId || "",
      doctorId: appointment?.doctorId || "",
      healthInsurancePlanId: appointment?.healthInsurancePlanId || undefined,
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
  const watchHealthInsurancePlanId = form.watch("healthInsurancePlanId");

  // Busca o médico selecionado
  const selectedDoctor = useMemo(() => {
    return doctors.find((doc) => doc.id === watchDoctorId);
  }, [watchDoctorId, doctors]);

  // Busca o plano de saúde selecionado
  const selectedHealthInsurancePlan = useMemo(() => {
    // Garantir que healthInsurancePlans é um array válido
    if (
      !Array.isArray(healthInsurancePlans) ||
      healthInsurancePlans.length === 0
    ) {
      return undefined;
    }
    return healthInsurancePlans.find(
      (plan) => plan.id === watchHealthInsurancePlanId,
    );
  }, [watchHealthInsurancePlanId, healthInsurancePlans]);

  // Busca os horários já ocupados quando mudam doctor e data
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!watchDoctorId || !watchDate) {
        setBookedSlots([]);
        return;
      }

      setIsLoadingSlots(true);

      try {
        const dateStr = watchDate.toISOString().split("T")[0]; // YYYY-MM-DD
        const response = await fetch(
          `/api/appointments/booked-slots?doctorId=${watchDoctorId}&date=${dateStr}`,
        );

        if (response.ok) {
          const data = await response.json();
          setBookedSlots(data.bookedSlots || []);
        } else {
          console.error("Erro ao buscar horários ocupados:", response.status);
          setBookedSlots([]);
        }
      } catch (error) {
        console.error("Erro ao buscar horários ocupados:", error);
        setBookedSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    // Debounce para evitar muitas requisições
    const timeoutId = setTimeout(() => {
      fetchBookedSlots();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [watchDoctorId, watchDate]);

  // Buscar contagem de agendamentos para o mês do calendário
  useEffect(() => {
    const fetchMonthlyBookedCounts = async () => {
      if (!selectedDoctor) {
        setDailyBookedCounts({});
        return;
      }

      try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 2,
          0,
        ); // +2 meses para incluir próximo mês

        const promises = [];
        const currentDate = new Date(startOfMonth);

        while (currentDate <= endOfMonth) {
          const dateStr = currentDate.toISOString().split("T")[0];
          promises.push(
            fetch(
              `/api/appointments/booked-slots?doctorId=${selectedDoctor.id}&date=${dateStr}`,
            )
              .then((res) => res.json())
              .then((data) => ({
                date: dateStr,
                count: data.bookedSlots?.length || 0,
              }))
              .catch(() => ({ date: dateStr, count: 0 })),
          );
          currentDate.setDate(currentDate.getDate() + 1);
        }

        const results = await Promise.all(promises);
        const counts: Record<string, number> = {};
        results.forEach((result) => {
          counts[result.date] = result.count;
        });
        setDailyBookedCounts(counts);
      } catch (error) {
        console.error("Erro ao buscar contagens mensais:", error);
        setDailyBookedCounts({});
      }
    };

    if (selectedDoctor) {
      fetchMonthlyBookedCounts();
    }
  }, [selectedDoctor]);

  // Função para verificar se um horário está ocupado
  const isTimeSlotBooked = useCallback(
    (timeSlot: string) => {
      // Se for o horário do agendamento atual (em caso de edição), não considerar como ocupado
      if (
        appointment &&
        appointment.doctorId === watchDoctorId &&
        getTimeFromDate(new Date(appointment.date)) === timeSlot
      ) {
        return false;
      }

      return bookedSlots.includes(timeSlot);
    },
    [appointment, watchDoctorId, bookedSlots],
  );

  // Função para obter os horários de funcionamento do médico para um dia específico
  const getDoctorHoursForDay = (
    doctor: typeof doctorsTable.$inferSelect,
    dayOfWeek: number,
  ) => {
    // Mapear dia da semana JS (0=domingo) para os nomes dos dias
    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const dayName = dayNames[dayOfWeek];

    // Se o médico tem businessHours (novo sistema)
    if (doctor.businessHours) {
      try {
        // Converter de UTC para UTC-3 para exibição
        const businessHours = convertBusinessHoursFromUTC(doctor.businessHours);

        if (
          !businessHours ||
          !businessHours[dayName] ||
          !businessHours[dayName].isOpen
        ) {
          return null; // Médico não atende neste dia
        }

        return {
          startTime: businessHours[dayName].startTime,
          endTime: businessHours[dayName].endTime,
        };
      } catch (error) {
        console.error("Erro ao processar businessHours:", error);
        return null;
      }
    }

    // Fallback para sistema legado
    const fromDay = doctor.availableFromWeekDay;
    const toDay = doctor.availableToWeekDay;

    // Verificar se o dia está no intervalo de disponibilidade
    let isDayAvailable = false;
    if (fromDay <= toDay) {
      isDayAvailable = dayOfWeek >= fromDay && dayOfWeek <= toDay;
    } else {
      // Intervalo que cruza o fim de semana
      isDayAvailable = dayOfWeek >= fromDay || dayOfWeek <= toDay;
    }

    if (!isDayAvailable) {
      return null;
    }

    // Converter horários legados de UTC para UTC-3
    const convertLegacyTime = (timeStr: string) => {
      if (!timeStr) return "";
      const [hours, minutes, seconds = "00"] = timeStr.split(":");
      const utcTime = new Date();
      utcTime.setUTCHours(
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds),
        0,
      );
      const localTime = new Date(utcTime.getTime() - 3 * 60 * 60 * 1000);
      const localHours = localTime.getUTCHours().toString().padStart(2, "0");
      const localMinutes = localTime
        .getUTCMinutes()
        .toString()
        .padStart(2, "0");
      return `${localHours}:${localMinutes}`;
    };

    return {
      startTime: convertLegacyTime(doctor.availableFromTime),
      endTime: convertLegacyTime(doctor.availableToTime),
    };
  };

  // Gera os horários disponíveis com base no médico selecionado e data
  const availableTimeSlots = useMemo(() => {
    if (!selectedDoctor || !watchDate) return [];

    const dayOfWeek = watchDate.getDay();
    const doctorHours = getDoctorHoursForDay(selectedDoctor, dayOfWeek);

    if (!doctorHours || !doctorHours.startTime || !doctorHours.endTime) {
      return []; // Médico não atende neste dia
    }

    try {
      // Parse dos horários
      const [fromHour, fromMinute] = doctorHours.startTime
        .split(":")
        .map(Number);
      const [toHour, toMinute] = doctorHours.endTime.split(":").map(Number);

      if (
        isNaN(fromHour) ||
        isNaN(fromMinute) ||
        isNaN(toHour) ||
        isNaN(toMinute)
      ) {
        console.error("Valores de hora inválidos:", doctorHours);
        return [];
      }

      // Criar horários
      const startTime = new Date();
      startTime.setHours(fromHour, fromMinute, 0, 0);

      const endTime = new Date();
      endTime.setHours(toHour, toMinute, 0, 0);

      if (endTime <= startTime) {
        console.error(
          "Horário final deve ser maior que o inicial:",
          doctorHours,
        );
        return [];
      }

      const slots = [];
      const currentTime = new Date(startTime);

      // Gerar slots de 30 minutos
      while (currentTime < endTime) {
        const hours = currentTime.getHours().toString().padStart(2, "0");
        const minutes = currentTime.getMinutes().toString().padStart(2, "0");
        const timeSlot = `${hours}:${minutes}:00`;

        // Verificar se o horário não está ocupado
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
  }, [selectedDoctor, watchDate, isTimeSlotBooked]);

  // Função para verificar se uma data é válida com base na disponibilidade do médico
  const isDateAvailable = (date: Date): boolean => {
    if (!selectedDoctor) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Verificar se a data é hoje ou no futuro
    if (date < today) return false;

    const dayOfWeek = date.getDay();
    const doctorHours = getDoctorHoursForDay(selectedDoctor, dayOfWeek);

    // Se não tem horários para este dia, não está disponível
    return doctorHours !== null;
  };

  // Função para verificar se uma data está lotada
  const isDateFullyBooked = (date: Date): boolean => {
    if (!selectedDoctor) return false;

    const dateStr = date.toISOString().split("T")[0];
    const bookedCount = dailyBookedCounts[dateStr] || 0;
    const totalSlots = getTotalSlotsForDay(date);

    // Se for o dia do agendamento atual (edição), não considerar como lotado
    if (appointment && appointment.date) {
      const appointmentDateStr = new Date(appointment.date)
        .toISOString()
        .split("T")[0];
      if (appointmentDateStr === dateStr) {
        return bookedCount >= totalSlots + 1; // +1 porque estamos editando
      }
    }

    return totalSlots > 0 && bookedCount >= totalSlots;
  };

  // Atualizar valor da consulta quando plano de saúde ou médico mudar
  useEffect(() => {
    if (selectedHealthInsurancePlan) {
      // Se há plano de saúde selecionado, usar o valor de reembolso
      form.setValue(
        "appointmentPriceInCents",
        selectedHealthInsurancePlan.reimbursementValueInCents,
      );
    } else if (selectedDoctor) {
      // Se não há plano, usar o valor padrão do médico
      form.setValue(
        "appointmentPriceInCents",
        selectedDoctor.appointmentPriceInCents,
      );
    }
  }, [selectedHealthInsurancePlan, selectedDoctor, form]);

  // Resetar formulário quando o modal é aberto/fechado ou quando recebe um agendamento para editar
  useEffect(() => {
    if (isOpen) {
      if (appointment) {
        // Se estiver editando um agendamento existente
        form.reset({
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          healthInsurancePlanId: appointment.healthInsurancePlanId || undefined,
          appointmentPriceInCents: appointment.doctor.appointmentPriceInCents,
          date: new Date(appointment.date),
          timeSlot: getTimeFromDate(new Date(appointment.date)),
        });
      } else {
        // Se estiver criando um novo agendamento
        form.reset({
          patientId: "",
          doctorId: "",
          healthInsurancePlanId: undefined,
          appointmentPriceInCents: 0,
          timeSlot: "",
        });
      }
    }
  }, [isOpen, appointment, form]);

  // Action para buscar planos de saúde
  const getPlansAction = useAction(getHealthInsurancePlans, {
    onSuccess: (data) => {
      // next-safe-action encapsula o resultado em {data: resultado}
      const result = data?.data;
      const validPlans = Array.isArray(result) ? result : [];
      console.log(
        "✅ Appointment Form - Planos carregados:",
        validPlans.length,
      );
      setHealthInsurancePlans(validPlans);
    },
    onError: (error) => {
      console.error("❌ Appointment Form - Erro ao buscar planos:", error);
      setHealthInsurancePlans([]);
    },
  });

  // Buscar planos de saúde quando o formulário abrir
  useEffect(() => {
    if (isOpen) {
      console.log("🔍 Appointment Form - Modal aberto, buscando planos...");
      getPlansAction.execute();
    }
  }, [isOpen, getPlansAction]);

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
    console.log("📊 Valores do formulário (UTC-3):", values);

    // Criar a data completa combinando a data e o horário selecionado
    const appointmentDate = new Date(values.date);
    const [hours, minutes] = values.timeSlot.split(":").map(Number);

    // Definir o horário local (UTC-3) - a action irá converter para UTC
    appointmentDate.setHours(hours, minutes, 0, 0);

    console.log(
      "🕐 Data/hora local (UTC-3) para enviar:",
      appointmentDate.toISOString(),
    );

    upsertAppointmentAction.execute({
      ...values,
      date: appointmentDate,
      id: appointment?.id, // Passa o ID se estiver editando
    });
  };

  // Calcula o total de slots possíveis para um dia
  const getTotalSlotsForDay = (date: Date): number => {
    if (!selectedDoctor) return 0;

    const dayOfWeek = date.getDay();
    const doctorHours = getDoctorHoursForDay(selectedDoctor, dayOfWeek);

    if (!doctorHours || !doctorHours.startTime || !doctorHours.endTime) {
      return 0;
    }

    try {
      const [fromHour, fromMinute] = doctorHours.startTime
        .split(":")
        .map(Number);
      const [toHour, toMinute] = doctorHours.endTime.split(":").map(Number);

      const startTime = new Date();
      startTime.setHours(fromHour, fromMinute, 0, 0);

      const endTime = new Date();
      endTime.setHours(toHour, toMinute, 0, 0);

      if (endTime <= startTime) return 0;

      // Calcular número de slots de 30 minutos
      const diffMs = endTime.getTime() - startTime.getTime();
      const slots = Math.floor(diffMs / (30 * 60 * 1000));
      return slots;
    } catch (error) {
      console.error("Erro ao calcular slots totais:", error);
      return 0;
    }
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
            name="healthInsurancePlanId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plano de Saúde</FormLabel>
                <Select
                  onValueChange={(value) => {
                    // Se for "particular", limpar o campo
                    field.onChange(value === "particular" ? undefined : value);
                  }}
                  defaultValue={field.value || "particular"}
                  value={field.value || "particular"}
                  disabled={!watchPatientId || !watchDoctorId}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um plano de saúde" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="particular">
                      💰 Particular (sem plano)
                    </SelectItem>
                    {getPlansAction.isExecuting ? (
                      <SelectItem value="loading" disabled>
                        Carregando planos...
                      </SelectItem>
                    ) : (
                      healthInsurancePlans
                        .filter((plan) => plan.isActive)
                        .map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            🏥 {plan.name} -{" "}
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(plan.reimbursementValueInCents / 100)}
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Campo de valor - só mostrar se não houver plano de saúde selecionado */}
          {!selectedHealthInsurancePlan && (
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
          )}

          {/* Mostrar valor do plano quando selecionado */}
          {selectedHealthInsurancePlan && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-green-800">
                  🏥 Plano de Saúde: {selectedHealthInsurancePlan.name}
                </span>
              </div>
              <div className="mt-1 text-sm text-green-600">
                Valor de reembolso:{" "}
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(
                  selectedHealthInsurancePlan.reimbursementValueInCents / 100,
                )}
              </div>
            </div>
          )}

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
                    <div className="border-b p-3">
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded border border-green-200 bg-green-50"></div>
                          <span>Disponível</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded border border-orange-200 bg-orange-100"></div>
                          <span>Agenda lotada</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded border border-red-200 bg-red-100"></div>
                          <span>Médico não atende</span>
                        </div>
                      </div>
                    </div>
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        if (
                          date &&
                          isDateAvailable(date) &&
                          !isDateFullyBooked(date)
                        ) {
                          field.onChange(date);
                          setCalendarOpen(false);
                          // Limpar horário quando a data mudar
                          form.setValue("timeSlot", "");
                        }
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return (
                          date < today ||
                          !isDateAvailable(date) ||
                          isDateFullyBooked(date)
                        );
                      }}
                      modifiers={{
                        available: (date) =>
                          isDateAvailable(date) && !isDateFullyBooked(date),
                        fullyBooked: (date) =>
                          isDateAvailable(date) && isDateFullyBooked(date),
                        unavailable: (date) => !isDateAvailable(date),
                      }}
                      modifiersClassNames={{
                        available:
                          "!bg-green-50 !text-green-700 hover:!bg-green-100 hover:!text-green-800",
                        fullyBooked: "!bg-orange-100 !text-orange-600",
                        unavailable: "!bg-red-100 !text-red-400",
                      }}
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
                <FormLabel>
                  Horário{" "}
                  {selectedDoctor && watchDate && (
                    <span className="text-xs text-gray-500">
                      (horários em UTC-3 - Brasília)
                    </span>
                  )}
                </FormLabel>
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
                            : !watchDate
                              ? "Selecione uma data primeiro"
                              : availableTimeSlots.length === 0
                                ? "Médico não atende neste dia"
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
                          : !watchDate
                            ? "Selecione uma data primeiro"
                            : "Nenhum horário disponível neste dia"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={upsertAppointmentAction.isExecuting}
            >
              {upsertAppointmentAction.isExecuting
                ? "Salvando..."
                : appointment
                  ? "Atualizar"
                  : "Criar"}{" "}
              Agendamento
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default UpsertAppointmentForm;
