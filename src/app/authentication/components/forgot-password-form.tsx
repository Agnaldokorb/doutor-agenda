"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft,Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { forgotPassword } from "@/actions/forgot-password";
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

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "E-mail é obrigatório" })
    .email({ message: "E-mail inválido" }),
});

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

const ForgotPasswordForm = ({ onBackToLogin }: ForgotPasswordFormProps) => {
  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const { execute, isExecuting } = useAction(forgotPassword, {
    onSuccess: (data) => {
      if (data?.data?.success) {
        toast.success(data.data.message);
        form.reset();
      } else {
        toast.error(data?.data?.message || "Erro ao enviar email");
      }
    },
    onError: (error) => {
      toast.error(
        error?.error?.serverError ||
          "Erro interno. Tente novamente mais tarde.",
      );
    },
  });

  const handleSubmit = async (values: z.infer<typeof forgotPasswordSchema>) => {
    execute(values);
  };

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onBackToLogin}
                className="h-auto p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              Esqueci Minha Senha
            </CardTitle>
            <CardDescription>
              Digite seu e-mail para receber as instruções de recuperação.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Digite seu e-mail"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <div className="w-full space-y-2">
              <Button type="submit" className="w-full" disabled={isExecuting}>
                {isExecuting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Instruções"
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                type="button"
                onClick={onBackToLogin}
              >
                Voltar ao Login
              </Button>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default ForgotPasswordForm;
