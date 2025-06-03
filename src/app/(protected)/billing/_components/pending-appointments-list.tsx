"use client";

import { format } from "date-fns";
import { CalendarIcon, ClockIcon, CreditCard, User } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";

import { getPendingPrivateAppointments } from "@/actions/get-pending-private-appointments";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyInCents } from "@/helpers/currency";
import { convertUTCToUTCMinus3 } from "@/helpers/timezone";

import { PaymentDialog } from "./payment-dialog";

type PendingAppointment = {
  id: string;
  date: Date;
  appointmentPriceInCents: number;
  patient: {
    id: string;
    name: string;
    email: string;
    phone_number: string;
  };
  doctor: {
    id: string;
    name: string;
    specialty: string;
    appointmentPriceInCents: number;
  };
  payment?: {
    id: string;
    status: "pendente" | "pago" | "parcial" | "cancelado";
    paidAmountInCents: number;
    remainingAmountInCents: number;
    transactions: unknown[];
  } | null;
};

interface PendingAppointmentsListProps {
  onPaymentProcessed?: () => void;
}

export function PendingAppointmentsList({
  onPaymentProcessed,
}: PendingAppointmentsListProps) {
  const [selectedAppointment, setSelectedAppointment] =
    useState<PendingAppointment | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const getDoctorAppointmentsAction = useAction(getPendingPrivateAppointments, {
    onSuccess: (data) => {
      console.log("✅ Estrutura completa dos dados recebidos:", data);
      console.log("🔍 Tipo de data:", typeof data);
      console.log("🔍 Object.keys(data):", Object.keys(data));
      console.log("🔍 data.data:", data?.data);
      console.log("🔍 data.data?.appointments:", data?.data?.appointments);
      console.log(
        "✅ Agendamentos pendentes carregados:",
        data?.data?.appointments?.length || 0,
      );

      if (data?.data) {
        console.log("🔍 data.data.appointments:", data.data.appointments);
      }
    },
    onError: (error: unknown) => {
      console.error("❌ Erro ao carregar agendamentos pendentes:", error);
      toast.error("Erro ao carregar agendamentos pendentes");
    },
  });

  useEffect(() => {
    getDoctorAppointmentsAction.execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executar apenas uma vez na montagem do componente

  const handleProcessPayment = (appointment: PendingAppointment) => {
    setSelectedAppointment(appointment);
    setPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    getDoctorAppointmentsAction.execute();
    toast.success("Pagamento processado com sucesso!");
    if (onPaymentProcessed) {
      onPaymentProcessed();
    }
  };

  const appointments = useMemo(() => {
    return getDoctorAppointmentsAction.result?.data?.appointments || [];
  }, [getDoctorAppointmentsAction.result]);

  if (getDoctorAppointmentsAction.isExecuting) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-green-600 border-t-transparent"></div>
          <p className="text-gray-500">Carregando agendamentos pendentes...</p>
        </div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CreditCard className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900">
          Nenhum agendamento pendente
        </h3>
        <p className="mt-2 text-gray-500">
          Todos os agendamentos particulares estão com pagamentos em dia.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {appointments.map((appointment: PendingAppointment) => {
          const utcDate = new Date(appointment.date);
          const localDate = convertUTCToUTCMinus3(utcDate);

          // Calcular valores baseados no pagamento existente ou valor total
          const totalValue = appointment.appointmentPriceInCents;
          const paidValue = appointment.payment?.paidAmountInCents || 0;
          const remainingValue = totalValue - paidValue;

          const getStatusConfig = (payment?: PendingAppointment["payment"]) => {
            if (!payment) {
              return {
                label: "Pendente",
                className: "bg-red-50 text-red-700 border-red-200",
              };
            }

            switch (payment.status) {
              case "parcial":
                return {
                  label: "Parcial",
                  className: "bg-yellow-50 text-yellow-700 border-yellow-200",
                };
              case "pago":
                return {
                  label: "Pago",
                  className: "bg-green-50 text-green-700 border-green-200",
                };
              default:
                return {
                  label: "Pendente",
                  className: "bg-red-50 text-red-700 border-red-200",
                };
            }
          };

          const statusConfig = getStatusConfig(appointment.payment);

          return (
            <Card
              key={appointment.id}
              className="border-l-4 border-l-green-500 transition-shadow hover:shadow-md"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    {/* Avatar do paciente */}
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarImage src="" alt={appointment.patient.name} />
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 font-semibold text-white">
                        {appointment.patient.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Detalhes do agendamento */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-start justify-between gap-4">
                        <div>
                          <h3 className="truncate font-semibold text-gray-900">
                            {appointment.patient.name}
                          </h3>
                          <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                            <User className="h-4 w-4" />
                            <span className="truncate">
                              Dr. {appointment.doctor.name}
                            </span>
                          </div>
                        </div>
                        <Badge className={statusConfig.className}>
                          {statusConfig.label}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-3">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-green-500" />
                          <span>{format(localDate, "dd/MM/yy")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4 text-green-500" />
                          <span>{format(localDate, "HH:mm")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-green-500" />
                          <span className="truncate">
                            {appointment.doctor.specialty}
                          </span>
                        </div>
                      </div>

                      {/* Informações de pagamento */}
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Valor Total:
                          </span>
                          <span className="font-semibold text-gray-900">
                            {formatCurrencyInCents(totalValue)}
                          </span>
                        </div>

                        {paidValue > 0 && (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                Já Pago:
                              </span>
                              <span className="font-semibold text-green-600">
                                {formatCurrencyInCents(paidValue)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                Restante:
                              </span>
                              <span className="font-semibold text-red-600">
                                {formatCurrencyInCents(remainingValue)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="mt-4 flex justify-end">
                        <Button
                          onClick={() => handleProcessPayment(appointment)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          {appointment.payment?.status === "parcial"
                            ? "Completar Pagamento"
                            : "Processar Pagamento"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog de Pagamento */}
      <PaymentDialog
        appointment={selectedAppointment}
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}
