import dayjs from "dayjs";
import { convertUTCToUTCMinus3 } from "./timezone";

export interface AppointmentWebhookData {
  status: "agendado" | "confirmado" | "cancelado" | "pago";
  appointmentId: string;
  patientName: string;
  doctorName: string;
  clinicName: string;
  clinicAddress: string;
  price: number; // em centavos
  appointmentDate: string; // ISO string em UTC-3
  appointmentTime: string; // HH:mm format
  confirmUrl?: string;
  cancelUrl?: string;
}

/**
 * Envia dados do agendamento para o webhook do n8n
 * @param data Dados do agendamento formatados
 */
export async function sendAppointmentWebhook(data: AppointmentWebhookData) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("⚠️ N8N_WEBHOOK_URL não está configurada no ambiente");
    return;
  }

  try {
    console.log("📡 Enviando webhook para n8n:", {
      status: data.status,
      appointmentId: data.appointmentId,
      patientName: data.patientName,
      doctorName: data.doctorName,
    });

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "appointment_status_change",
        timestamp: new Date().toISOString(),
        data: {
          ...data,
          // Formatação adicional para facilitar o uso no n8n
          priceFormatted: `R$ ${(data.price / 100).toFixed(2).replace(".", ",")}`,
          appointmentDateTime: `${data.appointmentDate} ${data.appointmentTime}`,
        },
      }),
    });

    if (response.ok) {
      console.log("✅ Webhook enviado com sucesso para n8n");
    } else {
      const errorText = await response.text();
      console.error("❌ Erro na resposta do webhook n8n:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
    }
  } catch (error) {
    console.error("❌ Erro ao enviar webhook para n8n:", error);
  }
}

/**
 * Prepara os dados do agendamento para envio via webhook
 * @param appointment Dados completos do agendamento
 * @param status Status do agendamento
 */
export function prepareAppointmentWebhookData(
  appointment: {
    id: string;
    date: Date;
    appointmentPriceInCents: number;
    patient: { name: string };
    doctor: { name: string };
    clinic?: { name: string; address?: string | null } | null;
  },
  status: AppointmentWebhookData["status"],
  baseUrl?: string,
): AppointmentWebhookData {
  // Converter a data UTC para UTC-3 (São Paulo)
  const localDateTime = convertUTCToUTCMinus3(appointment.date);

  // Separar data e hora
  const appointmentDate = dayjs(localDateTime).format("DD/MM/YYYY");
  const appointmentTime = dayjs(localDateTime).format("HH:mm");

  // URLs para confirmação e cancelamento
  const confirmUrl = baseUrl
    ? `${baseUrl}/api/appointments/${appointment.id}/confirm`
    : undefined;
  const cancelUrl = baseUrl
    ? `${baseUrl}/api/appointments/${appointment.id}/cancel`
    : undefined;

  return {
    status,
    appointmentId: appointment.id,
    patientName: appointment.patient.name,
    doctorName: appointment.doctor.name,
    clinicName: appointment.clinic?.name || "Clínica",
    clinicAddress: appointment.clinic?.address || "Endereço não informado",
    price: appointment.appointmentPriceInCents,
    appointmentDate,
    appointmentTime,
    confirmUrl,
    cancelUrl,
  };
}
