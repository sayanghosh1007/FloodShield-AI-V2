import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glow?: 'none' | 'brand' | 'danger' | 'warning' | 'success';
  as?: 'div' | 'section' | 'article';
}

const glowClass: Record<NonNullable<GlassCardProps['glow']>, string> = {
  none: '',
  brand: 'hover:shadow-glow',
  danger: 'hover:shadow-glow-danger',
  warning: 'hover:shadow-glow-warning',
  success: 'hover:shadow-glow-success',
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, hover = false, glow = 'none', children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'glass-panel transition-all duration-500 ease-smooth',
          hover && 'glass-hover',
          glowClass[glow],
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    );
  },
);
GlassCard.displayName = 'GlassCard';
