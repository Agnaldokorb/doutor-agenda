"use client";

import { CreditCard } from "lucide-react";
import { useRef } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { BillingStatsCards, BillingStatsCardsRef } from "./billing-stats-cards";
import { PendingAppointmentsList } from "./pending-appointments-list";

export function BillingPageContent() {
  const statsCardsRef = useRef<BillingStatsCardsRef>(null);

  const handlePaymentProcessed = () => {
    // Atualizar os cards de estatísticas quando um pagamento for processado
    if (statsCardsRef.current) {
      statsCardsRef.current.refresh();
    }
  };

  return (
    <>
      {/* Cards de Estatísticas com Dados Reais */}
      <BillingStatsCards ref={statsCardsRef} />

      {/* Lista de Agendamentos Pendentes */}
      <Card className="shadow-xl">
        <CardHeader className="border-b bg-gray-50">
          <CardTitle className="flex items-center space-x-2 text-xl">
            <CreditCard className="h-6 w-6 text-green-600" />
            <span>Consultas Particulares Pendentes de Pagamento</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <PendingAppointmentsList onPaymentProcessed={handlePaymentProcessed} />
        </CardContent>
      </Card>
    </>
  );
} 