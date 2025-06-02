"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  BuildingIcon,
  ClockIcon,
  LoaderIcon,
  MapPinIcon,
  SaveIcon,
  SettingsIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { PatternFormat } from "react-number-format";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { UploadButton } from "@/lib/uploadthing";

// Schema local para evitar problemas de importação
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

const clinicFormSchema = z.object({
  name: z.string().min(1, "Nome da clínica é obrigatório"),
  appointmentDurationMinutes: z.number().min(15).max(120),
  allowOnlineBooking: z.boolean(),
  requireEmailConfirmation: z.boolean(),
  autoConfirmAppointments: z.boolean(),
  logoUrl: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  cnpj: z.string().optional(),
  description: z.string().optional(),
  website: z
    .string()
    .url("Website deve ser uma URL válida")
    .optional()
    .or(z.literal("")),
  businessHours: businessHoursSchema.optional(),
});

type ClinicFormData = z.infer<typeof clinicFormSchema>;

interface ClinicConfigurationFormProps {
  onSuccess?: () => void;
}

const STATES = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

const DAYS_OF_WEEK = [
  { key: "monday", label: "Segunda-feira" },
  { key: "tuesday", label: "Terça-feira" },
  { key: "wednesday", label: "Quarta-feira" },
  { key: "thursday", label: "Quinta-feira" },
  { key: "friday", label: "Sexta-feira" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
] as const;

export const ClinicConfigurationForm = ({
  onSuccess,
}: ClinicConfigurationFormProps) => {
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<ClinicFormData>({
    resolver: zodResolver(clinicFormSchema),
    defaultValues: {
      name: "",
      logoUrl: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      cnpj: "",
      description: "",
      website: "",
      appointmentDurationMinutes: 30,
      allowOnlineBooking: true,
      requireEmailConfirmation: true,
      autoConfirmAppointments: false,
      businessHours: {
        monday: { isOpen: true, startTime: "08:00", endTime: "18:00" },
        tuesday: { isOpen: true, startTime: "08:00", endTime: "18:00" },
        wednesday: { isOpen: true, startTime: "08:00", endTime: "18:00" },
        thursday: { isOpen: true, startTime: "08:00", endTime: "18:00" },
        friday: { isOpen: true, startTime: "08:00", endTime: "18:00" },
        saturday: { isOpen: true, startTime: "08:00", endTime: "12:00" },
        sunday: { isOpen: false, startTime: "", endTime: "" },
      },
    },
  });

  // Funções temporárias até resolver problemas de importação
  const executeUpsertClinic = async (data: ClinicFormData) => {
    try {
      const response = await fetch("/api/clinic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success("Configurações salvas com sucesso!");
        onSuccess?.();
      } else {
        toast.error("Erro ao salvar configurações");
      }
    } catch {
      toast.error("Erro ao salvar configurações");
    }
  };

  // Carregar dados da clínica ao montar componente
  useEffect(() => {
    const executeGetClinic = async () => {
      try {
        const response = await fetch("/api/clinic");
        if (response.ok) {
          const result = await response.json();
          if (result.clinic) {
            const clinic = result.clinic;
            form.reset({
              name: clinic.name || "",
              logoUrl: clinic.logoUrl || "",
              email: clinic.email || "",
              phone: clinic.phone || "",
              address: clinic.address || "",
              city: clinic.city || "",
              state: clinic.state || "",
              zipCode: clinic.zipCode || "",
              cnpj: clinic.cnpj || "",
              description: clinic.description || "",
              website: clinic.website || "",
              appointmentDurationMinutes:
                clinic.appointmentDurationMinutes || 30,
              allowOnlineBooking: clinic.allowOnlineBooking ?? true,
              requireEmailConfirmation: clinic.requireEmailConfirmation ?? true,
              autoConfirmAppointments: clinic.autoConfirmAppointments ?? false,
              businessHours: clinic.businessHours || {
                monday: { isOpen: true, startTime: "08:00", endTime: "18:00" },
                tuesday: { isOpen: true, startTime: "08:00", endTime: "18:00" },
                wednesday: {
                  isOpen: true,
                  startTime: "08:00",
                  endTime: "18:00",
                },
                thursday: {
                  isOpen: true,
                  startTime: "08:00",
                  endTime: "18:00",
                },
                friday: { isOpen: true, startTime: "08:00", endTime: "18:00" },
                saturday: {
                  isOpen: true,
                  startTime: "08:00",
                  endTime: "12:00",
                },
                sunday: { isOpen: false, startTime: "", endTime: "" },
              },
            });
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados da clínica:", error);
        toast.error("Erro ao carregar dados da clínica");
      } finally {
        setIsLoading(false);
      }
    };

    executeGetClinic();
  }, [form]);

  const [isSaving, setIsSaving] = useState(false);

  const onSubmit = async (data: ClinicFormData) => {
    setIsSaving(true);
    await executeUpsertClinic(data);
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <LoaderIcon className="mx-auto h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-2 text-sm text-gray-600">
              Carregando configurações...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <BuildingIcon className="h-5 w-5 text-blue-600" />
                <CardTitle>Informações Básicas</CardTitle>
              </div>
              <CardDescription>
                Configure as informações principais da clínica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logo */}
              <div className="space-y-2">
                <Label>Logo da Clínica</Label>
                <div className="flex items-center space-x-4">
                  {form.watch("logoUrl") && (
                    <div className="relative">
                      <Image
                        src={form.watch("logoUrl") || ""}
                        alt="Logo da clínica"
                        width={80}
                        height={80}
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={() => form.setValue("logoUrl", "")}
                      >
                        <XIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <UploadButton
                    endpoint="imageUploader"
                    onClientUploadComplete={(res) => {
                      if (res?.[0]?.url) {
                        form.setValue("logoUrl", res[0].url);
                        toast.success("Logo enviado com sucesso!");
                      }
                    }}
                    onUploadError={(error: Error) => {
                      toast.error(`Erro no upload: ${error.message}`);
                    }}
                    appearance={{
                      button: "bg-blue-600 hover:bg-blue-700",
                      allowedContent: "text-xs text-gray-500",
                    }}
                    content={{
                      button: ({ ready }: { ready: boolean }) => {
                        if (ready) return <div>Enviar Logo</div>;
                        return "Preparando...";
                      },
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Recomendado: 200x200px, formato PNG ou JPG
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Clínica *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Clínica Exemplo" {...field} />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="contato@clinica.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <PatternFormat
                          format="(##) #####-####"
                          mask="_"
                          customInput={Input}
                          placeholder="(11) 99999-9999"
                          value={field.value || ""}
                          onValueChange={(values) => {
                            field.onChange(values.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <PatternFormat
                          format="##.###.###/####-##"
                          mask="_"
                          customInput={Input}
                          placeholder="00.000.000/0000-00"
                          value={field.value || ""}
                          onValueChange={(values) => {
                            field.onChange(values.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Breve descrição da clínica e especialidades..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://www.clinica.com.br"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <MapPinIcon className="h-5 w-5 text-green-600" />
                <CardTitle>Endereço</CardTitle>
              </div>
              <CardDescription>Configure o endereço da clínica</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Rua, Avenida, número, complemento"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="São Paulo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATES.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
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
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <PatternFormat
                          format="#####-###"
                          mask="_"
                          customInput={Input}
                          placeholder="00000-000"
                          value={field.value || ""}
                          onValueChange={(values) => {
                            field.onChange(values.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Horários de Funcionamento */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-5 w-5 text-purple-600" />
                <CardTitle>Horários de Funcionamento</CardTitle>
              </div>
              <CardDescription>
                Configure os horários de atendimento da clínica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.key} className="flex items-center space-x-4">
                  <div className="w-32">
                    <span className="text-sm font-medium">{day.label}</span>
                  </div>

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

                  {form.watch(`businessHours.${day.key}.isOpen` as const) && (
                    <>
                      <FormField
                        control={form.control}
                        name={`businessHours.${day.key}.startTime` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="time" className="w-32" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <span className="text-sm text-gray-500">às</span>

                      <FormField
                        control={form.control}
                        name={`businessHours.${day.key}.endTime` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="time" className="w-32" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {!form.watch(`businessHours.${day.key}.isOpen` as const) && (
                    <span className="text-sm text-gray-500">Fechado</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Configurações de Agendamento */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <SettingsIcon className="h-5 w-5 text-orange-600" />
                <CardTitle>Configurações de Agendamento</CardTitle>
              </div>
              <CardDescription>
                Configure o comportamento do sistema de agendamentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="appointmentDurationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Duração padrão das consultas (minutos)
                    </FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="15">15 minutos</SelectItem>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="45">45 minutos</SelectItem>
                        <SelectItem value="60">60 minutos</SelectItem>
                        <SelectItem value="90">90 minutos</SelectItem>
                        <SelectItem value="120">120 minutos</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="allowOnlineBooking"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Permitir agendamento online
                        </FormLabel>
                        <FormDescription>
                          Pacientes podem agendar consultas pelo sistema
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requireEmailConfirmation"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Exigir confirmação por email
                        </FormLabel>
                        <FormDescription>
                          Enviar emails de confirmação para agendamentos
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="autoConfirmAppointments"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Confirmar automaticamente
                        </FormLabel>
                        <FormDescription>
                          Agendamentos são confirmados automaticamente
                        </FormDescription>
                      </div>
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
            </CardContent>
          </Card>

          {/* Botão de Salvar */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving} className="min-w-32">
              {isSaving ? (
                <>
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <SaveIcon className="mr-2 h-4 w-4" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
