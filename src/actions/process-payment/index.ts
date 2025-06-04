"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import {
  appointmentPaymentsTable,
  paymentTransactionsTable,
} from "@/db/schema";
import { logDataOperation } from "@/helpers/audit-logger";
import {
  prepareAppointmentWebhookData,
  sendAppointmentWebhook,
} from "@/helpers/n8n-webhook";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { processPaymentSchema } from "./schema";

export const processPayment = actionClient
  .schema(processPaymentSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    if (!session?.user.clinic?.id) {
      throw new Error("Clinic not found");
    }

    // Verificar se o usuário tem permissão (admin ou atendente)
    if (!["admin", "atendente"].includes(session.user.userType)) {
      throw new Error("Usuário não tem permissão para processar pagamentos");
    }

    console.log("💰 Processando pagamento:", parsedInput);

    try {
      // Calcular totais CORRIGIDO: O valor a ser registrado deve ser limitado ao valor da consulta
      const totalInputByClient = parsedInput.transactions.reduce(
        (sum, transaction) => sum + transaction.amountInCents,
        0,
      );

      // CORREÇÃO PRINCIPAL: O valor efetivamente pago não pode ser maior que o valor da consulta
      // Se o cliente pagou mais, o excesso é troco e não deve ser contabilizado como faturamento
      const totalPaidInCents = Math.min(
        totalInputByClient,
        parsedInput.totalAmountInCents,
      );

      const remainingAmountInCents = Math.max(
        0,
        parsedInput.totalAmountInCents - totalPaidInCents,
      );

      const changeAmountInCents = Math.max(
        0,
        totalInputByClient - parsedInput.totalAmountInCents,
      );

      // Determinar o status do pagamento
      let paymentStatus: "pendente" | "pago" | "parcial" = "pendente";
      if (totalPaidInCents >= parsedInput.totalAmountInCents) {
        paymentStatus = "pago";
      } else if (totalPaidInCents > 0) {
        paymentStatus = "parcial";
      }

      // Verificar se já existe um registro de pagamento para este agendamento
      const existingPayment = await db.query.appointmentPaymentsTable.findFirst(
        {
          where: (payments, { eq }) =>
            eq(payments.appointmentId, parsedInput.appointmentId),
        },
      );

      let paymentRecord;

      if (existingPayment) {
        // Atualizar registro existente
        const [updatedPayment] = await db
          .update(appointmentPaymentsTable)
          .set({
            paidAmountInCents: totalPaidInCents, // CORRIGIDO: Agora salva apenas o valor da consulta
            remainingAmountInCents,
            changeAmountInCents,
            status: paymentStatus,
            processedByUserId: session.user.id,
            notes: parsedInput.notes,
            updatedAt: new Date(),
          })
          .where(eq(appointmentPaymentsTable.id, existingPayment.id))
          .returning();

        paymentRecord = updatedPayment;

        // Limpar transações antigas e inserir novas
        await db
          .delete(paymentTransactionsTable)
          .where(
            eq(
              paymentTransactionsTable.appointmentPaymentId,
              existingPayment.id,
            ),
          );
      } else {
        // Criar novo registro de pagamento
        const [newPayment] = await db
          .insert(appointmentPaymentsTable)
          .values({
            appointmentId: parsedInput.appointmentId,
            clinicId: session.user.clinic.id,
            totalAmountInCents: parsedInput.totalAmountInCents,
            paidAmountInCents: totalPaidInCents, // CORRIGIDO: Agora salva apenas o valor da consulta
            remainingAmountInCents,
            changeAmountInCents,
            status: paymentStatus,
            processedByUserId: session.user.id,
            notes: parsedInput.notes,
          })
          .returning();

        paymentRecord = newPayment;
      }

      // CORREÇÃO: Ajustar as transações para refletir apenas o valor da consulta
      // Se houve troco, precisamos ajustar os valores das transações proporcionalmente
      const adjustedTransactions = parsedInput.transactions.map(
        (transaction) => {
          let adjustedAmount = transaction.amountInCents;

          // Se o total pago pelo cliente excede o valor da consulta, ajustar proporcionalmente
          if (totalInputByClient > parsedInput.totalAmountInCents) {
            // Calcular a proporção que esta transação representa do total pago pelo cliente
            const proportion = transaction.amountInCents / totalInputByClient;
            // Aplicar essa proporção ao valor da consulta (não ao valor pago pelo cliente)
            adjustedAmount = Math.round(
              parsedInput.totalAmountInCents * proportion,
            );
          }

          return {
            ...transaction,
            amountInCents: adjustedAmount,
          };
        },
      );

      // Inserir as transações de pagamento com valores ajustados
      if (adjustedTransactions.length > 0) {
        await db.insert(paymentTransactionsTable).values(
          adjustedTransactions.map((transaction) => ({
            appointmentPaymentId: paymentRecord.id,
            paymentMethod: transaction.paymentMethod,
            amountInCents: transaction.amountInCents, // Valor ajustado (sem o troco)
            transactionReference: transaction.transactionReference || null,
            notes: transaction.notes || null,
          })),
        );
      }

      // Log de auditoria LGPD
      await logDataOperation({
        userId: session.user.id,
        clinicId: session.user.clinic.id,
        operation: existingPayment ? "update" : "create",
        dataType: "payment",
        recordId: paymentRecord.id,
        changes: {
          appointmentId: parsedInput.appointmentId,
          totalAmount: parsedInput.totalAmountInCents,
          paidAmount: totalPaidInCents, // Valor corrigido (sem troco)
          clientInput: totalInputByClient, // Valor que o cliente realmente deu
          change: changeAmountInCents, // Troco calculado
          status: paymentStatus,
          transactions: parsedInput.transactions.length,
        },
        success: true,
      });

      console.log("✅ Pagamento processado com sucesso:", {
        paymentId: paymentRecord.id,
        status: paymentStatus,
        totalPaid: totalPaidInCents, // Valor real da consulta
        clientInput: totalInputByClient, // Valor dado pelo cliente
        change: changeAmountInCents, // Troco a ser devolvido
      });

      // Enviar webhook para n8n se o pagamento foi concluído
      if (paymentStatus === "pago") {
        try {
          // Buscar dados completos do agendamento
          const appointmentData = await db.query.appointmentsTable.findFirst({
            where: (appointments, { eq }) =>
              eq(appointments.id, parsedInput.appointmentId),
            with: {
              patient: true,
              doctor: true,
              clinic: true,
            },
          });

          if (appointmentData) {
            const webhookData = prepareAppointmentWebhookData(
              appointmentData,
              "pago",
              process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            );
            await sendAppointmentWebhook(webhookData);
          }
        } catch (error) {
          console.error("❌ Erro ao enviar webhook n8n:", error);
          // Não falhar o pagamento por causa do webhook
        }
      }

      revalidatePath("/billing");
      revalidatePath("/appointments");

      return {
        success: true,
        payment: {
          ...paymentRecord,
          status: paymentStatus,
          changeAmountInCents,
        },
        message:
          paymentStatus === "pago"
            ? changeAmountInCents > 0
              ? `Pagamento processado com sucesso! Troco: R$ ${(changeAmountInCents / 100).toFixed(2).replace(".", ",")}`
              : "Pagamento processado com sucesso!"
            : paymentStatus === "parcial"
              ? "Pagamento parcial registrado!"
              : "Pagamento registrado!",
      };
    } catch (error) {
      // Log de falha na operação
      await logDataOperation({
        userId: session.user.id,
        clinicId: session.user.clinic.id,
        operation: "create",
        dataType: "payment",
        recordId: parsedInput.appointmentId,
        changes: {
          error: "Falha no processamento do pagamento",
          data: parsedInput,
        },
        success: false,
      });

      console.error("❌ Erro ao processar pagamento:", error);
      throw error;
    }
  });
