const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseIsoDate(value: string): Date | null {
  const match = DATE_PATTERN.exec(value.trim());
  if (!match) return null;

  const date = new Date(`${value.trim()}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;

  const [, year, month, day] = match;
  if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth() !== Number(month) - 1 || date.getUTCDate() !== Number(day)) {
    return null;
  }
  return date;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function diffInDays(fromValue: string, toValue: string): number | null {
  const from = parseIsoDate(fromValue);
  const to = parseIsoDate(toValue);
  if (!from || !to) return null;

  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}

export function addDays(value: string, days: number): string | null {
  const from = parseIsoDate(value);
  if (!from || !Number.isFinite(days)) return null;

  const result = new Date(from.getTime() + days * MS_PER_DAY);
  return result.toISOString().slice(0, 10);
}
