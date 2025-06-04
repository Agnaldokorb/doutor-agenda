"use client";

import {
  MailIcon,
  CheckCircleIcon,
  XCircleIcon,
  TestTubeIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAction } from "next-safe-action/hooks";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { checkEmailStatus } from "@/actions/check-email-status";

interface EmailStatus {
  emailService: boolean;
  reminderService: boolean;
  message: string;
  details?: {
    provider?: string;
    hasConfiguration?: boolean;
    resendConfigured?: boolean;
    isActive?: boolean;
    fromEmail?: string;
    fromName?: string;
    connectionTest?: boolean;
    clinicId?: string;
    clinicName?: string;
    timestamp?: string;
    error?: string;
  };
}

export const EmailConfigurationCard = () => {
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testMessage, setTestMessage] = useState("");

  const checkStatusAction = useAction(checkEmailStatus);

  // Carregar status do email na inicialização
  useEffect(() => {
    checkEmailService();
  }, []);

  const checkEmailService = async () => {
    try {
      const result = await checkStatusAction.executeAsync();
      if (result?.data) {
        setEmailStatus(result.data);
      }
    } catch (error) {
      console.error("Erro ao verificar status do email:", error);
    }
  };

  const handleTestEmail = async () => {
    setIsTestingEmail(true);
    setTestMessage("");

    try {
      const response = await fetch("/api/email/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "connection",
          email: "test@example.com",
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTestMessage("✅ Teste de conexão bem-sucedido!");
      } else {
        setTestMessage(
          `❌ Falha no teste: ${result.message || "Erro desconhecido"}`,
        );
      }
    } catch (error) {
      console.error("Erro ao testar email:", error);
      setTestMessage("❌ Erro inesperado ao testar conexão");
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleSendTestEmail = async () => {
    setIsTestingEmail(true);
    setTestMessage("");

    const testEmail = prompt("Digite o email para receber o teste:");
    if (!testEmail) {
      setIsTestingEmail(false);
      return;
    }

    try {
      const response = await fetch("/api/email/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "confirmation",
          email: testEmail,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTestMessage(`✅ Email de teste enviado para ${testEmail}!`);
      } else {
        setTestMessage(
          `❌ Falha ao enviar: ${result.message || "Erro desconhecido"}`,
        );
      }
    } catch (error) {
      console.error("Erro ao enviar email de teste:", error);
      setTestMessage("❌ Erro inesperado ao enviar email");
    } finally {
      setIsTestingEmail(false);
    }
  };

  const getProviderInfo = () => {
    const resendConfigured = emailStatus?.details?.resendConfigured || false;

    if (resendConfigured) {
      return { name: "Resend", modern: true, recommended: true };
    } else {
      return { name: "Não configurado", modern: false, recommended: false };
    }
  };

  const providerInfo = getProviderInfo();

  return (
    <>
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MailIcon className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-blue-900">
                Configurações de Email
              </CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge
                variant={emailStatus?.emailService ? "default" : "destructive"}
                className={`${emailStatus?.emailService ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              >
                {emailStatus?.emailService ? (
                  <CheckCircleIcon className="mr-1 h-3 w-3" />
                ) : (
                  <XCircleIcon className="mr-1 h-3 w-3" />
                )}
                {emailStatus?.emailService ? "Ativo" : "Inativo"}
              </Badge>

              <Badge
                variant={providerInfo.recommended ? "default" : "secondary"}
                className={`${providerInfo.modern ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}
              >
                {providerInfo.name}
              </Badge>
            </div>
          </div>
          <CardDescription className="text-blue-700">
            Configure o serviço de envio de emails para confirmações e lembretes
            de agendamentos.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status do serviço */}
          {emailStatus && (
            <div className="rounded-md border border-blue-200 bg-white p-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">
                    Status do Serviço
                  </p>
                  <p className="text-sm text-gray-600">{emailStatus.message}</p>

                  {emailStatus.details?.fromEmail && (
                    <p className="text-xs text-gray-500">
                      Email: {emailStatus.details.fromEmail}
                    </p>
                  )}
                </div>

                <div className="text-right text-xs text-gray-500">
                  {emailStatus.details?.clinicName && (
                    <div>Clínica: {emailStatus.details.clinicName}</div>
                  )}
                  {emailStatus.details?.timestamp && (
                    <div>
                      Atualizado:{" "}
                      {new Date(emailStatus.details.timestamp).toLocaleString(
                        "pt-BR",
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Mensagem de teste */}
          {testMessage && (
            <Alert>
              <AlertDescription>{testMessage}</AlertDescription>
            </Alert>
          )}

          {/* Botões de ação */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestEmail}
              disabled={isTestingEmail}
              className="flex items-center space-x-2"
            >
              <TestTubeIcon className="h-4 w-4" />
              <span>Testar Conexão</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSendTestEmail}
              disabled={isTestingEmail}
              className="flex items-center space-x-2"
            >
              <MailIcon className="h-4 w-4" />
              <span>Enviar Teste</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={checkEmailService}
              disabled={checkStatusAction.isPending}
              className="flex items-center space-x-2"
            >
              <span>Atualizar Status</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
