"use client";

import {
  AlertTriangle,
  CheckCircle,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect,useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  formatCurrencyInCents,
  parseCurrencyToCents,
} from "@/helpers/currency";

interface RevenueGoalsProps {
  currentRevenue: number;
  period: "day" | "week" | "month" | "year";
}

interface Goal {
  id: string;
  target: number;
  period: "day" | "week" | "month" | "year";
  createdAt: string;
}

export function RevenueGoals({ currentRevenue, period }: RevenueGoalsProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [targetValue, setTargetValue] = useState("");

  useEffect(() => {
    // Carregar metas do localStorage
    const savedGoals = localStorage.getItem("revenue-goals");
    if (savedGoals) {
      try {
        setGoals(JSON.parse(savedGoals));
      } catch (error) {
        console.error("Erro ao carregar metas:", error);
      }
    }
  }, []);

  const saveGoals = (newGoals: Goal[]) => {
    setGoals(newGoals);
    localStorage.setItem("revenue-goals", JSON.stringify(newGoals));
  };

  const currentGoal = goals.find((goal) => goal.period === period);

  const handleCreateGoal = () => {
    const target = parseCurrencyToCents(targetValue);
    if (target <= 0) return;

    const newGoal: Goal = {
      id: Date.now().toString(),
      target,
      period,
      createdAt: new Date().toISOString(),
    };

    const updatedGoals = goals.filter((g) => g.period !== period);
    updatedGoals.push(newGoal);

    saveGoals(updatedGoals);
    setTargetValue("");
    setIsDialogOpen(false);
  };

  const handleDeleteGoal = () => {
    const updatedGoals = goals.filter((g) => g.period !== period);
    saveGoals(updatedGoals);
  };

  const getProgressPercentage = () => {
    if (!currentGoal) return 0;
    return Math.min((currentRevenue / currentGoal.target) * 100, 100);
  };

  const getStatusIcon = () => {
    if (!currentGoal) return null;

    const percentage = getProgressPercentage();

    if (percentage >= 100) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else if (percentage >= 80) {
      return <TrendingUp className="h-5 w-5 text-blue-600" />;
    } else if (percentage >= 50) {
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    } else {
      return <TrendingDown className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusBadge = () => {
    if (!currentGoal) return null;

    const percentage = getProgressPercentage();

    if (percentage >= 100) {
      return (
        <Badge className="bg-green-100 text-green-800">Meta Atingida</Badge>
      );
    } else if (percentage >= 80) {
      return (
        <Badge className="bg-blue-100 text-blue-800">Próximo da Meta</Badge>
      );
    } else if (percentage >= 50) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">Abaixo da Meta</Badge>
      );
    } else {
      return <Badge className="bg-red-100 text-red-800">Muito Abaixo</Badge>;
    }
  };

  const getPeriodLabel = (period: string) => {
    const labels = {
      day: "diária",
      week: "semanal",
      month: "mensal",
      year: "anual",
    };
    return labels[period as keyof typeof labels] || period;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Meta de Faturamento
          </CardTitle>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                {currentGoal ? "Editar Meta" : "Definir Meta"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Meta de Faturamento {getPeriodLabel(period)}
                </DialogTitle>
                <DialogDescription>
                  Defina uma meta de faturamento para o período{" "}
                  {getPeriodLabel(period)} atual.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="target">Valor da Meta</Label>
                  <Input
                    id="target"
                    placeholder="R$ 0,00"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                  />
                </div>

                {currentGoal && (
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-sm text-gray-600">
                      Meta atual: {formatCurrencyInCents(currentGoal.target)}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <div className="flex gap-2">
                  {currentGoal && (
                    <Button variant="destructive" onClick={handleDeleteGoal}>
                      Excluir Meta
                    </Button>
                  )}
                  <Button onClick={handleCreateGoal} disabled={!targetValue}>
                    {currentGoal ? "Atualizar" : "Criar"} Meta
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {currentGoal ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="font-medium">
                  Meta {getPeriodLabel(period)}
                </span>
              </div>
              {getStatusBadge()}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>{getProgressPercentage().toFixed(1)}%</span>
              </div>
              <Progress value={getProgressPercentage()} className="h-3" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Faturamento Atual</p>
                <p className="font-semibold text-green-600">
                  {formatCurrencyInCents(currentRevenue)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Meta</p>
                <p className="font-semibold text-purple-600">
                  {formatCurrencyInCents(currentGoal.target)}
                </p>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Faltam{" "}
              {formatCurrencyInCents(
                Math.max(0, currentGoal.target - currentRevenue),
              )}{" "}
              para atingir a meta
            </div>
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center text-gray-500">
            <div className="text-center">
              <Target className="mx-auto mb-2 h-8 w-8" />
              <p>
                Nenhuma meta definida para o período {getPeriodLabel(period)}
              </p>
              <p className="text-xs">Clique em "Definir Meta" para começar</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
