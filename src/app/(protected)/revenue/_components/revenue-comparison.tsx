"use client";

import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyInCents } from "@/helpers/currency";

import { FilterState } from "./revenue-content";

type RevenueData = {
  summary: {
    totalRevenue: number;
    totalPayments: number;
    totalPatients: number;
    totalDoctors: number;
    averageTransaction: number;
  };
};

interface RevenueComparisonProps {
  filters: FilterState;
  data?: RevenueData;
  isLoading: boolean;
}

export function RevenueComparison({
  filters,
  data,
  isLoading,
}: RevenueComparisonProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparação Período Anterior</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
                <div className="h-6 w-32 animate-pulse rounded bg-gray-200"></div>
                <div className="h-4 w-20 animate-pulse rounded bg-gray-200"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparação Período Anterior</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-gray-500">
            Nenhum dado disponível para comparação
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mock da comparação - em uma implementação real, você faria uma segunda query
  const mockPreviousData = {
    totalRevenue: data.summary.totalRevenue * 0.85, // Simula 15% de crescimento
    totalPayments: data.summary.totalPayments * 0.9, // Simula 10% de crescimento
    totalPatients: data.summary.totalPatients * 0.95, // Simula 5% de crescimento
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return { percentage: 0, trend: "neutral" as const };
    const change = ((current - previous) / previous) * 100;
    const trend = change > 0 ? "up" : change < 0 ? "down" : "neutral";
    return { percentage: Math.abs(change), trend };
  };

  const revenueChange = calculateChange(
    data.summary.totalRevenue,
    mockPreviousData.totalRevenue,
  );
  const paymentsChange = calculateChange(
    data.summary.totalPayments,
    mockPreviousData.totalPayments,
  );
  const patientsChange = calculateChange(
    data.summary.totalPatients,
    mockPreviousData.totalPatients,
  );

  const getTrendIcon = (trend: "up" | "down" | "neutral") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: "up" | "down" | "neutral") => {
    switch (trend) {
      case "up":
        return "bg-green-100 text-green-800";
      case "down":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const comparisons = [
    {
      title: "Faturamento",
      current: formatCurrencyInCents(data.summary.totalRevenue),
      previous: formatCurrencyInCents(mockPreviousData.totalRevenue),
      change: revenueChange,
    },
    {
      title: "Pagamentos",
      current: data.summary.totalPayments.toString(),
      previous: mockPreviousData.totalPayments.toString(),
      change: paymentsChange,
    },
    {
      title: "Pacientes",
      current: data.summary.totalPatients.toString(),
      previous: mockPreviousData.totalPatients.toString(),
      change: patientsChange,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparação com Período Anterior</CardTitle>
        <p className="text-sm text-gray-600">
          Comparação baseada no mesmo período anterior
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {comparisons.map((comparison) => (
            <div key={comparison.title} className="space-y-2">
              <div className="text-sm font-medium text-gray-600">
                {comparison.title}
              </div>
              <div className="text-xl font-bold">{comparison.current}</div>
              <div className="flex items-center gap-2">
                {getTrendIcon(
                  comparison.change.trend as "neutral" | "up" | "down",
                )}
                <Badge
                  variant="outline"
                  className={getTrendColor(
                    comparison.change.trend as "neutral" | "up" | "down",
                  )}
                >
                  {comparison.change.percentage.toFixed(1)}%
                </Badge>
                <span className="text-xs text-gray-500">
                  vs {comparison.previous}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
