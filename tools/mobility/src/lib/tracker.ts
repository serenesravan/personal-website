export const WEEKLY_GOAL = 4;
const DAY_MS = 86_400_000;

export function utcDay(day: string): Date {
  return new Date(day + "T00:00:00Z");
}

export function deviceDay(date = new Date()): string {
  return [
    String(date.getFullYear()).padStart(4, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function isDay(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = utcDay(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function shiftDay(day: string, days: number): string {
  return new Date(utcDay(day).getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

export function monday(day: string): string {
  return shiftDay(day, -((utcDay(day).getUTCDay() + 6) % 7));
}

export function shiftMonth(month: string, offset: number): string {
  const date = utcDay(month + "-01");
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}

export function monthCells(month: string): (string | null)[] {
  const first = month + "-01";
  const offset = (utcDay(first).getUTCDay() + 6) % 7;
  const last = Number(shiftDay(shiftMonth(month, 1) + "-01", -1).slice(-2));
  return Array.from({ length: Math.ceil((offset + last) / 7) * 7 }, (_, index) => {
    const number = index - offset + 1;
    return number < 1 || number > last ? null : shiftDay(first, number - 1);
  });
}

export function formatDay(day: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-IN", { ...options, timeZone: "UTC" }).format(utcDay(day));
}

export function trackerStats(days: ReadonlySet<string>, today: string) {
  const currentWeek = monday(today);
  const counts = new Map<string, number>();

  for (const day of days) {
    if (day > today) continue;
    const week = monday(day);
    counts.set(week, (counts.get(week) ?? 0) + 1);
  }

  let lastCompletedWeek: string | undefined;
  let run = 0;
  let bestStreak = 0;
  for (const week of [...counts.keys()].sort()) {
    if ((counts.get(week) ?? 0) < WEEKLY_GOAL) continue;

    run = lastCompletedWeek === shiftDay(week, -7) ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    lastCompletedWeek = week;
  }

  const streak = lastCompletedWeek === currentWeek || lastCompletedWeek === shiftDay(currentWeek, -7)
    ? run
    : 0;
  return { thisWeek: counts.get(currentWeek) ?? 0, streak, bestStreak };
}
