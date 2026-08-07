import { AlertTriangle, ArrowRight, MapPin, Users, Waves } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@/hooks/useQuery';
import { getAlerts } from '@/api/floodApi';
import { getFloodPrediction } from '@/api/floodPredictionApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { cn, severityColor, severityLabel, severityRankOf, timeAgo, formatNumber } from '@/lib/utils';

/** Active alerts panel — surfaces the highest-risk regions first. */
export function AlertTicker() {
  const { data: alerts } = useQuery(getAlerts, []);
  const { data: floodPrediction } = useQuery(getFloodPrediction, []);

  // Merge system alerts with flood live-flood / high-alert events, then rank
  // by severity so the highest-risk regions appear at the top.
  const merged = (() => {
    const items: Array<{
      id: string;
      title: string;
      region: string;
      severity: 'info' | 'advisory' | 'watch' | 'warning' | 'critical';
      detail: string;
      population?: number;
      issuedAt: string;
      kind: 'alert' | 'live' | 'high-alert';
    }> = [];

    (alerts ?? []).forEach((a) =>
      items.push({
        id: a.id,
        title: a.title,
        region: a.region,
        severity: a.severity,
        detail: a.message,
        issuedAt: a.issuedAt,
        kind: 'alert',
      }),
    );

    (floodPrediction?.liveFloods ?? []).forEach((f) =>
      items.push({
        id: f.id,
        title: `LIVE FLOOD — ${f.name}`,
        region: f.name,
        severity: f.tier === 'extreme' ? 'critical' : f.tier === 'high' ? 'warning' : 'watch',
        detail: `${f.depth}m depth · ${f.source}`,
        population: f.affected,
        issuedAt: f.since,
        kind: 'live',
      }),
    );

    (floodPrediction?.highAlerts ?? []).forEach((a) =>
      items.push({
        id: a.id,
        title: `HIGH ALERT — ${a.name}`,
        region: a.name,
        severity: a.tier === 'extreme' ? 'critical' : 'warning',
        detail: a.reason,
        population: a.affectedPopulation,
        issuedAt: a.issuedAt,
        kind: 'high-alert',
      }),
    );

    return items.sort((a, b) => severityRankOf(b.severity) - severityRankOf(a.severity)).slice(0, 5);
  })();

  return (
    <GlassCard className="h-full p-5" glow={merged.some((m) => m.severity === 'critical') ? 'danger' : 'none'}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger-500/15 text-danger-600 dark:text-danger-400">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-base font-semibold text-ink-900 dark:text-white">
              Active Alerts
            </h3>
            <p className="text-xs text-ink-500 dark:text-ink-400">Highest-risk regions first</p>
          </div>
        </div>
        <Link
          to="/alerts"
          className="flex items-center gap-1 text-xs font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-300"
        >
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <ul className="mt-4 space-y-2.5">
        {merged.map((a) => {
          const sev = severityColor(a.severity);
          const tone = a.severity === 'critical' ? 'danger' : a.severity === 'warning' ? 'warning' : a.severity === 'watch' ? 'brand' : 'accent';
          const isLive = a.kind === 'live';
          return (
            <li
              key={`${a.kind}-${a.id}`}
              className={cn(
                'group rounded-xl border p-3 transition-all duration-300 hover:shadow-glass-sm',
                sev.bg,
                sev.border,
              )}
            >
              <div className="flex items-start gap-3">
                <span className={cn('mt-1.5 flex h-2.5 w-2.5 shrink-0 items-center justify-center')}>
                  <span className={cn('block h-2.5 w-2.5 rounded-full', isLive ? 'animate-ping' : '', sev.dot)} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-ink-800 dark:text-ink-100">
                      {a.title}
                    </p>
                    <Badge tone={tone}>{severityLabel(a.severity)}</Badge>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-ink-500 dark:text-ink-400">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {a.region}
                  </p>
                  <p className="mt-1 text-[11px] text-ink-600 dark:text-ink-300">{a.detail}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[10px] text-ink-400 dark:text-ink-500">
                    {a.population != null && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {formatNumber(a.population, 0)} affected
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Waves className="h-3 w-3" /> {timeAgo(a.issuedAt)}
                    </span>
                    {isLive && <span className="font-semibold text-danger-500">LIVE NOW</span>}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
