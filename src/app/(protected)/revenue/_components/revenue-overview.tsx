"use client";

import { DollarSign, Receipt, UserCheck,Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyInCents } from "@/helpers/currency";

type RevenueData = {
  summary: {
    totalRevenue: number;
    totalPayments: number;
    totalPatients: number;
    totalDoctors: number;
    averageTransaction: number;
  };
  timeSeries: Array<{
    date: string;
    totalRevenue: number;
    transactionCount: number;
  }>;
  paymentMethods: Array<{
    paymentMethod: string;
    totalAmount: number;
    transactionCount: number;
  }>;
  topDoctors: Array<{
    id: string;
    name: string;
    specialty: string;
    revenue: number;
    appointments: number;
  }>;
  recentTransactions: Array<{
    paymentId: string;
    patientName: string;
    doctorName: string;
    paymentMethod: string;
    amount: number;
    appointmentDate: string;
    paymentDate: string;
  }>;
  filters: {
    startDate: string;
    endDate: string;
    paymentMethod?: string;
    period: string;
  };
};

interface RevenueOverviewProps {
  data?: RevenueData;
  isLoading: boolean;
  hasError: boolean;
}

export function RevenueOverview({
  data,
  isLoading,
  hasError,
}: RevenueOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
              </CardTitle>
              <div className="h-4 w-4 animate-pulse rounded bg-gray-200"></div>
            </CardHeader>
            <CardContent>
              <div className="mb-2 h-8 w-32 animate-pulse rounded bg-gray-200"></div>
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (hasError || !data?.summary) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Faturamento Total
            </CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0,00</div>
            <p className="text-muted-foreground text-xs">
              {hasError
                ? "Erro ao carregar dados"
                : "Nenhum dado encontrado para o período"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { summary } = data;

  const statsCards = [
    {
      title: "Faturamento Total",
      value: formatCurrencyInCents(summary.totalRevenue),
      description: `${summary.totalPayments} pagamentos realizados`,
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Total de Pagamentos",
      value: summary.totalPayments.toString(),
      description: `Média: ${formatCurrencyInCents(summary.averageTransaction)}`,
      icon: Receipt,
      color: "text-blue-600",
    },
    {
      title: "Pacientes Atendidos",
      value: summary.totalPatients.toString(),
      description: "Pacientes únicos no período",
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Médicos Ativos",
      value: summary.totalDoctors.toString(),
      description: "Médicos com consultas pagas",
      icon: UserCheck,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statsCards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-muted-foreground text-xs">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
