import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
  dot?: boolean;
}

const toneClass: Record<NonNullable<BadgeProps['tone']>, string> = {
  brand: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300',
  accent: 'bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-300',
  success: 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300',
  warning: 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-300',
  danger: 'bg-danger-50 text-danger-700 dark:bg-danger-500/10 dark:text-danger-300',
  neutral: 'bg-ink-100 text-ink-600 dark:bg-ink-800/60 dark:text-ink-300',
};

const dotClass: Record<NonNullable<BadgeProps['tone']>, string> = {
  brand: 'bg-brand-500',
  accent: 'bg-accent-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  neutral: 'bg-ink-400',
};

export function Badge({ tone = 'neutral', dot = false, className, children, ...rest }: BadgeProps) {
  return (
    <span className={cn('badge', toneClass[tone], className)} {...rest}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotClass[tone])} />}
      {children}
    </span>
  );
}
