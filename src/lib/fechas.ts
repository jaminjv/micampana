/** Utilidades de fecha en español de Colombia, sin depender del idioma del teléfono. */
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIAS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

export function hace(iso: string): string {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  if (d === 1) return 'ayer';
  return `hace ${d} días`;
}

export function diaCorto(iso: string): { dia: string; num: number } {
  const f = new Date(iso);
  return { dia: DIAS[f.getDay()], num: f.getDate() };
}

export function horaTexto(iso: string): string {
  const f = new Date(iso);
  const h = f.getHours();
  const m = String(f.getMinutes()).padStart(2, '0');
  const sufijo = h < 12 ? 'a. m.' : 'p. m.';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${sufijo}`;
}

export function fechaCorta(iso: string): string {
  const f = new Date(iso);
  return `${f.getDate()} ${MESES[f.getMonth()]}`;
}
