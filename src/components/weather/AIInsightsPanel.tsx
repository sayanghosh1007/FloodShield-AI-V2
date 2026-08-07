import { Sparkles, TrendingUp, AlertCircle, ShieldCheck } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import type { WeatherSnapshot } from '@/api/weatherApi';

interface AIInsightsPanelProps {
  snapshot: WeatherSnapshot;
}

interface Insight {
  kind: 'risk' | 'trend' | 'note' | 'positive';
  title: string;
  detail: string;
}

/** Derives AI-style narrative insights from the current snapshot. */
function buildInsights(s: WeatherSnapshot): Insight[] {
  const out: Insight[] = [];
  const heavyRain = s.series.rainfall.filter((r) => r > 8).length;
  if (heavyRain > 6) {
    out.push({
      kind: 'risk',
      title: 'Sustained heavy rainfall detected',
      detail: `${heavyRain} of the last 24 hourly bins exceeded 8mm. Soil saturation is likely elevated across the Gangetic plains — flood onset risk raised for low-lying districts.`,
    });
  }
  if (s.storms.length) {
    out.push({
      kind: 'risk',
      title: `${s.storms.length} active storm systems tracked`,
      detail: `The Bay of Bengal remnant cyclone is forecast to track NW toward coastal Andhra. Expect 80–120mm cumulative rainfall over the next 24h in its path.`,
    });
  }
  const tempMax = Math.max(...s.series.temperature);
  if (tempMax > 40) {
    out.push({
      kind: 'note',
      title: 'Heat stress conditions in western India',
      detail: `Peak temperature reached ${tempMax.toFixed(1)}°C. Combine with humidity ${s.current.humidity}% for wet-bulb risk assessment in Rajasthan and Gujarat.`,
    });
  }
  const pressureDrop = s.series.pressure[0] - s.series.pressure[s.series.pressure.length - 1];
  if (pressureDrop > 4) {
    out.push({
      kind: 'trend',
      title: 'Pressure falling — system intensifying',
      detail: `Mean sea-level pressure dropped ${pressureDrop.toFixed(1)} hPa over 24h, consistent with an approaching low-pressure system. Monitor wind and rainfall trends.`,
    });
  }
  if (s.lightning.length > 8) {
    out.push({
      kind: 'risk',
      title: 'High lightning activity',
      detail: `${s.lightning.length} strikes detected in the last hour. Outdoor workers and livestock in affected districts should seek shelter immediately.`,
    });
  }
  if (out.length === 0) {
    out.push({
      kind: 'positive',
      title: 'Conditions within normal range',
      detail: 'No anomalous patterns detected across monitored parameters over the last 24 hours.',
    });
  }
  return out;
}

function kindMeta(k: Insight['kind']) {
  switch (k) {
    case 'risk':
      return { icon: AlertCircle, tone: 'danger' as const, color: 'text-danger-600 dark:text-danger-400 bg-danger-500/15' };
    case 'trend':
      return { icon: TrendingUp, tone: 'brand' as const, color: 'text-brand-600 dark:text-brand-300 bg-brand-500/15' };
    case 'note':
      return { icon: Sparkles, tone: 'accent' as const, color: 'text-accent-600 dark:text-accent-300 bg-accent-500/15' };
    default:
      return { icon: ShieldCheck, tone: 'success' as const, color: 'text-success-600 dark:text-success-400 bg-success-500/15' };
  }
}

export function AIInsightsPanel({ snapshot }: AIInsightsPanelProps) {
  const insights = buildInsights(snapshot);

  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-glow">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-base font-semibold text-ink-900 dark:text-white">AI Insights</h3>
            <p className="text-xs text-ink-500 dark:text-ink-400">Pattern analysis on live telemetry</p>
          </div>
        </div>
        <Badge tone="brand" dot>Auto-generated</Badge>
      </div>

      <ul className="space-y-3">
        {insights.map((ins, i) => {
          const meta = kindMeta(ins.kind);
          const Icon = meta.icon;
          return (
            <li
              key={i}
              className="flex gap-3 rounded-xl border border-ink-200/50 bg-white/40 p-3 dark:border-ink-800/50 dark:bg-ink-900/40"
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.color}`}>
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">{ins.title}</p>
                <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">{ins.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
