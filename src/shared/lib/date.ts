import { ValidationError } from "@/shared/api/errors";

export function formatTime(
  value: unknown,
  language: string,
  unit: "seconds" | "milliseconds" = "milliseconds",
) {
  const timestamp = Number(value);
  const date = new Date(unit === "seconds" ? timestamp * 1000 : timestamp);
  return timestamp && Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat(language, { dateStyle: "medium", timeStyle: "medium" }).format(date)
    : "-";
}

export function dateRange(start: string, end: string) {
  const startTime = start ? new Date(`${start}T00:00:00`).getTime() : 0;
  const endTime = end ? new Date(`${end}T23:59:59.999`).getTime() : 0;
  if (startTime && endTime && endTime < startTime)
    throw new ValidationError("management.invalidRange");
  return { startTime, endTime };
}
