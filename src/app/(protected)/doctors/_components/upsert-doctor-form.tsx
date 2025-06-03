"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ClockIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";
import { z } from "zod";

import { upsertDoctor } from "@/actions/upsert-doctor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { ProfileImageUploader } from "@/components/ui/profile-image-uploader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { doctorsTable } from "@/db/schema";
import { convertBusinessHoursFromUTC } from "@/helpers/timezone";

import { medicalSpecialties } from "../_constants";

// Schema para horários de funcionamento por dia da semana
const businessHoursSchema = z.object({
  monday: z.object({
    isOpen: z.boolean(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }),
  tuesday: z.object({
    isOpen: z.boolean(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }),
  wednesday: z.object({
    isOpen: z.boolean(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }),
  thursday: z.object({
    isOpen: z.boolean(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }),
  friday: z.object({
    isOpen: z.boolean(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }),
  saturday: z.object({
    isOpen: z.boolean(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }),
  sunday: z.object({
    isOpen: z.boolean(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }),
});

const formSchema = z
  .object({
    name: z.string().trim().min(1, {
      message: "Nome é obrigatório.",
    }),
    email: z.string().trim().email({
      message: "E-mail inválido.",
    }),
    avatarImageUrl: z.string().optional(),
    specialty: z.string().trim().min(1, {
      message: "Especialidade é obrigatória.",
    }),
    appointmentPrice: z.number().min(1, {
      message: "Preço da consulta é obrigatório.",
    }),
    businessHours: businessHoursSchema,
  })
  .refine(
    (data) => {
      // Validar que pelo menos um dia está aberto
      const hasOpenDay = Object.values(data.businessHours).some(
        (day) => day.isOpen,
      );
      return hasOpenDay;
    },
    {
      message: "Pelo menos um dia deve estar disponível para atendimento.",
      path: ["businessHours"],
    },
  );

interface UpsertDoctorFormProps {
  isOpen?: boolean;
  doctor?: typeof doctorsTable.$inferSelect;
  onSuccess?: () => void;
  isFullPage?: boolean; // Nova prop para modo página completa
}

const DAYS_OF_WEEK = [
  { key: "monday" as const, label: "Segunda-feira" },
  { key: "tuesday" as const, label: "Terça-feira" },
  { key: "wednesday" as const, label: "Quarta-feira" },
  { key: "thursday" as const, label: "Quinta-feira" },
  { key: "friday" as const, label: "Sexta-feira" },
  { key: "saturday" as const, label: "Sábado" },
  { key: "sunday" as const, label: "Domingo" },
] as const;

const UpsertDoctorForm = ({
  doctor,
  onSuccess,
  isOpen,
  isFullPage = false,
}: UpsertDoctorFormProps) => {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    doctor?.avatarImageUrl || undefined,
  );

  // Função para obter horários padrão
  const getDefaultBusinessHours = () => ({
    monday: { isOpen: true, startTime: "08:00", endTime: "18:00" },
    tuesday: { isOpen: true, startTime: "08:00", endTime: "18:00" },
    wednesday: { isOpen: true, startTime: "08:00", endTime: "18:00" },
    thursday: { isOpen: true, startTime: "08:00", endTime: "18:00" },
    friday: { isOpen: true, startTime: "08:00", endTime: "18:00" },
    saturday: { isOpen: false, startTime: "", endTime: "" },
    sunday: { isOpen: false, startTime: "", endTime: "" },
  });

  // Função para converter horários do médico para o formato do formulário
  const getDoctorBusinessHours = () => {
    if (doctor?.businessHours) {
      // Se o médico já tem o novo formato de horários, converter de UTC para UTC-3
      return (
        convertBusinessHoursFromUTC(doctor.businessHours) ||
        getDefaultBusinessHours()
      );
    } else if (doctor) {
      // Converter do formato legado para o novo formato
      // Os horários legados já estão em UTC no banco, converter para UTC-3
      const convertTimeToLocal = (timeStr: string) => {
        if (!timeStr) return "";
        const [hours, minutes, seconds = "00"] = timeStr.split(":");
        const utcTime = new Date();
        utcTime.setUTCHours(
          parseInt(hours),
          parseInt(minutes),
          parseInt(seconds),
          0,
        );
        // Converter para UTC-3
        const localTime = new Date(utcTime.getTime() - 3 * 60 * 60 * 1000);
        const localHours = localTime.getUTCHours().toString().padStart(2, "0");
        const localMinutes = localTime
          .getUTCMinutes()
          .toString()
          .padStart(2, "0");
        return `${localHours}:${localMinutes}`;
      };

      const defaultHours = getDefaultBusinessHours();
      const fromDay = doctor.availableFromWeekDay;
      const toDay = doctor.availableToWeekDay;
      const fromTime = convertTimeToLocal(doctor.availableFromTime);
      const toTime = convertTimeToLocal(doctor.availableToTime);

      // Marcar os dias entre fromDay e toDay como abertos
      const dayKeys = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];

      for (let i = 0; i < dayKeys.length; i++) {
        const dayKey = dayKeys[i] as keyof typeof defaultHours;
        if (
          (fromDay <= toDay && i >= fromDay && i <= toDay) ||
          (fromDay > toDay && (i >= fromDay || i <= toDay))
        ) {
          defaultHours[dayKey] = {
            isOpen: true,
            startTime: fromTime,
            endTime: toTime,
          };
        }
      }

      return defaultHours;
    }
    return getDefaultBusinessHours();
  };

  const form = useForm<z.infer<typeof formSchema>>({
    shouldUnregister: true,
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: doctor?.name ?? "",
      email: doctor?.email ?? "",
      avatarImageUrl: doctor?.avatarImageUrl ?? "",
      specialty: doctor?.specialty ?? "",
      appointmentPrice: doctor?.appointmentPriceInCents
        ? doctor.appointmentPriceInCents / 100
        : 0,
      businessHours: getDoctorBusinessHours(),
    },
  });

  useEffect(() => {
    if (isOpen || isFullPage) {
      const resetValues = {
        name: doctor?.name ?? "",
        email: doctor?.email ?? "",
        avatarImageUrl: doctor?.avatarImageUrl ?? "",
        specialty: doctor?.specialty ?? "",
        appointmentPrice: doctor?.appointmentPriceInCents
          ? doctor.appointmentPriceInCents / 100
          : 0,
        businessHours: getDoctorBusinessHours(),
      };

      form.reset(resetValues);
      setAvatarUrl(doctor?.avatarImageUrl || undefined);
    }
  }, [isOpen, isFullPage, doctor, form]);

  const upsertDoctorAction = useAction(upsertDoctor, {
    onSuccess: () => {
      toast.success("Médico salvo com sucesso.");

      // Se for página completa, redirecionar para /doctors
      if (isFullPage) {
        router.push("/doctors");
        router.refresh();
      } else {
        // Se for modal, chamar onSuccess (comportamento antigo)
        onSuccess?.();
      }
    },
    onError: (error) => {
      console.error("❌ Erro ao salvar médico:", {
        serverError: error.error?.serverError,
        validationErrors: error.error?.validationErrors,
        fullError: error,
      });

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
          validationErrors.name?._errors?.[0] ||
          validationErrors.email?._errors?.[0] ||
          validationErrors.specialty?._errors?.[0] ||
          validationErrors.appointmentPriceInCents?._errors?.[0] ||
          validationErrors.businessHours?._errors?.[0];

        if (firstError) {
          toast.error(firstError);
          return;
        }
      }

      // Mensagem genérica se nenhum erro específico for encontrado
      toast.error("Erro ao salvar médico.");
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("📊 Dados do formulário (UTC-3):", values);

    upsertDoctorAction.execute({
      id: doctor?.id,
      name: values.name,
      email: values.email,
      avatarImageUrl: avatarUrl || "",
      specialty: values.specialty,
      appointmentPriceInCents: values.appointmentPrice * 100,
      businessHours: values.businessHours,
    });
  };

  const handleAvatarUpload = (url: string) => {
    setAvatarUrl(url);
    form.setValue("avatarImageUrl", url);
  };

  // Conteúdo do formulário (reutilizado em ambos os modos)
  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>
              Dados pessoais e profissionais do médico
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Campo de Upload de Imagem */}
            <FormItem>
              <FormLabel>Foto de Perfil</FormLabel>
              <FormControl>
                <ProfileImageUploader
                  onUploadComplete={handleAvatarUpload}
                  currentImageUrl={avatarUrl}
                  fallbackText={doctor?.name?.charAt(0) || "M"}
                  disabled={upsertDoctorAction.isExecuting}
                />
              </FormControl>
            </FormItem>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="specialty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especialidade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione uma especialidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {medicalSpecialties.map((specialty) => (
                          <SelectItem
                            key={specialty.value}
                            value={specialty.value}
                          >
                            {specialty.label}
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
                name="appointmentPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço da consulta</FormLabel>
                    <NumericFormat
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value.floatValue);
                      }}
                      decimalScale={2}
                      fixedDecimalScale
                      decimalSeparator=","
                      allowNegative={false}
                      allowLeadingZeros={false}
                      thousandSeparator="."
                      customInput={Input}
                      prefix="R$"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Horários de Atendimento */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-5 w-5 text-purple-600" />
              <CardTitle>Horários de Atendimento</CardTitle>
            </div>
            <CardDescription>
              Configure os horários de atendimento do médico (horário de
              Brasília - UTC-3)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day.key}
                className="space-y-3 rounded-lg border border-gray-100 bg-gray-50/50 p-4"
              >
                {/* Header do dia */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {day.label}
                  </span>
                  <FormField
                    control={form.control}
                    name={`businessHours.${day.key}.isOpen` as const}
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Horários - apenas se o dia estiver aberto */}
                {form.watch(`businessHours.${day.key}.isOpen` as const) && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
                    <div className="flex flex-col space-y-1">
                      <label className="text-xs font-medium text-gray-600">
                        Início
                      </label>
                      <FormField
                        control={form.control}
                        name={`businessHours.${day.key}.startTime` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="time"
                                className="w-full bg-white"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-xs font-medium text-gray-600">
                        Término
                      </label>
                      <FormField
                        control={form.control}
                        name={`businessHours.${day.key}.endTime` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="time"
                                className="w-full bg-white"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-end sm:col-span-2 lg:col-span-1">
                      <span className="flex items-center text-xs font-medium text-emerald-600">
                        <div className="mr-2 h-2 w-2 rounded-full bg-emerald-500"></div>
                        Atendimento ativo
                      </span>
                    </div>
                  </div>
                )}

                {/* Estado fechado */}
                {!form.watch(`businessHours.${day.key}.isOpen` as const) && (
                  <div className="py-2 text-center">
                    <span className="flex items-center justify-center text-sm text-gray-400">
                      <div className="mr-2 h-2 w-2 rounded-full bg-gray-300"></div>
                      Não atende neste dia
                    </span>
                  </div>
                )}
              </div>
            ))}

            {/* Mensagem de erro dos horários */}
            <FormField
              control={form.control}
              name="businessHours"
              render={() => (
                <FormItem>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Botões de ação */}
        <div className="flex justify-end space-x-3">
          {isFullPage && (
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/doctors")}
              disabled={upsertDoctorAction.isExecuting}
            >
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={upsertDoctorAction.isExecuting}>
            {upsertDoctorAction.isExecuting
              ? "Salvando..."
              : doctor
                ? "Salvar Alterações"
                : "Adicionar Médico"}
          </Button>
        </div>
      </form>
    </Form>
  );

  // Se for página completa, retorna apenas o conteúdo
  if (isFullPage) {
    return formContent;
  }

  // Se for modal, retorna com DialogContent (comportamento antigo)
  return (
    <DialogContent className="max-h-[90vh] w-full max-w-4xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{doctor ? doctor.name : "Adicionar médico"}</DialogTitle>
        <DialogDescription>
          {doctor
            ? "Edite as informações desse médico."
            : "Adicione um novo médico."}
        </DialogDescription>
      </DialogHeader>
      {formContent}
    </DialogContent>
  );
};

export default UpsertDoctorForm;
