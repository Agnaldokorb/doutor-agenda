"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircleIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  InfoIcon,
  MailIcon,
  SendIcon,
  SettingsIcon,
  TestTubeIcon,
  XCircleIcon,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  testEmailConfiguration,
  updateEmailSettings,
} from "@/actions/update-email-settings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const emailSettingsSchema = z.object({
  apiKey: z.string().min(1, "API Key é obrigatória"),
  fromEmail: z.string().email("Email de origem inválido"),
  fromName: z.string().min(1, "Nome de origem é obrigatório"),
});

type EmailSettingsForm = z.infer<typeof emailSettingsSchema>;

const testEmailSchema = z.object({
  type: z.enum([
    "connection",
    "confirmation",
    "reminder",
    "cancellation",
    "update",
  ]),
  testEmail: z.string().email("Email para teste inválido"),
});

type TestEmailForm = z.infer<typeof testEmailSchema>;

interface ValidatedSettings {
  fromEmail: string;
  fromName: string;
  apiKey?: string;
}

export const EmailConfigurationForm = () => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [validatedSettings, setValidatedSettings] =
    useState<ValidatedSettings | null>(null);

  // Verificar se está configurado atualmente
  const isConfigured =
    typeof window !== "undefined"
      ? document.cookie.includes("sendgrid_configured=true")
      : false;

  // Form para configurações principais
  const settingsForm = useForm<EmailSettingsForm>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      apiKey: "",
      fromEmail: "",
      fromName: "Doutor Agenda",
    },
  });

  // Form para testes
  const testForm = useForm<TestEmailForm>({
    resolver: zodResolver(testEmailSchema),
    defaultValues: {
      type: "connection",
      testEmail: "",
    },
  });

  // Actions
  const { execute: executeUpdateSettings, isExecuting: isUpdating } = useAction(
    updateEmailSettings,
    {
      onSuccess: ({ data }) => {
        toast.success(data?.message || "Configurações validadas!");
        setTestResults((prev) => ({ ...prev, settings: true }));
        if (data?.settings) {
          setValidatedSettings(data.settings as ValidatedSettings);
        }

        // Definir cookie para indicar que está configurado
        if (typeof window !== "undefined") {
          document.cookie = "sendgrid_configured=true; path=/";
        }
      },
      onError: ({ error }) => {
        toast.error(error.serverError || "Erro ao validar configurações");
        setTestResults((prev) => ({ ...prev, settings: false }));
        setValidatedSettings(null);
      },
    },
  );

  const { execute: executeTestEmail, isExecuting: isTesting } = useAction(
    testEmailConfiguration,
    {
      onSuccess: ({ data, input }) => {
        toast.success(data?.message || "Teste realizado com sucesso!");
        if (input?.type) {
          setTestResults((prev) => ({ ...prev, [input.type]: true }));
        }
      },
      onError: ({ error, input }) => {
        toast.error(error.serverError || "Erro no teste");
        if (input?.type) {
          setTestResults((prev) => ({ ...prev, [input.type]: false }));
        }
      },
    },
  );

  const handleSaveSettings = (data: EmailSettingsForm) => {
    executeUpdateSettings(data);
  };

  const handleTestEmail = (data: TestEmailForm) => {
    executeTestEmail(data);
  };

  const getTestStatus = (type: string) => {
    if (testResults[type] === true) {
      return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
    }
    if (testResults[type] === false) {
      return <XCircleIcon className="h-4 w-4 text-red-600" />;
    }
    return null;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  return (
    <div className="space-y-6">
      {/* Status da Configuração */}
      <Card
        className={`border-2 ${isConfigured ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}`}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MailIcon
                className={`h-5 w-5 ${isConfigured ? "text-green-600" : "text-orange-600"}`}
              />
              <CardTitle
                className={isConfigured ? "text-green-900" : "text-orange-900"}
              >
                Status da Configuração de Email
              </CardTitle>
            </div>
            <Badge variant={isConfigured ? "default" : "destructive"}>
              {isConfigured ? "Configurado" : "Não Configurado"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              {isConfigured
                ? "✅ Sistema de email configurado e pronto para usar"
                : "⚠️ Configure as credenciais do SendGrid para ativar os emails"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Instruções */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <InfoIcon className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-900">Como Configurar</CardTitle>
          </div>
          <CardDescription className="text-blue-700">
            Siga estas etapas para configurar o SendGrid
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="space-y-2">
              <p className="font-medium text-blue-900">
                1. Obtenha uma API Key do SendGrid:
              </p>
              <p className="text-blue-800">
                • Acesse{" "}
                <a
                  href="https://app.sendgrid.com/"
                  target="_blank"
                  className="underline hover:text-blue-600"
                >
                  SendGrid Console
                </a>
              </p>
              <p className="text-blue-800">
                • Vá para Settings → API Keys → Create API Key
              </p>
              <p className="text-blue-800">
                • Escolha &quot;Full Access&quot; ou configure permissões
                específicas
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-blue-900">
                2. Teste as configurações abaixo:
              </p>
              <p className="text-blue-800">
                • Use o formulário para validar suas credenciais
              </p>
              <p className="text-blue-800">
                • Teste os diferentes tipos de email
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-blue-900">
                3. Configure no servidor (.env):
              </p>
              <p className="text-blue-800">
                • Adicione as variáveis no arquivo .env do servidor
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerta sobre Erro 403 */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <XCircleIcon className="h-5 w-5 text-red-600" />
            <CardTitle className="text-red-900">Solução de Problemas</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <p className="mb-1 font-medium text-red-900">
                Erro 403 (Forbidden):
              </p>
              <ul className="ml-4 space-y-1 text-red-800">
                <li>• Verifique se a API Key está correta</li>
                <li>
                  • Confirme se a API Key tem permissões &quot;Full Access&quot;
                </li>
                <li>
                  • Verifique se o email de origem está verificado no SendGrid
                </li>
                <li>
                  • Teste com um domínio verificado (ex: noreply@seudominio.com)
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-1 font-medium text-red-900">
                Dicas importantes:
              </p>
              <ul className="ml-4 space-y-1 text-red-800">
                <li>• Use um domínio próprio para melhor deliverability</li>
                <li>• Configure autenticação de domínio no SendGrid</li>
                <li>
                  • Evite usar emails gratuitos (gmail, hotmail) como remetente
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Configurações */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <SettingsIcon className="h-5 w-5 text-blue-600" />
            <CardTitle>Configurações do SendGrid</CardTitle>
          </div>
          <CardDescription>
            Configure e teste as credenciais do SendGrid
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={settingsForm.handleSubmit(handleSaveSettings)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key do SendGrid</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  placeholder="SG.xxxxxxxxxxxxxxxxxxxx"
                  {...settingsForm.register("apiKey")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-1/2 right-2 h-8 w-8 -translate-y-1/2"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {settingsForm.formState.errors.apiKey && (
                <p className="text-sm text-red-600">
                  {settingsForm.formState.errors.apiKey.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fromEmail">Email de Origem</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  placeholder="noreply@suaclinica.com"
                  {...settingsForm.register("fromEmail")}
                />
                {settingsForm.formState.errors.fromEmail && (
                  <p className="text-sm text-red-600">
                    {settingsForm.formState.errors.fromEmail.message}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Use preferencialmente um domínio próprio verificado
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fromName">Nome de Origem</Label>
                <Input
                  id="fromName"
                  placeholder="Doutor Agenda"
                  {...settingsForm.register("fromName")}
                />
                {settingsForm.formState.errors.fromName && (
                  <p className="text-sm text-red-600">
                    {settingsForm.formState.errors.fromName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Validando..." : "Validar Configurações"}
              </Button>
              {getTestStatus("settings")}
            </div>
          </form>

          {/* Configurações Validadas */}
          {validatedSettings && (
            <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
              <h4 className="mb-2 font-medium text-green-900">
                ✅ Configurações Validadas
              </h4>
              <p className="mb-3 text-sm text-green-800">
                Adicione estas variáveis ao arquivo{" "}
                <code className="rounded bg-green-100 px-1">.env</code> do
                servidor:
              </p>
              <div className="space-y-2">
                {[
                  {
                    key: "SENDGRID_API_KEY",
                    value: settingsForm.getValues("apiKey"),
                  },
                  {
                    key: "SENDGRID_FROM_EMAIL",
                    value: validatedSettings.fromEmail,
                  },
                  {
                    key: "SENDGRID_FROM_NAME",
                    value: validatedSettings.fromName,
                  },
                  {
                    key: "NEXT_PUBLIC_APP_URL",
                    value: "https://seudominio.com",
                  },
                ].map((env) => (
                  <div
                    key={env.key}
                    className="flex items-center justify-between rounded border border-green-200 bg-white p-2"
                  >
                    <code className="font-mono text-sm">
                      {env.key}=
                      {env.key === "SENDGRID_API_KEY"
                        ? "SG.***************"
                        : env.value}
                    </code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(`${env.key}=${env.value}`)}
                    >
                      <CopyIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Testes de Email */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <TestTubeIcon className="h-5 w-5 text-purple-600" />
            <CardTitle>Testes de Email</CardTitle>
          </div>
          <CardDescription>
            Teste os diferentes tipos de email que o sistema envia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={testForm.handleSubmit(handleTestEmail)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="emailType">Tipo de Email</Label>
                <Select
                  onValueChange={(value) =>
                    testForm.setValue("type", value as TestEmailForm["type"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="connection">
                      🔗 Teste de Conexão
                    </SelectItem>
                    <SelectItem value="confirmation">
                      ✅ Confirmação de Agendamento
                    </SelectItem>
                    <SelectItem value="reminder">⏰ Lembrete 24h</SelectItem>
                    <SelectItem value="cancellation">
                      ❌ Cancelamento
                    </SelectItem>
                    <SelectItem value="update">🔄 Reagendamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="testEmail">Email para Teste</Label>
                <Input
                  id="testEmail"
                  type="email"
                  placeholder="seuemail@teste.com"
                  {...testForm.register("testEmail")}
                />
                {testForm.formState.errors.testEmail && (
                  <p className="text-sm text-red-600">
                    {testForm.formState.errors.testEmail.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button type="submit" disabled={isTesting} variant="outline">
                <SendIcon className="mr-2 h-4 w-4" />
                {isTesting ? "Enviando..." : "Enviar Teste"}
              </Button>
              {getTestStatus(testForm.watch("type"))}
            </div>
          </form>

          {/* Status dos Testes */}
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
            {[
              { key: "connection", label: "Conexão", icon: "🔗" },
              { key: "confirmation", label: "Confirmação", icon: "✅" },
              { key: "reminder", label: "Lembrete", icon: "⏰" },
              { key: "cancellation", label: "Cancelamento", icon: "❌" },
              { key: "update", label: "Reagendamento", icon: "🔄" },
            ].map((test) => (
              <div
                key={test.key}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  testResults[test.key] === true
                    ? "border-green-200 bg-green-50"
                    : testResults[test.key] === false
                      ? "border-red-200 bg-red-50"
                      : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>{test.icon}</span>
                  <span className="text-sm font-medium">{test.label}</span>
                </div>
                {getTestStatus(test.key)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
