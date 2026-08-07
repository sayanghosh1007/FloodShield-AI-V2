import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Circle, CircleMarker, Popup, useMap } from 'react-leaflet';
import {
  BrainCircuit, RefreshCw, Radio, Zap, Droplets, Activity,
  Clock, Navigation, CheckCircle2, Gauge,
} from 'lucide-react';
import { useActiveIncident } from '@/context/ActiveIncidentContext';
import { useQuery } from '@/hooks/useQuery';
import {
  getAiFloodSnapshot,
  type AiFloodSnapshot,
  type PredictionHorizon,
} from '@/api/floodPredictionApi';

/** Imperatively flies the map to a focus center when focusKey changes. */
function FocusController({ center, focusKey }: { center: [number, number]; focusKey?: string }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 8, { duration: 0.4 });
  }, [center, focusKey, map]);
  return null;
}
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { GlassCard } from '@/components/ui/GlassCard';

import { LeafletMap } from '@/components/map/LeafletMap';
import { formatTime, cn } from '@/lib/utils';

const INDIA_CENTER: [number, number] = [22.5, 80];

// 5-tier risk color scheme per spec
const RISK_HEX: Record<string, string> = {
  extreme: '#7f1d1d',   // dark red
  high: '#dc2626',      // red
  moderate: '#f97316',  // orange
  low: '#eab308',       // yellow
  safe: '#22c55e',      // green
};

function riskTier(prob: number): keyof typeof RISK_HEX {
  if (prob >= 70) return 'extreme';
  if (prob >= 50) return 'high';
  if (prob >= 30) return 'moderate';
  if (prob >= 15) return 'low';
  return 'safe';
}

// ============================================================================
// Horizon selector (24 / 48 / 72h)
// ============================================================================

function HorizonSelector({ value, onChange }: { value: PredictionHorizon; onChange: (h: PredictionHorizon) => void }) {
  const H: PredictionHorizon[] = [24, 48, 72];
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-ink-200/60 bg-white/60 p-1 backdrop-blur-md dark:border-ink-800/60 dark:bg-ink-900/60">
      {H.map((h) => (
        <button
          key={h}
          onClick={() => onChange(h)}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[12px] font-semibold transition-all duration-200',
            value === h
              ? 'bg-brand-600 text-white shadow-glow'
              : 'text-ink-500 hover:bg-ink-100/70 dark:text-ink-400 dark:hover:bg-ink-800/60',
          )}
        >
          <Clock className="h-3 w-3" />
          {h}h
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// Mini SVG chart
// ============================================================================

function MiniChart({ values, color, yLabel, height = 90 }: { values: number[]; color: string; yLabel: string; height?: number }) {
  if (!values.length) return null;
  const W = 400, H = height, pad = 6;
  const min = Math.min(...values);
  const max = Math.max(...values) || min + 1;
  const range = max - min;
  const step = (W - pad * 2) / Math.max(1, values.length - 1);
  const y = (v: number) => H - pad - ((v - min) / range) * (H - pad * 2);
  const x = (i: number) => pad + i * step;
  const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(values.length - 1)},${H - pad} L${x(0)},${H - pad} Z`;
  const ticks = [min, (min + max) / 2, max];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.03" />
        </linearGradient>
      </defs>
      {ticks.map((t, i) => (
        <line key={i} x1={pad} y1={y(t)} x2={W - pad} y2={y(t)} stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
      ))}
      <path d={area} fill={`url(#g-${color.replace('#', '')})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {ticks.map((t, i) => (
        <text key={i} x={pad + 2} y={y(t) - 3} fontSize="9" fill="#64748b">{t.toFixed(1)}{yLabel}</text>
      ))}
    </svg>
  );
}

// ============================================================================
// Station list
// ============================================================================

function StationList({
  stations, selectedId, onSelect,
}: {
  stations: AiFloodSnapshot['stationPredictions']; selectedId: string | null; onSelect: (id: string) => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-ink-200/60 bg-white/60 backdrop-blur-md dark:border-ink-800/60 dark:bg-ink-900/60">
      <div className="flex items-center justify-between border-b border-ink-200/60 px-4 py-3 dark:border-ink-800/60">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-600 dark:text-slate-300">
          Stations · Ranked by Risk
        </span>
        <span className="font-mono text-[11px] text-ink-400 dark:text-slate-500">{stations.length} active</span>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-ink-100/80 dark:divide-white/5">
        {stations.map((s) => {
          const tier = riskTier(s.floodProbability);
          const hex = RISK_HEX[tier];
          const isSelected = s.id === selectedId;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={cn(
                'w-full px-4 py-3.5 text-left transition-all duration-200',
                isSelected
                  ? 'border-l-2 bg-brand-50/60 dark:bg-white/[0.06]'
                  : 'border-l-2 border-transparent hover:bg-ink-50/60 dark:hover:bg-white/[0.03]',
              )}
              style={isSelected ? { borderLeftColor: hex } : undefined}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[13px] font-bold uppercase tracking-wide text-ink-900 dark:text-white">{s.name}</p>
                  <p className="mt-0.5 font-mono text-[11px]" style={{ color: hex }}>{s.state} · {s.river}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase" style={{ borderColor: `${hex}50`, color: hex, background: `${hex}15` }}>
                    <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: hex }} />
                    {tier}
                  </span>
                  <p className="mt-1 font-mono text-[11px] text-ink-400 dark:text-slate-400">{s.floodProbability}% · {s.leadTime}h</p>
                </div>
              </div>
              <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-ink-200/60 dark:bg-white/10">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.floodProbability}%`, background: hex }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Station detail
// ============================================================================

function StationDetail({ station }: { station: AiFloodSnapshot['stationPredictions'][number] }) {
  const tier = riskTier(station.floodProbability);
  const hex = RISK_HEX[tier];

  const metrics = [
    { label: 'Flood Probability', value: `${station.floodProbability.toFixed(1)}%`, highlight: true },
    { label: 'Lead Time', value: `${station.leadTime}h` },
    { label: 'Arrival Time', value: `${station.flood.arrivalTime}h` },
    { label: 'Duration', value: `${station.flood.duration}h` },
    { label: 'Soil Moisture', value: `${station.soilMoisture}%` },
    { label: 'Reservoir', value: `${station.reservoirLevel}%` },
    { label: 'Slope', value: `${station.slope.toFixed(1)}°` },
    { label: 'Historical Events', value: `${station.historicalEvents}` },
  ];

  const contributors = [
    { label: 'Rainfall Total', value: station.modelContributors.rainfallTotal },
    { label: 'Rainfall Intensity', value: station.modelContributors.rainfallIntensity },
    { label: 'River Level', value: station.modelContributors.riverLevel },
    { label: 'Terrain', value: station.modelContributors.terrain },
    { label: 'Historical', value: station.modelContributors.historical },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-ink-200/60 bg-white/60 font-mono backdrop-blur-md dark:border-ink-800/60 dark:bg-ink-900/60">
      <div className="border-b border-ink-200/60 px-5 py-4 dark:border-ink-800/60">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400 dark:text-slate-500">Prediction Detail · Station</p>
            <h2 className="mt-1 text-xl font-bold uppercase tracking-wide text-ink-900 dark:text-white">{station.name}</h2>
            <p className="mt-1 text-[11px] text-ink-500 dark:text-slate-400">{station.state} · {station.lat.toFixed(3)}, {station.lng.toFixed(3)} · {formatTime(new Date().toISOString())}</p>
          </div>
          <div className="shrink-0 text-right">
            <span className="inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-[11px] font-bold uppercase" style={{ borderColor: `${hex}50`, color: hex, background: `${hex}18` }}>
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: hex }} />{tier}
            </span>
            <div className="mt-2 text-right">
              <p className="text-[10px] uppercase tracking-widest text-ink-400 dark:text-slate-500">Confidence</p>
              <p className="text-2xl font-bold text-ink-900 dark:text-white">{station.confidence}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* metric cards */}
        <div className="grid grid-cols-4 gap-px border-b border-ink-200/60 bg-ink-200/40 dark:border-ink-800/60 dark:bg-white/5">
          {metrics.map((m) => (
            <div key={m.label} className="bg-white/60 px-3 py-3.5 dark:bg-ink-900/60">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-ink-400 dark:text-slate-500">{m.label}</p>
              <p className="mt-1.5 text-sm font-bold" style={{ color: m.highlight ? hex : undefined }}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* charts */}
        <div className="grid grid-cols-2 gap-px border-b border-ink-200/60 bg-ink-200/40 dark:border-ink-800/60 dark:bg-white/5">
          <div className="bg-white/60 p-4 dark:bg-ink-900/60">
            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink-400 dark:text-slate-500"><Droplets className="h-3 w-3 text-blue-400" /> Rainfall Forecast · 72H</p>
            <MiniChart values={station.rainfallForecast} color="#3b82f6" yLabel="mm" height={90} />
          </div>
          <div className="bg-white/60 p-4 dark:bg-ink-900/60">
            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink-400 dark:text-slate-500"><Activity className="h-3 w-3 text-cyan-400" /> River Gauge · Projected</p>
            <MiniChart values={station.riverLevelForecast} color="#22d3ee" yLabel="m" height={90} />
          </div>
        </div>

        {/* model contributors */}
        <div className="border-b border-ink-200/60 px-5 py-4 dark:border-ink-800/60">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400 dark:text-slate-500">Model Contributors</p>
          <div className="space-y-2.5">
            {contributors.map((c) => (
              <div key={c.label} className="grid grid-cols-[1fr_auto] items-center gap-3">
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-widest text-ink-500 dark:text-slate-400">{c.label}</p>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-200/60 dark:bg-white/10">
                    <div className="h-full rounded-full" style={{ width: `${c.value}%`, background: '#3b82f6' }} />
                  </div>
                </div>
                <span className="text-[11px] font-bold text-ink-700 dark:text-slate-300">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI response plan */}
        <div className="px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400 dark:text-slate-500"><Zap className="h-3 w-3 text-yellow-400" /> AI Response Plan</p>
          </div>
          <div className="space-y-3 text-[11px] leading-relaxed">
            <div>
              <p className="mb-1 font-bold uppercase tracking-wider text-ink-700 dark:text-slate-300">Situation Assessment</p>
              {station.aiPlan.situationAssessment.map((l, i) => <p key={i} className="text-ink-500 dark:text-slate-400">- {l}</p>)}
            </div>
            <div>
              <p className="mb-1 font-bold uppercase tracking-wider text-ink-700 dark:text-slate-300">Immediate Actions</p>
              {station.aiPlan.immediateActions.map((l, i) => <p key={i} className="text-ink-500 dark:text-slate-400">- {l}</p>)}
            </div>
            <div>
              <p className="mb-1 font-bold uppercase tracking-wider text-ink-700 dark:text-slate-300">Evacuation Guidance</p>
              {station.aiPlan.evacuationGuidance.map((l, i) => <p key={i} className="text-ink-500 dark:text-slate-400">- {l}</p>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Page
// ============================================================================

export function FloodPredictionPage() {
  const navigate = useNavigate();
  const { incident, setIncident } = useActiveIncident();
  const [horizon, setHorizon] = useState<PredictionHorizon>(24);
  const { data: snap, loading, error, refetch } = useQuery(
    () => getAiFloodSnapshot(horizon),
    [horizon],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // When an active incident arrives from AlertsPage, auto-select the nearest station.
  useEffect(() => {
    if (!snap || !incident) return;
    // Find nearest station by geographic proximity (within 100km / ~1 degree).
    let nearest: AiFloodSnapshot['stationPredictions'][number] | null = null;
    let minDist = Infinity;
    for (const s of snap.stationPredictions) {
      const dLat = s.lat - incident.lat;
      const dLng = s.lng - incident.lng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      // Also match by state+river as a fallback.
      const stateRiverMatch =
        s.state.toLowerCase() === incident.state.toLowerCase() &&
        s.river.toLowerCase() === incident.river.toLowerCase();
      if (stateRiverMatch || dist < minDist) {
        minDist = dist;
        nearest = s;
      }
    }
    if (nearest && minDist < 5) setSelectedId(nearest.id);
  }, [snap, incident]);
  const selectedStation = useMemo(
    () => snap?.stationPredictions.find((s) => s.id === selectedId) ?? snap?.stationPredictions[0] ?? null,
    [snap, selectedId],
  );
  const effectiveId = selectedId ?? snap?.stationPredictions[0]?.id ?? null;

  // Map center: focus on active incident if present, otherwise default India center.
  const mapCenter: [number, number] = incident
    ? [incident.lat, incident.lng]
    : INDIA_CENTER;
  const mapZoom = incident ? 8 : 5;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-10 w-64 rounded" />
        <div className="skeleton h-[500px] w-full rounded-2xl" />
        <div className="skeleton h-[600px] w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !snap) {
    return <ErrorState fullPage title="AI prediction engine unavailable" message={error ?? 'Could not load flood predictions.'} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* Row 1 — Title + description */}
      <PageHeader
        eyebrow="AI Flood Prediction"
        title="Flood Prediction Dashboard"
        description="Select any station on the map or in the list to view flood probability, arrival time, duration, and AI response plan. Use the 24h / 48h / 72h forecast timeline to visualize how flood extent evolves over time."
      />

      {/* Row 2 — Controls toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-ink-200/60 bg-white/60 px-4 py-3 backdrop-blur-md dark:border-ink-800/60 dark:bg-ink-900/60">
        <HorizonSelector value={horizon} onChange={setHorizon} />
        <div className="h-6 w-px bg-ink-200/60 dark:bg-ink-700/60" />
        <Badge tone="brand" dot><BrainCircuit className="h-3 w-3" /> {snap.modelVersion}</Badge>
        <div className="ml-auto flex items-center gap-2">
          <Button
            onClick={() => {
              if (selectedStation) {
                setIncident({
                  id: selectedStation.id,
                  name: selectedStation.name,
                  lat: selectedStation.lat,
                  lng: selectedStation.lng,
                  floodProbability: selectedStation.floodProbability,
                  riskTier: riskTier(selectedStation.floodProbability),
                  state: selectedStation.state,
                  river: selectedStation.river,
                });
                navigate('/evacuation');
              }
            }}
            variant="primary"
            size="md"
          >
            <Navigation className="h-4 w-4" /> Evacuation Plan
          </Button>
          <Button onClick={refetch} variant="secondary" size="md"><RefreshCw className="h-4 w-4" /> Re-run</Button>
        </div>
      </div>

      {/* Forecast timeline metadata bar */}
      <GlassCard className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center" glow="brand">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <Clock className="h-4 w-4" />
          </span>
          <div>
            <p className="label-eyebrow">Active Forecast Period</p>
            <p className="text-sm font-semibold text-ink-900 dark:text-white">{horizon}h horizon</p>
          </div>
        </div>
        <div className="hidden h-8 w-px bg-ink-200/60 dark:bg-ink-700/60 sm:block" />
        <div className="flex-1">
          <p className="label-eyebrow">Forecast Generation</p>
          <p className="text-xs text-ink-600 dark:text-ink-300">Generated {formatTime(snap.lastUpdated)} · Updated {formatTime(snap.lastUpdated)}</p>
        </div>
        <div className="hidden h-8 w-px bg-ink-200/60 dark:bg-ink-700/60 sm:block" />
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-brand-500" />
          <div>
            <p className="label-eyebrow">AI Confidence</p>
            <p className="text-sm font-semibold text-ink-900 dark:text-white">{Math.round(snap.confidence * 100)}%</p>
          </div>
        </div>
        <div className="hidden h-8 w-px bg-ink-200/60 dark:bg-ink-700/60 sm:block" />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-3 py-1 text-xs font-semibold text-success-700 dark:bg-success-500/10 dark:text-success-300">
          <CheckCircle2 className="h-3.5 w-3.5" />
          AI + Official Verification
        </span>
      </GlassCard>

      {/* Map + station list side by side — aligned heights like main dashboard */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:h-[548px]">
        {/* Map */}
        <div className="lg:col-span-2 h-full min-h-[500px]">
          <div className="glass-panel flex h-full flex-col overflow-hidden p-2">
            <div className="mb-2 flex shrink-0 items-center justify-between px-3 pt-2">
              <span className="label-eyebrow">AI Flood Prediction Map · {horizon}h horizon</span>
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-success-600 dark:text-success-400">
                <Radio className="h-3 w-3" />
{snap.stationPredictions.length} stations live
              </span>
            </div>
            <div className="relative min-h-[500px] flex-1 w-full overflow-hidden rounded-xl">
              <LeafletMap center={mapCenter} zoom={mapZoom} theme="osm">
                {incident && (
                  <FocusController center={mapCenter} focusKey={incident.id} />
                )}
                {/* Station risk zones — semi-transparent areas matching the list's risk tiers */}
                {snap.stationPredictions.map((st) => {
                  const tier = riskTier(st.floodProbability);
                  const hex = RISK_HEX[tier];
                  const isSelected = st.id === effectiveId;
                  const zoneRadius = Math.round(15000 + st.floodProbability * 400);
                  return (
                    <Circle
                      key={`zone-${st.id}`}
                      center={[st.lat, st.lng]}
                      radius={zoneRadius}
                      pathOptions={{
                        color: hex,
                        weight: isSelected ? 2.5 : 1,
                        fillColor: hex,
                        fillOpacity: isSelected ? 0.45 : 0.28,
                        dashArray: isSelected ? undefined : '4 3',
                      }}
                      eventHandlers={{ click: () => setSelectedId(st.id) }}
                    />
                  );
                })}

                {/* Station markers — pin on top of the risk zones */}
                {snap.stationPredictions.map((st) => {
                  const tier = riskTier(st.floodProbability);
                  const hex = RISK_HEX[tier];
                  const isSelected = st.id === effectiveId;
                  return (
                    <CircleMarker
                      key={st.id}
                      center={[st.lat, st.lng]}
                      radius={isSelected ? 11 : 7}
                      pathOptions={{ color: '#fff', weight: 2, fillColor: hex, fillOpacity: 0.95 }}
                      eventHandlers={{ click: () => setSelectedId(st.id) }}
                    >
                      <Popup>
                        <strong>{st.name}</strong><br />
                        {st.state} · {st.river}<br />
                        Flood Probability: {st.floodProbability.toFixed(1)}%<br />
                        Risk Tier: {tier}<br />
                        Lead Time: {st.leadTime}h<br />
                        <button onClick={() => setSelectedId(st.id)} style={{ color: '#1d61f2', fontWeight: 600, marginTop: 4, cursor: 'pointer' }}>View prediction detail →</button>
                      </Popup>
                    </CircleMarker>
                  );
                })}

              </LeafletMap>

              {/* 5-tier legend — matches station risk tiers */}
              <div className="fs-map-legend absolute bottom-3 left-3 z-[500] rounded-lg border border-white/20 bg-white/85 px-3 py-2 text-[10px] backdrop-blur-md dark:border-white/10 dark:bg-ink-900/85">
                <p className="mb-1.5 font-semibold text-ink-600 dark:text-ink-200">Flood Risk</p>
                <div className="space-y-1">
                  {[
                    { c: '#7f1d1d', l: 'Extreme' },
                    { c: '#dc2626', l: 'High' },
                    { c: '#f97316', l: 'Moderate' },
                    { c: '#eab308', l: 'Low' },
                    { c: '#22c55e', l: 'Safe' },
                  ].map((s) => (
                    <div key={s.l} className="flex items-center gap-1.5">
                      <span className="h-2 w-2.5 rounded-sm" style={{ background: s.c }} />
                      <span className="text-ink-500 dark:text-ink-300">{s.l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Station list */}
        <div className="lg:col-span-1 h-full min-h-[536px]">
          <StationList stations={snap.stationPredictions} selectedId={effectiveId} onSelect={setSelectedId} />
        </div>
      </div>

      {/* Station detail */}
      {selectedStation && (
        <div className="h-[640px] overflow-hidden">
          <StationDetail station={selectedStation} />
        </div>
      )}
    </div>
  );
}

