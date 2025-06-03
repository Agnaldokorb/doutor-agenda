"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrencyInCents } from "@/helpers/currency";

type RevenueData = {
  recentTransactions: Array<{
    paymentId: string;
    patientName: string;
    doctorName: string;
    paymentMethod: string;
    amount: number;
    appointmentDate: string;
    paymentDate: string;
  }>;
};

interface RevenueTableProps {
  data?: RevenueData;
  isLoading: boolean;
  hasError: boolean;
}

const paymentMethodLabels = {
  dinheiro: "Dinheiro",
  cartao_credito: "Cartão de Crédito",
  cartao_debito: "Cartão de Débito",
  pix: "PIX",
  cheque: "Cheque",
  transferencia_eletronica: "Transferência",
};

export function RevenueTable({ data, isLoading, hasError }: RevenueTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-3">
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
                <div className="h-4 w-32 animate-pulse rounded bg-gray-200"></div>
                <div className="h-4 w-20 animate-pulse rounded bg-gray-200"></div>
                <div className="h-4 w-16 animate-pulse rounded bg-gray-200"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasError || !data?.recentTransactions?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-gray-500">
            {hasError
              ? "Erro ao carregar transações"
              : "Nenhuma transação encontrada"}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transações Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Médico</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.recentTransactions.map((transaction) => (
              <TableRow key={transaction.paymentId}>
                <TableCell className="font-medium">
                  {transaction.patientName}
                </TableCell>
                <TableCell>{transaction.doctorName}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {paymentMethodLabels[
                      transaction.paymentMethod as keyof typeof paymentMethodLabels
                    ] || transaction.paymentMethod}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono">
                  {formatCurrencyInCents(transaction.amount)}
                </TableCell>
                <TableCell>
                  {new Date(transaction.paymentDate).toLocaleDateString(
                    "pt-BR",
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
