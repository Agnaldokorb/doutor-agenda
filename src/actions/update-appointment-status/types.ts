// Definindo os possíveis status
export const appointmentStatus = [
  "agendado",
  "confirmado",
  "cancelado",
  "concluido",
] as const;
export type AppointmentStatus = (typeof appointmentStatus)[number];
