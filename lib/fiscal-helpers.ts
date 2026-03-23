import type { FiscalPrinter } from './types';

/** Etiqueta legible para fecha/hora de creación del registro en el libro. */
export function formatRegistroCreado(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('es-VE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function formatTimestamp(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  } catch {
    return dateStr;
  }
}

export function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export function truncateVersion(version: string | null | undefined): string | null {
  if (!version) return null;
  const parts = version.split('.');
  if (parts.length > 1) {
    return parts.slice(0, -1).join('.');
  }
  return version;
}

export function getActiveSealSerial(printer: FiscalPrinter): string | null {
  if (!printer.precintos || printer.precintos.length === 0) {
    return null;
  }
  const activeSeal = printer.precintos.find(precinto =>
    precinto.id_impresora !== null && precinto.estatus === 'en_impresora'
  );
  return activeSeal ? activeSeal.serial : null;
}
