import { MapPin, Users, Waves, CloudRain } from 'lucide-react';
import type { RegionSummary } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { cn, formatNumber, severityColor, severityLabel } from '@/lib/utils';

export function RegionRiskTable({ regions }: { regions: RegionSummary[] }) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-semibold text-ink-900 dark:text-white">
            Regional Risk Overview
          </h3>
          <p className="text-xs text-ink-500 dark:text-ink-400">Monitored flood basins</p>
        </div>
        <Badge tone="neutral">{regions.length} regions</Badge>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-200/60 text-[11px] uppercase tracking-wider text-ink-400 dark:border-ink-800/60 dark:text-ink-500">
              <th className="pb-2 font-semibold">Region</th>
              <th className="pb-2 font-semibold">Risk</th>
              <th className="hidden pb-2 font-semibold sm:table-cell">River</th>
              <th className="hidden pb-2 font-semibold sm:table-cell">24h Rain</th>
              <th className="hidden pb-2 text-right font-semibold md:table-cell">Population</th>
              <th className="pb-2 text-right font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200/40 dark:divide-ink-800/40">
            {regions.map((r) => {
              const sev = severityColor(r.risk);
              return (
                <tr key={r.id} className="group transition hover:bg-brand-50/40 dark:hover:bg-brand-500/5">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-brand-500" />
                      <span className="font-medium text-ink-800 dark:text-ink-100">{r.name}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={cn('badge', sev.bg, sev.text)}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', sev.dot)} />
                      {severityLabel(r.risk)}
                    </span>
                  </td>
                  <td className="hidden py-3 sm:table-cell">
                    <span className="flex items-center gap-1.5 text-ink-600 dark:text-ink-300">
                      <Waves className="h-3.5 w-3.5 text-accent-500" />
                      {formatNumber(r.riverLevel)} m
                    </span>
                  </td>
                  <td className="hidden py-3 sm:table-cell">
                    <span className="flex items-center gap-1.5 text-ink-600 dark:text-ink-300">
                      <CloudRain className="h-3.5 w-3.5 text-brand-500" />
                      {r.rainfall24h} mm
                    </span>
                  </td>
                  <td className="hidden py-3 text-right text-ink-600 dark:text-ink-300 md:table-cell">
                    <span className="flex items-center justify-end gap-1.5">
                      <Users className="h-3.5 w-3.5 text-ink-400" />
                      {formatNumber(r.population, 0)}
                    </span>
                  </td>
                  <td className="py-3 text-right text-xs font-medium text-ink-500 dark:text-ink-400">
                    {r.status}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
