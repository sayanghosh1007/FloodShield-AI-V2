import {
  Brain,
  AlertTriangle,
  TrendingUp,
  CloudRain,
  Waves,
  WifiOff,
  MapPin,
  Sparkles,
} from 'lucide-react';
import type { SensorAnalytics, SensorAlert } from '@/api/sensorApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { cn, timeAgo, severityColor } from '@/lib/utils';

interface SensorAnalyticsPanelProps {
  analytics: SensorAnalytics;
  alerts: SensorAlert[];
}

export function SensorAnalyticsPanel({ analytics, alerts }: SensorAnalyticsPanelProps) {
  return (
    <div className="space-y-4">
      <GlassCard className="p-5" hover glow="brand">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <Brain className="h-5 w-5" />
          </span>
          <div>
            <p className="label-eyebrow text-[10px]">AI Sensor Analytics</p>
            <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">Automated anomaly detection</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <AnalyticsTile icon={<AlertTriangle className="h-4 w-4" />} label="Abnormal Readings" value={analytics.sensorsReportingAbnormal} tone="danger" />
          <AnalyticsTile icon={<TrendingUp className="h-4 w-4" />} label="Rising River Levels" value={analytics.risingRiverLevels} tone="warning" />
          <AnalyticsTile icon={<CloudRain className="h-4 w-4" />} label="Heavy Rainfall" value={analytics.heavyRainfallDetected} tone="accent" />
          <AnalyticsTile icon={<Waves className="h-4 w-4" />} label="Rapid Water Rise" value={analytics.rapidWaterLevelIncrease} tone="warning" />
          <AnalyticsTile icon={<WifiOff className="h-4 w-4" />} label="Comm Failures" value={analytics.communicationFailures} tone="danger" />
          <AnalyticsTile icon={<MapPin className="h-4 w-4" />} label="Areas to Inspect" value={analytics.areasRequiringInspection} tone="brand" />
        </div>
      </GlassCard>

      <GlassCard className="p-5" hover>
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink-800 dark:text-ink-100">
            <Sparkles className="h-4 w-4 text-brand-500" />
            Sensor Alerts & Recommendations
          </p>
          <Badge tone="brand">{alerts.length} active</Badge>
        </div>

        <div className="mt-4 space-y-2.5">
          {alerts.slice(0, 8).map((alert) => {
            const sev = severityColor(alert.severity);
            return (
              <div
                key={alert.id}
                className={cn('rounded-xl border p-3.5 transition-all duration-300 hover:shadow-glass-sm', sev.bg, sev.border)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={cn('text-sm font-semibold', sev.text)}>{alert.title}</p>
                    <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
                      {alert.sensorName} · {alert.district}, {alert.state}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge tone={alert.severity === 'critical' ? 'danger' : alert.severity === 'warning' ? 'warning' : 'neutral'}>
                      {alert.severity}
                    </Badge>
                    <span className="text-[10px] text-ink-400">{timeAgo(alert.timestamp)}</span>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-xs text-ink-600 dark:text-ink-300">
                    <span className="font-semibold">Action:</span> {alert.recommendedAction}
                  </p>
                  <span className="shrink-0 text-[10px] font-semibold text-brand-600 dark:text-brand-400">
                    {alert.confidence}% conf.
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

function AnalyticsTile({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: 'brand' | 'danger' | 'warning' | 'accent' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
    danger: 'bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-400',
    warning: 'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400',
    accent: 'bg-accent-50 text-accent-600 dark:bg-accent-500/10 dark:text-accent-400',
  };
  return (
    <div className="rounded-xl border border-ink-200/50 bg-white/40 p-3 dark:border-ink-800/50 dark:bg-ink-900/40">
      <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', tones[tone])}>
        {icon}
      </div>
      <p className="mt-2 font-display text-xl font-bold text-ink-900 dark:text-white">{value}</p>
      <p className="text-[10px] font-medium text-ink-500 dark:text-ink-400">{label}</p>
    </div>
  );
}
