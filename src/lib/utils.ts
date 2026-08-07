import type { Severity } from '@/types';

/** Format a number with up to `digits` decimals and thousands separators. */
export function formatNumber(value: number, digits = 1): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value);
}

/** Compact relative time, e.g. "3m ago", "just now". */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, Math.round((now - then) / 1000));
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const severityRank: Record<Severity, number> = {
  info: 0,
  advisory: 1,
  watch: 2,
  warning: 3,
  critical: 4,
};

export function severityLabel(s: Severity): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function severityRankOf(s: Severity): number {
  return severityRank[s];
}

export function severityColor(s: Severity): {
  text: string;
  bg: string;
  border: string;
  dot: string;
} {
  switch (s) {
    case 'critical':
      return {
        text: 'text-danger-700 dark:text-danger-300',
        bg: 'bg-danger-50 dark:bg-danger-500/10',
        border: 'border-danger-300/50 dark:border-danger-500/30',
        dot: 'bg-danger-500',
      };
    case 'warning':
      return {
        text: 'text-warning-700 dark:text-warning-300',
        bg: 'bg-warning-50 dark:bg-warning-500/10',
        border: 'border-warning-300/50 dark:border-warning-500/30',
        dot: 'bg-warning-500',
      };
    case 'watch':
      return {
        text: 'text-brand-700 dark:text-brand-300',
        bg: 'bg-brand-50 dark:bg-brand-500/10',
        border: 'border-brand-300/50 dark:border-brand-500/30',
        dot: 'bg-brand-500',
      };
    case 'advisory':
      return {
        text: 'text-accent-700 dark:text-accent-300',
        bg: 'bg-accent-50 dark:bg-accent-500/10',
        border: 'border-accent-300/50 dark:border-accent-500/30',
        dot: 'bg-accent-500',
      };
    default:
      return {
        text: 'text-ink-600 dark:text-ink-300',
        bg: 'bg-ink-100 dark:bg-ink-800/40',
        border: 'border-ink-300/50 dark:border-ink-700/40',
        dot: 'bg-ink-500',
      };
  }
}

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Build a normalized sparkline path for an SVG, given values + viewBox dims. */
export function sparklinePath(values: number[], w = 100, h = 32): string {
  if (values.length === 0) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = w / Math.max(1, values.length - 1);
  return values
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

/** Deterministic pseudo-random in [0,1) from a string seed. */
export function seededRandom(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
