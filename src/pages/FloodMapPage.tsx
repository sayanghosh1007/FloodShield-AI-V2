import { useState } from 'react';
import { CircleMarker, Popup } from 'react-leaflet';
import { RotateCw, Waves, Users, Globe } from 'lucide-react';
import { useQuery } from '@/hooks/useQuery';
import { getWorldFloodHotspots, type WorldFloodHotspot } from '@/api/floodApi';
import { PageHeader } from '@/components/ui/PageHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { LeafletMap } from '@/components/map/LeafletMap';
import { formatTime, severityColor, severityLabel } from '@/lib/utils';

const WORLD_CENTER: [number, number] = [25, 15];

const RISK_HEX: Record<string, string> = {
  critical: '#7f1d1d',
  warning: '#dc2626',
  watch: '#f97316',
  advisory: '#eab308',
  info: '#10b981',
};

export function FloodMapPage() {
  const { data, loading, error, refetch } = useQuery(getWorldFloodHotspots, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-10 w-64 rounded" />
        <div className="skeleton h-[600px] w-full rounded-2xl" />
      </div>
    );
  }
  if (error || !data) {
    return <ErrorState fullPage title="Flood map unavailable" message={error ?? 'Could not load flood data.'} onRetry={refetch} />;
  }

  const critical = data.filter((d) => d.risk === 'critical').length;
  const totalAffected = data.reduce((a, d) => a + d.affected, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Intelligence"
        title="Global Flood Map"
        description="Worldwide view of active flood events — inundation hotspots across every continent with affected population, depth, and severity."
        actions={
          <Button onClick={refetch} variant="secondary" size="md">
            <RotateCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard icon={<Globe className="h-5 w-5" />} label="Active Floods" value={data.length.toString()} tone="brand" />
        <SummaryCard icon={<Waves className="h-5 w-5" />} label="Critical Events" value={critical.toString()} tone="danger" />
        <SummaryCard icon={<Users className="h-5 w-5" />} label="People Affected" value={totalAffected.toLocaleString()} tone="warning" />
        <SummaryCard icon={<Globe className="h-5 w-5" />} label="Countries" value={new Set(data.map((d) => d.country)).size.toString()} tone="accent" />
      </div>

      <GlassCard className="relative overflow-hidden p-2" hover>
        <div className="mb-2 flex items-center justify-between px-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="label-eyebrow">Global flood map · OpenStreetMap</span>
            <Badge tone="danger" dot>{critical} critical</Badge>
          </div>
          <span className="text-[11px] text-ink-400 dark:text-ink-500">Click a hotspot for details</span>
        </div>
        <div className="relative h-[600px] w-full overflow-hidden rounded-xl">
          <LeafletMap center={WORLD_CENTER} zoom={2} theme="osm" className="absolute inset-0">
            {data.map((h) => {
              const hex = RISK_HEX[h.risk] ?? '#10b981';
              return (
                <CircleMarker
                  key={h.id}
                  center={[h.lat, h.lng]}
                  radius={h.risk === 'critical' ? 12 : h.risk === 'warning' ? 10 : 8}
                  pathOptions={{ color: '#fff', weight: 1.5, fillColor: hex, fillOpacity: 0.8 }}
                >
                  <Popup>
                    <strong>{h.name}</strong><br />
                    {h.country}<br />
                    Risk: {severityLabel(h.risk)}<br />
                    Depth: {h.depth} m<br />
                    Affected: {h.affected.toLocaleString()}<br />
                    Since: {formatTime(h.since)}
                  </Popup>
                </CircleMarker>
              );
            })}
          </LeafletMap>

          {/* Legend */}
          <div className="fs-map-legend absolute bottom-3 left-3 z-[500] rounded-lg border border-white/30 bg-white/85 px-3 py-2 text-[10px] backdrop-blur-md dark:border-white/10 dark:bg-ink-900/85">
            <p className="mb-1.5 font-semibold text-ink-600 dark:text-ink-300">Severity</p>
            <div className="space-y-1">
              {[
                { c: '#7f1d1d', l: 'Critical' },
                { c: '#dc2626', l: 'Warning' },
                { c: '#f97316', l: 'Watch' },
                { c: '#eab308', l: 'Advisory' },
              ].map((s) => (
                <div key={s.l} className="flex items-center gap-1.5">
                  <span className="h-2 w-2.5 rounded-full" style={{ background: s.c }} />
                  <span className="text-ink-500 dark:text-ink-400">{s.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Worldwide flood list */}
      <GlassCard className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-semibold text-ink-900 dark:text-white">Active Flood Events Worldwide</h3>
            <p className="text-xs text-ink-500 dark:text-ink-400">Sorted by severity</p>
          </div>
          <Badge tone="neutral">{data.length} events</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-200/60 text-[11px] uppercase tracking-wider text-ink-400 dark:border-ink-800/60 dark:text-ink-500">
                <th className="pb-2 font-semibold">Event</th>
                <th className="pb-2 font-semibold">Country</th>
                <th className="pb-2 font-semibold">Risk</th>
                <th className="hidden pb-2 text-right font-semibold sm:table-cell">Depth</th>
                <th className="hidden pb-2 text-right font-semibold sm:table-cell">Affected</th>
                <th className="hidden pb-2 text-right font-semibold md:table-cell">Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200/40 dark:divide-ink-800/40">
              {[...data]
                .sort((a, b) => severityRank(b.risk) - severityRank(a.risk))
                .map((h) => {
                  const sev = severityColor(h.risk);
                  return (
                    <tr key={h.id} className="transition hover:bg-brand-50/40 dark:hover:bg-brand-500/5">
                      <td className="py-3 font-medium text-ink-800 dark:text-ink-100">{h.name}</td>
                      <td className="py-3 text-ink-600 dark:text-ink-300">{h.country}</td>
                      <td className="py-3">
                        <span className={`badge ${sev.bg} ${sev.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${sev.dot}`} />
                          {severityLabel(h.risk)}
                        </span>
                      </td>
                      <td className="hidden py-3 text-right tabular-nums text-ink-600 dark:text-ink-300 sm:table-cell">{h.depth} m</td>
                      <td className="hidden py-3 text-right tabular-nums text-ink-600 dark:text-ink-300 sm:table-cell">{h.affected.toLocaleString()}</td>
                      <td className="hidden py-3 text-right text-xs text-ink-400 dark:text-ink-500 md:table-cell">{formatTime(h.since)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

function SummaryCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: 'brand' | 'danger' | 'warning' | 'accent' }) {
  const toneClass = {
    brand: 'bg-brand-500/15 text-brand-600 dark:text-brand-300',
    danger: 'bg-danger-500/15 text-danger-600 dark:text-danger-400',
    warning: 'bg-warning-500/15 text-warning-600 dark:text-warning-400',
    accent: 'bg-accent-500/15 text-accent-600 dark:text-accent-300',
  };
  return (
    <GlassCard className="flex items-center gap-3 p-4">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClass[tone]}`}>{icon}</span>
      <div>
        <p className="font-display text-xl font-bold text-ink-900 dark:text-white">{value}</p>
        <p className="text-[11px] font-medium uppercase tracking-wider text-ink-400 dark:text-ink-500">{label}</p>
      </div>
    </GlassCard>
  );
}

function severityRank(s: string): number {
  return { critical: 4, warning: 3, watch: 2, advisory: 1, info: 0 }[s] ?? 0;
}
