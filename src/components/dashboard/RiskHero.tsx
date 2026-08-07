import { ShieldAlert, Radar, RefreshCw, Radio } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { HeroStat } from './RiverChart';
import type { WeatherSnapshot } from '@/types';
import { formatTime } from '@/lib/utils';

interface RiskHeroProps {
  snapshot: WeatherSnapshot;
  onRefresh: () => void;
  refreshing?: boolean;
}

export function RiskHero({ snapshot, onRefresh, refreshing }: RiskHeroProps) {
  const critical = snapshot.metrics.filter((m) => m.severity === 'critical').length;
  const warnings = snapshot.metrics.filter((m) => m.severity === 'warning').length;
  const overall = critical > 0 ? 'critical' : warnings > 0 ? 'warning' : 'normal';

  return (
    <GlassCard className="relative overflow-hidden p-6 sm:p-7">
      {/* Decorative radar sweep */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 opacity-30 dark:opacity-20">
        <div className="absolute inset-0 rounded-full border-2 border-brand-400/30" />
        <div className="absolute inset-6 rounded-full border border-brand-400/20" />
        <div className="absolute inset-12 rounded-full border border-brand-400/20" />
        <div
          className="absolute inset-0 animate-spin-slow rounded-full"
          style={{
            background:
              'conic-gradient(from 0deg, rgba(51,128,252,0.4), transparent 60%, transparent)',
          }}
        />
      </div>

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <div className="flex items-center gap-2">
            <Badge tone={critical > 0 ? 'danger' : warnings > 0 ? 'warning' : 'success'} dot>
              {overall === 'critical' ? 'Critical risk' : overall === 'warning' ? 'Elevated risk' : 'Stable'}
            </Badge>
            <span className="flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
              <Radio className="h-3.5 w-3.5 text-success-500" />
              Live · {snapshot.station}
            </span>
          </div>
          <h1 className="mt-3 font-display text-2xl font-semibold text-ink-900 dark:text-white sm:text-3xl">
            Eastern Flood Basin — real-time monitoring
          </h1>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
            {snapshot.metrics.length} telemetry channels active across rivers, reservoirs, and
            atmospheric sensors. Last sync {formatTime(snapshot.lastUpdated)}.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button onClick={onRefresh} variant="primary" size="md" disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Syncing' : 'Refresh telemetry'}
            </Button>
            <Button variant="secondary" size="md">
              <Radar className="h-4 w-4" />
              Run AI forecast
            </Button>
            <Button variant="ghost" size="md">
              <ShieldAlert className="h-4 w-4" />
              Issue evacuation
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:max-w-md">
          <HeroStat label="Critical" value={String(critical)} tone={critical > 0 ? 'danger' : 'success'} />
          <HeroStat label="Warnings" value={String(warnings)} tone={warnings > 0 ? 'warning' : 'success'} />
          <HeroStat label="Sensors" value="128" tone="brand" />
          <HeroStat label="Uptime" value="99.9%" tone="success" />
        </div>
      </div>
    </GlassCard>
  );
}
