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
  userType: z.enum(["admin", "atendente"], {
    message: "Selecione um tipo de usuário",
  }),
});

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

      // Verifica se há um erro do servidor
      if (error.error?.serverError) {
        toast.error(error.error.serverError);
        return;
      }

      // Verifica se há erros de validação
      if (error.error?.validationErrors) {
        const validationErrors = error.error.validationErrors;
        const firstError =
          validationErrors._errors?.[0] ||
          validationErrors.name?._errors?.[0] ||
          validationErrors.email?._errors?.[0] ||
          validationErrors.password?._errors?.[0] ||
          validationErrors.userType?._errors?.[0];

        if (firstError) {
          toast.error(firstError);
          return;
        }
      }

      toast.error("Erro ao criar usuário");
    },
  });

  const onSubmit = async (values: z.infer<typeof createUserFormSchema>) => {
    console.log("📊 Dados do formulário:", values);

    const payload = {
      name: values.name,
      email: values.email,
      password: values.password,
      userType: values.userType,
    } as Parameters<typeof createUserAction.execute>[0];

    await createUserAction.execute(payload);
  };

  const userTypeOptions = [
    { value: "admin", label: "Administrador" },
    { value: "atendente", label: "Atendente" },
  ] as const;

  return (
    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
      <DialogHeader className="space-y-1">
        <DialogTitle>Criar Novo Usuário</DialogTitle>
        <DialogDescription>
          Preencha as informações para criar um novo usuário administrativo.
          Para criar médicos, utilize a página de Gerenciamento de Médicos.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Informações Básicas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Informações do Usuário
              </CardTitle>
              <CardDescription className="text-sm">
                Dados pessoais e credenciais do usuário
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {/* Nome */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Nome completo *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Digite o nome completo"
                          className="h-9"
                          {...field}
                        />
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
                      <FormLabel className="text-sm">E-mail *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Digite o e-mail"
                          className="h-9"
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
                      <FormLabel className="text-sm">Senha *</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Mínimo 8 caracteres"
                          className="h-9"
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
                      <FormLabel className="text-sm">
                        Tipo de usuário *
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-9">
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

              {/* Informações sobre tipos de usuário */}
              <div className="mt-4 rounded-lg border bg-blue-50/50 p-3">
                <h4 className="mb-2 text-sm font-medium text-blue-900">
                  📋 Sobre os tipos de usuário:
                </h4>
                <div className="space-y-1 text-xs text-blue-800">
                  <div>
                    <span className="font-medium">Administrador:</span> Acesso
                    completo ao sistema, incluindo configurações e gerenciamento
                    de usuários
                  </div>
                  <div>
                    <span className="font-medium">Atendente:</span> Acesso para
                    gerenciar agendamentos, pacientes e consultas
                  </div>
                  <div>
                    <span className="font-medium">Médico:</span> Deve ser criado
                    na página &quot;Gerenciamento de Médicos&quot; com
                    informações específicas
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="pt-3">
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
