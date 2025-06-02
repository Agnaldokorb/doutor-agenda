"use client";

import { DollarSign, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyInCents } from "@/helpers/currency";

interface RevenueCardsProps {
  monthlyRevenue: number;
  todayRevenue?: number;
  isCurrentMonth: boolean;
}

export default function RevenueCards({
  monthlyRevenue,
  todayRevenue,
  isCurrentMonth,
}: RevenueCardsProps) {
  const [showMonthlyRevenue, setShowMonthlyRevenue] = useState(true);
  const [showDailyRevenue, setShowDailyRevenue] = useState(true);

  const toggleMonthlyRevenue = () => setShowMonthlyRevenue(!showMonthlyRevenue);
  const toggleDailyRevenue = () => setShowDailyRevenue(!showDailyRevenue);

  return (
    <>
      <Card className="border-0 bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs tracking-wide text-green-100 uppercase">
                Faturamento do mês
              </p>
              <p className="text-2xl font-bold">
                {showMonthlyRevenue
                  ? formatCurrencyInCents(monthlyRevenue)
                  : "••••••••"}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMonthlyRevenue}
                className="rounded-full p-1 transition-colors hover:bg-white/20"
                title={showMonthlyRevenue ? "Esconder valor" : "Mostrar valor"}
              >
                {showMonthlyRevenue ? (
                  <Eye className="h-4 w-4 text-green-200" />
                ) : (
                  <EyeOff className="h-4 w-4 text-green-200" />
                )}
              </button>
              <DollarSign className="h-6 w-6 text-green-200" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Faturamento do Dia - só aparece no mês atual */}
      {isCurrentMonth && (
        <Card className="border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs tracking-wide text-emerald-100 uppercase">
                  Faturamento do dia
                </p>
                <p className="text-2xl font-bold">
                  {showDailyRevenue
                    ? formatCurrencyInCents(todayRevenue || 0)
                    : "••••••••"}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleDailyRevenue}
                  className="rounded-full p-1 transition-colors hover:bg-white/20"
                  title={showDailyRevenue ? "Esconder valor" : "Mostrar valor"}
                >
                  {showDailyRevenue ? (
                    <Eye className="h-4 w-4 text-emerald-200" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-emerald-200" />
                  )}
                </button>
                <DollarSign className="h-6 w-6 text-emerald-200" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
