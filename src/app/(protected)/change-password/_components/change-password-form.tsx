"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon, KeyIcon, LockIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { changePassword } from "@/actions/change-password";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Senha atual é obrigatória"),
    newPassword: z
      .string()
      .min(6, "Nova senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

interface ChangePasswordFormProps {
  isObligatory?: boolean;
}

export const ChangePasswordForm = ({
  isObligatory = false,
}: ChangePasswordFormProps) => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();
  const session = authClient.useSession();

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePasswordAction = useAction(changePassword, {
    onSuccess: (data) => {
      toast.success(data.message);
      form.reset();

      if (isObligatory) {
        // Determinar para onde redirecionar baseado no tipo de usuário
        const userType = session.data?.user?.userType;

        if (userType === "doctor") {
          // Redirecionar para o dashboard do médico
          router.push("/doctor-dashboard");
        } else {
          // Para outros tipos de usuário, redirecionar para o dashboard geral
          router.push("/dashboard");
        }
      } else {
        router.push("/dashboard");
      }
    },
    onError: (error) => {
      console.error("Erro ao alterar senha:", error);
      toast.error(error.serverError || "Erro ao alterar senha");
    },
  });

  const onSubmit = (values: ChangePasswordFormData) => {
    changePasswordAction.execute(values);
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Card className={isObligatory ? "border-orange-200 bg-orange-50" : ""}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <KeyIcon className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-xl font-bold">
            {isObligatory ? "Alteração de Senha Obrigatória" : "Alterar Senha"}
          </CardTitle>
          <CardDescription>
            {isObligatory
              ? "Por segurança, você deve alterar sua senha antes de continuar."
              : "Altere sua senha de acesso ao sistema."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha Atual</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="Digite sua senha atual"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                          className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showCurrentPassword ? (
                            <EyeOffIcon className="h-4 w-4" />
                          ) : (
                            <EyeIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Digite sua nova senha"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showNewPassword ? (
                            <EyeOffIcon className="h-4 w-4" />
                          ) : (
                            <EyeIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Nova Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirme sua nova senha"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showConfirmPassword ? (
                            <EyeOffIcon className="h-4 w-4" />
                          ) : (
                            <EyeIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col space-y-2 pt-4">
                <Button
                  type="submit"
                  disabled={changePasswordAction.isExecuting}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  {changePasswordAction.isExecuting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Alterando...
                    </>
                  ) : (
                    <>
                      <LockIcon className="mr-2 h-4 w-4" />
                      Alterar Senha
                    </>
                  )}
                </Button>

                {!isObligatory && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                    className="w-full"
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isObligatory && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-start space-x-3">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100">
              <div className="h-2 w-2 rounded-full bg-orange-600" />
            </div>
            <div className="flex-1 text-sm">
              <p className="font-medium text-orange-800">
                Primeira vez no sistema?
              </p>
              <p className="mt-1 text-orange-700">
                Por questões de segurança, é necessário alterar a senha padrão
                antes de acessar o sistema.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
