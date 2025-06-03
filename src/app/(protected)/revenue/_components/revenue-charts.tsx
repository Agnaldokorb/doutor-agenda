"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

interface RevenueChartsProps {
  data?: RevenueData;
  isLoading: boolean;
  hasError: boolean;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const paymentMethodLabels = {
  dinheiro: "Dinheiro",
  cartao_credito: "Cartão de Crédito",
  cartao_debito: "Cartão de Débito",
  pix: "PIX",
  cheque: "Cheque",
  transferencia_eletronica: "Transferência",
};

export function RevenueCharts({ data, isLoading, hasError }: RevenueChartsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-48 animate-pulse rounded bg-gray-200"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full animate-pulse rounded bg-gray-200"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (hasError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gráficos de Faturamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-gray-500">
            {hasError ? "Erro ao carregar dados dos gráficos" : "Nenhum dado disponível"}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { timeSeries, paymentMethods, topDoctors } = data;

  // Preparar dados para os gráficos
  const timeSeriesData = timeSeries.map((item) => ({
    ...item,
    totalRevenue: item.totalRevenue / 100, // Converter para valor real
    date: new Date(item.date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    }),
  }));

  const paymentMethodsData = paymentMethods.map((method) => ({
    name: paymentMethodLabels[method.paymentMethod as keyof typeof paymentMethodLabels] || method.paymentMethod,
    value: method.totalAmount / 100, // Converter para valor real
    count: method.transactionCount,
  }));

  const topDoctorsData = topDoctors.slice(0, 5).map((doctor) => ({
    name: doctor.name.length > 20 ? doctor.name.substring(0, 17) + "..." : doctor.name,
    faturamento: doctor.revenue / 100, // Converter para valor real
    consultas: doctor.appointments,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Evolução do Faturamento */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Evolução do Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis
                  tickFormatter={(value) =>
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      minimumFractionDigits: 0,
                    }).format(value)
                  }
                />
                <Tooltip
                  formatter={(value: number) => [
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(value),
                    "Faturamento",
                  ]}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="totalRevenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Médicos */}
        <Card>
          <CardHeader>
            <CardTitle>Top Médicos por Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart layout="horizontal" data={topDoctorsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickFormatter={(value) =>
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      minimumFractionDigits: 0,
                    }).format(value)
                  }
                />
                <YAxis type="category" dataKey="name" width={120} />
                <Tooltip
                  formatter={(value: number) => [
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(value),
                    "Faturamento",
                  ]}
                />
                <Bar dataKey="faturamento" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Métodos de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Método de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethodsData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {paymentMethodsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(value),
                    "Valor",
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
