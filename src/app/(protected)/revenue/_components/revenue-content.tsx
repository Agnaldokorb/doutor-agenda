"use client";

import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";

import { getRevenueData } from "@/actions/get-revenue-data";
import { Card } from "@/components/ui/card";

import { RevenueCharts } from "./revenue-charts";
import { RevenueComparison } from "./revenue-comparison";
import { RevenueExport } from "./revenue-export";
import { RevenueFilters } from "./revenue-filters";
import { RevenueGoals } from "./revenue-goals";
import { RevenueOverview } from "./revenue-overview";
import { RevenueTable } from "./revenue-table";

export type FilterState = {
  startDate: string;
  endDate: string;
  paymentMethod?:
    | "dinheiro"
    | "cartao_credito"
    | "cartao_debito"
    | "pix"
    | "cheque"
    | "transferencia_eletronica";
  period: "day" | "week" | "month" | "year";
};

export function RevenueContent() {
  const [filters, setFilters] = useState<FilterState>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    period: "day",
  });

  const getRevenueAction = useAction(getRevenueData, {
    onError: (error) => {
      console.error("❌ Erro ao carregar dados de faturamento:", error);
    },
  });

  // Executar a action sempre que os filtros mudarem
  useEffect(() => {
    getRevenueAction.execute(filters);
  }, [filters, getRevenueAction.execute]);

  const handleFiltersChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Preparar dados para os componentes
  const revenueData = getRevenueAction.result?.data?.data;
  const isLoading = getRevenueAction.isExecuting;
  const hasError = getRevenueAction.hasErrored;

  // Preparar dados para exportação
  const exportData = revenueData
    ? {
        ...revenueData,
        filters,
      }
    : null;

  // Obter faturamento atual para as metas
  const currentRevenue = revenueData?.summary?.totalRevenue || 0;

  return (
    <div className="space-y-6">
      {/* Filtros e Exportação */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Filtros e Exportação
            </h2>
            <RevenueExport
              data={exportData}
              clinicName="Clínica" // TODO: Buscar nome real da clínica
              disabled={isLoading}
            />
          </div>

          <RevenueFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </div>
      </Card>

      {/* Visão Geral e Metas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueOverview
            data={revenueData}
            isLoading={isLoading}
            hasError={hasError}
          />
        </div>
        <div>
          <RevenueGoals
            currentRevenue={currentRevenue}
            period={filters.period}
          />
        </div>
      </div>

      {/* Dashboard Comparativo */}
      <RevenueComparison
        filters={filters}
        data={revenueData}
        isLoading={isLoading}
      />

      {/* Gráficos */}
      <RevenueCharts
        data={revenueData}
        isLoading={isLoading}
        hasError={hasError}
      />

      {/* Tabela de Transações */}
      <RevenueTable
        data={revenueData}
        isLoading={isLoading}
        hasError={hasError}
      />
    </div>
  );
}
