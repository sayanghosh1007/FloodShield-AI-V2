import { CloudRain, Sun, Cloud, CloudDrizzle, MapPin, Loader2 } from 'lucide-react';
import type { ForecastRow } from '@/api/weatherApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatTime, cn } from '@/lib/utils';

function conditionIcon(c: string) {
  if (c.includes('Heavy')) return <CloudRain className="h-4 w-4 text-brand-500" />;
  if (c.includes('Light')) return <CloudDrizzle className="h-4 w-4 text-accent-500" />;
  if (c.includes('Cloudy')) return <Cloud className="h-4 w-4 text-ink-400" />;
  return <Sun className="h-4 w-4 text-warning-500" />;
}

interface ForecastTableProps {
  forecast: ForecastRow[];
  /** Label for the location the forecast applies to (set after a map click). */
  locationLabel?: string;
  loading?: boolean;
}

export function ForecastTable({ forecast, locationLabel, loading }: ForecastTableProps) {
  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-semibold text-ink-900 dark:text-white">36-Hour Forecast</h3>
          <p className="flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
            <MapPin className="h-3 w-3 text-brand-500" />
            {loading ? 'Calculating for selected location…' : locationLabel ?? 'Open-Meteo · 3-hour intervals'}
          </p>
        </div>
        <span className="label-eyebrow">{forecast.length} steps</span>
      </div>
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-ink-400 dark:text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Generating location forecast…
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-200/60 text-[11px] uppercase tracking-wider text-ink-400 dark:border-ink-800/60 dark:text-ink-500">
                <th className="pb-2 font-semibold">Time</th>
                <th className="pb-2 font-semibold">Condition</th>
                <th className="pb-2 text-right font-semibold">Temp</th>
                <th className="pb-2 text-right font-semibold">Rain</th>
                <th className="hidden pb-2 text-right font-semibold sm:table-cell">Wind</th>
                <th className="hidden pb-2 text-right font-semibold sm:table-cell">Humidity</th>
                <th className="hidden pb-2 text-right font-semibold md:table-cell">Cloud</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200/40 dark:divide-ink-800/40">
              {forecast.map((f) => (
                <tr key={f.time} className="transition hover:bg-brand-50/40 dark:hover:bg-brand-500/5">
                  <td className="py-2.5 font-medium text-ink-700 dark:text-ink-200">{formatTime(f.time)}</td>
                  <td className="py-2.5">
                    <span className="flex items-center gap-2 text-ink-600 dark:text-ink-300">
                      {conditionIcon(f.condition)}
                      {f.condition}
                    </span>
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-ink-700 dark:text-ink-200">{f.temp.toFixed(1)}°</td>
                  <td className={cn('py-2.5 text-right tabular-nums', f.rain > 1 ? 'font-medium text-brand-600 dark:text-brand-300' : 'text-ink-400')}>
                    {f.rain.toFixed(1)} mm
                  </td>
                  <td className="hidden py-2.5 text-right tabular-nums text-ink-600 dark:text-ink-300 sm:table-cell">{f.wind} km/h</td>
                  <td className="hidden py-2.5 text-right tabular-nums text-ink-600 dark:text-ink-300 sm:table-cell">{f.humidity}%</td>
                  <td className="hidden py-2.5 text-right tabular-nums text-ink-600 dark:text-ink-300 md:table-cell">{f.cloud}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  );
}
