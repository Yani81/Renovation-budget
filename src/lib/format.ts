export const fmtEUR = (n: number) =>
  new Intl.NumberFormat('bg-BG', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(n);

export const fmtDate = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('bg-BG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export const today = () => new Date().toISOString().slice(0, 10);

import type { PeriodFilter } from '../types';

/** Връща [from, to] като yyyy-mm-dd според избрания период */
export function periodRange(f: PeriodFilter): [string | null, string | null] {
  const now = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  switch (f.period) {
    case 'week': {
      const d = new Date(now);
      const day = (d.getDay() + 6) % 7; // понеделник = 0
      d.setDate(d.getDate() - day);
      return [iso(d), iso(now)];
    }
    case 'month':
      return [iso(new Date(now.getFullYear(), now.getMonth(), 1)), iso(now)];
    case 'year':
      return [iso(new Date(now.getFullYear(), 0, 1)), iso(now)];
    case 'custom':
      return [f.from ?? null, f.to ?? null];
    default:
      return [null, null];
  }
}
