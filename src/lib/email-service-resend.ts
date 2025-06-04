import { Resend } from "resend";

import {
  type AppointmentEmailData,
  createAppointmentCancellationTemplate,
  createAppointmentConfirmationTemplate,
  createAppointmentReminderTemplate,
  createAppointmentUpdateTemplate,
} from "./email-templates";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: {
    email: string;
    name: string;
  };
}

// Configurações padrão
export const emailConfig = {
  from: {
    email: process.env.RESEND_FROM_EMAIL || "noreply@doutorAgenda.com",
    name: process.env.RESEND_FROM_NAME || "Doutor Agenda",
  },
};

class ResendEmailService {
  private resend: Resend | null = null;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.warn(
        "⚠️ RESEND_API_KEY não configurada. Serviço de email desabilitado.",
      );
      this.resend = null;
    } else {
      this.resend = new Resend(apiKey);
      console.log("✅ Serviço Resend inicializado com sucesso");
    }
  }

  /**
   * Verifica se o Resend está configurado
   */
  private isConfigured(): boolean {
    return this.resend !== null;
  }

  /**
   * Envia um email usando Resend
   */
  private async sendEmail(
    options: EmailOptions,
    clinicId: string,
  ): Promise<boolean> {
    try {
      // Verificar se Resend está configurado
      if (!this.isConfigured()) {
        console.warn("⚠️ Resend não configurado. Configure RESEND_API_KEY.");
        return false;
      }

      const fromEmail = options.from || emailConfig.from;

      console.log(
        `📧 Enviando email via Resend para: ${options.to} (Clínica: ${clinicId})`,
      );
      console.log(`📋 Assunto: ${options.subject}`);

      const { data, error } = await this.resend!.emails.send({
        from: `${fromEmail.name} <${fromEmail.email}>`,
        to: [options.to],
        subject: options.subject,
        html: options.html,
      });

      if (error) {
        console.error("❌ Erro ao enviar email via Resend:", error);
        return false;
      }

      if (data?.id) {
        console.log("✅ Email enviado com sucesso via Resend!");
        console.log(`📬 Email ID: ${data.id}`);
        return true;
      } else {
        console.error("❌ Email rejeitado pelo Resend");
        return false;
      }
    } catch (error: unknown) {
      console.error("❌ Erro ao enviar email via Resend:", error);
      return false;
    }
  }

  /**
   * Teste de conectividade (sempre retorna true para Resend)
   */
  async checkConfiguration(): Promise<boolean> {
    try {
      // Para Resend, só precisamos verificar se a API key existe e o serviço está configurado
      return this.isConfigured();
    } catch (error) {
      console.error("❌ Erro na verificação Resend:", error);
      return false;
    }
  }

  /**
   * Testa a conexão Resend
   */
  async testConnection(): Promise<boolean> {
    return this.checkConfiguration();
  }

  /**
   * Envia email de confirmação de agendamento
   */
  async sendAppointmentConfirmation(
    data: AppointmentEmailData,
    clinicId: string,
  ): Promise<boolean> {
    try {
      const { subject, html } = createAppointmentConfirmationTemplate(data);

      return await this.sendEmail(
        {
          to: data.patientEmail,
          subject,
          html,
        },
        clinicId,
      );
    } catch (error) {
      console.error("❌ Erro ao enviar confirmação de agendamento:", error);
      return false;
    }
  }

  /**
   * Envia email de lembrete de agendamento
   */
  async sendAppointmentReminder(
    data: AppointmentEmailData,
    clinicId: string,
  ): Promise<boolean> {
    try {
      const { subject, html } = createAppointmentReminderTemplate(data);

      return await this.sendEmail(
        {
          to: data.patientEmail,
          subject,
          html,
        },
        clinicId,
      );
    } catch (error) {
      console.error("❌ Erro ao enviar lembrete de agendamento:", error);
      return false;
    }
  }

  /**
   * Envia email de cancelamento de agendamento
   */
  async sendAppointmentCancellation(
    data: AppointmentEmailData,
    clinicId: string,
  ): Promise<boolean> {
    try {
      const { subject, html } = createAppointmentCancellationTemplate(data);

      return await this.sendEmail(
        {
          to: data.patientEmail,
          subject,
          html,
        },
        clinicId,
      );
    } catch (error) {
      console.error("❌ Erro ao enviar cancelamento de agendamento:", error);
      return false;
    }
  }

  /**
   * Envia email de atualização de agendamento
   */
  async sendAppointmentUpdate(
    data: AppointmentEmailData & { oldDate?: Date },
    clinicId: string,
  ): Promise<boolean> {
    try {
      const { subject, html } = createAppointmentUpdateTemplate(data);

      return await this.sendEmail(
        {
          to: data.patientEmail,
          subject,
          html,
        },
        clinicId,
      );
    } catch (error) {
      console.error("❌ Erro ao enviar atualização de agendamento:", error);
      return false;
    }
  }

  /**
   * Envia múltiplos emails em lote
   */
  async sendBatchEmails(
    emails: (EmailOptions & { clinicId: string })[],
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const email of emails) {
      const success = await this.sendEmail(email, email.clinicId);
      if (success) {
        sent++;
      } else {
        failed++;
      }
    }

    return { sent, failed };
  }

  /**
   * Valida formato de email
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Exportar instância única
export const emailService = new ResendEmailService();

// Exportar tipos
export type { AppointmentEmailData, EmailOptions };
