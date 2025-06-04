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
    console.warn("⚠️ N8N_WEBHOOK_URL não está configurada");
    return;
  }

  try {
    console.log("📡 Enviando webhook para n8n:", {
      url: webhookUrl,
      status: data.status,
      appointmentId: data.appointmentId,
    });

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "appointment_status_change",
        data,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro na resposta do webhook n8n:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });

      // Se for 404, significa que o workflow não está ativo
      if (response.status === 404) {
        console.warn(
          "⚠️ Webhook n8n retornou 404 - verifique se o workflow está ATIVO no n8n",
        );
      }

      return;
    }

    const responseData = await response.text();
    console.log("✅ Webhook n8n enviado com sucesso:", {
      status: response.status,
      response: responseData,
    });
  } catch (error) {
    console.error("❌ Erro ao enviar webhook n8n:", error);
  }
}

/**
 * Prepara os dados do agendamento para envio ao webhook
 */
export function prepareAppointmentWebhookData(
  appointment: {
    id: string;
    date: Date;
    appointmentPriceInCents: number;
    patient: { name: string };
    doctor: { name: string };
    clinic?: { name: string; address?: string | null };
  },
  status: "agendado" | "confirmado" | "cancelado" | "pago",
  baseUrl: string,
): AppointmentWebhookData {
  // Converter UTC para UTC-3 para exibição
  const localDate = convertUTCToUTCMinus3(appointment.date);

  return {
    status,
    appointmentId: appointment.id,
    patientName: appointment.patient.name,
    doctorName: appointment.doctor.name,
    clinicName: appointment.clinic?.name || "Clínica",
    clinicAddress: appointment.clinic?.address || "Endereço não informado",
    price: appointment.appointmentPriceInCents,
    appointmentDate: dayjs(localDate).format("DD/MM/YYYY"),
    appointmentTime: dayjs(localDate).format("HH:mm"),
    confirmUrl: `${baseUrl}/api/appointments/${appointment.id}/confirm`,
    cancelUrl: `${baseUrl}/api/appointments/${appointment.id}/cancel`,
  };
}
