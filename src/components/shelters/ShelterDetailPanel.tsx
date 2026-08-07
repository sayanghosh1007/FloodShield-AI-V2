import { useEffect } from 'react';
import {
  X,
  Phone,
  MapPin,
  Navigation,
  Clock,
  Users,
  Gauge,
  Stethoscope,
  Utensils,
  Droplets,
  Bath,
  Zap,
  Users2,
  Brain,
  CheckCircle2,
  XCircle,
  Car,
} from 'lucide-react';
import type { ShelterDetail, ShelterFacility, FacilityState } from '@/api/shelterApi';
import { buildGoogleMapsUrl } from '@/api/shelterApi';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn, formatNumber } from '@/lib/utils';

const FACILITY_ICONS: Record<string, typeof Stethoscope> = {
  Stethoscope,
  Utensils,
  Droplets,
  Bath,
  Zap,
  Users2,
};

const FACILITY_STATE_META: Record<FacilityState, { label: string; tone: 'success' | 'warning' | 'danger'; color: string }> = {
  available: { label: 'Available', tone: 'success', color: 'text-success-600 dark:text-success-400' },
  limited: { label: 'Limited', tone: 'warning', color: 'text-warning-600 dark:text-warning-400' },
  unavailable: { label: 'Unavailable', tone: 'danger', color: 'text-danger-600 dark:text-danger-400' },
};

const STATUS_META: Record<ShelterDetail['status'], { tone: 'success' | 'warning' | 'danger' | 'neutral'; label: string }> = {
  open: { tone: 'success', label: 'Open' },
  'nearly-full': { tone: 'warning', label: 'Nearly Full' },
  full: { tone: 'danger', label: 'Full' },
  closed: { tone: 'neutral', label: 'Closed' },
};

interface ShelterDetailPanelProps {
  shelter: ShelterDetail;
  onClose: () => void;
  userLat?: number;
  userLng?: number;
}

export function ShelterDetailPanel({ shelter, onClose, userLat, userLng }: ShelterDetailPanelProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const pct = shelter.capacity > 0 ? Math.min(100, Math.round((shelter.occupancy / shelter.capacity) * 100)) : 0;
  const remaining = Math.max(0, shelter.capacity - shelter.occupancy);
  const occupancyColor =
    pct >= 100 ? 'bg-danger-500' :
    pct >= 85 ? 'bg-orange-500' :
    pct >= 50 ? 'bg-warning-500' : 'bg-success-500';
  const statusMeta = STATUS_META[shelter.status];
  const navUrl = buildGoogleMapsUrl(shelter, userLat, userLng);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink-950/50 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden />
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col bg-white/95 shadow-2xl backdrop-blur-xl dark:bg-ink-900/95 animate-slide-in-right"
        role="dialog"
        aria-label={`Shelter details: ${shelter.name}`}
      >
        {/* Header */}
        <div className={cn(
          'flex items-start justify-between border-b border-ink-200/60 p-5 dark:border-ink-700/60',
          shelter.aiRecommended ? 'bg-brand-50/60 dark:bg-brand-500/10' : 'bg-white/60 dark:bg-ink-900/40',
        )}>
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-300/50 bg-brand-50 text-brand-600 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400">
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-ink-500 dark:text-ink-400">{shelter.id}</span>
                <Badge tone={statusMeta.tone} dot>{statusMeta.label}</Badge>
              </div>
              <h2 className="mt-1 font-display text-lg font-semibold text-ink-900 dark:text-white">{shelter.name}</h2>
              <p className="text-xs text-ink-500 dark:text-ink-400">{shelter.address}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-ink-200"
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Capacity Information */}
          <Section title="Capacity Information" icon={<Users className="h-4 w-4" />}>
            <div className="grid grid-cols-3 gap-3">
              <StatBox label="Total Capacity" value={formatNumber(shelter.capacity, 0)} sub="people" />
              <StatBox label="Current Occupancy" value={formatNumber(shelter.occupancy, 0)} sub="housed" />
              <StatBox label="Remaining" value={formatNumber(remaining, 0)} sub="available" />
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-500 dark:text-ink-400">Occupancy</span>
                <span className={cn('font-semibold tabular-nums', pct >= 85 ? 'text-danger-600 dark:text-danger-400' : pct >= 50 ? 'text-warning-600 dark:text-warning-400' : 'text-success-600 dark:text-success-400')}>
                  {pct}%
                </span>
              </div>
              <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-ink-200/70 dark:bg-ink-800/70">
                <div
                  className={cn('h-full rounded-full transition-all duration-700', occupancyColor)}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center gap-3 text-[10px] text-ink-400 dark:text-ink-500">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success-500" /> Low</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning-500" /> Moderate</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500" /> Nearly Full</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-danger-500" /> Full</span>
              </div>
            </div>
          </Section>

          {/* Estimated Arrival */}
          <Section title="Estimated Arrival" icon={<Navigation className="h-4 w-4" />}>
            <div className="grid grid-cols-2 gap-3">
              <StatBox label="Distance" value={`${shelter.distanceKm} km`} icon={<MapPin className="h-3.5 w-3.5" />} />
              <StatBox label="Travel Time" value={`${shelter.travelMin} min`} icon={<Clock className="h-3.5 w-3.5" />} />
              <StatBox label="Traffic" value={shelter.trafficLevel} icon={<Car className="h-3.5 w-3.5" />} />
              <StatBox
                label="Road Access"
                value={shelter.roadAccessible ? 'Accessible' : 'Blocked'}
                icon={shelter.roadAccessible ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              />
            </div>
          </Section>

          {/* Facilities */}
          <Section title="Facilities" icon={<Stethoscope className="h-4 w-4" />}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {shelter.facilities.map((f) => (
                <FacilityRow key={f.key} facility={f} />
              ))}
            </div>
          </Section>

          {/* AI Recommendation */}
          {shelter.aiRecommended && (
            <Section title="AI Shelter Recommendation" icon={<Brain className="h-4 w-4" />}>
              <div className="rounded-xl border border-brand-300/50 bg-brand-50/60 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
                <p className="text-sm leading-relaxed text-ink-800 dark:text-ink-100">{shelter.aiReason}</p>
                <div className="mt-3 flex items-center gap-3 rounded-lg border border-brand-200/50 bg-white/50 p-2.5 dark:border-brand-500/20 dark:bg-ink-800/40">
                  <Gauge className="h-5 w-5 text-brand-500" />
                  <div className="flex-1">
                    <p className="label-eyebrow">AI Confidence Score</p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-200/70 dark:bg-ink-700/60">
                        <div
                          className="h-full rounded-full bg-brand-500 transition-all duration-700"
                          style={{ width: `${shelter.aiConfidence}%` }}
                        />
                      </div>
                      <span className="stat-value text-sm text-ink-900 dark:text-white">{shelter.aiConfidence}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Contact */}
          <Section title="Contact Information" icon={<Phone className="h-4 w-4" />}>
            <div className="rounded-xl border border-ink-200/60 bg-ink-50/40 p-3 dark:border-ink-700/60 dark:bg-ink-800/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="label-eyebrow">Official Contact Number</p>
                  <p className="mt-0.5 font-mono text-base font-semibold text-ink-900 dark:text-white">{shelter.phone}</p>
                </div>
                <a
                  href={`tel:${shelter.phone.replace(/\s/g, '')}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-brand-700 active:scale-[0.98]"
                >
                  <Phone className="h-4 w-4" />
                  Call Now
                </a>
              </div>
            </div>
          </Section>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-ink-200/60 p-4 dark:border-ink-700/60">
          <div className="flex gap-2">
            <a href={navUrl} target="_blank" rel="noreferrer" className="flex-1">
              <Button variant="primary" size="md" className="w-full">
                <Navigation className="h-4 w-4" />
                Navigate via Google Maps
              </Button>
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          {icon}
        </span>
        <h3 className="font-display text-sm font-semibold text-ink-900 dark:text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function StatBox({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-ink-200/50 bg-ink-50/30 px-3 py-2 dark:border-ink-700/50 dark:bg-ink-800/30">
      <p className="label-eyebrow text-[10px]">{label}</p>
      <p className="mt-0.5 flex items-center gap-1 text-sm font-semibold text-ink-800 dark:text-ink-100">
        {icon}
        {value}
      </p>
      {sub && <p className="text-[10px] text-ink-400 dark:text-ink-500">{sub}</p>}
    </div>
  );
}

function FacilityRow({ facility }: { facility: ShelterFacility }) {
  const Icon = FACILITY_ICONS[facility.icon] ?? Stethoscope;
  const meta = FACILITY_STATE_META[facility.state];

  return (
    <div className={cn(
      'flex items-center justify-between rounded-lg border px-3 py-2',
      facility.state === 'unavailable'
        ? 'border-danger-200/40 bg-danger-50/30 dark:border-danger-500/20 dark:bg-danger-500/5'
        : facility.state === 'limited'
        ? 'border-warning-200/40 bg-warning-50/30 dark:border-warning-500/20 dark:bg-warning-500/5'
        : 'border-success-200/40 bg-success-50/30 dark:border-success-500/20 dark:bg-success-500/5',
    )}>
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4', meta.color)} />
        <span className="text-sm font-medium text-ink-800 dark:text-ink-100">{facility.label}</span>
      </div>
      <Badge tone={meta.tone}>{meta.label}</Badge>
    </div>
  );
}
