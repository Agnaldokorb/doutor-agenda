"use client";

import {
  CheckCircleIcon,
  EyeIcon,
  LockIcon,
  RefreshCwIcon,
  SettingsIcon,
  ShieldIcon,
  XCircleIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { getSecurityConfiguration } from "@/actions/get-security-configuration";
import { getSecurityLogs } from "@/actions/get-security-logs";
import { updateSecurityConfiguration } from "@/actions/update-security-configuration";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";

const configurationSchema = z.object({
  enableLoginLogging: z.boolean(),
  enableDataAccessLogging: z.boolean(),
  enableConfigurationLogging: z.boolean(),
  logRetentionDays: z.number().min(1).max(365),
  sessionTimeoutMinutes: z.number().min(30).max(1440),
  maxConcurrentSessions: z.number().min(1).max(20),
  requirePasswordChange: z.boolean(),
  passwordChangeIntervalDays: z.number().min(30).max(365),
  notifyFailedLogins: z.boolean(),
  notifyNewLogins: z.boolean(),
});

type ConfigurationForm = z.infer<typeof configurationSchema>;

export const SecurityConfigurationCard = () => {
  const router = useRouter();
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Actions
  const getConfigAction = useAction(getSecurityConfiguration, {
    onSuccess: (data) => {
      console.log("✅ Configurações carregadas:", data.configuration);
      if (data.configuration) {
        form.reset({
          enableLoginLogging: data.configuration.enableLoginLogging,
          enableDataAccessLogging: data.configuration.enableDataAccessLogging,
          enableConfigurationLogging:
            data.configuration.enableConfigurationLogging,
          logRetentionDays: data.configuration.logRetentionDays,
          sessionTimeoutMinutes: data.configuration.sessionTimeoutMinutes,
          maxConcurrentSessions: data.configuration.maxConcurrentSessions,
          requirePasswordChange: data.configuration.requirePasswordChange,
          passwordChangeIntervalDays:
            data.configuration.passwordChangeIntervalDays || 90,
          notifyFailedLogins: data.configuration.notifyFailedLogins,
          notifyNewLogins: data.configuration.notifyNewLogins,
        });
      }
    },
    onError: (error) => {
      console.error("❌ Erro ao carregar configurações:", error);
      toast.error("Erro ao carregar configurações de segurança");
    },
  });

  const getLogsAction = useAction(getSecurityLogs, {
    onSuccess: (data) => {
      console.log(
        "✅ Estatísticas de logs carregadas:",
        data?.logs?.length || 0,
      );
    },
    onError: (error) => {
      console.error("❌ Erro ao carregar logs:", error);
    },
  });

  const updateConfigAction = useAction(updateSecurityConfiguration, {
    onSuccess: () => {
      toast.success("Configurações de segurança atualizadas com sucesso!");
      setIsConfigModalOpen(false);
      getConfigAction.execute();
      getLogsAction.execute({ days: 30, limit: 10 });
    },
    onError: (error) => {
      console.error("❌ Erro ao atualizar configurações:", error);
      toast.error("Erro ao atualizar configurações de segurança");
    },
  });

  // Form
  const form = useForm<ConfigurationForm>({
    resolver: zodResolver(configurationSchema),
    defaultValues: {
      enableLoginLogging: true,
      enableDataAccessLogging: true,
      enableConfigurationLogging: true,
      logRetentionDays: 90,
      sessionTimeoutMinutes: 480,
      maxConcurrentSessions: 5,
      requirePasswordChange: false,
      passwordChangeIntervalDays: 90,
      notifyFailedLogins: true,
      notifyNewLogins: false,
    },
  });

  // Load data on mount
  useEffect(() => {
    getConfigAction.execute();
    getLogsAction.execute({ days: 30, limit: 10 });
  }, []);

  const configuration = getConfigAction.result?.data?.configuration;
  const logs = getLogsAction.result?.data?.logs || [];
  const activeUsers = logs.filter((log) => log.type === "login").length;
  const totalLogs = logs.length;

  const onSubmit = (values: ConfigurationForm) => {
    updateConfigAction.execute(values);
  };

  const handleViewLogs = () => {
    router.push("/configurations/security-logs");
  };

  return (
    <>
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <ShieldIcon className="h-5 w-5 text-red-600" />
            <CardTitle className="text-red-900">
              Configurações de Segurança
            </CardTitle>
          </div>
          <CardDescription className="text-red-700">
            Gerencie aspectos de segurança e autenticação da clínica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Estatísticas */}
            <div className="rounded-lg border border-red-200 bg-white p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <LockIcon className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-gray-900">
                      Sessões ativas
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-red-600">
                      {activeUsers} usuários
                    </span>
                    {getLogsAction.isExecuting && (
                      <RefreshCwIcon className="h-3 w-3 animate-spin text-gray-400" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <EyeIcon className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-gray-900">
                      Logs de segurança
                    </span>
                  </div>
                  <span className="text-sm font-medium text-red-600">
                    {totalLogs} entradas
                  </span>
                </div>

                {/* Status das configurações */}
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Log de logins</span>
                    {configuration?.enableLoginLogging ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Log de dados</span>
                    {configuration?.enableDataAccessLogging ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Retenção</span>
                    <Badge variant="outline" className="text-xs">
                      {configuration?.logRetentionDays || 90} dias
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-100"
                onClick={handleViewLogs}
                disabled={getLogsAction.isExecuting}
              >
                <EyeIcon className="mr-2 h-4 w-4" />
                Ver Logs
              </Button>
              <Button
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-100"
                onClick={() => setIsConfigModalOpen(true)}
                disabled={getConfigAction.isExecuting}
              >
                <SettingsIcon className="mr-2 h-4 w-4" />
                Configurar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Configurações */}
      <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <ShieldIcon className="h-5 w-5" />
              <span>Configurações de Segurança</span>
            </DialogTitle>
            <DialogDescription>
              Configure as políticas de segurança e logging da clínica
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Configurações de Log */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Configurações de Log</h3>

                <FormField
                  control={form.control}
                  name="enableLoginLogging"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Log de Login/Logout
                        </FormLabel>
                        <FormDescription>
                          Registrar tentativas de login e logout dos usuários
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="enableDataAccessLogging"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Log de Acesso a Dados
                        </FormLabel>
                        <FormDescription>
                          Registrar acessos a dados sensíveis (prontuários,
                          relatórios)
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="enableConfigurationLogging"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Log de Configurações
                        </FormLabel>
                        <FormDescription>
                          Registrar alterações nas configurações do sistema
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="logRetentionDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Retenção de Logs (dias)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={365}
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Número de dias para manter os logs armazenados
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Configurações de Sessão */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Configurações de Sessão
                </h3>

                <FormField
                  control={form.control}
                  name="sessionTimeoutMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timeout de Sessão (minutos)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={30}
                          max={1440}
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Tempo limite para inatividade antes do logout automático
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxConcurrentSessions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Máximo de Sessões Simultâneas</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={20}
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Número máximo de sessões simultâneas por usuário
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Configurações de Senha */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Configurações de Senha
                </h3>

                <FormField
                  control={form.control}
                  name="requirePasswordChange"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Forçar Alteração Periódica
                        </FormLabel>
                        <FormDescription>
                          Exigir que usuários alterem suas senhas periodicamente
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("requirePasswordChange") && (
                  <FormField
                    control={form.control}
                    name="passwordChangeIntervalDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Intervalo para Alteração (dias)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={30}
                            max={365}
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Frequência obrigatória para alteração de senhas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <Separator />

              {/* Configurações de Notificações */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Notificações de Segurança
                </h3>

                <FormField
                  control={form.control}
                  name="notifyFailedLogins"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Notificar Tentativas de Login Falharam
                        </FormLabel>
                        <FormDescription>
                          Enviar notificações quando há tentativas de login
                          falharam
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notifyNewLogins"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Notificar Novos Logins
                        </FormLabel>
                        <FormDescription>
                          Enviar notificações quando há novos logins
                          bem-sucedidos
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsConfigModalOpen(false)}
                  disabled={updateConfigAction.isExecuting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateConfigAction.isExecuting}>
                  {updateConfigAction.isExecuting ? (
                    <>
                      <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Configurações"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};
