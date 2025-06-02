import "dayjs/locale/pt-br";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { doctorsTable } from "@/db/schema";
import { convertBusinessHoursFromUTC } from "@/helpers/timezone";

dayjs.extend(utc);
dayjs.locale("pt-br");

export interface DoctorAvailability {
  hasBusinessHours: boolean;
  schedule: Array<{
    day: string;
    dayName: string;
    isOpen: boolean;
    startTime?: string;
    endTime?: string;
  }>;
  // Para compatibilidade com o código existente
  from: dayjs.Dayjs;
  to: dayjs.Dayjs;
}

export const getAvailability = (
  doctor: typeof doctorsTable.$inferSelect,
): DoctorAvailability => {
  const dayNames = [
    { key: "sunday", label: "Domingo" },
    { key: "monday", label: "Segunda" },
    { key: "tuesday", label: "Terça" },
    { key: "wednesday", label: "Quarta" },
    { key: "thursday", label: "Quinta" },
    { key: "friday", label: "Sexta" },
    { key: "saturday", label: "Sábado" },
  ];

  // Se o médico tem businessHours (novo sistema)
  if (doctor.businessHours) {
    try {
      // Converter de UTC para UTC-3 para exibição
      const businessHours = convertBusinessHoursFromUTC(doctor.businessHours);

      if (businessHours) {
        const schedule = dayNames.map((day, index) => ({
          day: day.key,
          dayName: day.label,
          isOpen: businessHours[day.key]?.isOpen || false,
          startTime: businessHours[day.key]?.isOpen
            ? businessHours[day.key].startTime
            : undefined,
          endTime: businessHours[day.key]?.isOpen
            ? businessHours[day.key].endTime
            : undefined,
        }));

        // Encontrar primeiro e último dia aberto para compatibilidade
        const openDays = schedule.filter((day) => day.isOpen);
        const firstOpenDay = openDays[0];
        const lastOpenDay = openDays[openDays.length - 1];

        // Criar objetos dayjs para compatibilidade
        const from = firstOpenDay
          ? dayjs()
              .day(schedule.findIndex((d) => d.day === firstOpenDay.day))
              .set(
                "hour",
                parseInt(firstOpenDay.startTime?.split(":")[0] || "8"),
              )
              .set(
                "minute",
                parseInt(firstOpenDay.startTime?.split(":")[1] || "0"),
              )
              .set("second", 0)
          : dayjs().day(1).set("hour", 8).set("minute", 0).set("second", 0);

        const to = lastOpenDay
          ? dayjs()
              .day(schedule.findIndex((d) => d.day === lastOpenDay.day))
              .set("hour", parseInt(lastOpenDay.endTime?.split(":")[0] || "18"))
              .set(
                "minute",
                parseInt(lastOpenDay.endTime?.split(":")[1] || "0"),
              )
              .set("second", 0)
          : dayjs().day(5).set("hour", 18).set("minute", 0).set("second", 0);

        return {
          hasBusinessHours: true,
          schedule,
          from,
          to,
        };
      }
    } catch (error) {
      console.error("Erro ao processar businessHours:", error);
    }
  }

  // Fallback para sistema legado
  const convertLegacyTime = (timeStr: string) => {
    if (!timeStr) return { hour: 8, minute: 0 };
    const [hours, minutes, seconds = "00"] = timeStr.split(":");
    const utcTime = new Date();
    utcTime.setUTCHours(
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds),
      0,
    );
    const localTime = new Date(utcTime.getTime() - 3 * 60 * 60 * 1000);
    return {
      hour: localTime.getUTCHours(),
      minute: localTime.getUTCMinutes(),
    };
  };

  const fromTime = convertLegacyTime(doctor.availableFromTime);
  const toTime = convertLegacyTime(doctor.availableToTime);

  const from = dayjs()
    .day(doctor.availableFromWeekDay)
    .set("hour", fromTime.hour)
    .set("minute", fromTime.minute)
    .set("second", 0);

  const to = dayjs()
    .day(doctor.availableToWeekDay)
    .set("hour", toTime.hour)
    .set("minute", toTime.minute)
    .set("second", 0);

  // Criar schedule legado
  const schedule = dayNames.map((day, index) => {
    const fromDay = doctor.availableFromWeekDay;
    const toDay = doctor.availableToWeekDay;

    let isOpen = false;
    if (fromDay <= toDay) {
      isOpen = index >= fromDay && index <= toDay;
    } else {
      isOpen = index >= fromDay || index <= toDay;
    }

    return {
      day: day.key,
      dayName: day.label,
      isOpen,
      startTime: isOpen
        ? `${fromTime.hour.toString().padStart(2, "0")}:${fromTime.minute.toString().padStart(2, "0")}`
        : undefined,
      endTime: isOpen
        ? `${toTime.hour.toString().padStart(2, "0")}:${toTime.minute.toString().padStart(2, "0")}`
        : undefined,
    };
  });

  return {
    hasBusinessHours: false,
    schedule,
    from,
    to,
  };
};
