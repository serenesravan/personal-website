import { isDay } from "./tracker";

export const checkInsKey = "mobility.check-ins.v1";

export function parseCheckIns(json: string): Set<string> {
  const value: unknown = JSON.parse(json);
  if (typeof value !== "object" || value === null || !("days" in value)
    || !Array.isArray(value.days) || !value.days.every(isDay)) {
    throw new Error("Invalid check-ins");
  }
  return new Set(value.days);
}

export function loadCheckIns(): Set<string> {
  const saved = localStorage.getItem(checkInsKey);
  return saved === null ? new Set() : parseCheckIns(saved);
}

export async function updateCheckIns(change: (days: Set<string>) => void): Promise<Set<string>> {
  const update = () => {
    const days = loadCheckIns();
    change(days);
    localStorage.setItem(checkInsKey, JSON.stringify({ days: [...days].sort() }));
    return days;
  };

  // Serialize read-modify-write operations across tabs where Web Locks is available.
  return navigator.locks ? navigator.locks.request(checkInsKey, update) : update();
}
