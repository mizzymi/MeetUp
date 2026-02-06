/**
 * Converts an <input type="datetime-local"> value into a full ISO string.
 * Example: "2026-02-06T14:30" -> "2026-02-06T13:30:00.000Z" (depending on local TZ)
 *
 * The input is interpreted as local time and converted to UTC ISO.
 */
export function datetimeLocalToIso(value: string): string {
    return new Date(value).toISOString();
}

export function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
