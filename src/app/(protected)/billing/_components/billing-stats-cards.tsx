"use client";

import React, { forwardRef, useImperativeHandle, useEffect } from "react";
import { CreditCard, DollarSign, FileText, RefreshCw } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { getBillingStats } from "@/actions/get-billing-stats";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyInCents } from "@/helpers/currency";

export interface BillingStatsCardsRef {
  refresh: () => void;
}

export const BillingStatsCards = forwardRef<BillingStatsCardsRef>((_, ref) => {
  const getBillingStatsAction = useAction(getBillingStats, {
    onError: (error) => {
      console.error("❌ Erro ao carregar estatísticas de billing:", error);
      toast.error("Erro ao carregar estatísticas de billing");
    },
    onSuccess: () => {
      console.log("✅ Estatísticas de billing carregadas com sucesso");
    },
  });

  // Carregar dados ao montar o componente
  useEffect(() => {
    getBillingStatsAction.execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executar apenas uma vez na montagem

  const handleRefresh = () => {
    getBillingStatsAction.execute();
  };

  // Expor a função de refresh através do ref
  useImperativeHandle(ref, () => ({
    refresh: handleRefresh,
  }));

  const stats = getBillingStatsAction.result?.data?.stats;
  const isLoading = getBillingStatsAction.isExecuting;

  return (
    <div className="space-y-4">
      {/* Botão de Atualizar */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Atualizando..." : "Atualizar Dados"}
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Card: Consultas Pendentes */}
        <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs tracking-wide text-blue-100 uppercase">
                  Pendentes
                </p>
                <p className="text-2xl font-bold">
                  {isLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    stats?.pendingAppointments || 0
                  )}
                </p>
                <p className="mt-1 text-xs text-blue-200">
                  consultas particulares
                </p>
              </div>
              <FileText className="h-6 w-6 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        {/* Card: Pagamentos Hoje */}
        <Card className="border-0 bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs tracking-wide text-green-100 uppercase">
                  Pagos Hoje
                </p>
                <p className="text-2xl font-bold">
                  {isLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    stats?.paymentsToday || 0
                  )}
                </p>
                <p className="mt-1 text-xs text-green-200">
                  pagamentos realizados
                </p>
              </div>
              <CreditCard className="h-6 w-6 text-green-200" />
            </div>
          </CardContent>
        </Card>

        {/* Card: Faturamento do Dia */}
        <Card className="border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs tracking-wide text-purple-100 uppercase">
                  Total do Dia
                </p>
                <p className="text-2xl font-bold">
                  {isLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    formatCurrencyInCents(stats?.dailyRevenueInCents || 0)
                  )}
                </p>
                <p className="mt-1 text-xs text-purple-200">faturamento hoje</p>
              </div>
              <DollarSign className="h-6 w-6 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

BillingStatsCards.displayName = "BillingStatsCards";
