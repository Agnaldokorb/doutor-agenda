/*
 * CONFORMIDADE LGPD - Proteção de Dados Sensíveis
 *
 * Este componente está em conformidade com a Lei Geral de Proteção de Dados (LGPD)
 * e normas do Banco Central do Brasil. NÃO armazenamos dados sensíveis de cartão
 * como número, CVV, data de validade ou outros dados que possam comprometer a
 * segurança do portador do cartão.
 *
 * Para cartões de crédito/débito, armazenamos apenas:
 * - O ID/referência da transação fornecido pela operadora
 * - O método de pagamento (crédito/débito)
 * - O valor da transação
 *
 * Isso garante rastreabilidade para fins de auditoria sem expor dados sensíveis.
 */

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calculator, CreditCard, DollarSign, Plus, Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";
import { z } from "zod";

import { processPayment } from "@/actions/process-payment";
import { Button } from "@/components/ui/button";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrencyInCents } from "@/helpers/currency";
import { convertUTCToUTCMinus3 } from "@/helpers/timezone";

type PaymentTransaction = {
  id: string;
  paymentMethod: string;
  amountInCents: number;
  transactionReference?: string;
  notes?: string;
};

type Appointment = {
  id: string;
  date: Date;
  appointmentPriceInCents: number;
  patient: {
    name: string;
  };
  doctor: {
    name: string;
    specialty: string;
    appointmentPriceInCents: number;
  };
  payment?: {
    paidAmountInCents: number;
  } | null;
};

interface PaymentDialogProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const paymentMethods = [
  { value: "dinheiro", label: "💵 Dinheiro" },
  { value: "cartao_credito", label: "💳 Cartão de Crédito" },
  { value: "cartao_debito", label: "💳 Cartão de Débito" },
  { value: "pix", label: "📱 PIX" },
  { value: "cheque", label: "📝 Cheque" },
  { value: "transferencia_eletronica", label: "🏦 Transferência Eletrônica" },
];

const formSchema = z.object({
  transactions: z
    .array(
      z.object({
        paymentMethod: z.string().min(1, "Selecione um método de pagamento"),
        amountInCents: z.number().min(1, "Valor deve ser maior que zero"),
        transactionReference: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .min(1, "Adicione pelo menos um método de pagamento"),
  notes: z.string().optional(),
});

export function PaymentDialog({
  appointment,
  open,
  onOpenChange,
  onSuccess,
}: PaymentDialogProps) {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transactions: [],
      notes: "",
    },
  });

  const processPaymentAction = useAction(processPayment, {
    onSuccess: () => {
      onSuccess();
      setTransactions([]);
      form.reset();
    },
    onError: (error: unknown) => {
      console.error("❌ Erro ao processar pagamento:", error);
      toast.error("Erro ao processar pagamento");
    },
  });

  useEffect(() => {
    if (open && appointment) {
      // Resetar transações quando abrir o diálogo
      setTransactions([]);
      form.reset();
    }
  }, [open, appointment, form]);

  if (!appointment) return null;

  const totalValue = appointment.appointmentPriceInCents;
  const alreadyPaid = appointment.payment?.paidAmountInCents || 0;
  const remainingValue = totalValue - alreadyPaid;

  const totalTransactions = transactions.reduce(
    (sum, t) => sum + t.amountInCents,
    0,
  );
  const stillOwed = Math.max(0, remainingValue - totalTransactions);
  const change = Math.max(0, totalTransactions - remainingValue);

  const addTransaction = () => {
    const newTransaction: PaymentTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      paymentMethod: "",
      amountInCents: stillOwed > 0 ? stillOwed : 0,
    };
    setTransactions([...transactions, newTransaction]);
  };

  const updateTransaction = (
    id: string,
    field: keyof PaymentTransaction,
    value: string | number,
  ) => {
    setTransactions(
      transactions.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    );
  };

  const removeTransaction = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  const onSubmit = () => {
    if (transactions.length === 0) {
      toast.error("Adicione pelo menos um método de pagamento");
      return;
    }

    if (transactions.some((t) => !t.paymentMethod || t.amountInCents <= 0)) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // NOVA VALIDAÇÃO: Verificar métodos de pagamento que não deveriam ter "troco"
    const nonCashPayments = transactions.filter(
      (t) => t.paymentMethod !== "dinheiro",
    );
    const nonCashTotal = nonCashPayments.reduce(
      (sum, t) => sum + t.amountInCents,
      0,
    );

    if (nonCashTotal > remainingValue && nonCashPayments.length > 0) {
      toast.error(
        "Métodos como cartão, PIX, transferência não deveriam exceder o valor da consulta. Apenas dinheiro pode gerar troco.",
        { duration: 7000 },
      );
      return;
    }

    // NOVA VALIDAÇÃO: Alertar sobre troco se necessário
    if (change > 0) {
      const trocoFormatted = formatCurrencyInCents(change);
      const hasCashPayment = transactions.some(
        (t) => t.paymentMethod === "dinheiro",
      );

      if (!hasCashPayment) {
        toast.error("Não é possível ter troco sem pagamento em dinheiro");
        return;
      }

      toast.info(`Troco a devolver: ${trocoFormatted}`, {
        duration: 5000,
        description:
          "O valor registrado será apenas o da consulta. O troco não será contabilizado no faturamento.",
      });
    }

    processPaymentAction.execute({
      appointmentId: appointment.id,
      totalAmountInCents: totalValue,
      transactions: transactions.map((t) => ({
        paymentMethod: t.paymentMethod as
          | "dinheiro"
          | "cartao_credito"
          | "cartao_debito"
          | "pix"
          | "cheque"
          | "transferencia_eletronica",
        amountInCents: t.amountInCents,
        transactionReference: t.transactionReference,
        notes: t.notes,
      })),
      notes: form.getValues("notes"),
    });
  };

  const utcDate = new Date(appointment.date);
  const localDate = convertUTCToUTCMinus3(utcDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            Processar Pagamento
          </DialogTitle>
          <DialogDescription>
            Registre o pagamento da consulta particular
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Agendamento */}
          <div className="rounded-lg border bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold text-gray-900">
              Detalhes da Consulta
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Paciente:</span>
                <span className="ml-2 font-medium">
                  {appointment.patient.name}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Médico:</span>
                <span className="ml-2 font-medium">
                  Dr. {appointment.doctor.name}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Data:</span>
                <span className="ml-2 font-medium">
                  {format(localDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Especialidade:</span>
                <span className="ml-2 font-medium">
                  {appointment.doctor.specialty}
                </span>
              </div>
            </div>
          </div>

          {/* Resumo Financeiro */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            <div className="min-w-0 rounded-lg border bg-blue-50 p-2 text-center">
              <div className="truncate text-base font-bold text-blue-600">
                {formatCurrencyInCents(totalValue)}
              </div>
              <div className="text-xs font-medium text-blue-600">
                Valor da Consulta
              </div>
            </div>

            {alreadyPaid > 0 && (
              <div className="min-w-0 rounded-lg border bg-green-50 p-2 text-center">
                <div className="truncate text-base font-bold text-green-600">
                  {formatCurrencyInCents(alreadyPaid)}
                </div>
                <div className="text-xs font-medium text-green-600">
                  Já Pago
                </div>
              </div>
            )}

            <div className="min-w-0 rounded-lg border bg-orange-50 p-2 text-center">
              <div className="truncate text-base font-bold text-orange-600">
                {formatCurrencyInCents(stillOwed)}
              </div>
              <div className="text-xs font-medium text-orange-600">
                Ainda Deve
              </div>
            </div>

            {change > 0 && (
              <div className="min-w-0 rounded-lg border bg-purple-50 p-2 text-center">
                <div className="truncate text-base font-bold text-purple-600">
                  {formatCurrencyInCents(change)}
                </div>
                <div className="text-xs font-medium text-purple-600">
                  Troco a Devolver
                </div>
              </div>
            )}
          </div>

          {/* NOVA SEÇÃO: Aviso sobre troco */}
          {change > 0 && (
            <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                    <DollarSign className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-purple-900">
                    ⚠️ Atenção: Troco de {formatCurrencyInCents(change)}
                  </h4>
                  <p className="mt-1 text-sm text-purple-700">
                    O cliente deve receber{" "}
                    <strong>{formatCurrencyInCents(change)}</strong> de troco.
                    No sistema, será registrado apenas o valor da consulta (
                    {formatCurrencyInCents(totalValue)}) para fins de
                    faturamento. O troco não é contabilizado como receita.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* NOVA SEÇÃO: Resumo do que será registrado */}
          {totalTransactions > 0 && (
            <div className="rounded-lg border bg-gray-50 p-4">
              <h4 className="mb-2 text-sm font-semibold text-gray-900">
                📊 Resumo do Registro no Sistema
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">
                    Valor pago pelo cliente:
                  </span>
                  <span className="ml-2 font-medium text-blue-600">
                    {formatCurrencyInCents(totalTransactions)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">
                    Será registrado como faturamento:
                  </span>
                  <span className="ml-2 font-medium text-green-600">
                    {formatCurrencyInCents(
                      Math.min(totalTransactions, totalValue),
                    )}
                  </span>
                </div>
                {change > 0 && (
                  <>
                    <div>
                      <span className="text-gray-600">Troco a devolver:</span>
                      <span className="ml-2 font-medium text-purple-600">
                        {formatCurrencyInCents(change)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className="ml-2 font-medium text-green-600">
                        Pago (com troco)
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Métodos de Pagamento */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Métodos de Pagamento
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTransaction}
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Método
              </Button>
            </div>

            {transactions.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <Calculator className="mx-auto mb-2 h-12 w-12 text-gray-400" />
                <p>Nenhum método de pagamento adicionado</p>
                <p className="text-sm">
                  Clique em "Adicionar Método" para começar
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction, index) => (
                  <div
                    key={transaction.id}
                    className="rounded-lg border bg-white p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        Pagamento {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTransaction(transaction.id)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Método de Pagamento
                        </label>
                        <Select
                          value={transaction.paymentMethod}
                          onValueChange={(value) =>
                            updateTransaction(
                              transaction.id,
                              "paymentMethod",
                              value,
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentMethods.map((method) => (
                              <SelectItem
                                key={method.value}
                                value={method.value}
                              >
                                {method.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Valor
                        </label>
                        <NumericFormat
                          value={transaction.amountInCents / 100}
                          onValueChange={(value) => {
                            updateTransaction(
                              transaction.id,
                              "amountInCents",
                              (value.floatValue || 0) * 100,
                            );
                          }}
                          decimalScale={2}
                          fixedDecimalScale
                          decimalSeparator=","
                          thousandSeparator="."
                          allowNegative={false}
                          prefix="R$ "
                          customInput={Input}
                          placeholder="R$ 0,00"
                        />
                      </div>

                      {/* Referência/ID da Transação para todos os métodos eletrônicos */}
                      {(transaction.paymentMethod === "cartao_credito" ||
                        transaction.paymentMethod === "cartao_debito" ||
                        transaction.paymentMethod === "pix" ||
                        transaction.paymentMethod === "cheque" ||
                        transaction.paymentMethod ===
                          "transferencia_eletronica") && (
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-gray-700">
                            {transaction.paymentMethod === "cartao_credito"
                              ? "ID da Transação do Cartão de Crédito"
                              : transaction.paymentMethod === "cartao_debito"
                                ? "ID da Transação do Cartão de Débito"
                                : transaction.paymentMethod === "pix"
                                  ? "Chave PIX / ID da Transação"
                                  : transaction.paymentMethod === "cheque"
                                    ? "Número do Cheque"
                                    : "ID da Transferência Eletrônica"}
                          </label>
                          <Input
                            value={transaction.transactionReference || ""}
                            onChange={(e) =>
                              updateTransaction(
                                transaction.id,
                                "transactionReference",
                                e.target.value,
                              )
                            }
                            placeholder={
                              transaction.paymentMethod === "cartao_credito" ||
                              transaction.paymentMethod === "cartao_debito"
                                ? "Ex: TXN123456789..."
                                : transaction.paymentMethod === "pix"
                                  ? "Chave PIX ou ID da transação..."
                                  : transaction.paymentMethod === "cheque"
                                    ? "Número do cheque..."
                                    : "ID da transferência..."
                            }
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Observações */}
          <Form {...form}>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Observações sobre o pagamento..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Form>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={
              transactions.length === 0 || processPaymentAction.isExecuting
            }
            className="bg-green-600 hover:bg-green-700"
          >
            {processPaymentAction.isExecuting ? (
              "Processando..."
            ) : (
              <>
                <DollarSign className="mr-2 h-4 w-4" />
                Processar Pagamento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
