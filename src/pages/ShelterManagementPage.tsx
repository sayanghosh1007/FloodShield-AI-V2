import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search,
  MapPin,
  Navigation,
  Phone,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Home,
  Filter,
  Brain,
  Sparkles,
  Copy,
  Check,
  X,
  Gauge,
  Car,
  Info,
} from 'lucide-react';
import { useQuery } from '@/hooks/useQuery';
import { getShelterSnapshot, buildGoogleMapsUrl } from '@/api/shelterApi';
import type { ShelterDetail, ShelterStatus } from '@/api/shelterApi';
import { useActiveIncident } from '@/context/ActiveIncidentContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { ShelterDetailPanel } from '@/components/shelters/ShelterDetailPanel';
import { cn, formatNumber, formatTime } from '@/lib/utils';

type StatusFilter = 'all' | ShelterStatus;
type SortFilter = 'distance' | 'capacity' | 'occupancy';

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Available' },
  { key: 'nearly-full', label: 'Nearly Full' },
  { key: 'full', label: 'Full' },
  { key: 'closed', label: 'Closed' },
];

const STATUS_META: Record<ShelterStatus, { tone: 'success' | 'warning' | 'danger' | 'neutral'; label: string; icon: typeof CheckCircle2; color: string; bar: string }> = {
  open: { tone: 'success', label: 'Open', icon: CheckCircle2, color: 'text-success-600 dark:text-success-400', bar: 'bg-success-500' },
  'nearly-full': { tone: 'warning', label: 'Nearly Full', icon: AlertTriangle, color: 'text-orange-600 dark:text-orange-400', bar: 'bg-orange-500' },
  full: { tone: 'danger', label: 'Full', icon: XCircle, color: 'text-danger-600 dark:text-danger-400', bar: 'bg-danger-500' },
  closed: { tone: 'neutral', label: 'Closed', icon: XCircle, color: 'text-ink-500 dark:text-ink-400', bar: 'bg-ink-400' },
};

export function ShelterManagementPage() {
  const { incident } = useActiveIncident();
  const { data: snapshot, loading, error, refetch } = useQuery(
    () => getShelterSnapshot(incident),
    [incident?.id],
  );

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortFilter, setSortFilter] = useState<SortFilter>('distance');
  const [facilityFilter, setFacilityFilter] = useState<string>('all');
  const [selectedShelter, setSelectedShelter] = useState<ShelterDetail | null>(null);
  const [callDialogShelter, setCallDialogShelter] = useState<ShelterDetail | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [pressedBtn, setPressedBtn] = useState<string | null>(null);

  // Try to get user's geolocation for Google Maps origin
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { timeout: 5000 },
    );
  }, []);

  const shelters = useMemo(() => snapshot?.shelters ?? [], [snapshot?.shelters]);

  const allFacilities = useMemo(() => {
    const set = new Set<string>();
    shelters.forEach((s) => s.facilities.forEach((f) => set.add(f.label)));
    return Array.from(set);
  }, [shelters]);

  const filtered = useMemo(() => {
    let list = shelters
      .filter((s) => statusFilter === 'all' || s.status === statusFilter)
      .filter((s) => {
        if (facilityFilter === 'all') return true;
        return s.facilities.some((f) => f.label === facilityFilter && f.state !== 'unavailable');
      })
      .filter((s) =>
        query.trim()
          ? s.name.toLowerCase().includes(query.toLowerCase()) ||
            s.id.toLowerCase().includes(query.toLowerCase()) ||
            s.address.toLowerCase().includes(query.toLowerCase())
          : true,
      );

    list = [...list].sort((a, b) => {
      if (sortFilter === 'distance') return a.distanceKm - b.distanceKm;
      if (sortFilter === 'capacity') return b.capacity - a.capacity;
      if (sortFilter === 'occupancy') return (b.occupancy / b.capacity) - (a.occupancy / a.capacity);
      return 0;
    });

    // AI-recommended shelter always first
    return list.sort((a, b) => {
      if (a.aiRecommended && !b.aiRecommended) return -1;
      if (!a.aiRecommended && b.aiRecommended) return 1;
      return 0;
    });
  }, [shelters, statusFilter, facilityFilter, query, sortFilter]);

  const handleNavigate = useCallback((shelter: ShelterDetail) => {
    const url = buildGoogleMapsUrl(shelter, userLocation?.lat, userLocation?.lng);
    window.open(url, '_blank', 'noopener,noreferrer');
    setPressedBtn(`nav-${shelter.id}`);
    setTimeout(() => setPressedBtn(null), 600);
  }, [userLocation]);

  const handleCall = useCallback((shelter: ShelterDetail) => {
    const cleaned = shelter.phone.replace(/\s/g, '');
    setPressedBtn(`call-${shelter.id}`);
    setTimeout(() => setPressedBtn(null), 600);

    const isMobile = /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `tel:${cleaned}`;
    } else {
      setCallDialogShelter(shelter);
    }
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-10 w-64 rounded" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-52 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState fullPage title="Shelter data unavailable" message={error} onRetry={refetch} />;
  }

  if (!incident) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Relief Operations"
          title="Shelter Management"
          description="Live shelter roster synchronized with the active flood incident. Select a flood area to view shelters."
        />
        <GlassCard className="flex flex-col items-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
            <Home className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-ink-800 dark:text-ink-100">No flood area selected</h3>
          <p className="mt-1.5 max-w-md text-sm text-ink-500 dark:text-ink-400">
            Select a flood-affected area from the Flood Prediction Dashboard, Emergency Response Dashboard, or AI Alerts to view shelters assigned to that incident.
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Relief Operations"
        title="Shelter Management"
        description={`Shelters serving ${incident.name} — live capacity, occupancy, facilities, ETA, and contact details.`}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone="brand" dot>{snapshot?.shelters.length ?? 0} shelters</Badge>
            <Button variant="secondary" size="sm" onClick={refetch}>
              <Filter className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Context banner */}
      <GlassCard className="flex items-center gap-3 p-3.5" glow="brand">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          <MapPin className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink-900 dark:text-white">Context: {incident.name}</p>
          <p className="text-xs text-ink-500 dark:text-ink-400">
            {incident.state} · {incident.river} · {incident.riskTier} risk · {incident.floodProbability}% flood probability
          </p>
        </div>
      </GlassCard>

      {/* Summary cards */}
      {snapshot && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            icon={<Users className="h-4 w-4" />}
            label="Total Capacity"
            value={formatNumber(snapshot.totalCapacity, 0)}
            sub="People"
            tone="brand"
          />
          <SummaryCard
            icon={<Home className="h-4 w-4" />}
            label="Current Occupancy"
            value={formatNumber(snapshot.totalOccupancy, 0)}
            sub="People Housed"
            tone="accent"
          />
          <SummaryCard
            icon={<Gauge className="h-4 w-4" />}
            label="Occupancy Rate"
            value={`${snapshot.occupancyRate}%`}
            sub="Occupied"
            tone={snapshot.occupancyRate >= 85 ? 'danger' : snapshot.occupancyRate >= 50 ? 'warning' : 'success'}
            progress={snapshot.occupancyRate}
          />
          <SummaryCard
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Available Shelters"
            value={String(snapshot.availableCount)}
            sub="Ready to Receive"
            tone="success"
          />
        </div>
      )}

      {/* AI Recommendation banner */}
      {snapshot?.recommendedShelter && (
        <GlassCard className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center" glow="brand">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400">
              <Brain className="h-5 w-5" />
            </span>
            <div>
              <p className="label-eyebrow">AI Recommended Shelter</p>
              <p className="text-sm font-semibold text-ink-900 dark:text-white">{snapshot.recommendedShelter.name}</p>
            </div>
          </div>
          <p className="flex-1 text-xs text-ink-500 dark:text-ink-400">{snapshot.recommendedShelter.aiReason}</p>
          <div className="flex items-center gap-2">
            <Badge tone="brand">{snapshot.recommendedShelter.aiConfidence}% confidence</Badge>
            <Button variant="outline" size="sm" onClick={() => setSelectedShelter(snapshot.recommendedShelter)}>
              <Info className="h-3.5 w-3.5" />
              Details
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Search + filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by shelter name, ID, or address..."
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
              value={facilityFilter}
              onChange={(e) => setFacilityFilter(e.target.value)}
              className="rounded-full border border-ink-200/70 bg-white/60 px-3 py-1.5 text-xs font-semibold text-ink-600 transition focus:border-brand-400 dark:border-ink-700/70 dark:bg-ink-900/50 dark:text-ink-300"
            >
              <option value="all">All Facilities</option>
              {allFacilities.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <div className="mx-1 h-4 w-px bg-ink-200 dark:bg-ink-700" />
            <select
              value={sortFilter}
              onChange={(e) => setSortFilter(e.target.value as SortFilter)}
              className="rounded-full border border-ink-200/70 bg-white/60 px-3 py-1.5 text-xs font-semibold text-ink-600 transition focus:border-brand-400 dark:border-ink-700/70 dark:bg-ink-900/50 dark:text-ink-300"
            >
              <option value="distance">Sort: Distance</option>
              <option value="capacity">Sort: Capacity</option>
              <option value="occupancy">Sort: Occupancy</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Shelter grid */}
      {filtered.length === 0 ? (
        <GlassCard className="flex flex-col items-center py-12 text-center">
          <Home className="h-10 w-10 text-ink-300 dark:text-ink-600" />
          <p className="mt-3 text-sm font-medium text-ink-600 dark:text-ink-300">No shelters match your filters</p>
          <p className="mt-1 text-xs text-ink-400 dark:text-ink-500">Try a different search or clear filters.</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((s, i) => (
            <ShelterCard
              key={s.id}
              shelter={s}
              index={i}
              pressedBtn={pressedBtn}
              onNavigate={() => handleNavigate(s)}
              onCall={() => handleCall(s)}
              onSelect={() => setSelectedShelter(s)}
            />
          ))}
        </div>
      )}

      {snapshot && (
        <p className="text-center text-[11px] text-ink-400 dark:text-ink-500">
          Occupancy synced {formatTime(snapshot.lastUpdated)} · auto-refreshes on incident change
        </p>
      )}

      {/* Detail side panel */}
      {selectedShelter && (
        <ShelterDetailPanel
          shelter={selectedShelter}
          onClose={() => setSelectedShelter(null)}
          userLat={userLocation?.lat}
          userLng={userLocation?.lng}
        />
      )}

      {/* Call dialog (desktop) */}
      {callDialogShelter && (
        <CallDialog
          shelter={callDialogShelter}
          onClose={() => setCallDialogShelter(null)}
        />
      )}
    </div>
  );
}

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: 'brand' | 'accent' | 'success' | 'warning' | 'danger';
  progress?: number;
}

const summaryTone: Record<SummaryCardProps['tone'], { bg: string; text: string; bar: string }> = {
  brand: { bg: 'bg-brand-50 dark:bg-brand-500/10', text: 'text-brand-600 dark:text-brand-400', bar: 'bg-brand-500' },
  accent: { bg: 'bg-accent-50 dark:bg-accent-500/10', text: 'text-accent-600 dark:text-accent-400', bar: 'bg-accent-500' },
  success: { bg: 'bg-success-50 dark:bg-success-500/10', text: 'text-success-600 dark:text-success-400', bar: 'bg-success-500' },
  warning: { bg: 'bg-warning-50 dark:bg-warning-500/10', text: 'text-warning-600 dark:text-warning-400', bar: 'bg-warning-500' },
  danger: { bg: 'bg-danger-50 dark:bg-danger-500/10', text: 'text-danger-600 dark:text-danger-400', bar: 'bg-danger-500' },
};

function SummaryCard({ icon, label, value, sub, tone, progress }: SummaryCardProps) {
  const tc = summaryTone[tone];
  return (
    <GlassCard className="p-4" hover>
      <div className="flex items-center gap-2.5">
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', tc.bg, tc.text)}>
          {icon}
        </span>
        <div>
          <p className="label-eyebrow text-[10px]">{label}</p>
          <p className="stat-value text-xl text-ink-900 dark:text-white">{value}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-ink-400 dark:text-ink-500">{sub}</p>
      {progress != null && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-200/70 dark:bg-ink-800/70">
          <div className={cn('h-full rounded-full transition-all duration-700', tc.bar)} style={{ width: `${progress}%` }} />
        </div>
      )}
    </GlassCard>
  );
}

interface ShelterCardProps {
  shelter: ShelterDetail;
  index: number;
  pressedBtn: string | null;
  onNavigate: () => void;
  onCall: () => void;
  onSelect: () => void;
}

function ShelterCard({ shelter, index, pressedBtn, onNavigate, onCall, onSelect }: ShelterCardProps) {
  const pct = shelter.capacity > 0 ? Math.min(100, Math.round((shelter.occupancy / shelter.capacity) * 100)) : 0;
  const remaining = Math.max(0, shelter.capacity - shelter.occupancy);
  const meta = STATUS_META[shelter.status];
  const StatusIcon = meta.icon;
  const isPressedNav = pressedBtn === `nav-${shelter.id}`;
  const isPressedCall = pressedBtn === `call-${shelter.id}`;

  return (
    <GlassCard
      className={cn(
        'relative overflow-hidden p-5 cursor-pointer animate-fade-in-scale',
        shelter.aiRecommended && 'ring-2 ring-brand-400/40 dark:ring-brand-500/30',
      )}
      glow={shelter.aiRecommended ? 'brand' : shelter.status === 'full' ? 'danger' : shelter.status === 'nearly-full' ? 'warning' : 'success'}
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={onSelect}
    >
      {/* AI Recommended badge */}
      {shelter.aiRecommended && (
        <div className="absolute right-3 top-3 z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-md animate-pulse-glow">
            <Sparkles className="h-3 w-3" />
            AI Pick
          </span>
        </div>
      )}

      <div className="flex items-start gap-3">
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border', meta.tone === 'success' ? 'bg-success-50 border-success-300/50 text-success-600 dark:bg-success-500/10 dark:text-success-400' : meta.tone === 'warning' ? 'bg-orange-50 border-orange-300/50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400' : meta.tone === 'danger' ? 'bg-danger-50 border-danger-300/50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-400' : 'bg-ink-100 border-ink-300/50 text-ink-500 dark:bg-ink-800/40 dark:text-ink-400')}>
          <Home className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold text-ink-500 dark:text-ink-400">{shelter.id}</span>
            <Badge tone={meta.tone} dot>
              <StatusIcon className="h-3 w-3" />
              {meta.label}
            </Badge>
          </div>
          <h3 className="mt-1.5 font-display text-base font-semibold text-ink-900 dark:text-white">{shelter.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-500 dark:text-ink-400">
            <MapPin className="h-3 w-3 text-brand-500" />
            {shelter.address}
          </p>
        </div>
      </div>

      {/* Occupancy bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-ink-500 dark:text-ink-400">
            <Users className="h-3.5 w-3.5" />
            Occupancy
          </span>
          <span className={cn('font-semibold tabular-nums', meta.color)}>
            {formatNumber(shelter.occupancy, 0)} / {formatNumber(shelter.capacity, 0)}
          </span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink-200/70 dark:bg-ink-800/70">
          <div className={cn('h-full rounded-full transition-all duration-700', meta.bar)} style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] text-ink-400 dark:text-ink-500">
          <span>{pct}% occupied</span>
          <span>{formatNumber(remaining, 0)} remaining</span>
        </div>
      </div>

      {/* Distance + ETA + Traffic */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-ink-200/60 bg-white/40 px-3 py-2 dark:border-ink-800/60 dark:bg-ink-900/40">
          <p className="label-eyebrow text-[9px]">Distance</p>
          <p className="stat-value mt-0.5 text-sm text-ink-800 dark:text-ink-100">{shelter.distanceKm} km</p>
        </div>
        <div className="rounded-lg border border-ink-200/60 bg-white/40 px-3 py-2 dark:border-ink-800/60 dark:bg-ink-900/40">
          <p className="label-eyebrow text-[9px]">ETA</p>
          <p className="stat-value mt-0.5 flex items-center gap-1 text-sm text-ink-800 dark:text-ink-100">
            <Clock className="h-3 w-3 text-brand-500" />
            {shelter.travelMin}m
          </p>
        </div>
        <div className="rounded-lg border border-ink-200/60 bg-white/40 px-3 py-2 dark:border-ink-800/60 dark:bg-ink-900/40">
          <p className="label-eyebrow text-[9px]">Traffic</p>
          <p className="stat-value mt-0.5 flex items-center gap-1 text-sm text-ink-800 dark:text-ink-100">
            <Car className="h-3 w-3" />
            {shelter.trafficLevel}
          </p>
        </div>
      </div>

      {/* Facilities preview */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {shelter.facilities.filter((f) => f.state !== 'unavailable').slice(0, 4).map((f) => (
          <span key={f.key} className={cn(
            'badge px-2 py-0.5 text-[10px]',
            f.state === 'available'
              ? 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300'
              : 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-300',
          )}>
            {f.label}
          </span>
        ))}
        {shelter.facilities.filter((f) => f.state === 'unavailable').length > 0 && (
          <span className="badge bg-ink-100/70 px-2 py-0.5 text-[10px] text-ink-500 dark:bg-ink-800/50 dark:text-ink-400">
            +{shelter.facilities.filter((f) => f.state === 'unavailable').length} unavailable
          </span>
        )}
      </div>

      {/* Always-visible action buttons */}
      <div className="mt-4 flex gap-2 border-t border-ink-200/50 pt-3 dark:border-ink-800/50" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="primary"
          size="sm"
          className={cn('flex-1 transition-all', isPressedNav && 'scale-[0.97] ring-2 ring-brand-300')}
          onClick={onNavigate}
        >
          <Navigation className="h-3.5 w-3.5" />
          Navigate
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className={cn('flex-1 transition-all', isPressedCall && 'scale-[0.97] ring-2 ring-brand-300')}
          onClick={onCall}
        >
          <Phone className="h-3.5 w-3.5" />
          Call Shelter
        </Button>
      </div>
    </GlassCard>
  );
}

function CallDialog({ shelter, onClose }: { shelter: ShelterDetail; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const cleaned = shelter.phone.replace(/\s/g, '');

  const handleCopy = () => {
    navigator.clipboard?.writeText(cleaned).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink-950/50 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden />
      <div className="fixed left-1/2 top-1/2 z-50 w-[90%] max-w-sm -translate-x-1/2 -translate-y-1/2 animate-fade-in-scale">
        <GlassCard className="p-6" glow="brand">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                <Phone className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900 dark:text-white">{shelter.name}</p>
                <p className="font-mono text-xs text-ink-500 dark:text-ink-400">{shelter.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-ink-200/60 bg-ink-50/40 p-3 dark:border-ink-700/60 dark:bg-ink-800/30">
            <p className="label-eyebrow">Official Contact Number</p>
            <p className="mt-1 font-mono text-lg font-semibold text-ink-900 dark:text-white">{shelter.phone}</p>
          </div>

          <div className="mt-4 flex gap-2">
            <Button variant="primary" size="md" className="flex-1" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Number'}
            </Button>
            <Button variant="secondary" size="md" onClick={onClose}>
              Close
            </Button>
          </div>
        </GlassCard>
      </div>
    </>
  );
}
