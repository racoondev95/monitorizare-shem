// Datele sunt păstrate ca șiruri "YYYY-MM-DD" (fără probleme de fus orar).

export function today(): string {
  const tz = process.env.APP_TIMEZONE || "Europe/Bucharest";
  return new Date().toLocaleDateString("en-CA", { timeZone: tz });
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function diffDays(a: string, b: string): number {
  const [ya, ma, da] = a.split("-").map(Number);
  const [yb, mb, db] = b.split("-").map(Number);
  return Math.round((Date.UTC(ya, ma - 1, da) - Date.UTC(yb, mb - 1, db)) / 86_400_000);
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return addDays(value, 0) === value;
}

export function formatDate(date: string, opts?: Intl.DateTimeFormatOptions): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("ro-RO", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
    ...opts,
  });
}

/** Ziua curentă a evocării (1–7), 0 dacă n-a început, 8 dacă s-a încheiat. */
export function dayOfEvocation(evokedOn: string, now = today()): number {
  const n = diffDays(now, evokedOn) + 1;
  if (n < 1) return 0;
  if (n > 7) return 8;
  return n;
}
