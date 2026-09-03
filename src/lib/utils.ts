import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Locale-aware, so a thousands separator never appears as a decimal point. */
export const num = (n: number) => new Intl.NumberFormat('en-US').format(n);

export const money = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export const pct = (n: number, digits = 0) => `${n.toFixed(digits)}%`;

/**
 * Absolute date AND time, with the year. A relative label alone ("2 days ago") is
 * ambiguous the moment someone reads it a week later, so this is what tooltips carry.
 */
export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export const dateOnly = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

/** Short relative label for scan-reading. Always paired with `dateTime` in a tooltip. */
export function relative(iso: string, now = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (Math.abs(min) < 1) return 'just now';
  if (Math.abs(min) < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (Math.abs(hr) < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (Math.abs(day) < 30) return `${day}d ago`;
  return dateOnly(iso);
}

export const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

/** Deterministic pick from a list — keeps mock data stable across renders. */
export const pick = <T,>(list: readonly T[], seed: number): T => list[seed % list.length]!;

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
