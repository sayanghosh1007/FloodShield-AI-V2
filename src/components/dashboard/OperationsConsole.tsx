import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, Popup, useMap } from 'react-leaflet';
import {
  Activity,
  AlertTriangle,
  Users,
  ShieldAlert,
  RefreshCw,
  Satellite,
  Radio,
  MapPin,
} from 'lucide-react';
import { useQuery } from '@/hooks/useQuery';
import { getIndiaFloodAreas, getRegionWeatherDetail, type RegionWeatherDetail } from '@/api/floodApi';
import { getFloodPrediction } from '@/api/floodPredictionApi';
import { LeafletMap } from '@/components/map/LeafletMap';
import { RegionWeatherCards } from './RegionWeatherCards';
import { cn, severityLabel } from '@/lib/utils';

/** Imperatively flies the map to a focus center when focusKey changes. */
function FocusController({ center, focusKey }: { center: [number, number]; focusKey?: string }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 8, { duration: 0.4 });
  }, [center, focusKey, map]);
  return null;
}

const INDIA_CENTER: [number, number] = [22.5, 80];

const SEVERITY_HEX: Record<string, string> = {
  critical: '#7f1d1d',
  warning: '#dc2626',
  watch: '#f97316',
  advisory: '#eab308',
  info: '#10b981',
};

interface OperationsConsoleProps {
  /** Controlled selection — when provided, the map reports clicks via onSelect. */
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** Optional [lat, lng] to focus the map on (e.g. from active incident). */
  focusCenter?: [number, number];
  /** Changing this key triggers a fly-to (prevents re-fly on every render). */
  focusKey?: string;
}

export function OperationsConsole({ selectedId, onSelect, focusCenter, focusKey }: OperationsConsoleProps) {
  const { data: pins, loading } = useQuery(getIndiaFloodAreas, []);
  const { data: floodPrediction } = useQuery(getFloodPrediction, []);
  const [internalId, setInternalId] = useState<string | null>(null);
  const [detail, setDetail] = useState<RegionWeatherDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const effectiveId = selectedId !== undefined ? selectedId : internalId;

  const handleSelect = (id: string) => {
    if (onSelect) onSelect(id);
    else setInternalId(id);
  };

  // Auto-select the highest-risk flood area on first load
  useEffect(() => {
    if (pins && pins.length && !effectiveId) {
      const top = [...pins].sort((a, b) => severityRank(b.risk) - severityRank(a.risk))[0];
      handleSelect(top.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins, effectiveId]);

  // Fetch detail whenever selection changes
  useEffect(() => {
    if (!effectiveId) return;
    let cancelled = false;
    setDetailLoading(true);
    getRegionWeatherDetail(effectiveId).then((d) => {
      if (!cancelled) {
        setDetail(d);
        setDetailLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [effectiveId]);

  const kpis = useMemo(() => {
    const totalPins = pins?.length ?? 0;
    const alerts24h = (floodPrediction?.liveFloods.length ?? 0) + (floodPrediction?.highAlerts.length ?? 0);
    const popAtRisk = pins?.reduce((a, p) => a + p.population, 0) ?? 0;
    const severe = pins?.filter((p) => p.risk === 'critical' || p.risk === 'warning').length ?? 0;
    return { totalPins, alerts24h, popAtRisk, severe };
  }, [pins, floodPrediction]);

  const selectedPin = pins?.find((p) => p.id === effectiveId) ?? null;

  return (
    <div className="space-y-5">
      {/* Command console header */}
      <div className="relative overflow-hidden rounded-2xl border border-ink-800/40 bg-gradient-to-br from-ink-950 via-ink-900 to-brand-950/40 p-6 sm:p-7">
        {/* Decorative radar sweep */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 opacity-25">
          <div className="absolute inset-0 rounded-full border-2 border-brand-500/30" />
          <div className="absolute inset-8 rounded-full border border-brand-500/20" />
          <div
            className="absolute inset-0 animate-spin-slow rounded-full"
            style={{ background: 'conic-gradient(from 0deg, rgba(51,128,252,0.5), transparent 55%, transparent)' }}
          />
        </div>

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-400">
              Flood Risk · Operations Dashboard
            </p>
            <h1 className="mt-3 font-display text-2xl font-bold text-white sm:text-[28px] sm:leading-tight">
              Real-Time Flood Monitoring & Response
            </h1>
            <p className="mt-2 text-sm text-ink-400">
              Unified situational awareness across India's flood basins. Click any flood area on the map to view live weather telemetry and river-level forecasts.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-brand-500">
                <RefreshCw className="h-4 w-4" />
                Refresh Telemetry
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-ink-200 transition hover:bg-white/10">
                <Satellite className="h-4 w-4" />
                Run AI Forecast
              </button>
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-3 lg:max-w-lg">
            <KpiCard icon={<Activity className="h-5 w-5" />} label="Flood Areas Tracked" value={kpis.totalPins.toString()} tone="brand" />
            <KpiCard icon={<AlertTriangle className="h-5 w-5" />} label="Alerts Last 24H" value={kpis.alerts24h.toString()} tone="warning" pulse={kpis.alerts24h > 0} />
            <KpiCard icon={<Users className="h-5 w-5" />} label="Population at Risk" value={kpis.popAtRisk.toLocaleString()} tone="danger" />
            <KpiCard icon={<ShieldAlert className="h-5 w-5" />} label="Severe / Critical Sites" value={kpis.severe.toString()} tone="danger" pulse={kpis.severe > 0} />
          </div>
        </div>
      </div>

      {/* GIS map + weather detail */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="glass-panel overflow-hidden p-2">
            <div className="mb-2 flex items-center justify-between px-3 pt-2">
              <span className="label-eyebrow">India Flood Areas · OpenStreetMap</span>
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-success-600 dark:text-success-400">
                <Radio className="h-3 w-3" />
                {pins?.length ?? 0} flood areas live
              </span>
            </div>
            <div className="relative h-[380px] w-full overflow-hidden rounded-xl">
              {loading ? (
                <div className="skeleton h-full w-full rounded-xl" />
              ) : (
                <LeafletMap center={INDIA_CENTER} zoom={5} theme="osm">
                  {focusCenter && (
                    <FocusController center={focusCenter} focusKey={focusKey} />
                  )}
                  {pins?.map((pin) => {
                    const hex = SEVERITY_HEX[pin.risk] ?? '#10b981';
                    const isSelected = pin.id === effectiveId;
                    return (
                      <CircleMarker
                        key={pin.id}
                        center={[pin.lat, pin.lng]}
                        radius={isSelected ? 13 : 9}
                        pathOptions={{
                          color: '#fff',
                          weight: 2,
                          fillColor: hex,
                          fillOpacity: isSelected ? 0.9 : 0.7,
                        }}
                        eventHandlers={{ click: () => handleSelect(pin.id) }}
                      >
                        <Popup>
                          <strong>{pin.name}</strong><br />
                          Risk: {severityLabel(pin.risk)}<br />
                          River: {pin.riverLevel} m<br />
                          Population: {pin.population.toLocaleString()}<br />
                          <button
                            onClick={() => handleSelect(pin.id)}
                            style={{ color: '#1d61f2', fontWeight: 600, marginTop: 4, cursor: 'pointer' }}
                          >
                            View details & river forecast →
                          </button>
                        </Popup>
                      </CircleMarker>
                    );
                  })}
                </LeafletMap>
              )}

              {/* Severity legend */}
              <div className="fs-map-legend absolute bottom-3 left-3 z-[500] rounded-lg border border-white/20 bg-ink-950/85 px-3 py-2 text-[10px] backdrop-blur-md">
                <p className="mb-1.5 font-semibold text-ink-200">Severity</p>
                <div className="space-y-1">
                  {[
                    { c: '#7f1d1d', l: 'Critical' },
                    { c: '#dc2626', l: 'Warning' },
                    { c: '#f97316', l: 'Watch' },
                    { c: '#eab308', l: 'Advisory' },
                    { c: '#10b981', l: 'Stable' },
                  ].map((s) => (
                    <div key={s.l} className="flex items-center gap-1.5">
                      <span className="h-2 w-2.5 rounded-sm" style={{ background: s.c }} />
                      <span className="text-ink-300">{s.l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Selected flood area weather cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-500" />
              <h3 className="font-display text-sm font-semibold text-ink-900 dark:text-white">
                {selectedPin?.name ?? 'Select a flood area'}
              </h3>
            </div>
            {selectedPin && (
              <span
                className="badge px-2 py-0.5 text-[10px]"
                style={{ background: `${SEVERITY_HEX[selectedPin.risk]}25`, color: SEVERITY_HEX[selectedPin.risk] }}
              >
                {severityLabel(selectedPin.risk)}
              </span>
            )}
          </div>
          {detailLoading || !detail ? (
            <div className="grid grid-cols-2 gap-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
          ) : (
            <RegionWeatherCards detail={detail} />
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, tone, pulse }: { icon: React.ReactNode; label: string; value: string; tone: 'brand' | 'warning' | 'danger'; pulse?: boolean }) {
  const toneClass = {
    brand: 'text-brand-400 bg-brand-500/15',
    warning: 'text-warning-400 bg-warning-500/15',
    danger: 'text-danger-400 bg-danger-500/15',
  };
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', toneClass[tone])}>
          {icon}
        </span>
        {pulse && <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-danger-500" /></span>}
      </div>
      <p className="mt-2 font-display text-xl font-bold text-white">{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wider text-ink-400">{label}</p>
    </div>
  );
}

function severityRank(s: string): number {
  return { critical: 4, warning: 3, watch: 2, advisory: 1, info: 0 }[s] ?? 0;
}
