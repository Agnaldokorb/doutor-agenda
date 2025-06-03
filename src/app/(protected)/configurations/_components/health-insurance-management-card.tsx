"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Settings, Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";
import { z } from "zod";

import { deleteHealthInsurancePlan } from "@/actions/delete-health-insurance-plan";
import { getHealthInsurancePlans } from "@/actions/get-health-insurance-plans";
import { upsertHealthInsurancePlan } from "@/actions/upsert-health-insurance-plan";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { healthInsurancePlansTable } from "@/db/schema";

type HealthInsurancePlan = typeof healthInsurancePlansTable.$inferSelect;

const formSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, { message: "Nome do plano é obrigatório" }),
  reimbursementValueInCents: z.number().min(0, {
    message: "Valor de reembolso deve ser maior ou igual a zero",
  }),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

const HealthInsuranceManagementCard = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<HealthInsurancePlan | null>(
    null,
  );
  const [plans, setPlans] = useState<HealthInsurancePlan[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      reimbursementValueInCents: 0,
      isActive: true,
    },
  });

  // Action para buscar planos
  const getPlansAction = useAction(getHealthInsurancePlans, {
    onSuccess: (data) => {
      // next-safe-action encapsula o resultado em {data: resultado}
      // Como a action retorna um array diretamente, data.data contém o array
      const result = data?.data;
      const validPlans = Array.isArray(result) ? result : [];
      console.log("✅ Planos de saúde carregados:", validPlans.length);
      setPlans(validPlans);
    },
    onError: (error) => {
      console.error("❌ Erro ao buscar planos:", error);
      // Garantir que plans seja um array vazio em caso de erro
      setPlans([]);
      toast.error("Erro ao carregar planos de saúde");
    },
  });

  // Action para criar/editar plano
  const upsertPlanAction = useAction(upsertHealthInsurancePlan, {
    onSuccess: ({ data }) => {
      toast.success(data?.message || "Plano salvo com sucesso!");
      setIsDialogOpen(false);
      setEditingPlan(null);
      form.reset();
      getPlansAction.execute();
    },
    onError: (error) => {
      console.error("❌ Erro ao salvar plano:", error);
      if (error.error?.serverError) {
        toast.error(error.error.serverError);
      } else {
        toast.error("Erro ao salvar plano de saúde");
      }
    },
  });

  // Action para deletar plano
  const deletePlanAction = useAction(deleteHealthInsurancePlan, {
    onSuccess: ({ data }) => {
      toast.success(data?.message || "Plano deletado com sucesso!");
      getPlansAction.execute();
    },
    onError: (error) => {
      console.error("❌ Erro ao deletar plano:", error);
      if (error.error?.serverError) {
        toast.error(error.error.serverError);
      } else {
        toast.error("Erro ao deletar plano de saúde");
      }
    },
  });

  // Carregar planos ao montar o componente
  useEffect(() => {
    getPlansAction.execute();
  }, []);

  const handleOpenDialog = (plan?: HealthInsurancePlan) => {
    if (plan) {
      setEditingPlan(plan);
      form.reset({
        id: plan.id,
        name: plan.name,
        reimbursementValueInCents: plan.reimbursementValueInCents,
        isActive: plan.isActive,
      });
    } else {
      setEditingPlan(null);
      form.reset({
        name: "",
        reimbursementValueInCents: 0,
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleDeletePlan = (plan: HealthInsurancePlan) => {
    if (confirm(`Tem certeza que deseja deletar o plano "${plan.name}"?`)) {
      deletePlanAction.execute({ id: plan.id });
    }
  };

  const onSubmit = (values: FormData) => {
    if (editingPlan) {
      upsertPlanAction.execute({ ...values, id: editingPlan.id });
    } else {
      upsertPlanAction.execute(values);
    }
  };

  const formatCurrency = (valueInCents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valueInCents / 100);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle>Planos de Saúde</CardTitle>
                <CardDescription>
                  Configure os planos de saúde aceitos pela clínica e seus
                  valores de reembolso
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Plano
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {getPlansAction.isExecuting ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : !Array.isArray(plans) || plans.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
              <Settings className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Nenhum plano configurado
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Configure os planos de saúde aceitos pela sua clínica
              </p>
              <Button onClick={() => handleOpenDialog()} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Primeiro Plano
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Plano</TableHead>
                  <TableHead>Valor de Reembolso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(plans) &&
                  plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>
                        {formatCurrency(plan.reimbursementValueInCents)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            plan.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {plan.isActive ? "Ativo" : "Inativo"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(plan)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePlan(plan)}
                            disabled={deletePlanAction.isExecuting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? "Editar Plano de Saúde" : "Novo Plano de Saúde"}
            </DialogTitle>
            <DialogDescription>
              {editingPlan
                ? "Edite os dados do plano de saúde."
                : "Preencha os dados para criar um novo plano de saúde."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Plano</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Unimed, Amil, SulAmérica..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reimbursementValueInCents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor de Reembolso</FormLabel>
                    <FormControl>
                      <NumericFormat
                        value={field.value / 100}
                        onValueChange={(value) => {
                          field.onChange(
                            value.floatValue ? value.floatValue * 100 : 0,
                          );
                        }}
                        decimalScale={2}
                        fixedDecimalScale
                        decimalSeparator=","
                        allowNegative={false}
                        allowLeadingZeros={false}
                        thousandSeparator="."
                        customInput={Input}
                        prefix="R$ "
                        placeholder="R$ 0,00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Plano Ativo</FormLabel>
                      <FormDescription className="text-muted-foreground text-sm">
                        Determina se este plano estará disponível para seleção
                        nos agendamentos
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={upsertPlanAction.isExecuting}
                  className="gap-2"
                >
                  {upsertPlanAction.isExecuting && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {editingPlan ? "Atualizar" : "Criar"} Plano
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { HealthInsuranceManagementCard };
