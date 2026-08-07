import { memo, useMemo } from 'react';
import {
  Activity,
  Cloud,
  CloudRain,
  Compass,
  Database,
  Droplets,
  Eye,
  Gauge,
  Sprout,
  Sun,
  Thermometer,
  Waves,
  Wind,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
} from 'lucide-react';
import type { MetricReading } from '@/types';
import { GlassCard } from './GlassCard';
import { Sparkline } from './Sparkline';
import { useCountUp } from '@/hooks/useCountUp';
import { cn, formatNumber, severityColor } from '@/lib/utils';

const ICONS: Record<string, typeof Thermometer> = {
  Thermometer,
  Droplets,
  CloudRain,
  Wind,
  Compass,
  Gauge,
  Eye,
  Cloud,
  Waves,
  Database,
  Sprout,
  Sun,
};

interface MetricCardProps {
  metric: MetricReading;
  index?: number;
}

function TrendIcon({ trend }: { trend: MetricReading['trend'] }) {
  if (trend === 'up') return <ArrowUpRight className="h-3.5 w-3.5" />;
  if (trend === 'down') return <ArrowDownRight className="h-3.5 w-3.5" />;
  return <Minus className="h-3.5 w-3.5" />;
}

function trendColor(trend: MetricReading['trend']): string {
  if (trend === 'up') return 'text-success-600 dark:text-success-400';
  if (trend === 'down') return 'text-danger-600 dark:text-danger-400';
  return 'text-ink-400 dark:text-ink-500';
}

/** Render the wind-direction value as a live compass dial. */
function CompassDial({ degrees }: { degrees: number }) {
  const dirs = ['N', 'E', 'S', 'W'];
  const normalized = ((degrees % 360) + 360) % 360;
  return (
    <div className="relative h-16 w-16" aria-label={`Wind from ${Math.round(degrees)} degrees`}>
      <div className="absolute inset-0 rounded-full border-2 border-ink-200/70 dark:border-ink-700/60" />
      <div className="absolute inset-0 rounded-full border border-brand-300/30 dark:border-brand-500/20" />
      {dirs.map((d, i) => (
        <span
          key={d}
          className="absolute text-[9px] font-semibold text-ink-400 dark:text-ink-500"
          style={{
            top: '50%',
            left: '50%',
            transform: `translate(-50%,-50%) rotate(${i * 90}deg) translateY(-26px)`,
          }}
        >
          {d}
        </span>
      ))}
      <div
        className="absolute left-1/2 top-1/2 h-7 w-0.5 origin-bottom -translate-x-1/2 -translate-y-full rounded-full bg-gradient-to-t from-brand-500 to-accent-400 transition-transform duration-1000 ease-smooth"
        style={{ transform: `translate(-50%, -100%) rotate(${normalized}deg)` }}
      >
        <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-accent-400 shadow-glow" />
      </div>
      <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600 dark:bg-brand-400" />
    </div>
  );
}

export const MetricCard = memo(function MetricCard({ metric, index = 0 }: MetricCardProps) {
  const Icon = ICONS[metric.icon] ?? Activity;
  const sev = severityColor(metric.severity);
  const animated = useCountUp(metric.value);
  const display = useMemo(() => formatNumber(metric.value, metric.unit === '°' ? 0 : 1), [metric.value, metric.unit]);
  const isCompass = metric.key === 'windDirection';

  return (
    <GlassCard
      hover
      glow={metric.severity === 'critical' ? 'danger' : metric.severity === 'warning' ? 'warning' : 'brand'}
      className="group relative overflow-hidden p-4 animate-fade-in-scale"
      style={{ animationDelay: `${index * 0.04}s` }}
      role="group"
      aria-label={`${metric.label}: ${display} ${metric.unit}, ${metric.status}`}
    >
      {/* severity accent strip */}
      <div className={cn('absolute inset-x-0 top-0 h-0.5', sev.dot)} />

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl border',
              sev.bg,
              sev.border,
              sev.text,
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <p className="text-[13px] font-medium text-ink-700 dark:text-ink-200">{metric.label}</p>
            <p className={cn('text-[11px] font-semibold', sev.text)}>{metric.status}</p>
          </div>
        </div>
        <span
          className={cn(
            'badge px-1.5 py-0.5',
            trendColor(metric.trend),
            metric.trend === 'stable' ? 'bg-ink-100/70 dark:bg-ink-800/40' : 'bg-transparent',
          )}
        >
          <TrendIcon trend={metric.trend} />
          {Math.abs(metric.change).toFixed(1)}%
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-1">
          <span className="stat-value text-2xl text-ink-900 dark:text-white" aria-live="polite">
            {isCompass ? formatNumber(animated, 0) : display}
          </span>
          <span className="text-xs font-medium text-ink-400 dark:text-ink-500">{metric.unit}</span>
        </div>

        {isCompass ? (
          <CompassDial degrees={animated} />
        ) : (
          <div className={cn('h-9 w-24', sev.text)}>
            <Sparkline values={metric.series} className="h-9 w-24" color="currentColor" />
          </div>
        )}
      </div>

      {metric.threshold && (
        <div className="mt-3 flex items-center gap-1.5">
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-ink-200/70 dark:bg-ink-800/70">
            <div
              className={cn('absolute inset-y-0 left-0 rounded-full', sev.dot)}
              style={{
                width: `${Math.min(100, (metric.value / metric.threshold.critical) * 100)}%`,
                transition: 'width 0.9s cubic-bezier(0.16,1,0.3,1)',
              }}
            />
          </div>
          <span className="text-[10px] font-medium text-ink-400 dark:text-ink-500">
            crit {metric.threshold.critical}
          </span>
        </div>
      )}
    </GlassCard>
  );
});
