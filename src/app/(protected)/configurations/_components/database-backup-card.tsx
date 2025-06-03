"use client";

import {
  AlertTriangleIcon,
  ArchiveIcon,
  ClockIcon,
  DatabaseIcon,
  DownloadIcon,
  RefreshCwIcon,
  ShieldIcon,
  UploadIcon,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { createBackup } from "@/actions/create-backup";
import { getDatabaseStats } from "@/actions/get-database-stats";
import { restoreBackup } from "@/actions/restore-backup";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export const DatabaseBackupCard = ({
  triggerBackup = false,
}: {
  triggerBackup?: boolean;
}) => {
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para controlar se o backup já foi disparado
  const [backupTriggered, setBackupTriggered] = useState(false);

  // Actions
  const getStatsAction = useAction(getDatabaseStats, {
    onSuccess: (data) => {
      console.log("✅ Estatísticas do banco carregadas:", data?.data?.stats);
    },
    onError: (error) => {
      console.error("❌ Erro ao carregar estatísticas:", error);
      toast.error("Erro ao carregar estatísticas do banco");
    },
  });

  const createBackupAction = useAction(createBackup, {
    onSuccess: (result) => {
      console.log("✅ Backup criado - resultado completo:", result);
      console.log("✅ Data:", result.data);
      console.log("✅ Filename:", result.data?.filename);
      console.log("✅ Statistics:", result.data?.statistics);

      if (!result.data?.backup || !result.data?.filename) {
        console.error(
          "❌ Dados do backup ou filename não encontrados:",
          result,
        );
        toast.error("Erro: dados do backup não encontrados");
        return;
      }

      const stats = result.data.statistics;
      const compressionInfo = stats?.compressionRatio
        ? ` (${stats.compressionRatio} de compressão)`
        : "";

      toast.success(`Backup ZIP criado com sucesso!${compressionInfo}`);

      // Converter base64 de volta para bytes e criar blob
      const base64String = result.data.backup;
      const binaryString = atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], {
        type: "application/zip",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsBackupModalOpen(false);
      getStatsAction.execute(); // Recarregar estatísticas
    },
    onError: (error) => {
      console.error("❌ Erro ao criar backup:", error);
      toast.error("Erro ao criar backup dos dados");
    },
  });

  const restoreBackupAction = useAction(restoreBackup, {
    onSuccess: (result) => {
      console.log("✅ Backup restaurado:", result.data);
      const format = result.data?.format || "arquivo";
      const counts = result.data?.restoredCounts;
      const message = counts
        ? `Backup ${format} restaurado! Médicos: ${counts.doctors}, Pacientes: ${counts.patients}, Agendamentos: ${counts.appointments}, Prontuários: ${counts.medicalRecords}`
        : `Backup ${format} restaurado com sucesso!`;

      toast.success(message);
      setIsRestoreModalOpen(false);
      getStatsAction.execute(); // Recarregar estatísticas
    },
    onError: (error) => {
      console.error("❌ Erro ao restaurar backup:", error);
      toast.error("Erro ao restaurar backup");
    },
  });

  // Carregar dados na inicialização
  useEffect(() => {
    getStatsAction.execute();
  }, []);

  // Executar backup automaticamente quando triggerBackup mudar
  useEffect(() => {
    if (triggerBackup && !backupTriggered && !createBackupAction.isExecuting) {
      setBackupTriggered(true);
      createBackupAction.execute();
    }
  }, [triggerBackup, backupTriggered, createBackupAction]);

  const stats = getStatsAction.result?.data?.stats;

  const handleBackup = () => {
    setIsBackupModalOpen(true);
  };

  const handleConfirmBackup = () => {
    createBackupAction.execute();
  };

  const handleRestore = () => {
    setIsRestoreModalOpen(true);
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const isZipFile = file.name.toLowerCase().endsWith(".zip");

      if (isZipFile) {
        // Processar arquivo ZIP
        const arrayBuffer = await file.arrayBuffer();
        const base64String = Buffer.from(arrayBuffer).toString("base64");

        restoreBackupAction.execute({
          backupData: base64String,
          isZipFile: true,
        });
      } else {
        // Processar arquivo JSON (compatibilidade com backups antigos)
        const fileContent = await file.text();
        restoreBackupAction.execute({
          backupData: fileContent,
          isZipFile: false,
        });
      }
    } catch (error) {
      console.error("❌ Erro ao ler arquivo:", error);
      toast.error("Erro ao ler arquivo de backup");
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Nunca";
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(date));
  };

  return (
    <>
      <Card className="border-indigo-200 bg-indigo-50">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <DatabaseIcon className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-indigo-900">Backup e Dados</CardTitle>
          </div>
          <CardDescription className="text-indigo-700">
            Gerencie backups compactados e exportação de dados conforme LGPD
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border border-indigo-200 bg-white p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm font-medium text-gray-900">
                      Último backup
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-indigo-600">
                      {formatDate(
                        stats?.lastBackup
                          ? stats.lastBackup.toISOString()
                          : null,
                      )}
                    </span>
                    {getStatsAction.isExecuting && (
                      <RefreshCwIcon className="h-3 w-3 animate-spin text-gray-400" />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ArchiveIcon className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm font-medium text-gray-900">
                      Tamanho estimado
                    </span>
                  </div>
                  <span className="text-sm font-medium text-indigo-600">
                    {stats?.estimatedSize || "Calculando..."}
                  </span>
                </div>

                <Separator />

                {/* Estatísticas detalhadas */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Médicos:</span>
                    <span className="font-medium">{stats?.doctors || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pacientes:</span>
                    <span className="font-medium">{stats?.patients || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Agendamentos:</span>
                    <span className="font-medium">
                      {stats?.appointments || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Prontuários:</span>
                    <span className="font-medium">
                      {stats?.medicalRecords || 0}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between border-t pt-2">
                  <span className="text-xs font-medium text-gray-700">
                    Total de registros:
                  </span>
                  <span className="text-xs font-bold text-indigo-600">
                    {stats?.totalRecords || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                onClick={handleBackup}
                disabled={
                  createBackupAction.isExecuting || getStatsAction.isExecuting
                }
              >
                {createBackupAction.isExecuting ? (
                  <>
                    <RefreshCwIcon className="mr-1 h-3 w-3 animate-spin" />
                    Criando ZIP...
                  </>
                ) : (
                  <>
                    <ArchiveIcon className="mr-1 h-3 w-3" />
                    Backup ZIP
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                onClick={handleRestore}
                disabled={restoreBackupAction.isExecuting}
              >
                {restoreBackupAction.isExecuting ? (
                  <>
                    <RefreshCwIcon className="mr-1 h-3 w-3 animate-spin" />
                    Restaurando...
                  </>
                ) : (
                  <>
                    <UploadIcon className="mr-1 h-3 w-3" />
                    Restaurar
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Confirmação de Backup */}
      <Dialog open={isBackupModalOpen} onOpenChange={setIsBackupModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <ShieldIcon className="h-5 w-5" />
              <span>Criar Backup Compactado</span>
            </DialogTitle>
            <DialogDescription>
              Você está prestes a criar um backup compactado (ZIP) dos dados da
              clínica.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangleIcon className="mt-0.5 h-5 w-5 text-amber-600" />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-amber-800">
                    Aviso de Conformidade LGPD
                  </h4>
                  <ul className="space-y-1 text-xs text-amber-700">
                    <li>• Este backup contém dados pessoais e sensíveis</li>
                    <li>• Arquivo será compactado em formato ZIP</li>
                    <li>• Mantenha o arquivo em local seguro</li>
                    <li>• Não compartilhe com terceiros não autorizados</li>
                    <li>• Considere criptografar o arquivo após download</li>
                    <li>
                      • Exclua backups antigos conforme política de retenção
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Dados a serem incluídos:
              </Label>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>✓ Dados da clínica</li>
                <li>✓ Médicos e usuários</li>
                <li>✓ Pacientes (dados pessoais)</li>
                <li>✓ Agendamentos</li>
                <li>✓ Prontuários médicos (dados sensíveis)</li>
                <li>✓ Configurações de segurança</li>
                <li>✓ Logs de auditoria</li>
                <li>✓ Arquivo README com instruções</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsBackupModalOpen(false)}
                disabled={createBackupAction.isExecuting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmBackup}
                disabled={createBackupAction.isExecuting}
              >
                {createBackupAction.isExecuting ? (
                  <>
                    <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                    Criando Backup ZIP...
                  </>
                ) : (
                  <>
                    <ArchiveIcon className="mr-2 h-4 w-4" />
                    Criar e Baixar Backup ZIP
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Restauração */}
      <Dialog open={isRestoreModalOpen} onOpenChange={setIsRestoreModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <UploadIcon className="h-5 w-5" />
              <span>Restaurar Backup</span>
            </DialogTitle>
            <DialogDescription>
              Selecione um arquivo de backup para restaurar os dados (ZIP ou
              JSON).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangleIcon className="mt-0.5 h-5 w-5 text-red-600" />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-red-800">
                    Atenção - Operação Crítica
                  </h4>
                  <ul className="space-y-1 text-xs text-red-700">
                    <li>• Esta operação pode sobrescrever dados existentes</li>
                    <li>• Aceita arquivos ZIP (novos) ou JSON (antigos)</li>
                    <li>• Apenas backups da mesma clínica são aceitos</li>
                    <li>• Registros com IDs duplicados serão ignorados</li>
                    <li>• A operação será registrada nos logs de auditoria</li>
                    <li>• Certifique-se de que o backup é confiável</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="backup-file" className="text-sm font-medium">
                Arquivo de Backup (.zip ou .json)
              </Label>
              <Input
                id="backup-file"
                type="file"
                accept=".zip,.json"
                onChange={handleFileSelect}
                ref={fileInputRef}
                disabled={restoreBackupAction.isExecuting}
              />
              <p className="text-xs text-gray-600">
                Formatos aceitos: ZIP (recomendado) ou JSON (compatibilidade)
              </p>
            </div>

            {restoreBackupAction.isExecuting && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Progresso da Restauração
                </Label>
                <Progress value={50} className="h-2" />
                <p className="text-xs text-gray-600">
                  Processando e descompactando dados do backup...
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsRestoreModalOpen(false)}
                disabled={restoreBackupAction.isExecuting}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Input oculto para seleção de arquivo */}
      <input
        type="file"
        accept=".zip,.json"
        onChange={handleFileSelect}
        ref={fileInputRef}
        style={{ display: "none" }}
      />
    </>
  );
};
