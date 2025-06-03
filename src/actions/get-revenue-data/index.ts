"use server";

import { and, count, desc, eq, gte, lte, sum } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import {
  appointmentPaymentsTable,
  appointmentsTable,
  doctorsTable,
  patientsTable,
  paymentTransactionsTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { getRevenueDataSchema } from "./schema";

export const getRevenueData = actionClient
  .schema(getRevenueDataSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Não autenticado");
    }

    if (!session.user.clinic) {
      throw new Error("Usuário não possui clínica associada");
    }

    if (session.user.userType !== "admin") {
      throw new Error(
        "Apenas administradores podem acessar dados de faturamento",
      );
    }

    const { startDate, endDate, paymentMethod, period } = parsedInput;
    const clinicId = session.user.clinic.id;

    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999);

    // Base condition for filtering
    const baseCondition = and(
      eq(appointmentPaymentsTable.clinicId, clinicId),
      gte(appointmentPaymentsTable.createdAt, startDateTime),
      lte(appointmentPaymentsTable.createdAt, endDateTime),
      eq(appointmentPaymentsTable.status, "pago"),
    );

    try {
      // 1. Summary data
      const summaryResult = await db
        .select({
          totalRevenue: sum(appointmentPaymentsTable.paidAmountInCents),
          totalPayments: count(appointmentPaymentsTable.id),
        })
        .from(appointmentPaymentsTable)
        .where(baseCondition);

      // 2. Unique patients count
      const patientsResult = await db
        .selectDistinct({
          patientId: appointmentsTable.patientId,
        })
        .from(appointmentPaymentsTable)
        .innerJoin(
          appointmentsTable,
          eq(appointmentPaymentsTable.appointmentId, appointmentsTable.id),
        )
        .where(baseCondition);

      // 3. Unique doctors count
      const doctorsResult = await db
        .selectDistinct({
          doctorId: appointmentsTable.doctorId,
        })
        .from(appointmentPaymentsTable)
        .innerJoin(
          appointmentsTable,
          eq(appointmentPaymentsTable.appointmentId, appointmentsTable.id),
        )
        .where(baseCondition);

      // 4. Payment methods breakdown
      const paymentMethodsCondition = paymentMethod
        ? and(
            baseCondition,
            eq(
              paymentTransactionsTable.paymentMethod,
              paymentMethod as
                | "dinheiro"
                | "cartao_credito"
                | "cartao_debito"
                | "pix"
                | "cheque"
                | "transferencia_eletronica",
            ),
          )
        : baseCondition;

      const paymentMethodsResult = await db
        .select({
          paymentMethod: paymentTransactionsTable.paymentMethod,
          totalAmount: sum(paymentTransactionsTable.amountInCents),
          transactionCount: count(paymentTransactionsTable.id),
        })
        .from(paymentTransactionsTable)
        .innerJoin(
          appointmentPaymentsTable,
          eq(
            paymentTransactionsTable.appointmentPaymentId,
            appointmentPaymentsTable.id,
          ),
        )
        .where(paymentMethodsCondition)
        .groupBy(paymentTransactionsTable.paymentMethod)
        .orderBy(desc(sum(paymentTransactionsTable.amountInCents)));

      // 5. Top doctors by revenue
      const topDoctorsResult = await db
        .select({
          doctorId: doctorsTable.id,
          doctorName: doctorsTable.name,
          specialty: doctorsTable.specialty,
          revenue: sum(appointmentPaymentsTable.paidAmountInCents),
          appointments: count(appointmentPaymentsTable.id),
        })
        .from(appointmentPaymentsTable)
        .innerJoin(
          appointmentsTable,
          eq(appointmentPaymentsTable.appointmentId, appointmentsTable.id),
        )
        .innerJoin(
          doctorsTable,
          eq(appointmentsTable.doctorId, doctorsTable.id),
        )
        .where(baseCondition)
        .groupBy(doctorsTable.id, doctorsTable.name, doctorsTable.specialty)
        .orderBy(desc(sum(appointmentPaymentsTable.paidAmountInCents)))
        .limit(10);

      // 6. Recent transactions
      const recentTransactionsResult = await db
        .select({
          paymentId: appointmentPaymentsTable.id,
          patientName: patientsTable.name,
          doctorName: doctorsTable.name,
          paymentMethod: paymentTransactionsTable.paymentMethod,
          amount: paymentTransactionsTable.amountInCents,
          appointmentDate: appointmentsTable.date,
          paymentDate: appointmentPaymentsTable.createdAt,
        })
        .from(appointmentPaymentsTable)
        .innerJoin(
          appointmentsTable,
          eq(appointmentPaymentsTable.appointmentId, appointmentsTable.id),
        )
        .innerJoin(
          patientsTable,
          eq(appointmentsTable.patientId, patientsTable.id),
        )
        .innerJoin(
          doctorsTable,
          eq(appointmentsTable.doctorId, doctorsTable.id),
        )
        .innerJoin(
          paymentTransactionsTable,
          eq(
            paymentTransactionsTable.appointmentPaymentId,
            appointmentPaymentsTable.id,
          ),
        )
        .where(baseCondition)
        .orderBy(desc(appointmentPaymentsTable.createdAt))
        .limit(50);

      // 7. Time series data (simplified for now)
      const timeSeriesResult = await db
        .select({
          date: appointmentPaymentsTable.createdAt,
          totalRevenue: appointmentPaymentsTable.paidAmountInCents,
        })
        .from(appointmentPaymentsTable)
        .where(baseCondition)
        .orderBy(appointmentPaymentsTable.createdAt);

      // Process results
      const summary = {
        totalRevenue: Number(summaryResult[0]?.totalRevenue || 0),
        totalPayments: Number(summaryResult[0]?.totalPayments || 0),
        totalPatients: patientsResult.length,
        totalDoctors: doctorsResult.length,
        averageTransaction: summaryResult[0]?.totalPayments
          ? Number(summaryResult[0].totalRevenue) /
            Number(summaryResult[0].totalPayments)
          : 0,
      };

      const paymentMethods = paymentMethodsResult.map((item) => ({
        paymentMethod: item.paymentMethod,
        totalAmount: Number(item.totalAmount || 0),
        transactionCount: Number(item.transactionCount || 0),
      }));

      const topDoctors = topDoctorsResult.map((item) => ({
        id: item.doctorId,
        name: item.doctorName,
        specialty: item.specialty,
        revenue: Number(item.revenue || 0),
        appointments: Number(item.appointments || 0),
      }));

      const recentTransactions = recentTransactionsResult.map((item) => ({
        paymentId: item.paymentId,
        patientName: item.patientName,
        doctorName: item.doctorName,
        paymentMethod: item.paymentMethod,
        amount: Number(item.amount || 0),
        appointmentDate: item.appointmentDate.toISOString(),
        paymentDate: item.paymentDate.toISOString(),
      }));

      // Group time series by day/week/month based on period
      const timeSeries = timeSeriesResult.reduce(
        (
          acc: Array<{
            date: string;
            totalRevenue: number;
            transactionCount: number;
          }>,
          item,
        ) => {
          const dateKey = item.date.toISOString().split("T")[0]; // Use date only
          const existing = acc.find((t) => t.date === dateKey);

          if (existing) {
            existing.totalRevenue += Number(item.totalRevenue);
            existing.transactionCount += 1;
          } else {
            acc.push({
              date: dateKey,
              totalRevenue: Number(item.totalRevenue),
              transactionCount: 1,
            });
          }

          return acc;
        },
        [],
      );

      const revenueData = {
        summary,
        timeSeries,
        paymentMethods,
        topDoctors,
        recentTransactions,
        filters: {
          startDate,
          endDate,
          paymentMethod,
          period,
        },
      };

      return { data: revenueData };
    } catch (error) {
      console.error("❌ Erro ao buscar dados de faturamento:", error);
      throw new Error("Falha ao carregar dados de faturamento");
    }
  });
