import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { convertUTCToUTCMinus3 } from "@/helpers/timezone";

// Template base comum para todos os emails
const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Doutor Agenda</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f7fa;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 300;
        }
        .content {
            padding: 40px 30px;
        }
        .card {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .info-label {
            font-weight: 600;
            color: #495057;
        }
        .info-value {
            color: #6c757d;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
        }
        .alert {
            background: #fef7e7;
            border: 1px solid #ffd60a;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
        }
        .alert-icon {
            color: #f59e0b;
            font-size: 18px;
            margin-right: 8px;
        }
        .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
        }
        .divider {
            height: 1px;
            background: linear-gradient(to right, transparent, #e9ecef, transparent);
            margin: 30px 0;
        }
        @media (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            .content {
                padding: 20px 15px;
            }
            .info-row {
                flex-direction: column;
            }
            .info-label, .info-value {
                text-align: left;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🩺 Doutor Agenda</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p><strong>Doutor Agenda</strong> - Sistema de Gestão Médica</p>
            <p>Este é um email automático, não responda esta mensagem.</p>
            <p>Em caso de dúvidas, entre em contato com a clínica.</p>
        </div>
    </div>
</body>
</html>
`;

interface AppointmentEmailData {
  patientName: string;
  doctorName: string;
  doctorSpecialty: string;
  appointmentDate: Date;
  clinicName?: string;
  patientEmail: string;
  price?: number;
  confirmationUrl?: string;
  cancelationUrl?: string;
}

// Template de confirmação de agendamento
export const createAppointmentConfirmationTemplate = (
  data: AppointmentEmailData,
) => {
  const localDate = convertUTCToUTCMinus3(data.appointmentDate);
  const formattedDate = format(localDate, "EEEE, dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });
  const formattedTime = format(localDate, "HH:mm", { locale: ptBR });

  const content = `
    <h2 style="color: #495057; margin-bottom: 10px;">✅ Agendamento Confirmado!</h2>
    <p style="font-size: 16px; color: #6c757d; margin-bottom: 30px;">
      Olá <strong>${data.patientName}</strong>, seu agendamento foi confirmado com sucesso!
    </p>

    <div class="card">
      <h3 style="color: #495057; margin-top: 0;">📋 Detalhes da Consulta</h3>
      
      <div class="info-row">
        <span class="info-label">👨‍⚕️ Médico:</span>
        <span class="info-value">Dr. ${data.doctorName}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">🏥 Especialidade:</span>
        <span class="info-value">${data.doctorSpecialty}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">📅 Data:</span>
        <span class="info-value">${formattedDate}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">🕐 Horário:</span>
        <span class="info-value">${formattedTime}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">👤 Paciente:</span>
        <span class="info-value">${data.patientName}</span>
      </div>
      
      ${
        data.price
          ? `
      <div class="info-row">
        <span class="info-label">💰 Valor:</span>
        <span class="info-value">R$ ${(data.price / 100).toFixed(2).replace(".", ",")}</span>
      </div>
      `
          : ""
      }
    </div>

    <div class="alert">
      <span class="alert-icon">ℹ️</span>
      <strong>Importante:</strong> Chegue com 15 minutos de antecedência. 
      Traga um documento com foto e o cartão do convênio (se aplicável).
    </div>

    <div class="divider"></div>
    
    <p style="text-align: center;">
      <a href="${data.confirmationUrl || "#"}" class="button">
        📱 Gerenciar Agendamento
      </a>
    </p>

    <p style="font-size: 14px; color: #6c757d; text-align: center;">
      Se você não pode comparecer, entre em contato conosco o quanto antes.
    </p>
  `;

  return {
    subject: `🩺 Consulta Confirmada - Dr. ${data.doctorName} - ${formattedDate}`,
    html: baseTemplate(content),
  };
};

// Template de lembrete 24h antes
export const createAppointmentReminderTemplate = (
  data: AppointmentEmailData,
) => {
  const localDate = convertUTCToUTCMinus3(data.appointmentDate);
  const formattedDate = format(localDate, "EEEE, dd 'de' MMMM", {
    locale: ptBR,
  });
  const formattedTime = format(localDate, "HH:mm", { locale: ptBR });
  const tomorrow = format(localDate, "dd/MM/yyyy", { locale: ptBR });

  const content = `
    <h2 style="color: #f59e0b; margin-bottom: 10px;">⏰ Lembrete da sua consulta</h2>
    <p style="font-size: 16px; color: #6c757d; margin-bottom: 30px;">
      Olá <strong>${data.patientName}</strong>, você tem uma consulta marcada para <strong>amanhã</strong>!
    </p>

    <div class="card" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-color: #fbbf24;">
      <h3 style="color: #92400e; margin-top: 0;">📋 Lembrete da Consulta</h3>
      
      <div class="info-row" style="border-color: #fbbf24;">
        <span class="info-label" style="color: #92400e;">👨‍⚕️ Médico:</span>
        <span class="info-value" style="color: #92400e;">Dr. ${data.doctorName}</span>
      </div>
      
      <div class="info-row" style="border-color: #fbbf24;">
        <span class="info-label" style="color: #92400e;">🏥 Especialidade:</span>
        <span class="info-value" style="color: #92400e;">${data.doctorSpecialty}</span>
      </div>
      
      <div class="info-row" style="border-color: #fbbf24;">
        <span class="info-label" style="color: #92400e;">📅 Data:</span>
        <span class="info-value" style="color: #92400e;"><strong>${formattedDate}</strong></span>
      </div>
      
      <div class="info-row" style="border-color: #fbbf24;">
        <span class="info-label" style="color: #92400e;">🕐 Horário:</span>
        <span class="info-value" style="color: #92400e;"><strong>${formattedTime}</strong></span>
      </div>
    </div>

    <div class="alert" style="background: #dcfce7; border-color: #16a34a;">
      <span class="alert-icon" style="color: #16a34a;">✅</span>
      <strong style="color: #15803d;">Checklist para sua consulta:</strong>
      <ul style="margin: 10px 0; color: #166534;">
        <li>Documento com foto (RG, CNH ou Passaporte)</li>
        <li>Cartão do convênio (se aplicável)</li>
        <li>Exames anteriores relacionados</li>
        <li>Lista de medicamentos em uso</li>
        <li>Chegar 15 minutos antes do horário</li>
      </ul>
    </div>

    <div class="divider"></div>
    
    <p style="text-align: center;">
      <a href="${data.confirmationUrl || "#"}" class="button" style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);">
        ✅ Confirmar Presença
      </a>
    </p>

    <p style="font-size: 14px; color: #6c757d; text-align: center;">
      Se você não pode comparecer, entre em contato conosco <strong>urgentemente</strong>.
    </p>
  `;

  return {
    subject: `⏰ Lembrete: Consulta amanhã (${tomorrow}) às ${formattedTime} - Dr. ${data.doctorName}`,
    html: baseTemplate(content),
  };
};

// Template de cancelamento
export const createAppointmentCancellationTemplate = (
  data: AppointmentEmailData,
) => {
  const localDate = convertUTCToUTCMinus3(data.appointmentDate);
  const formattedDate = format(localDate, "EEEE, dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });
  const formattedTime = format(localDate, "HH:mm", { locale: ptBR });

  const content = `
    <h2 style="color: #dc2626; margin-bottom: 10px;">❌ Consulta Cancelada</h2>
    <p style="font-size: 16px; color: #6c757d; margin-bottom: 30px;">
      Olá <strong>${data.patientName}</strong>, informamos que sua consulta foi cancelada.
    </p>

    <div class="card" style="background: #fef2f2; border-color: #fca5a5;">
      <h3 style="color: #991b1b; margin-top: 0;">📋 Consulta Cancelada</h3>
      
      <div class="info-row" style="border-color: #fca5a5;">
        <span class="info-label" style="color: #991b1b;">👨‍⚕️ Médico:</span>
        <span class="info-value" style="color: #991b1b;">Dr. ${data.doctorName}</span>
      </div>
      
      <div class="info-row" style="border-color: #fca5a5;">
        <span class="info-label" style="color: #991b1b;">📅 Data que seria:</span>
        <span class="info-value" style="color: #991b1b;">${formattedDate} às ${formattedTime}</span>
      </div>
    </div>

    <div class="alert" style="background: #eff6ff; border-color: #3b82f6;">
      <span class="alert-icon" style="color: #2563eb;">ℹ️</span>
      <strong style="color: #1d4ed8;">Precisa reagendar?</strong><br>
      Entre em contato conosco para marcar uma nova consulta.
    </div>

    <div class="divider"></div>
    
    <p style="text-align: center;">
      <a href="${data.confirmationUrl || "#"}" class="button" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);">
        📅 Agendar Nova Consulta
      </a>
    </p>

    <p style="font-size: 14px; color: #6c757d; text-align: center;">
      Lamentamos qualquer inconveniente causado.
    </p>
  `;

  return {
    subject: `❌ Consulta Cancelada - Dr. ${data.doctorName} - ${formattedDate}`,
    html: baseTemplate(content),
  };
};

// Template de atualização de agendamento
export const createAppointmentUpdateTemplate = (
  data: AppointmentEmailData & { oldDate?: Date },
) => {
  const localDate = convertUTCToUTCMinus3(data.appointmentDate);
  const formattedDate = format(localDate, "EEEE, dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });
  const formattedTime = format(localDate, "HH:mm", { locale: ptBR });

  const content = `
    <h2 style="color: #2563eb; margin-bottom: 10px;">🔄 Consulta Reagendada</h2>
    <p style="font-size: 16px; color: #6c757d; margin-bottom: 30px;">
      Olá <strong>${data.patientName}</strong>, sua consulta foi reagendada com sucesso!
    </p>

    <div class="card" style="background: #eff6ff; border-color: #3b82f6;">
      <h3 style="color: #1d4ed8; margin-top: 0;">📋 Nova Data da Consulta</h3>
      
      <div class="info-row" style="border-color: #93c5fd;">
        <span class="info-label" style="color: #1d4ed8;">👨‍⚕️ Médico:</span>
        <span class="info-value" style="color: #1d4ed8;">Dr. ${data.doctorName}</span>
      </div>
      
      <div class="info-row" style="border-color: #93c5fd;">
        <span class="info-label" style="color: #1d4ed8;">📅 Nova Data:</span>
        <span class="info-value" style="color: #1d4ed8;"><strong>${formattedDate}</strong></span>
      </div>
      
      <div class="info-row" style="border-color: #93c5fd;">
        <span class="info-label" style="color: #1d4ed8;">🕐 Novo Horário:</span>
        <span class="info-value" style="color: #1d4ed8;"><strong>${formattedTime}</strong></span>
      </div>
    </div>

    <div class="alert">
      <span class="alert-icon">ℹ️</span>
      <strong>Lembre-se:</strong> Chegue com 15 minutos de antecedência. 
      Traga um documento com foto e o cartão do convênio (se aplicável).
    </div>

    <div class="divider"></div>
    
    <p style="text-align: center;">
      <a href="${data.confirmationUrl || "#"}" class="button">
        📱 Ver Detalhes
      </a>
    </p>
  `;

  return {
    subject: `🔄 Consulta Reagendada - Dr. ${data.doctorName} - ${formattedDate}`,
    html: baseTemplate(content),
  };
};

export type { AppointmentEmailData };
