import { useState } from 'react';
import { Clock, MapPin, ArrowRight, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@/hooks/useQuery';
import { getWeatherSnapshot, getRegionWeatherDetail } from '@/api/floodApi';
import { useActiveIncident } from '@/context/ActiveIncidentContext';
import { DashboardSkeleton } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { RiverChart } from '@/components/dashboard/RiverChart';
import { OperationsConsole } from '@/components/dashboard/OperationsConsole';
import { formatTime } from '@/lib/utils';

export function DashboardPage() {
  const { incident } = useActiveIncident();
  const {
    data: snapshot,
    loading,
    error,
    refetch,
  } = useQuery(getWeatherSnapshot, []);

  // Selected flood area — driven by clicks on the operations console map.
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  const { data: regionDetail } = useQuery(
    () => getRegionWeatherDetail(selectedAreaId ?? 'fa-1'),
    [selectedAreaId],
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <DashboardSkeleton count={1} />
        <DashboardSkeleton count={12} />
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <ErrorState
        fullPage
        title="Telemetry stream offline"
        message={error ?? 'Could not reach the sensor network.'}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations console"
        title="Main Dashboard"
        description="Unified real-time view of weather, river, and reservoir telemetry across India's monitored flood basins."
        actions={<Badge tone="success" dot>Live feed</Badge>}
      />

      {/* Operations console — map reports its selected flood area via onSelect */}
      <OperationsConsole
        selectedId={selectedAreaId}
        onSelect={setSelectedAreaId}
        focusCenter={incident ? [incident.lat, incident.lng] : undefined}
        focusKey={incident?.id}
      />

      {/* Last updated strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-200/50 bg-white/40 px-4 py-2.5 text-xs text-ink-500 backdrop-blur-md dark:border-ink-800/50 dark:bg-ink-900/40 dark:text-ink-400">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-brand-500" />
          {snapshot.region} · {snapshot.coordinates.lat.toFixed(2)}, {snapshot.coordinates.lng.toFixed(2)}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-ink-400" />
          Last updated {formatTime(snapshot.lastUpdated)} · auto-refresh every 60s
        </span>
      </div>

      {/* River level forecast for the selected flood area */}
      <section>
        {regionDetail ? (
          <RiverChart
            series={regionDetail.river.series24h}
            warningLevel={regionDetail.river.warningLevel}
            criticalLevel={regionDetail.river.criticalLevel}
            multiSeries={{
              '24h': regionDetail.river.series24h,
              '48h': regionDetail.river.series48h,
              '72h': regionDetail.river.series72h,
            }}
            regionName={`${regionDetail.name} · River station`}
          />
        ) : (
          <GlassCard className="p-5"><div className="skeleton h-44 w-full rounded-xl" /></GlassCard>
        )}
      </section>

      {/* Dashboard quick links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink to="/weather" title="Weather Intelligence" desc="Live wind, rain & storms" tone="bg-brand-500/15 text-brand-600 dark:text-brand-300" />
        <QuickLink to="/flood-prediction" title="Flood Prediction" desc="Live floods & 72h AI model" tone="bg-accent-500/15 text-accent-600 dark:text-accent-300" />
        <QuickLink to="/evacuation" title="Evacuation Planning" desc="Routes & shelters" tone="bg-warning-500/15 text-warning-600 dark:text-warning-400" />
        <QuickLink to="/alerts" title="Alert Dashboard" desc="AI-powered alerts & warnings" tone="bg-danger-500/15 text-danger-600 dark:text-danger-400" icon={<Bell className="h-5 w-5" />} />
      </div>
    </div>
  );
}

function QuickLink({ to, title, desc, tone, icon }: { to: string; title: string; desc: string; tone: string; icon?: React.ReactNode }) {
  return (
    <Link to={to}>
      <GlassCard className="group flex items-center gap-3 p-4 transition-all duration-300 hover:shadow-glow" hover>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
          {icon ?? <span className="h-2 w-2 rounded-full bg-current" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">{title}</p>
          <p className="truncate text-xs text-ink-500 dark:text-ink-400">{desc}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-ink-400 transition group-hover:translate-x-1 group-hover:text-brand-500" />
      </GlassCard>
    </Link>
  );
}
