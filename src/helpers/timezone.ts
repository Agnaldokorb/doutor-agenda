/**
 * Utilitários para conversão de fuso horário entre UTC e UTC-3 (Brasília)
 */

interface BusinessHours {
  [key: string]: {
    startTime: string;
    endTime: string;
    isOpen: boolean;
  };
}

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
 * Converte horários de funcionamento de UTC para UTC-3 (horário local)
 * @param businessHours - Objeto com horários de funcionamento em UTC
 * @returns Objeto com horários convertidos para UTC-3
 */
export function convertBusinessHoursFromUTC(
  businessHours: BusinessHours | null | string,
): BusinessHours | null {
  if (!businessHours) return null;

  // Se businessHours for string (JSON), fazer parse
  let parsedBusinessHours: BusinessHours;
  try {
    if (typeof businessHours === "string") {
      parsedBusinessHours = JSON.parse(businessHours);
    } else {
      parsedBusinessHours = businessHours;
    }
  } catch (error) {
    console.error("Erro ao fazer parse do businessHours:", error);
    return null;
  }

  const convertedHours: BusinessHours = {};

  Object.keys(parsedBusinessHours).forEach((day) => {
    const dayHours = parsedBusinessHours[day];
    if (dayHours && dayHours.startTime && dayHours.endTime && dayHours.isOpen) {
      try {
        // Converte os horários assumindo que estão no formato HH:MM:SS ou HH:MM
        const [startHour, startMinute] = dayHours.startTime
          .split(":")
          .map(Number);
        const [endHour, endMinute] = dayHours.endTime.split(":").map(Number);

        // Criar data base (hoje) para fazer a conversão
        const baseDate = new Date();

        // Horário de início em UTC
        const startTimeUTC = new Date(baseDate);
        startTimeUTC.setUTCHours(startHour, startMinute, 0, 0);

        // Horário de fim em UTC
        const endTimeUTC = new Date(baseDate);
        endTimeUTC.setUTCHours(endHour, endMinute, 0, 0);

        // Converter para UTC-3
        const startTimeLocal = convertUTCToUTCMinus3(startTimeUTC);
        const endTimeLocal = convertUTCToUTCMinus3(endTimeUTC);

        // Formatar para HH:MM
        const formatTime = (date: Date) => {
          const hours = date.getUTCHours().toString().padStart(2, "0");
          const minutes = date.getUTCMinutes().toString().padStart(2, "0");
          return `${hours}:${minutes}`;
        };

        convertedHours[day] = {
          startTime: formatTime(startTimeLocal),
          endTime: formatTime(endTimeLocal),
          isOpen: dayHours.isOpen,
        };
      } catch (error) {
        console.error(`Erro ao converter horário para o dia ${day}:`, error);
        // Em caso de erro, manter o horário original
        convertedHours[day] = {
          startTime: dayHours.startTime,
          endTime: dayHours.endTime,
          isOpen: dayHours.isOpen,
        };
      }
    } else {
      // Dia fechado ou sem horários definidos
      convertedHours[day] = {
        startTime: "",
        endTime: "",
        isOpen: false,
      };
    }
  });

  return convertedHours;
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

/**
 * Converte horários de funcionamento de UTC-3 (horário local) para UTC
 * @param businessHours - Objeto com horários de funcionamento em UTC-3
 * @returns Objeto com horários convertidos para UTC
 */
export function convertBusinessHoursToUTC(
  businessHours: BusinessHours | null,
): BusinessHours | null {
  if (!businessHours) return null;

  const convertedHours: BusinessHours = {};

  Object.keys(businessHours).forEach((day) => {
    const dayHours = businessHours[day];
    if (dayHours && dayHours.startTime && dayHours.endTime && dayHours.isOpen) {
      try {
        // Converte os horários assumindo que estão no formato HH:MM
        const [startHour, startMinute] = dayHours.startTime
          .split(":")
          .map(Number);
        const [endHour, endMinute] = dayHours.endTime.split(":").map(Number);

        // Criar data base (hoje) para fazer a conversão
        const baseDate = new Date();

        // Horário de início em UTC-3 (horário local)
        const startTimeLocal = new Date(baseDate);
        startTimeLocal.setUTCHours(startHour, startMinute, 0, 0);

        // Horário de fim em UTC-3 (horário local)
        const endTimeLocal = new Date(baseDate);
        endTimeLocal.setUTCHours(endHour, endMinute, 0, 0);

        // Converter para UTC
        const startTimeUTC = convertUTCMinus3ToUTC(startTimeLocal);
        const endTimeUTC = convertUTCMinus3ToUTC(endTimeLocal);

        // Formatar para HH:MM
        const formatTime = (date: Date) => {
          const hours = date.getUTCHours().toString().padStart(2, "0");
          const minutes = date.getUTCMinutes().toString().padStart(2, "0");
          return `${hours}:${minutes}`;
        };

        convertedHours[day] = {
          startTime: formatTime(startTimeUTC),
          endTime: formatTime(endTimeUTC),
          isOpen: dayHours.isOpen,
        };
      } catch (error) {
        console.error(
          `Erro ao converter horário para UTC no dia ${day}:`,
          error,
        );
        // Em caso de erro, manter o horário original
        convertedHours[day] = {
          startTime: dayHours.startTime,
          endTime: dayHours.endTime,
          isOpen: dayHours.isOpen,
        };
      }
    } else {
      // Dia fechado ou sem horários definidos
      convertedHours[day] = {
        startTime: "",
        endTime: "",
        isOpen: false,
      };
    }
  });

  return convertedHours;
}
