"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createUser } from "@/actions/create-user";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const createUserFormSchema = z.object({
  name: z.string().trim().min(1, { message: "Nome é obrigatório" }),
  email: z
    .string()
    .trim()
    .min(1, { message: "E-mail é obrigatório" })
    .email({ message: "E-mail inválido" }),
  password: z
    .string()
    .trim()
    .min(8, { message: "A senha deve ter pelo menos 8 caracteres" }),
  userType: z.enum(["admin", "doctor", "atendente"], {
    message: "Selecione um tipo de usuário",
  }),
  // Campos específicos para médicos
  specialty: z.string().trim().optional(),
  appointmentPrice: z.string().optional(),
  availableFromWeekDay: z.string().optional(),
  availableToWeekDay: z.string().optional(),
  availableFromTime: z.string().optional(),
  availableToTime: z.string().optional(),
});

interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  userType: "admin" | "doctor" | "atendente";
  specialty?: string;
  appointmentPriceInCents?: number;
  availableFromWeekDay?: number;
  availableToWeekDay?: number;
  availableFromTime?: string;
  availableToTime?: string;
}

interface CreateUserFormProps {
  onSuccess?: () => void;
}

const CreateUserForm = ({ onSuccess }: CreateUserFormProps) => {
  const form = useForm<z.infer<typeof createUserFormSchema>>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      userType: "atendente",
      specialty: "",
      appointmentPrice: "",
      availableFromWeekDay: "1",
      availableToWeekDay: "5",
      availableFromTime: "08:00",
      availableToTime: "18:00",
    },
  });

  const createUserAction = useAction(createUser, {
    onSuccess: ({ data }) => {
      console.log("✅ Usuário criado:", data);
      toast.success(data?.message || "Usuário criado com sucesso!");
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      console.error("❌ Erro ao criar usuário:", error);
      toast.error("Erro ao criar usuário");
    },
  });

  const watchUserType = form.watch("userType");

  const onSubmit = async (values: z.infer<typeof createUserFormSchema>) => {
    const payload: CreateUserPayload = {
      name: values.name,
      email: values.email,
      password: values.password,
      userType: values.userType,
    };

    // Se for médico, adicionar campos específicos
    if (values.userType === "doctor") {
      payload.specialty = values.specialty;
      payload.appointmentPriceInCents = Math.round(
        parseFloat(values.appointmentPrice || "0") * 100,
      );
      payload.availableFromWeekDay = parseInt(
        values.availableFromWeekDay || "1",
      );
      payload.availableToWeekDay = parseInt(values.availableToWeekDay || "5");
      payload.availableFromTime = values.availableFromTime;
      payload.availableToTime = values.availableToTime;
    }

    await createUserAction.execute(payload);
  };

  const weekDays = [
    { value: "0", label: "Domingo" },
    { value: "1", label: "Segunda" },
    { value: "2", label: "Terça" },
    { value: "3", label: "Quarta" },
    { value: "4", label: "Quinta" },
    { value: "5", label: "Sexta" },
    { value: "6", label: "Sábado" },
  ];

  const userTypeOptions = [
    { value: "admin", label: "Administrador" },
    { value: "doctor", label: "Médico" },
    { value: "atendente", label: "Atendente" },
  ] as const;

  return (
    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Criar Novo Usuário</DialogTitle>
        <DialogDescription>
          Preencha as informações para criar um novo usuário do sistema.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Nome */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Digite o e-mail"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Senha */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha *</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Mínimo 8 caracteres"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo de usuário */}
            <FormField
              control={form.control}
              name="userType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de usuário *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {userTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Campos específicos para médicos */}
          {watchUserType === "doctor" && (
            <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h4 className="font-semibold text-blue-900">
                Informações do Médico
              </h4>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Especialidade */}
                <FormField
                  control={form.control}
                  name="specialty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especialidade *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Cardiologia, Pediatria"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Preço da consulta */}
                <FormField
                  control={form.control}
                  name="appointmentPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço da consulta (R$) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Ex: 150.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Dia da semana - início */}
                <FormField
                  control={form.control}
                  name="availableFromWeekDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disponível de (dia da semana) *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {weekDays.map((day) => (
                            <SelectItem key={day.value} value={day.value}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Dia da semana - fim */}
                <FormField
                  control={form.control}
                  name="availableToWeekDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disponível até (dia da semana) *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {weekDays.map((day) => (
                            <SelectItem key={day.value} value={day.value}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Horário - início */}
                <FormField
                  control={form.control}
                  name="availableFromTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário de início *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Horário - fim */}
                <FormField
                  control={form.control}
                  name="availableToTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário de fim *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={createUserAction.isExecuting}
              className="w-full sm:w-auto"
            >
              {createUserAction.isExecuting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Usuário"
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default CreateUserForm;
