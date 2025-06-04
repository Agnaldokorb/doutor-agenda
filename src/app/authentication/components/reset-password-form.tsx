"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormControl, FormMessage } from "@/components/ui/form";
import { FormItem, FormLabel } from "@/components/ui/form";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { resetPassword, validateResetToken } from "@/actions/reset-password";

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token é obrigatório"),
    newPassword: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "A senha deve conter ao menos uma letra maiúscula, uma minúscula e um número",
      ),
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

interface ResetPasswordFormProps {
  token: string;
}

const ResetPasswordForm = ({ token }: ResetPasswordFormProps) => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValidation, setTokenValidation] = useState<{
    valid: boolean;
    user?: { name: string; email: string };
    message?: string;
    loading: boolean;
  }>({ valid: false, loading: true });

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Validar token ao carregar
  const { execute: validateToken } = useAction(validateResetToken, {
    onSuccess: (data) => {
      if (data?.data?.valid) {
        setTokenValidation({
          valid: true,
          user: data.data.user,
          loading: false,
        });
      } else {
        setTokenValidation({
          valid: false,
          message: data?.data?.message || "Token inválido",
          loading: false,
        });
      }
    },
    onError: () => {
      setTokenValidation({
        valid: false,
        message: "Erro ao validar token",
        loading: false,
      });
    },
  });

  const { execute, isExecuting } = useAction(resetPassword, {
    onSuccess: (data) => {
      if (data?.data?.success) {
        toast.success(data.data.message);
        setTimeout(() => {
          router.push("/authentication");
        }, 2000);
      } else {
        toast.error(data?.data?.message || "Erro ao redefinir senha");
      }
    },
    onError: (error) => {
      toast.error(
        error?.error?.serverError ||
          "Erro interno. Tente novamente mais tarde.",
      );
    },
  });

  useEffect(() => {
    if (token) {
      validateToken({ token });
    }
  }, [token, validateToken]);

  const handleSubmit = async (values: z.infer<typeof resetPasswordSchema>) => {
    execute(values);
  };

  if (tokenValidation.loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Card className="w-[400px]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Validando token...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tokenValidation.valid) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Token Inválido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                {tokenValidation.message ||
                  "O link de recuperação é inválido ou expirou."}
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => router.push("/authentication")}
              className="w-full"
            >
              Voltar ao Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <Card className="w-[400px]">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Redefinir Senha
              </CardTitle>
              <CardDescription>
                Olá, <strong>{tokenValidation.user?.name}</strong>! Defina sua
                nova senha abaixo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Digite sua nova senha"
                          type={showPassword ? "text" : "password"}
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
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
                          placeholder="Confirme sua nova senha"
                          type={showConfirmPassword ? "text" : "password"}
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Alert>
                <AlertDescription>
                  <strong>Requisitos da senha:</strong>
                  <ul className="mt-2 list-inside list-disc text-sm">
                    <li>Mínimo 8 caracteres</li>
                    <li>Pelo menos uma letra maiúscula</li>
                    <li>Pelo menos uma letra minúscula</li>
                    <li>Pelo menos um número</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <div className="w-full space-y-2">
                <Button type="submit" className="w-full" disabled={isExecuting}>
                  {isExecuting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redefinindo...
                    </>
                  ) : (
                    "Redefinir Senha"
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  type="button"
                  onClick={() => router.push("/authentication")}
                >
                  Cancelar
                </Button>
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default ResetPasswordForm;
