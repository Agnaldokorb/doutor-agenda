import { z } from "zod";

// Schema para uma transação individual de pagamento
const paymentTransactionSchema = z.object({
  paymentMethod: z.enum(
    [
      "dinheiro",
      "cartao_credito",
      "cartao_debito",
      "pix",
      "cheque",
      "transferencia_eletronica",
    ],
    {
      message: "Selecione um método de pagamento válido.",
    },
  ),
  amountInCents: z.number().min(1, {
    message: "O valor deve ser maior que zero.",
  }),
  transactionReference: z.string().optional(),
  notes: z.string().optional(),
});

// Schema principal para processar pagamento
export const processPaymentSchema = z
  .object({
    appointmentId: z.string().uuid({
      message: "ID do agendamento inválido.",
    }),
    totalAmountInCents: z.number().min(1, {
      message: "O valor total deve ser maior que zero.",
    }),
    transactions: z.array(paymentTransactionSchema).min(1, {
      message: "Pelo menos um método de pagamento deve ser informado.",
    }),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      // Validar que a soma das transações não seja zero
      const totalTransactions = data.transactions.reduce(
        (sum, transaction) => sum + transaction.amountInCents,
        0,
      );
      return totalTransactions > 0;
    },
    {
      message: "A soma dos valores das transações deve ser maior que zero.",
      path: ["transactions"],
    },
  );

export type ProcessPaymentSchema = z.infer<typeof processPaymentSchema>;
export type PaymentTransactionSchema = z.infer<typeof paymentTransactionSchema>;
