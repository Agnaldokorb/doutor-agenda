"use client";

import { MailIcon, ExternalLinkIcon, CheckCircleIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface ResendConfigurationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigurationSaved: () => void;
}

export const ResendConfigurationForm = ({
  open,
  onOpenChange,
  onConfigurationSaved,
}: ResendConfigurationFormProps) => {
  const [formData, setFormData] = useState({
    apiKey: process.env.RESEND_API_KEY || "",
    fromEmail: process.env.RESEND_FROM_EMAIL || "",
    fromName: process.env.RESEND_FROM_NAME || "Doutor Agenda",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setMessage(""); // Limpar mensagens ao editar
    setTestStatus("idle");
  };

  const handleTestConnection = async () => {
    if (!formData.apiKey) {
      setMessage("❌ Por favor, insira uma API Key válida primeiro");
      return;
    }

    setIsTesting(true);
    setMessage("");
    setTestStatus("idle");

    try {
      // Testar conexão com Resend
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
        setMessage("✅ Conexão Resend testada com sucesso!");
        setTestStatus("success");
      } else {
        setMessage(`❌ Falha no teste: ${result.message || "Erro na conexão"}`);
        setTestStatus("error");
      }
    } catch (error) {
      console.error("Erro ao testar Resend:", error);
      setMessage("❌ Erro inesperado ao testar conexão");
      setTestStatus("error");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendTestEmail = async () => {
    const testEmail = prompt("Digite o email para receber o teste:");
    if (!testEmail) return;

    setIsTesting(true);
    setMessage("");

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
        setMessage(`✅ Email de teste enviado para ${testEmail}!`);
        setTestStatus("success");
      } else {
        setMessage(
          `❌ Falha ao enviar: ${result.message || "Erro desconhecido"}`,
        );
        setTestStatus("error");
      }
    } catch (error) {
      console.error("Erro ao enviar email de teste:", error);
      setMessage("❌ Erro inesperado ao enviar email");
      setTestStatus("error");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!formData.apiKey || !formData.fromEmail) {
      setMessage("❌ Por favor, preencha API Key e Email do Remetente");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      // Salvar no arquivo .env.local (isso seria normalmente feito pelo backend)
      setMessage(
        "⚠️ Configuração do Resend deve ser feita no arquivo .env.local:",
      );
      setTimeout(() => {
        setMessage(`
✅ Adicione estas variáveis no seu .env.local:

RESEND_API_KEY="${formData.apiKey}"
RESEND_FROM_EMAIL="${formData.fromEmail}"
RESEND_FROM_NAME="${formData.fromName}"

Reinicie o servidor após salvar!
        `);
        setTimeout(() => {
          onConfigurationSaved();
        }, 3000);
      }, 1000);
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      setMessage("❌ Erro inesperado ao salvar configuração");
    } finally {
      setIsLoading(false);
    }
  };

  const isApiKeyConfigured = !!process.env.RESEND_API_KEY;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MailIcon className="h-5 w-5 text-blue-600" />
            <span>Configuração Resend</span>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Recomendado
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Configure o Resend para envio de emails - Setup em 2 minutos!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status atual */}
          {isApiKeyConfigured ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircleIcon className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ✅ Resend já está configurado e funcionando!
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertDescription className="text-yellow-800">
                ⚠️ Resend não está configurado. Siga os passos abaixo.
              </AlertDescription>
            </Alert>
          )}

          {/* Passo 1: Criar conta */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              🚀 Passo 1: Criar conta no Resend
            </h3>
            <div className="rounded-lg bg-gray-50 p-4">
              <ol className="list-inside list-decimal space-y-2 text-sm text-gray-700">
                <li>
                  Acesse <strong>resend.com</strong> e clique em "Get Started"
                </li>
                <li>Registre-se com seu email e confirme a verificação</li>
                <li>No dashboard, vá em "API Keys" → "Create API Key"</li>
                <li>
                  Dê um nome (ex: "Doutor Agenda") e selecione "Send emails"
                </li>
                <li>Copie a API key (começa com "re_")</li>
              </ol>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => window.open("https://resend.com", "_blank")}
              >
                <ExternalLinkIcon className="mr-2 h-4 w-4" />
                Abrir Resend.com
              </Button>
            </div>
          </div>

          {/* Passo 2: Configurar variáveis */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              ⚙️ Passo 2: Configurar credenciais
            </h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="apiKey">API Key do Resend *</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={formData.apiKey}
                  onChange={(e) => handleInputChange("apiKey", e.target.value)}
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Obtida no dashboard do Resend → API Keys
                </p>
              </div>

              <div>
                <Label htmlFor="fromEmail">Email do Remetente *</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  placeholder="noreply@seudominio.com ou onboarding@resend.dev"
                  value={formData.fromEmail}
                  onChange={(e) =>
                    handleInputChange("fromEmail", e.target.value)
                  }
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Para teste: use "onboarding@resend.dev" | Para produção:
                  configure seu domínio
                </p>
              </div>

              <div>
                <Label htmlFor="fromName">Nome do Remetente</Label>
                <Input
                  id="fromName"
                  type="text"
                  placeholder="Doutor Agenda"
                  value={formData.fromName}
                  onChange={(e) =>
                    handleInputChange("fromName", e.target.value)
                  }
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Nome amigável que aparecerá nos emails
                </p>
              </div>
            </div>
          </div>

          {/* Mensagens de status */}
          {message && (
            <Alert
              className={
                testStatus === "success"
                  ? "border-green-200 bg-green-50"
                  : testStatus === "error"
                    ? "border-red-200 bg-red-50"
                    : ""
              }
            >
              <AlertDescription
                className={`whitespace-pre-line ${
                  testStatus === "success"
                    ? "text-green-800"
                    : testStatus === "error"
                      ? "text-red-800"
                      : ""
                }`}
              >
                {message}
              </AlertDescription>
            </Alert>
          )}

          {/* Botões de teste */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={isTesting || !formData.apiKey}
            >
              {isTesting ? "Testando..." : "Testar Conexão"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSendTestEmail}
              disabled={isTesting || !formData.apiKey}
            >
              {isTesting ? "Enviando..." : "Enviar Email Teste"}
            </Button>
          </div>

          {/* Informações importantes */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h4 className="mb-2 font-semibold text-blue-900">
              📋 Instruções finais:
            </h4>
            <ol className="list-inside list-decimal space-y-1 text-sm text-blue-800">
              <li>
                Adicione as variáveis no arquivo{" "}
                <code className="rounded bg-blue-100 px-1">.env.local</code>
              </li>
              <li>Reinicie o servidor de desenvolvimento</li>
              <li>Teste o envio de email</li>
              <li>Para produção, configure seu próprio domínio no Resend</li>
            </ol>
          </div>

          {/* Vantagens do Resend */}
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <h4 className="mb-2 font-semibold text-green-900">
              ✅ Vantagens do Resend:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-green-800">
              <div>• Zero configuração SMTP</div>
              <div>• 99%+ entregabilidade</div>
              <div>• 3.000 emails/mês grátis</div>
              <div>• Dashboard com logs</div>
              <div>• API HTTP simples</div>
              <div>• Sem senhas de app</div>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-between border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>

          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={() => window.open("https://resend.com/docs", "_blank")}
            >
              <ExternalLinkIcon className="mr-2 h-4 w-4" />
              Documentação
            </Button>

            <Button
              onClick={handleSave}
              disabled={isLoading || !formData.apiKey || !formData.fromEmail}
            >
              {isLoading ? "Salvando..." : "Salvar Configuração"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
