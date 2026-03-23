/**
 * Parsing y validación de fechas/horas para formularios (hora local del navegador).
 * Evita `new Date("YYYY-MM-DDTHH:mm")` sin zona, que en algunos entornos se interpreta como UTC.
 */

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

function isValidCalendarDate(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(y, m - 1, d, 12, 0, 0, 0);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export type ParseResult =
  | { ok: true; value: Date }
  | { ok: false; error: string };

/**
 * Fecha calendario (input type="date") en hora local, medianoche.
 */
export function parseLocalDateOnly(dateStr: string, fieldLabel: string): ParseResult {
  const s = dateStr.trim();
  const m = s.match(DATE_RE);
  if (!m) {
    return { ok: false, error: `${fieldLabel}: la fecha no tiene el formato AAAA-MM-DD.` };
  }
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (![y, mo, d].every((n) => Number.isFinite(n))) {
    return { ok: false, error: `${fieldLabel}: la fecha contiene valores no numéricos.` };
  }
  if (!isValidCalendarDate(y, mo, d)) {
    return { ok: false, error: `${fieldLabel}: la fecha no existe en el calendario.` };
  }
  const value = new Date(y, mo - 1, d, 0, 0, 0, 0);
  if (isNaN(value.getTime())) {
    return { ok: false, error: `${fieldLabel}: fecha inválida.` };
  }
  return { ok: true, value };
}

/**
 * Fecha + hora (inputs type="date" + type="time") en hora local.
 */
export function parseLocalDateTime(dateStr: string, timeStr: string, fieldLabel: string): ParseResult {
  const ds = dateStr.trim();
  const ts = timeStr.trim();
  const dm = ds.match(DATE_RE);
  if (!dm) {
    return { ok: false, error: `${fieldLabel}: la fecha no tiene el formato AAAA-MM-DD.` };
  }
  const tm = ts.match(TIME_RE);
  if (!tm) {
    return { ok: false, error: `${fieldLabel}: la hora no es válida (use HH:MM).` };
  }
  const y = Number(dm[1]);
  const mo = Number(dm[2]);
  const d = Number(dm[3]);
  let h = Number(tm[1]);
  let min = Number(tm[2]);
  const sec = tm[3] !== undefined && tm[3] !== '' ? Number(tm[3]) : 0;

  if (![y, mo, d, h, min, sec].every((n) => Number.isFinite(n))) {
    return { ok: false, error: `${fieldLabel}: fecha u hora contiene valores no numéricos.` };
  }
  if (h < 0 || h > 23 || min < 0 || min > 59 || sec < 0 || sec > 59) {
    return { ok: false, error: `${fieldLabel}: hora fuera de rango (00:00–23:59).` };
  }
  if (!isValidCalendarDate(y, mo, d)) {
    return { ok: false, error: `${fieldLabel}: la fecha no existe en el calendario.` };
  }

  const value = new Date(y, mo - 1, d, h, min, sec, 0);
  if (isNaN(value.getTime())) {
    return { ok: false, error: `${fieldLabel}: combinación fecha/hora inválida.` };
  }
  // Comprobar que no hubo desbordamiento silencioso (p. ej. 31 de febrero)
  if (
    value.getFullYear() !== y ||
    value.getMonth() !== mo - 1 ||
    value.getDate() !== d ||
    value.getHours() !== h ||
    value.getMinutes() !== min ||
    value.getSeconds() !== sec
  ) {
    return { ok: false, error: `${fieldLabel}: la fecha u hora no es coherente.` };
  }
  return { ok: true, value };
}

/** ISO 8601 UTC para columnas timestamptz de Supabase */
export function toIsoUtc(d: Date): string {
  return d.toISOString();
}

/** Diferencia en días (fracción) entre dos fechas locales; asume end >= start */
export function diffDaysInclusive(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
}
