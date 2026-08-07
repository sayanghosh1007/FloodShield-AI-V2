import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ShieldCheck,
  Activity,
  AlertOctagon,
  Skull,
  CheckCircle2,
  Users,
  MapPin,
  Gauge,
  Bell,
  Filter,
  Navigation,
  TentTree,
  Sparkles,
  CloudRain,
  Bot,
  Radio,
  Waves,
  Clock,
} from 'lucide-react';
import { useQuery } from '@/hooks/useQuery';
import { getAlertSnapshot } from '@/api/alertApi';
import type { AlertDetail, AlertCategory, AlertSource } from '@/api/alertApi';
import { useActiveIncident } from '@/context/ActiveIncidentContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { AlertDetailPanel } from '@/components/alerts/AlertDetailPanel';
import { cn, formatTime, formatDate, severityColor, severityLabel, timeAgo } from '@/lib/utils';
import type { Severity } from '@/types';

const FILTERS: { key: 'all' | Severity; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'critical', label: 'Critical' },
  { key: 'warning', label: 'Warning' },
  { key: 'watch', label: 'Watch' },
  { key: 'advisory', label: 'Advisory' },
  { key: 'info', label: 'Info' },
];

const CATEGORY_COLORS: Record<AlertCategory, { dot: string; label: string }> = {
  'information': { dot: 'bg-brand-400', label: 'Information' },
  'advisory': { dot: 'bg-success-400', label: 'Advisory' },
  'watch': { dot: 'bg-warning-400', label: 'Watch' },
  'warning': { dot: 'bg-orange-400', label: 'Warning' },
  'emergency': { dot: 'bg-danger-500', label: 'Emergency' },
  'critical-evacuation': { dot: 'bg-ink-700 dark:bg-ink-300', label: 'Critical Evacuation' },
};

const SOURCE_META: Record<AlertSource, { label: string; icon: typeof Bot; tone: 'brand' | 'accent' | 'success'; classes: string }> = {
  ai: { label: 'AI Prediction', icon: Bot, tone: 'brand', classes: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300' },
  official: { label: 'Official Source', icon: Radio, tone: 'accent', classes: 'bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-300' },
  verified: { label: 'AI + Official', icon: CheckCircle2, tone: 'success', classes: 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300' },
};

const NEW_BADGE_MS = 5 * 60 * 1000;

export function AlertsPage() {
  const { incident, setIncident } = useActiveIncident();
  const { data: snapshot, loading, error, refetch } = useQuery(
    () => getAlertSnapshot(incident),
    [incident?.id],
  );
  const [filter, setFilter] = useState<'all' | Severity>('all');
  const [selectedAlert, setSelectedAlert] = useState<AlertDetail | null>(null);
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const analytics = snapshot?.analytics;

  const filtered = useMemo(
    () => (snapshot?.alerts ?? []).filter((a) => filter === 'all' || a.severity === filter),
    [snapshot?.alerts, filter],
  );

  const handleSelectAlert = useCallback((alert: AlertDetail) => {
    setSelectedAlert(alert);
    setViewedIds((prev) => new Set(prev).add(alert.id));
  }, []);

  const handleViewAlertArea = useCallback((alert: AlertDetail) => {
    if (alert.alertType === 'flood' && alert.lat != null && alert.lng != null) {
      setIncident({
        id: alert.id,
        name: alert.title,
        lat: alert.lat!,
        lng: alert.lng!,
        floodProbability: alert.aiConfidence,
        riskTier: alert.floodRiskLevel.toLowerCase(),
        state: alert.state ?? alert.region,
        river: alert.river ?? 'Unknown',
      });
    }
    navigate(alert.alertType === 'weather' ? '/weather' : '/flood-prediction');
  }, [navigate, setIncident]);

  const handleViewEvacuation = useCallback(() => {
    navigate('/evacuation');
  }, [navigate]);

  const handleViewShelters = useCallback(() => {
    navigate('/shelters');
  }, [navigate]);

  const handleFloodLiveClick = useCallback((alert: AlertDetail) => {
    if (alert.lat != null && alert.lng != null) {
      setIncident({
        id: alert.id,
        name: alert.title,
        lat: alert.lat!,
        lng: alert.lng!,
        floodProbability: alert.aiConfidence,
        riskTier: alert.floodRiskLevel.toLowerCase(),
        state: alert.state ?? alert.region,
        river: alert.river ?? 'Unknown',
      });
    }
    navigate('/');
  }, [navigate, setIncident]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Emergency response"
        title="Alert Dashboard"
        description="AI-powered early warning and emergency alert system. Monitors, generates, and manages flood alerts synchronized across all dashboards."
        actions={
          <Button variant="secondary" size="md" onClick={refetch}>
            <Filter className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {/* Active incident banner */}
      {incident && (
        <GlassCard className="flex items-center gap-3 p-3.5" glow="brand">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <MapPin className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink-900 dark:text-white">
              Context: {incident.name}
            </p>
            <p className="text-xs text-ink-500 dark:text-ink-400">
              Showing alerts for {incident.state} · {incident.river} · {incident.riskTier} risk
            </p>
          </div>
          <Badge tone={incident.floodProbability >= 50 ? 'danger' : 'warning'}>
            {incident.floodProbability}% flood probability
          </Badge>
        </GlassCard>
      )}

      {/* Alert Analytics */}
      {analytics && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8">
          <AnalyticsCard icon={<Activity className="h-4 w-4" />} label="Active Alerts" value={analytics.activeAlerts} tone="brand" />
          <AnalyticsCard icon={<Skull className="h-4 w-4" />} label="Critical" value={analytics.criticalAlerts} tone="danger" pulse={analytics.criticalAlerts > 0} />
          <AnalyticsCard icon={<AlertOctagon className="h-4 w-4" />} label="Warnings" value={analytics.warningAlerts} tone="warning" />
          <AnalyticsCard icon={<CheckCircle2 className="h-4 w-4" />} label="Resolved" value={analytics.resolvedAlerts} tone="success" />
          <AnalyticsCard icon={<Users className="h-4 w-4" />} label="Pop. at Risk" value={formatCompact(analytics.populationUnderAlert)} tone="accent" />
          <AnalyticsCard icon={<MapPin className="h-4 w-4" />} label="Districts" value={analytics.districtsAffected} tone="brand" />
          <AnalyticsCard icon={<Gauge className="h-4 w-4" />} label="Avg AI Conf." value={`${analytics.averageAiConfidence}%`} tone="accent" />
          <AnalyticsCard icon={<Bell className="h-4 w-4" />} label="Notified" value={formatCompact(analytics.notificationsDelivered)} tone="success" />
        </div>
      )}

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-300',
              filter === f.key
                ? 'bg-brand-600 text-white shadow-glass-sm'
                : 'bg-white/60 text-ink-600 hover:bg-brand-50 hover:text-brand-700 dark:bg-ink-900/50 dark:text-ink-300 dark:hover:bg-brand-500/10',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-32 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && <ErrorState message={error} onRetry={refetch} />}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <GlassCard className="flex flex-col items-center py-12 text-center">
          <ShieldCheck className="h-10 w-10 text-success-500" />
          <p className="mt-3 text-sm font-medium text-ink-700 dark:text-ink-200">No alerts in this category</p>
        </GlassCard>
      )}

      {/* Alert cards */}
      {!loading && !error && (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((alert, i) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              isNew={isNewAlert(alert, viewedIds)}
              onSelect={() => handleSelectAlert(alert)}
              onViewAlertArea={() => handleViewAlertArea(alert)}
              onViewEvacuation={handleViewEvacuation}
              onViewShelters={handleViewShelters}
              onFloodLiveClick={() => handleFloodLiveClick(alert)}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Side panel */}
      {selectedAlert && (
        <AlertDetailPanel
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onViewAlertArea={() => handleViewAlertArea(selectedAlert)}
          onViewEvacuation={handleViewEvacuation}
          onViewShelters={handleViewShelters}
        />
      )}
    </div>
  );
}

function isNewAlert(alert: AlertDetail, viewedIds: Set<string>): boolean {
  if (viewedIds.has(alert.id)) return false;
  if (alert.status === 'resolved') return false;
  const ageMs = Date.now() - new Date(alert.issuedAt).getTime();
  return ageMs <= NEW_BADGE_MS;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

interface AnalyticsCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tone: 'brand' | 'danger' | 'warning' | 'success' | 'accent';
  pulse?: boolean;
}

const analyticsTone: Record<AnalyticsCardProps['tone'], { bg: string; text: string }> = {
  brand: { bg: 'bg-brand-50 dark:bg-brand-500/10', text: 'text-brand-600 dark:text-brand-400' },
  danger: { bg: 'bg-danger-50 dark:bg-danger-500/10', text: 'text-danger-600 dark:text-danger-400' },
  warning: { bg: 'bg-warning-50 dark:bg-warning-500/10', text: 'text-warning-600 dark:text-warning-400' },
  success: { bg: 'bg-success-50 dark:bg-success-500/10', text: 'text-success-600 dark:text-success-400' },
  accent: { bg: 'bg-accent-50 dark:bg-accent-500/10', text: 'text-accent-600 dark:text-accent-400' },
};

function AnalyticsCard({ icon, label, value, tone, pulse }: AnalyticsCardProps) {
  const tc = analyticsTone[tone];
  return (
    <GlassCard className={cn('p-3.5', pulse && 'animate-pulse-glow')} hover>
      <div className="flex items-center gap-2">
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', tc.bg, tc.text)}>
          {icon}
        </span>
        <span className="label-eyebrow text-[10px]">{label}</span>
      </div>
      <p className="stat-value mt-2 text-xl text-ink-900 dark:text-white">{value}</p>
    </GlassCard>
  );
}

interface AlertCardProps {
  alert: AlertDetail;
  isNew: boolean;
  onSelect: () => void;
  onViewAlertArea: () => void;
  onViewEvacuation: () => void;
  onViewShelters: () => void;
  onFloodLiveClick: (alert: AlertDetail) => void;
  index: number;
}

function AlertCard({
  alert,
  isNew,
  onSelect,
  onViewAlertArea,
  onViewEvacuation,
  onViewShelters,
  onFloodLiveClick,
  index,
}: AlertCardProps) {
  const sev = severityColor(alert.severity);
  const cat = CATEGORY_COLORS[alert.category];
  const isCritical = alert.severity === 'critical';
  const isWeather = alert.alertType === 'weather';
  const isFloodLive = alert.isFloodLive;
  const src = SOURCE_META[alert.alertSource];
  const SrcIcon = src.icon;

  const handleClick = () => {
    if (isFloodLive) {
      onFloodLiveClick(alert);
    } else {
      onSelect();
    }
  };

  return (
    <GlassCard
      className={cn(
        'relative overflow-hidden p-5 cursor-pointer animate-fade-in-scale',
        isCritical && alert.status === 'active' && 'animate-pulse-glow',
      )}
      glow={isCritical ? 'danger' : alert.severity === 'warning' ? 'warning' : 'brand'}
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={handleClick}
    >
      {/* Severity accent strip */}
      <div className={cn('absolute inset-x-0 top-0 h-1', sev.dot)} />

      {/* Badges row (LIVE + NEW) */}
      <div className="absolute right-3 top-3 z-10 flex gap-1.5">
        {isFloodLive && (
          <span className="inline-flex items-center gap-1 rounded-full bg-danger-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-md animate-pulse-glow">
            <Waves className="h-3 w-3" />
            LIVE
          </span>
        )}
        {isNew && (
          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-md animate-pulse-glow">
            <Sparkles className="h-3 w-3" />
            NEW
          </span>
        )}
      </div>

      <div className="flex items-start gap-3">
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border', sev.bg, sev.border, sev.text)}>
          {isFloodLive ? <Waves className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold text-ink-500 dark:text-ink-400">{alert.id}</span>
            <Badge tone={isCritical ? 'danger' : alert.severity === 'warning' ? 'warning' : alert.severity === 'watch' ? 'brand' : 'accent'}>
              {severityLabel(alert.severity)}
            </Badge>
            <Badge tone={alert.status === 'active' ? 'danger' : alert.status === 'monitoring' ? 'warning' : 'success'}>
              {alert.status}
            </Badge>
          </div>
          <h3 className="mt-1.5 font-semibold text-ink-900 dark:text-white">{alert.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
            <MapPin className="h-3.5 w-3.5" />
            {alert.affectedDistrict}
            <span className="text-ink-300 dark:text-ink-600">·</span>
            <span className="font-medium text-brand-600 dark:text-brand-400">{alert.alertTypeLabel}</span>
          </div>
        </div>
      </div>

      {/* Alert metadata row */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500 dark:text-ink-400">
        <span className="flex items-center gap-1">
          <span className={cn('h-2 w-2 rounded-full', cat.dot)} />
          {cat.label}
        </span>
        {alert.populationAtRisk > 0 && (
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {formatCompact(alert.populationAtRisk)} at risk
          </span>
        )}
        <span className="flex items-center gap-1">
          <Gauge className="h-3.5 w-3.5" />
          AI: {alert.aiConfidence}%
        </span>
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', src.classes)}>
          <SrcIcon className="h-3 w-3" />
          {src.label}
        </span>
      </div>

      {/* Timestamps */}
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-ink-400 dark:text-ink-500">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Issued {formatDate(alert.issuedAt)} {formatTime(alert.issuedAt)}
        </span>
        <span>·</span>
        <span>Updated {timeAgo(alert.updatedAt)}</span>
      </div>

      {/* Quick action buttons — only for non-Flood-Live alerts */}
      {!isFloodLive && (
        <div className="mt-4 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="secondary" size="sm" onClick={onViewAlertArea}>
            {isWeather ? <CloudRain className="h-3.5 w-3.5" /> : <Navigation className="h-3.5 w-3.5" />}
            {isWeather ? 'Weather Area' : 'Flood Area'}
          </Button>
          <Button variant="secondary" size="sm" onClick={onViewEvacuation}>
            <AlertTriangle className="h-3.5 w-3.5" />
            Evacuation
          </Button>
          <Button variant="secondary" size="sm" onClick={onViewShelters}>
            <TentTree className="h-3.5 w-3.5" />
            Shelters
          </Button>
        </div>
      )}

      {/* Flood Live hint */}
      {isFloodLive && (
        <div className="mt-4 flex items-center gap-2 border-t border-ink-200/50 pt-3 text-xs text-ink-500 dark:text-ink-400 dark:border-ink-800/50">
          <Navigation className="h-3.5 w-3.5 text-brand-500" />
          Click to locate on Main Dashboard flood map
        </div>
      )}
    </GlassCard>
  );
}
