import {
  Thermometer,
  Droplets,
  CloudRain,
  Wind,
  Gauge,
  Eye,
  type LucideIcon,
} from 'lucide-react';
import type { RegionWeatherDetail } from '@/api/floodApi';
import { cn, severityColor } from '@/lib/utils';

const ICONS: Record<string, LucideIcon> = {
  Thermometer,
  Droplets,
  CloudRain,
  Wind,
  Gauge,
  Eye,
};

interface RegionWeatherCardsProps {
  detail: RegionWeatherDetail;
}

/** Weather detail cards for a clicked flood region — accurate per-region readings. */
export function RegionWeatherCards({ detail }: RegionWeatherCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {detail.conditions.map((c) => {
        const Icon = ICONS[c.icon] ?? Thermometer;
        const sev = severityColor(c.severity);
        const tone = c.severity === 'critical' || c.severity === 'warning'
          ? 'danger'
          : c.severity === 'watch'
            ? 'warning'
            : c.severity === 'advisory'
              ? 'accent'
              : 'success';
        return (
          <div
            key={c.key}
            className={cn(
              'rounded-xl border bg-white/50 p-3 backdrop-blur-md transition-all duration-300 dark:bg-ink-900/40',
              sev.border,
            )}
          >
            <div className="flex items-center justify-between">
              <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', sev.bg, sev.text)}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className={cn('h-1.5 w-1.5 rounded-full', sev.dot)} />
            </div>
            <p className="mt-2 font-display text-lg font-bold text-ink-900 dark:text-white">
              {c.value.toFixed(1)}
              <span className="ml-0.5 text-xs font-medium text-ink-400 dark:text-ink-500">{c.unit}</span>
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-ink-500 dark:text-ink-400">{c.label}</p>
          </div>
        );
      })}
    </div>
  );
}
