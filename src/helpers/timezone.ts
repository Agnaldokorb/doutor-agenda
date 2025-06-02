/**
 * Utilitários para conversão de fuso horário entre UTC e UTC-3 (Brasília)
 */

/**
 * Converte uma data de UTC para UTC-3 (horário de Brasília)
 * @param utcDate - Data em UTC
 * @returns Nova data convertida para UTC-3
 */
export function convertUTCToUTCMinus3(utcDate: Date): Date {
  return new Date(utcDate.getTime() - 3 * 60 * 60 * 1000);
}

/**
 * Converte uma data de UTC-3 (horário de Brasília) para UTC
 * @param localDate - Data em UTC-3
 * @returns Nova data convertida para UTC
 */
export function convertUTCMinus3ToUTC(localDate: Date): Date {
  return new Date(localDate.getTime() + 3 * 60 * 60 * 1000);
}

/**
 * Formata uma data UTC para exibição em horário local (UTC-3)
 * @param utcDate - Data em UTC
 * @param options - Opções de formatação do toLocaleString
 * @returns String formatada em horário local
 */
export function formatUTCDateToLocal(
  utcDate: Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  const localDate = convertUTCToUTCMinus3(utcDate);
  return localDate.toLocaleString("pt-BR", options);
}

/**
 * Formata apenas o horário de uma data UTC para exibição local (UTC-3)
 * @param utcDate - Data em UTC
 * @returns String do horário formatada (HH:MM)
 */
export function formatUTCTimeToLocal(utcDate: Date): string {
  const localDate = convertUTCToUTCMinus3(utcDate);
  return localDate.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formata apenas a data de uma data UTC para exibição local (UTC-3)
 * @param utcDate - Data em UTC
 * @returns String da data formatada (DD/MM/AAAA)
 */
export function formatUTCDateOnly(utcDate: Date): string {
  const localDate = convertUTCToUTCMinus3(utcDate);
  return localDate.toLocaleDateString("pt-BR");
}

/**
 * Extrai o horário no formato HH:MM:SS de uma data UTC convertida para UTC-3
 * @param utcDate - Data em UTC
 * @returns String do horário no formato HH:MM:SS
 */
export function extractTimeSlotFromUTCDate(utcDate: Date): string {
  const localDate = convertUTCToUTCMinus3(utcDate);
  const hours = localDate.getUTCHours().toString().padStart(2, "0");
  const minutes = localDate.getUTCMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}:00`;
}
