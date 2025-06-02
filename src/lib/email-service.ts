import {
  type AppointmentEmailData,
  createAppointmentCancellationTemplate,
  createAppointmentConfirmationTemplate,
  createAppointmentReminderTemplate,
  createAppointmentUpdateTemplate,
} from "./email-templates";
import { emailConfig, sgMail } from "./sendgrid";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: {
    email: string;
    name: string;
  };
}

interface SendGridError {
  code?: number;
  message?: string;
  response?: {
    body?: {
      errors?: Array<{
        message: string;
        field?: string;
        help?: string;
      }>;
    };
  };
}

// Type guard para verificar se o erro é do tipo SendGrid
function isSendGridError(error: unknown): error is SendGridError {
  return (
    typeof error === "object" &&
    error !== null &&
    ("code" in error || "response" in error)
  );
}

class EmailService {
  private async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Verificar se o SendGrid está configurado
      if (!process.env.SENDGRID_API_KEY) {
        console.warn(
          "⚠️ SendGrid API Key não configurada. Email não será enviado.",
        );
        return false;
      }

      const msg = {
        to: options.to,
        from: options.from || emailConfig.from,
        subject: options.subject,
        html: options.html,
      };

      console.log(`📧 Enviando email para: ${options.to}`);
      console.log(`📋 Assunto: ${options.subject}`);

      const [response] = await sgMail.send(msg);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        console.log("✅ Email enviado com sucesso!");
        return true;
      } else {
        console.error("❌ Falha no envio do email:", response.statusCode);
        return false;
      }
    } catch (error: unknown) {
      console.error("❌ Erro ao enviar email:", error);

      // Melhor tratamento de erros específicos do SendGrid
      if (isSendGridError(error)) {
        if (error.code === 403) {
          console.error("🚫 Erro 403: Acesso negado. Verifique:");
          console.error("   - API Key está correta");
          console.error("   - API Key tem permissões suficientes");
          console.error("   - Email de origem está verificado");
          console.error("   - Domínio está autenticado no SendGrid");
        } else if (error.code === 401) {
          console.error("🔐 Erro 401: API Key inválida ou expirada");
        } else if (error.code === 429) {
          console.error("⏱️ Erro 429: Rate limit excedido");
        }
      }

      return false;
    }
  }

  /**
   * Envia email de confirmação quando um agendamento é criado
   */
  async sendAppointmentConfirmation(
    data: AppointmentEmailData,
  ): Promise<boolean> {
    try {
      const template = createAppointmentConfirmationTemplate(data);

      return await this.sendEmail({
        to: data.patientEmail,
        subject: template.subject,
        html: template.html,
      });
    } catch (error) {
      console.error("❌ Erro ao enviar confirmação de agendamento:", error);
      return false;
    }
  }

  /**
   * Envia lembrete 24 horas antes da consulta
   */
  async sendAppointmentReminder(data: AppointmentEmailData): Promise<boolean> {
    try {
      const template = createAppointmentReminderTemplate(data);

      return await this.sendEmail({
        to: data.patientEmail,
        subject: template.subject,
        html: template.html,
      });
    } catch (error) {
      console.error("❌ Erro ao enviar lembrete de consulta:", error);
      return false;
    }
  }

  /**
   * Envia email de cancelamento
   */
  async sendAppointmentCancellation(
    data: AppointmentEmailData,
  ): Promise<boolean> {
    try {
      const template = createAppointmentCancellationTemplate(data);

      return await this.sendEmail({
        to: data.patientEmail,
        subject: template.subject,
        html: template.html,
      });
    } catch (error) {
      console.error("❌ Erro ao enviar cancelamento de consulta:", error);
      return false;
    }
  }

  /**
   * Envia email de reagendamento
   */
  async sendAppointmentUpdate(
    data: AppointmentEmailData & { oldDate?: Date },
  ): Promise<boolean> {
    try {
      const template = createAppointmentUpdateTemplate(data);

      return await this.sendEmail({
        to: data.patientEmail,
        subject: template.subject,
        html: template.html,
      });
    } catch (error) {
      console.error("❌ Erro ao enviar atualização de consulta:", error);
      return false;
    }
  }

  /**
   * Envia emails em lote (para lembretes de 24h)
   */
  async sendBatchEmails(
    emails: EmailOptions[],
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const email of emails) {
      const success = await this.sendEmail(email);
      if (success) {
        sent++;
      } else {
        failed++;
      }

      // Pequeno delay entre emails para evitar rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(
      `📊 Batch de emails processado: ${sent} enviados, ${failed} falharam`,
    );
    return { sent, failed };
  }

  /**
   * Valida se um email é válido
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Testa a conexão com o SendGrid
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        console.warn("⚠️ SendGrid API Key não configurada");
        return false;
      }

      // Tentar enviar um email de teste para si mesmo
      const testEmail = emailConfig.from.email;

      const success = await this.sendEmail({
        to: testEmail,
        subject: "🧪 Teste de Conexão SendGrid - Doutor Agenda",
        html: `
          <h2>✅ Teste de Conexão Bem-sucedido!</h2>
          <p>Este email confirma que a integração com SendGrid está funcionando corretamente.</p>
          <p><strong>Data/Hora:</strong> ${new Date().toLocaleString("pt-BR")}</p>
        `,
      });

      if (success) {
        console.log("✅ Teste de conexão SendGrid bem-sucedido!");
      } else {
        console.error("❌ Falha no teste de conexão SendGrid");
      }

      return success;
    } catch (error: unknown) {
      console.error("❌ Erro no teste de conexão SendGrid:", error);

      // Informações específicas para debugging
      if (isSendGridError(error) && error.code === 403) {
        console.error(
          "💡 Dica: Verifique se o email de origem está verificado no SendGrid",
        );
      }

      return false;
    }
  }
}

// Instância singleton do serviço de email
export const emailService = new EmailService();

// Exportar tipos
export type { AppointmentEmailData, EmailOptions };
