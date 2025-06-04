import { NextResponse } from "next/server";
import { sendAppointmentWebhook } from "@/helpers/n8n-webhook";

export async function GET() {
  try {
    console.log("🧪 Iniciando teste direto do webhook...");

    const testData = {
      status: "agendado" as const,
      appointmentId: "test-123-456",
      patientName: "Paciente Teste",
      doctorName: "Dr. Teste",
      clinicName: "Clínica Teste",
      clinicAddress: "Rua Teste, 123",
      price: 15000,
      appointmentDate: "15/01/2025",
      appointmentTime: "14:30",
      confirmUrl: "http://localhost:3000/api/appointments/test-123-456/confirm",
      cancelUrl: "http://localhost:3000/api/appointments/test-123-456/cancel",
    };

    console.log("📡 Enviando webhook de teste...");
    await sendAppointmentWebhook(testData);
    console.log("✅ Teste concluído!");

    return NextResponse.json({
      success: true,
      message: "Webhook de teste enviado",
      data: testData,
    });
  } catch (error) {
    console.error("❌ Erro no teste do webhook:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    );
  }
}
