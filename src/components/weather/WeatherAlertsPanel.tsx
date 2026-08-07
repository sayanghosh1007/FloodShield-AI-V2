import { AlertTriangle, Bell } from 'lucide-react';
import type { WeatherAlert } from '@/api/weatherApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { cn, severityColor, severityLabel, timeAgo } from '@/lib/utils';

export function WeatherAlertsPanel({ alerts }: { alerts: WeatherAlert[] }) {
  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger-500/15 text-danger-600 dark:text-danger-400">
            <Bell className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-base font-semibold text-ink-900 dark:text-white">Weather Alerts</h3>
            <p className="text-xs text-ink-500 dark:text-ink-400">{alerts.length} active across India</p>
          </div>
        </div>
      </div>

      <ul className="space-y-3">
        {alerts.map((a) => {
          const sev = severityColor(a.severity);
          const tone = a.severity === 'critical' ? 'danger' : a.severity === 'warning' ? 'warning' : a.severity === 'watch' ? 'brand' : 'accent';
          return (
            <li
              key={a.id}
              className={cn('rounded-xl border p-3 transition hover:shadow-glass-sm', sev.bg, sev.border)}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">{a.title}</p>
                <Badge tone={tone}>{severityLabel(a.severity)}</Badge>
              </div>
              <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">{a.area}</p>
              <p className="mt-1.5 text-xs text-ink-600 dark:text-ink-300">{a.message}</p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-ink-400 dark:text-ink-500">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {a.source}
                </span>
                <span>Issued {timeAgo(a.issuedAt)}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
