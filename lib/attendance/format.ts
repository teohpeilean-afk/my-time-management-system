const TIME_ZONE = "Asia/Kuala_Lumpur";

export function minutesToHm(minutes: number): string {
  if (!minutes) return "0h 0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-MY", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-MY", {
    timeZone: TIME_ZONE,
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export function todayInKL(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
}
