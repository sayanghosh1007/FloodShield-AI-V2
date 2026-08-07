import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Waves,
  CloudRain,
  Radio,
  Search,
  Filter,
  RefreshCw,
  Satellite,
  WifiOff,
  Wifi,
  Battery,
  BatteryLow,
  MapPin,
} from 'lucide-react';
import { useQuery } from '@/hooks/useQuery';
import { getSensorSnapshot, type Sensor, type SensorStatus, type SensorType, type NetworkHealth, SENSOR_TYPE_LIST } from '@/api/sensorApi';
import { PageHeader } from '@/components/ui/PageHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { SensorMap } from '@/components/sensors/SensorMap';
import { SensorDetailPanel } from '@/components/sensors/SensorDetailPanel';
import { SensorAnalyticsPanel } from '@/components/sensors/SensorAnalyticsPanel';
import { cn, timeAgo } from '@/lib/utils';

type StatusFilter = 'all' | SensorStatus;
type TypeFilter = 'all' | SensorType;

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'online', label: 'Online' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'warning', label: 'Warning' },
  { key: 'offline', label: 'Offline' },
];

const STATUS_META: Record<SensorStatus, { tone: 'success' | 'warning' | 'danger' | 'neutral'; label: string }> = {
  online: { tone: 'success', label: 'Online' },
  maintenance: { tone: 'warning', label: 'Maintenance' },
  warning: { tone: 'warning', label: 'Warning' },
  offline: { tone: 'danger', label: 'Offline' },
};

const HEALTH_META: Record<NetworkHealth, { tone: 'success' | 'warning' | 'danger'; label: string; dot: string }> = {
  healthy: { tone: 'success', label: 'Healthy', dot: 'bg-success-500' },
  minor: { tone: 'warning', label: 'Minor Issues', dot: 'bg-warning-500' },
  partial: { tone: 'warning', label: 'Partial Failure', dot: 'bg-orange-500' },
  critical: { tone: 'danger', label: 'Critical Failure', dot: 'bg-danger-500' },
};

export function SensorsPage() {
  const { data: snapshot, loading, error, refetch } = useQuery(getSensorSnapshot, []);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [batteryFilter, setBatteryFilter] = useState('all');
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => refetch(), 30_000);
    return () => clearInterval(interval);
  }, [refetch]);

  const sensors = useMemo(() => snapshot?.sensors ?? [], [snapshot?.sensors]);

  const allStates = useMemo(() => Array.from(new Set(sensors.map((s) => s.state))).sort(), [sensors]);

  const filtered = useMemo(() => {
    return sensors
      .filter((s) => statusFilter === 'all' || s.status === statusFilter)
      .filter((s) => typeFilter === 'all' || s.type === typeFilter)
      .filter((s) => stateFilter === 'all' || s.state === stateFilter)
      .filter((s) => {
        if (batteryFilter === 'all') return true;
        if (batteryFilter === 'low') return s.battery < 20;
        if (batteryFilter === 'medium') return s.battery >= 20 && s.battery < 50;
        return s.battery >= 50;
      })
      .filter((s) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.district.toLowerCase().includes(q) || s.state.toLowerCase().includes(q);
      });
  }, [sensors, statusFilter, typeFilter, stateFilter, batteryFilter, query]);

  const handleSelectSensor = useCallback((sensor: Sensor) => {
    setSelectedSensor(sensor);
  }, []);

  if (loading && !snapshot) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-10 w-64 rounded" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="skeleton h-[500px] rounded-2xl" />
      </div>
    );
  }

  if (error && !snapshot) {
    return <ErrorState fullPage title="Sensor network data unavailable" message={error} onRetry={refetch} />;
  }

  const health = snapshot ? HEALTH_META[snapshot.networkHealth] : HEALTH_META.healthy;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Infrastructure Monitoring"
        title="Sensor Network Dashboard"
        description="Real-time IoT sensor network monitoring — live telemetry, health, and AI anomaly detection synchronized across all dashboards."
        actions={
          <div className="flex items-center gap-2">
            <Badge tone="brand" dot>Live · {snapshot ? timeAgo(snapshot.lastUpdated) : '—'}</Badge>
            <Button variant="secondary" size="sm" onClick={refetch}>
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        }
      />

      {snapshot && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            icon={<Radio className="h-4 w-4" />}
            label="Active Sensors"
            value={snapshot.totalOnline.toLocaleString()}
            sub="Online"
            tone="brand"
          />
          <SummaryCard
            icon={<Waves className="h-4 w-4" />}
            label="River Stations"
            value={String(snapshot.riverStations)}
            sub="Operational"
            tone="accent"
          />
          <SummaryCard
            icon={<CloudRain className="h-4 w-4" />}
            label="Weather Stations"
            value={String(snapshot.weatherStations)}
            sub="Operational"
            tone="success"
          />
          <SummaryCard
            icon={<Satellite className="h-4 w-4" />}
            label="Network Health"
            value={health.label}
            sub={health.label === 'Healthy' ? 'All systems nominal' : 'Attention required'}
            tone={health.tone}
            dot={health.dot}
          />
        </div>
      )}

      <GlassCard className="p-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by sensor name, ID, district, or state..."
              className="h-11 w-full rounded-xl border border-ink-200/70 bg-white/60 pl-9 pr-3 text-sm text-ink-800 placeholder:text-ink-400 transition focus:border-brand-400 dark:border-ink-700/70 dark:bg-ink-900/50 dark:text-ink-100"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 shrink-0 text-ink-400" />
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-300',
                  statusFilter === f.key
                    ? 'bg-brand-600 text-white shadow-glass-sm'
                    : 'bg-white/60 text-ink-600 hover:bg-brand-50 hover:text-brand-700 dark:bg-ink-900/50 dark:text-ink-300',
                )}
              >
                {f.label}
              </button>
            ))}
            <div className="mx-1 h-4 w-px bg-ink-200 dark:bg-ink-700" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              className="rounded-full border border-ink-200/70 bg-white/60 px-3 py-1.5 text-xs font-semibold text-ink-600 transition focus:border-brand-400 dark:border-ink-700/70 dark:bg-ink-900/50 dark:text-ink-300"
            >
              <option value="all">All Types</option>
              {SENSOR_TYPE_LIST.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="rounded-full border border-ink-200/70 bg-white/60 px-3 py-1.5 text-xs font-semibold text-ink-600 transition focus:border-brand-400 dark:border-ink-700/70 dark:bg-ink-900/50 dark:text-ink-300"
            >
              <option value="all">All States</option>
              {allStates.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={batteryFilter}
              onChange={(e) => setBatteryFilter(e.target.value)}
              className="rounded-full border border-ink-200/70 bg-white/60 px-3 py-1.5 text-xs font-semibold text-ink-600 transition focus:border-brand-400 dark:border-ink-700/70 dark:bg-ink-900/50 dark:text-ink-300"
            >
              <option value="all">All Battery</option>
              <option value="low">Low (&lt;20%)</option>
              <option value="medium">Medium (20-50%)</option>
              <option value="high">High (&ge;50%)</option>
            </select>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 xl:grid-cols-[1fr_400px]">
        <GlassCard className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-ink-200/50 px-4 py-3 dark:border-ink-800/50">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink-800 dark:text-ink-100">
              <MapPin className="h-4 w-4 text-brand-500" />
              Sensor Network Map
            </p>
            <Badge tone="neutral">{filtered.length} sensors</Badge>
          </div>
          <div className="h-[500px] w-full">
            <SensorMap sensors={filtered} selectedId={selectedSensor?.id ?? null} onSelect={handleSelectSensor} theme="dark" />
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-ink-200/50 px-4 py-3 dark:border-ink-800/50">
            {SENSOR_TYPE_LIST.map((t) => (
              <span key={t.key} className="flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
                <span>{t.glyph}</span> {t.label}
              </span>
            ))}
          </div>
        </GlassCard>

        <div className="space-y-4">
          {selectedSensor ? (
            <SensorDetailPanel sensor={selectedSensor} onClose={() => setSelectedSensor(null)} />
          ) : (
            <GlassCard className="flex flex-col items-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
                <Radio className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-ink-800 dark:text-ink-100">Select a sensor</h3>
              <p className="mt-1.5 max-w-xs text-sm text-ink-500 dark:text-ink-400">
                Click any marker on the map to view live readings, battery status, and sensor details.
              </p>
            </GlassCard>
          )}
        </div>
      </div>

      {snapshot && (
        <SensorAnalyticsPanel analytics={snapshot.analytics} alerts={snapshot.alerts} />
      )}

      <GlassCard className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-ink-200/50 px-4 py-3 dark:border-ink-800/50">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink-800 dark:text-ink-100">
            <Activity className="h-4 w-4 text-brand-500" />
            Sensor Registry
          </p>
          <Badge tone="neutral">{filtered.length} of {sensors.length}</Badge>
        </div>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white/80 backdrop-blur dark:bg-ink-900/80">
              <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500">
                <th className="px-4 py-2.5">Sensor</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Location</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Battery</th>
                <th className="px-4 py-2.5">Signal</th>
                <th className="px-4 py-2.5">Last Comms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100/50 dark:divide-ink-800/40">
              {filtered.slice(0, 50).map((sensor) => {
                const status = STATUS_META[sensor.status];
                return (
                  <tr
                    key={sensor.id}
                    onClick={() => handleSelectSensor(sensor)}
                    className={cn(
                      'cursor-pointer transition-colors hover:bg-brand-50/40 dark:hover:bg-brand-500/5',
                      selectedSensor?.id === sensor.id && 'bg-brand-50/60 dark:bg-brand-500/10',
                    )}
                  >
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-ink-800 dark:text-ink-100">{sensor.name}</p>
                      <p className="font-mono text-[10px] text-ink-400">{sensor.id}</p>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-ink-500 dark:text-ink-400">
                      {SENSOR_TYPE_LIST.find((t) => t.key === sensor.type)?.label ?? sensor.type}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-ink-500 dark:text-ink-400">
                      {sensor.district}, {sensor.state}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge tone={status.tone} dot>{status.label}</Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn('flex items-center gap-1 text-xs', sensor.battery < 20 ? 'text-danger-600 dark:text-danger-400' : sensor.battery < 40 ? 'text-warning-600 dark:text-warning-400' : 'text-success-600 dark:text-success-400')}>
                        {sensor.battery < 20 ? <BatteryLow className="h-3 w-3" /> : <Battery className="h-3 w-3" />}
                        {sensor.battery}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn('flex items-center gap-1 text-xs', sensor.signalStrength < 40 ? 'text-danger-600 dark:text-danger-400' : 'text-success-600 dark:text-success-400')}>
                        {sensor.signalStrength < 40 ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
                        {sensor.signalStrength}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-ink-400">{timeAgo(sensor.lastCommunication)}</td>
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

function SummaryCard({ icon, label, value, sub, tone, dot }: { icon: React.ReactNode; label: string; value: string; sub: string; tone: 'brand' | 'accent' | 'success' | 'warning' | 'danger'; dot?: string }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
    accent: 'bg-accent-50 text-accent-600 dark:bg-accent-500/10 dark:text-accent-400',
    success: 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400',
    warning: 'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400',
    danger: 'bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-400',
  };
  return (
    <GlassCard className="p-4" hover glow={tone === 'danger' ? 'danger' : tone === 'warning' ? 'warning' : 'brand'}>
      <div className="flex items-center gap-2.5">
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', tones[tone])}>{icon}</span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500">{label}</p>
          {dot && <span className={cn('mr-1 inline-block h-1.5 w-1.5 rounded-full', dot)} />}
          <p className="font-display text-xl font-bold text-ink-900 dark:text-white">{value}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-ink-500 dark:text-ink-400">{sub}</p>
    </GlassCard>
  );
}
