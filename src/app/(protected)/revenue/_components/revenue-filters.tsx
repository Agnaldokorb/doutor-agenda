"use client";

import { CalendarIcon, FilterIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { FilterState } from "./revenue-content";

interface RevenueFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
}

const paymentMethods = [
  { value: "dinheiro", label: "💵 Dinheiro" },
  { value: "cartao_credito", label: "💳 Cartão de Crédito" },
  { value: "cartao_debito", label: "💳 Cartão de Débito" },
  { value: "pix", label: "📱 PIX" },
  { value: "cheque", label: "📝 Cheque" },
  { value: "transferencia_eletronica", label: "🏦 Transferência Eletrônica" },
];

const periods = [
  { value: "day", label: "Diário" },
  { value: "week", label: "Semanal" },
  { value: "month", label: "Mensal" },
  { value: "year", label: "Anual" },
];

const quickDateRanges = [
  {
    label: "Últimos 7 dias",
    getDates: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);
      return {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      };
    },
  },
  {
    label: "Últimos 30 dias",
    getDates: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      return {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      };
    },
  },
  {
    label: "Este mês",
    getDates: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      };
    },
  },
  {
    label: "Últimos 3 meses",
    getDates: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 3);
      return {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      };
    },
  },
];

export function RevenueFilters({
  filters,
  onFiltersChange,
}: RevenueFiltersProps) {
  const handleQuickDateRange = (
    getDates: () => { start: string; end: string },
  ) => {
    const { start, end } = getDates();
    onFiltersChange({ startDate: start, endDate: end });
  };

  const clearPaymentMethodFilter = () => {
    onFiltersChange({ paymentMethod: undefined });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
        <FilterIcon className="h-5 w-5 text-green-600" />
        Filtros de Pesquisa
      </div>

      {/* Período e Datas */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="period" className="text-sm font-medium">
            Agrupamento
          </Label>
          <Select
            value={filters.period}
            onValueChange={(value: FilterState["period"]) =>
              onFiltersChange({ period: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periods.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate" className="text-sm font-medium">
            Data Inicial
          </Label>
          <div className="relative">
            <CalendarIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => onFiltersChange({ startDate: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate" className="text-sm font-medium">
            Data Final
          </Label>
          <div className="relative">
            <CalendarIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => onFiltersChange({ endDate: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentMethod" className="text-sm font-medium">
            Método de Pagamento
          </Label>
          <div className="flex gap-2">
            <Select
              value={filters.paymentMethod || "all"}
              onValueChange={(value) =>
                onFiltersChange({
                  paymentMethod:
                    value === "all"
                      ? undefined
                      : (value as FilterState["paymentMethod"]),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os métodos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os métodos</SelectItem>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filters.paymentMethod && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearPaymentMethodFilter}
                className="px-2"
              >
                ✕
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filtros Rápidos de Data */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Períodos Rápidos</Label>
        <div className="flex flex-wrap gap-2">
          {quickDateRanges.map((range) => (
            <Button
              key={range.label}
              variant="outline"
              size="sm"
              onClick={() => handleQuickDateRange(range.getDates)}
              className="text-xs"
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
