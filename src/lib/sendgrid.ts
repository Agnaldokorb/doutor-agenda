import sgMail from "@sendgrid/mail";

// Configurar a API key do SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export { sgMail };

// Configurações padrão
export const emailConfig = {
  from: {
    email: process.env.SENDGRID_FROM_EMAIL || "noreply@doutorAgenda.com",
    name: process.env.SENDGRID_FROM_NAME || "Doutor Agenda",
  },
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
};
