import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Marker, Popup, Polyline, CircleMarker, Polygon, useMap } from 'react-leaflet';
import {
  Navigation, RotateCw, MapPin, AlertTriangle, Shield, Home, PlusSquare,
  Tent, Flame, Siren, Clock, Gauge, Route as RouteIcon, BrainCircuit,
  Activity, Droplets, Users, Cloud, Download, ChevronRight,
  Truck, Zap, TrendingUp, Layers, X, Phone, Map as MapIcon,
} from 'lucide-react';
import { useActiveIncident } from '@/context/ActiveIncidentContext';
import {
  getEvacuationSnapshot, findNearestHospitalRoute,
  type EvacRoute, type EmergencyPoi, type PoiKind, type RouteStatus,
  type TrafficLevel, type FloodRisk,
} from '@/api/evacuationApi';
import { PageHeader } from '@/components/ui/PageHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { LeafletMap, makeIcon } from '@/components/map/LeafletMap';
import { poiIcon } from '@/components/map/poiIcons';
import { cn, formatTime } from '@/lib/utils';

// ---- Color maps ----

const ROUTE_COLORS: Record<RouteStatus, string> = {
  open: '#22c55e',
  restricted: '#eab308',
  congested: '#f97316',
  closed: '#dc2626',
};

const TRAFFIC_COLORS: Record<TrafficLevel, string> = {
  low: '#22c55e',
  moderate: '#eab308',
  heavy: '#f97316',
  standstill: '#dc2626',
};

const FLOOD_RISK_COLORS: Record<FloodRisk, string> = {
  'very-low': '#22c55e',
  low: '#84cc16',
  moderate: '#f97316',
  high: '#dc2626',
  extreme: '#7f1d1d',
};

const STATUS_LABEL: Record<RouteStatus, string> = {
  open: 'Open',
  restricted: 'Restricted',
  congested: 'Congested',
  closed: 'Closed',
};

const TRAFFIC_LABEL: Record<TrafficLevel, string> = {
  low: 'Low',
  moderate: 'Moderate',
  heavy: 'Heavy',
  standstill: 'Standstill',
};

const FLOOD_RISK_LABEL: Record<FloodRisk, string> = {
  'very-low': 'Very Low',
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  extreme: 'Extreme',
};

const POI_ICON_MAP: Record<PoiKind, typeof Home> = {
  shelter: Home,
  hospital: PlusSquare,
  police: Shield,
  fire: Flame,
  'relief-camp': Tent,
  'community-shelter': Home,
  'high-ground': MapIcon,
};
const HospitalIcon = PlusSquare;

const POI_LABEL: Record<PoiKind, string> = {
  shelter: 'Shelters',
  hospital: 'Hospitals',
  police: 'Police Stations',
  fire: 'Fire Stations',
  'relief-camp': 'Relief Camps',
  'community-shelter': 'Community Shelters',
  'high-ground': 'High Ground',
};

// ---- Map fit-to-bounds helper ----

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.flyTo(points[0], 13, { duration: 1.2 });
      return;
    }
    const lats = points.map((p) => p[0]);
    const lngs = points.map((p) => p[1]);
    const bounds: [[number, number], [number, number]] = [
      [Math.min(...lats) - 0.01, Math.min(...lngs) - 0.01],
      [Math.max(...lats) + 0.01, Math.max(...lngs) + 0.01],
    ];
    map.flyToBounds(bounds, { duration: 1.2, padding: [60, 60] });
  }, [map, points]);
  return null;
}

// ============================================================================
// Main page
// ============================================================================

export function EvacuationPage() {
  const { incident } = useActiveIncident();
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof getEvacuationSnapshot>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [visiblePois, setVisiblePois] = useState<Record<PoiKind, boolean>>({
    shelter: true, hospital: true, police: true, fire: true,
    'relief-camp': true, 'community-shelter': true, 'high-ground': true,
  });
  const [hospitalRoute, setHospitalRoute] = useState<{
    route: { lat: number; lng: number }[]; hospital: EmergencyPoi;
    distanceKm: number; etaMin: number; traffic: TrafficLevel;
  } | null>(null);
  const [showHospitalRoute, setShowHospitalRoute] = useState(false);

  // Fetch evacuation data whenever the active incident changes
  useEffect(() => {
    if (!incident) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSnapshot(null);
    setSelectedRouteId(null);
    setHospitalRoute(null);
    setShowHospitalRoute(false);
    getEvacuationSnapshot(incident)
      .then((data) => {
        if (cancelled) return;
        setSnapshot(data);
        setSelectedRouteId(data.routes[0]?.id ?? null);
      })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [incident]);

  const selectedRoute = useMemo(
    () => snapshot?.routes.find((r) => r.id === selectedRouteId) ?? snapshot?.routes[0] ?? null,
    [snapshot, selectedRouteId],
  );

  // Collect all map points for fit-to-bounds
  const mapPoints = useMemo<[number, number][]>(() => {
    if (!snapshot) return [];
    const pts: [number, number][] = [[snapshot.origin.lat, snapshot.origin.lng]];
    if (selectedRoute) {
      selectedRoute.path.forEach((p) => pts.push([p.lat, p.lng]));
    }
    snapshot.pois.forEach((p) => {
      if (visiblePois[p.kind]) pts.push([p.lat, p.lng]);
    });
    return pts;
  }, [snapshot, selectedRoute, visiblePois]);

  async function handleFindHospital() {
    if (!snapshot || !incident) return;
    const result = await findNearestHospitalRoute(incident, snapshot.pois);
    if (result) {
      setHospitalRoute({
        route: result.route,
        hospital: result.hospital,
        distanceKm: result.distanceKm,
        etaMin: result.etaMin,
        traffic: result.traffic,
      });
      setShowHospitalRoute(true);
    }
  }

  function handleRecalculate() {
    if (!incident) return;
    setLoading(true);
    getEvacuationSnapshot(incident)
      .then((data) => { setSnapshot(data); setSelectedRouteId(data.routes[0]?.id ?? null); })
      .finally(() => setLoading(false));
  }

  function handleDownload() {
    if (!selectedRoute || !snapshot) return;
    const r = selectedRoute;
    const lines: string[] = [];
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('  AI EMERGENCY RESPONSE DASHBOARD — EVACUATION ROUTE REPORT');
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('');
    lines.push(`Flood Area: ${snapshot.incident.name} (${snapshot.incident.state})`);
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push(`Dashboard Version: AI Emergency Response Dashboard v2.0`);
    lines.push('');
    lines.push('── ROUTE INFORMATION ──────────────────────────────────────');
    lines.push(`Route Name:      ${r.roadName}`);
    lines.push(`Route ID:        ${r.routeId}`);
    lines.push(`Route Status:    ${STATUS_LABEL[r.status]}`);
    lines.push(`Distance:        ${r.distanceKm} km`);
    lines.push(`Est. Travel Time:${r.etaMin} min`);
    lines.push(`AI Safety Score: ${r.safetyScore}%`);
    lines.push(`Flood Risk:      ${FLOOD_RISK_LABEL[r.floodRisk]}`);
    lines.push(`Current Traffic: ${TRAFFIC_LABEL[r.traffic]}`);
    lines.push(`Road Type:       ${r.roadType}`);
    lines.push(`Road Elevation:  ${r.elevation} m`);
    lines.push(`Capacity Usage:  ${r.capacityUsage}%`);
    lines.push(`AI Confidence:   ${r.aiConfidence}%`);
    lines.push('');
    lines.push('── ROUTE SEGMENTS ────────────────────────────────────────');
    r.segments.forEach((s, i) => {
      lines.push(`  ${i + 1}. ${s.name}`);
      lines.push(`     Distance: ${s.distanceKm} km | ETA: ${s.etaMin} min`);
      lines.push(`     Condition: ${s.roadCondition} | Traffic: ${TRAFFIC_LABEL[s.traffic]}`);
      lines.push(`     Flood Status: ${FLOOD_RISK_LABEL[s.floodStatus]} | Elevation: ${s.elevation} m`);
      lines.push('');
    });
    lines.push('── DESTINATION SHELTER ───────────────────────────────────');
    const dest = snapshot.pois.find((p) => p.name === r.destinationName);
    if (dest) {
      lines.push(`Shelter Name:     ${dest.name}`);
      lines.push(`Capacity:         ${dest.capacity}`);
      lines.push(`Current Occupancy:${dest.occupancy}`);
      lines.push(`Remaining:        ${(dest.capacity ?? 0) - (dest.occupancy ?? 0)}`);
      lines.push(`Contact:          ${dest.phone}`);
    }
    lines.push('');
    lines.push('── EMERGENCY RESOURCES ──────────────────────────────────');
    snapshot.pois.forEach((p) => {
      lines.push(`  ${POI_LABEL[p.kind]}: ${p.name} — ${p.distanceKm}km, ${p.travelMin}min`);
    });
    lines.push('');
    lines.push('── AI RECOMMENDATION ────────────────────────────────────');
    lines.push(`Confidence Score: ${r.aiConfidence}%`);
    lines.push('Recommended because:');
    r.aiReasons.forEach((reason) => lines.push(`  • ${reason}`));
    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('Generated by AI Emergency Response Dashboard');
    lines.push('═══════════════════════════════════════════════════════════');

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${r.roadName.replace(/[^a-zA-Z0-9]/g, '_')}_Evacuation_Route.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!incident) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Emergency Response"
          title="Evacuation Dashboard"
          description="Select a flood-affected area from the Flood Prediction Dashboard to view its evacuation plan."
        />
        <GlassCard className="flex flex-col items-center justify-center gap-4 p-16 text-center" hover>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-500/10">
            <AlertTriangle className="h-8 w-8 text-brand-500" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white">No Active Incident</h3>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400 max-w-md">
              Go to the Flood Prediction Dashboard and click on a flood station to activate its evacuation plan here.
            </p>
          </div>
          <Button onClick={() => navigate('/flood-prediction')} variant="primary" size="md">
            <BrainCircuit className="h-4 w-4" />
            Open Flood Prediction
          </Button>
        </GlassCard>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-10 w-64 rounded" />
        <div className="skeleton h-[540px] w-full rounded-2xl" />
        <div className="skeleton h-[300px] w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <ErrorState
        fullPage
        title="Evacuation data unavailable"
        message={error ?? 'Could not load evacuation plan.'}
        onRetry={handleRecalculate}
      />
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Emergency Response · Active Incident"
        title="Evacuation Dashboard"
        description={`AI-powered evacuation plan for ${incident.name}, ${incident.state}. Routes, shelters, and emergency resources synced with the selected flood incident.`}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone="danger" dot><AlertTriangle className="h-3 w-3" /> {incident.riskTier}</Badge>
            <Button onClick={handleRecalculate} variant="secondary" size="md">
              <RotateCw className="h-4 w-4" />
              Recalculate
            </Button>
          </div>
        }
      />

      {/* Incident context strip */}
      <IncidentStrip snapshot={snapshot} />

      {/* Map — full width */}
      <GlassCard className="relative overflow-hidden p-2" hover>
        <div className="mb-2 flex items-center justify-between px-3 pt-2">
          <span className="label-eyebrow">
            Evacuation Map · {incident.name}
            {showHospitalRoute && hospitalRoute && ' · Hospital Route'}
          </span>
          <div className="flex items-center gap-2">
            {showHospitalRoute && hospitalRoute && (
              <Badge tone="brand" dot><HospitalIcon className="h-3 w-3" /> {hospitalRoute.etaMin} min to hospital</Badge>
            )}
            {selectedRoute && !showHospitalRoute && (
              <Badge tone={selectedRoute.status === 'open' ? 'success' : selectedRoute.status === 'closed' ? 'danger' : 'warning'} dot>
                {selectedRoute.roadName.split(' — ')[0]} · {selectedRoute.etaMin} min
              </Badge>
            )}
          </div>
        </div>
        <div className="relative h-[560px] w-full overflow-hidden rounded-xl">
          <LeafletMap
            center={[incident.lat, incident.lng]}
            zoom={13}
            theme="dark"
          >
            <FitBounds points={mapPoints} />

            {/* Flood boundary */}
            <Polygon
              positions={snapshot.floodBoundary.map((p) => [p.lat, p.lng] as [number, number])}
              pathOptions={{ color: '#dc2626', weight: 2, fillColor: '#dc2626', fillOpacity: 0.2, dashArray: '6 4' }}
            />

            {/* Evacuation routes — dim non-selected, highlight selected */}
            {snapshot.routes.map((r) => {
              const isSelected = r.id === selectedRoute?.id;
              return (
                <Polyline
                  key={r.id}
                  positions={r.path.map((p) => [p.lat, p.lng] as [number, number])}
                  pathOptions={{
                    color: isSelected ? ROUTE_COLORS[r.status] : '#334155',
                    weight: isSelected ? 7 : 4,
                    opacity: isSelected ? 0.95 : 0.3,
                  }}
                  eventHandlers={{ click: () => setSelectedRouteId(r.id) }}
                >
                  <Popup>
                    <strong>{r.roadName}</strong><br />
                    Route {r.routeId} · {STATUS_LABEL[r.status]}<br />
                    {r.distanceKm} km · {r.etaMin} min · Safety {r.safetyScore}%
                  </Popup>
                </Polyline>
              );
            })}

            {/* Alternative routes for selected */}
            {selectedRoute?.alternatives.map((alt, i) => (
              <Polyline
                key={`alt-${i}`}
                positions={alt.map((p) => [p.lat, p.lng] as [number, number])}
                pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.5, dashArray: '6 6' }}
              />
            ))}

            {/* Hospital route */}
            {showHospitalRoute && hospitalRoute && (
              <Polyline
                positions={hospitalRoute.route.map((p) => [p.lat, p.lng] as [number, number])}
                pathOptions={{ color: '#3b82f6', weight: 6, opacity: 0.9 }}
              />
            )}

            {/* Origin marker */}
            <Marker
              position={[snapshot.origin.lat, snapshot.origin.lng]}
              icon={makeIcon({ color: 'danger', size: 28, pulse: true, glyph: '!' })}
            >
              <Popup>
                <strong>{snapshot.origin.name}</strong><br />
                <span style={{ color: '#dc2626' }}>Flood incident origin</span>
              </Popup>
            </Marker>

            {/* Route endpoints */}
            {selectedRoute && (
              <>
                <CircleMarker
                  center={[selectedRoute.path[0].lat, selectedRoute.path[0].lng]}
                  radius={6}
                  pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.9 }}
                />
                <CircleMarker
                  center={[selectedRoute.path[selectedRoute.path.length - 1].lat, selectedRoute.path[selectedRoute.path.length - 1].lng]}
                  radius={6}
                  pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.9 }}
                />
              </>
            )}

            {/* POIs */}
            {snapshot.pois.map((p) =>
              visiblePois[p.kind] ? (
                <Marker
                  key={p.id}
                  position={[p.lat, p.lng]}
                  icon={poiIcon(p.kind, { pulse: p.kind === 'high-ground' || p.status === 'full' })}
                >
                  <Popup>
                    <strong>{p.name}</strong><br />
                    Type: {POI_LABEL[p.kind]}<br />
                    {p.capacity ? `Capacity: ${p.capacity}` : ''}{p.occupancy != null ? ` · Occupancy: ${p.occupancy}` : ''}<br />
                    {p.distanceKm ? `Distance: ${p.distanceKm} km · ETA ${p.travelMin} min` : ''}<br />
                    {p.phone ? `📞 ${p.phone}` : ''}<br />
                    Status: <span style={{ color: p.status === 'full' ? '#dc2626' : p.status === 'limited' ? '#f59e0b' : '#22c55e' }}>{p.status}</span>
                  </Popup>
                </Marker>
              ) : null,
            )}
          </LeafletMap>

          {/* Persistent map legend */}
          <MapLegend />
        </div>
      </GlassCard>

      {/* Quick actions toolbar */}
      <QuickActions
        onRecalculate={handleRecalculate}
        onFindHospital={handleFindHospital}
        onViewShelter={() => navigate('/shelters')}
        onDownload={handleDownload}
        hospitalRoute={showHospitalRoute ? hospitalRoute : null}
        onCloseHospital={() => setShowHospitalRoute(false)}
      />

      {/* Evacuation routes — directly below the map */}
      <RouteCards
        routes={snapshot.routes}
        selectedId={selectedRoute?.id ?? null}
        onSelect={setSelectedRouteId}
      />

      {/* Emergency resources — below evacuation routes */}
      <PoiLayers
        pois={snapshot.pois}
        visiblePois={visiblePois}
        onToggle={(k) => setVisiblePois((p) => ({ ...p, [k]: !p[k] }))}
      />

      {/* Route detail panel */}
      {selectedRoute && (
        <RouteDetailPanel route={selectedRoute} />
      )}

      {/* Route comparison table */}
      {snapshot.routes.length > 1 && (
        <RouteComparison routes={snapshot.routes} selectedId={selectedRoute?.id ?? null} onSelect={setSelectedRouteId} />
      )}
    </div>
  );
}

// ============================================================================
// Incident context strip
// ============================================================================

function IncidentStrip({ snapshot }: { snapshot: Awaited<ReturnType<typeof getEvacuationSnapshot>> }) {
  const inc = snapshot.incident;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      <StripItem icon={<MapPin className="h-3.5 w-3.5" />} label="Location" value={inc.name} />
      <StripItem icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Risk Level" value={inc.riskTier} color="#dc2626" />
      <StripItem icon={<Users className="h-3.5 w-3.5" />} label="Pop. at Risk" value={snapshot.populationAtRisk.toLocaleString()} />
      <StripItem icon={<Droplets className="h-3.5 w-3.5" />} label="Water Level" value={`${snapshot.waterLevel} m`} />
      <StripItem icon={<Cloud className="h-3.5 w-3.5" />} label="Weather" value={snapshot.weather.condition} />
      <StripItem icon={<Cloud className="h-3.5 w-3.5" />} label="Rainfall" value={`${snapshot.weather.rainfall} mm/h`} />
      <StripItem icon={<Clock className="h-3.5 w-3.5" />} label="Updated" value={formatTime(snapshot.lastUpdated)} />
    </div>
  );
}

function StripItem({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl border border-ink-200/50 bg-white/40 px-3 py-2 backdrop-blur-md dark:border-ink-800/50 dark:bg-ink-900/40">
      <div className="flex items-center gap-1.5 text-brand-500 dark:text-brand-400">{icon}<span className="text-[10px] font-medium text-ink-400 dark:text-ink-500">{label}</span></div>
      <p className="mt-0.5 truncate text-xs font-semibold text-ink-800 dark:text-ink-100" style={color ? { color } : undefined}>{value}</p>
    </div>
  );
}

// ============================================================================
// Route cards
// ============================================================================

function RouteCards({ routes, selectedId, onSelect }: {
  routes: EvacRoute[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <GlassCard className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <RouteIcon className="h-4 w-4 text-brand-500" />
        <h3 className="font-display text-sm font-semibold text-ink-900 dark:text-white">Evacuation Routes</h3>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {routes.map((r) => {
          const isSelected = r.id === selectedId;
          return (
            <button
              key={r.id}
              onClick={() => onSelect(r.id)}
              className={cn(
                'w-full rounded-xl border p-3 text-left transition-all duration-300',
                isSelected
                  ? 'border-brand-400 bg-brand-50/70 shadow-glow-sm dark:border-brand-500/50 dark:bg-brand-500/10'
                  : 'border-ink-200/60 hover:border-brand-300 hover:bg-brand-50/40 dark:border-ink-800/60 dark:hover:bg-brand-500/5',
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-100 text-[10px] font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">{r.routeId}</span>
                  <span className="text-xs font-semibold text-ink-800 dark:text-ink-100">{r.roadName.split(' — ')[0]}</span>
                </div>
                {r.aiRecommended && (
                  <Badge tone="brand" className="text-[9px]"><BrainCircuit className="h-2.5 w-2.5" /> AI</Badge>
                )}
              </div>
              <p className="mt-1 truncate text-[10px] text-ink-500 dark:text-ink-400">{r.roadName}</p>
              <div className="mt-2 flex items-center gap-3 text-[10px] text-ink-400 dark:text-ink-500">
                <span className="flex items-center gap-1"><Navigation className="h-3 w-3" />{r.distanceKm} km</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.etaMin} min</span>
                <span className="flex items-center gap-1"><Shield className="h-3 w-3" />{r.safetyScore}%</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: ROUTE_COLORS[r.status] }} />
                <span className="text-[10px] text-ink-500 dark:text-ink-400">{STATUS_LABEL[r.status]}</span>
                <span className="h-2 w-2 rounded-full" style={{ background: TRAFFIC_COLORS[r.traffic] }} />
                <span className="text-[10px] text-ink-500 dark:text-ink-400">{TRAFFIC_LABEL[r.traffic]} traffic</span>
              </div>
            </button>
          );
        })}
      </div>
    </GlassCard>
  );
}

// ============================================================================
// POI layer toggles
// ============================================================================

function PoiLayers({ pois, visiblePois, onToggle }: {
  pois: EmergencyPoi[];
  visiblePois: Record<PoiKind, boolean>;
  onToggle: (k: PoiKind) => void;
}) {
  return (
    <GlassCard className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Siren className="h-4 w-4 text-danger-500" />
        <h3 className="font-display text-sm font-semibold text-ink-900 dark:text-white">Emergency Resources</h3>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {(Object.keys(POI_LABEL) as PoiKind[]).map((kind) => {
          const Icon = POI_ICON_MAP[kind];
          const count = pois.filter((p) => p.kind === kind).length;
          const isVisible = visiblePois[kind];
          return (
            <button
              key={kind}
              onClick={() => onToggle(kind)}
              className={cn(
                'flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition-all duration-300',
                isVisible
                  ? 'border-brand-200 bg-brand-50/50 dark:border-brand-500/30 dark:bg-brand-500/10'
                  : 'border-transparent opacity-60 hover:opacity-100',
              )}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="flex-1 text-[12px] font-medium text-ink-700 dark:text-ink-200">{POI_LABEL[kind]}</span>
              <Badge tone="neutral" className="text-[10px]">{count}</Badge>
            </button>
          );
        })}
      </div>
    </GlassCard>
  );
}

// ============================================================================
// Route detail panel
// ============================================================================

function RouteDetailPanel({ route }: {
  route: EvacRoute;
}) {
  return (
    <GlassCard className="overflow-hidden p-5" glow={route.aiRecommended ? 'brand' : 'none'}>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">{route.routeId}</span>
            <div>
              <h3 className="font-display text-base font-semibold text-ink-900 dark:text-white">{route.roadName}</h3>
              <p className="text-[11px] text-ink-500 dark:text-ink-400">{route.roadType} · {route.originName} → {route.destinationName}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {route.aiRecommended && <Badge tone="brand" dot><BrainCircuit className="h-3 w-3" /> AI Recommended</Badge>}
          <Badge tone={route.status === 'open' ? 'success' : route.status === 'closed' ? 'danger' : 'warning'} dot>{STATUS_LABEL[route.status]}</Badge>
          <span className="text-[10px] text-ink-400 dark:text-ink-500">Updated {formatTime(route.lastUpdated)}</span>
        </div>
      </div>

      {/* Overview stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <DetailStat icon={<Navigation className="h-3.5 w-3.5" />} label="Distance" value={`${route.distanceKm} km`} />
        <DetailStat icon={<Clock className="h-3.5 w-3.5" />} label="ETA" value={`${route.etaMin} min`} />
        <DetailStat icon={<Gauge className="h-3.5 w-3.5" />} label="Avg Speed" value={`${route.avgSpeed} km/h`} />
        <DetailStat icon={<Activity className="h-3.5 w-3.5" />} label="Traffic" value={TRAFFIC_LABEL[route.traffic]} color={TRAFFIC_COLORS[route.traffic]} />
        <DetailStat icon={<Droplets className="h-3.5 w-3.5" />} label="Flood Risk" value={FLOOD_RISK_LABEL[route.floodRisk]} color={FLOOD_RISK_COLORS[route.floodRisk]} />
        <DetailStat icon={<RouteIcon className="h-3.5 w-3.5" />} label="Road Type" value={route.roadType} />
        <DetailStat icon={<TrendingUp className="h-3.5 w-3.5" />} label="Elevation" value={`${route.elevation} m`} />
        <DetailStat icon={<Shield className="h-3.5 w-3.5" />} label="Safety Score" value={`${route.safetyScore}%`} color="#22c55e" />
        <DetailStat icon={<Truck className="h-3.5 w-3.5" />} label="Capacity" value={`${route.capacityUsage}%`} />
        <DetailStat icon={<Zap className="h-3.5 w-3.5" />} label="Congestion" value={route.predictedCongestion} />
      </div>

      {/* Route segments */}
      <div className="mt-5">
        <h4 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold text-ink-900 dark:text-white">
          <Layers className="h-4 w-4 text-brand-500" /> Route Segments
        </h4>
        <div className="space-y-2">
          {route.segments.map((s, i) => (
            <div key={s.id} className="flex items-start gap-3 rounded-xl border border-ink-200/50 bg-white/40 p-3 dark:border-ink-800/50 dark:bg-ink-900/40">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-[10px] font-bold text-ink-600 dark:bg-ink-800 dark:text-ink-300">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-ink-800 dark:text-ink-100">
                  <MapPin className="mr-1 inline h-3 w-3 text-brand-500" />{s.fromLabel} → {s.toLabel}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-ink-500 dark:text-ink-400">
                  <span>{s.distanceKm} km · {s.etaMin} min</span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.roadCondition === 'good' ? '#22c55e' : s.roadCondition === 'fair' ? '#eab308' : s.roadCondition === 'poor' ? '#f97316' : '#dc2626' }} />
                    {s.roadCondition}
                  </span>
                  <span>Traffic: {TRAFFIC_LABEL[s.traffic]}</span>
                  <span>Flood: {FLOOD_RISK_LABEL[s.floodStatus]}</span>
                  <span>Elevation: {s.elevation} m</span>
                </div>
              </div>
              <Badge tone={s.safetyScore > 85 ? 'success' : s.safetyScore > 70 ? 'warning' : 'danger'} className="text-[9px]">{s.safetyScore}%</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* AI recommendation */}
      <div className="mt-5 rounded-xl border border-brand-200/50 bg-brand-50/40 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-2 font-display text-sm font-semibold text-ink-900 dark:text-white">
            <BrainCircuit className="h-4 w-4 text-brand-500" /> AI Recommendation
          </h4>
          <Badge tone="brand" dot>Confidence {route.aiConfidence}%</Badge>
        </div>
        <p className="mt-2 text-[11px] font-medium text-ink-600 dark:text-ink-300">Recommended because:</p>
        <ul className="mt-1.5 space-y-1">
          {route.aiReasons.map((reason, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] text-ink-600 dark:text-ink-300">
              <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-brand-500" />
              {reason}
            </li>
          ))}
        </ul>
      </div>
    </GlassCard>
  );
}

function DetailStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl border border-ink-200/50 bg-white/40 p-3 dark:border-ink-800/50 dark:bg-ink-900/40">
      <div className="flex items-center gap-1.5 text-brand-500 dark:text-brand-400">{icon}<span className="text-[10px] text-ink-400 dark:text-ink-500">{label}</span></div>
      <p className="mt-1 font-mono text-sm font-bold text-ink-900 dark:text-slate-100" style={color ? { color } : undefined}>{value}</p>
    </div>
  );
}

// ============================================================================
// Route comparison table
// ============================================================================

type SortKey = 'safest' | 'fastest' | 'lowest-traffic' | 'shortest';

function RouteComparison({ routes, selectedId, onSelect }: {
  routes: EvacRoute[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [sort, setSort] = useState<SortKey>('safest');

  const sorted = useMemo(() => {
    const arr = [...routes];
    switch (sort) {
      case 'fastest': return arr.sort((a, b) => a.etaMin - b.etaMin);
      case 'safest': return arr.sort((a, b) => b.safetyScore - a.safetyScore);
      case 'lowest-traffic': return arr.sort((a, b) => {
        const order: Record<TrafficLevel, number> = { low: 0, moderate: 1, heavy: 2, standstill: 3 };
        return order[a.traffic] - order[b.traffic];
      });
      case 'shortest': return arr.sort((a, b) => a.distanceKm - b.distanceKm);
    }
  }, [routes, sort]);

  return (
    <GlassCard className="overflow-hidden p-5">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-display text-sm font-semibold text-ink-900 dark:text-white">Route Comparison</h3>
        <div className="flex items-center gap-1.5">
          {(['safest', 'fastest', 'lowest-traffic', 'shortest'] as SortKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={cn(
                'rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all duration-300',
                sort === k
                  ? 'bg-brand-600 text-white'
                  : 'bg-ink-100 text-ink-500 hover:bg-brand-100 hover:text-brand-700 dark:bg-ink-800 dark:text-ink-400',
              )}
            >
              {k.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-ink-200/50 text-[10px] uppercase text-ink-400 dark:border-ink-800/50 dark:text-ink-500">
              <th className="py-2 pr-3 font-medium">Route</th>
              <th className="px-3 font-medium">Distance</th>
              <th className="px-3 font-medium">ETA</th>
              <th className="px-3 font-medium">Traffic</th>
              <th className="px-3 font-medium">Flood Risk</th>
              <th className="px-3 font-medium">Safety</th>
              <th className="px-3 font-medium">Capacity</th>
              <th className="px-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const isSelected = r.id === selectedId;
              return (
                <tr
                  key={r.id}
                  onClick={() => onSelect(r.id)}
                  className={cn(
                    'cursor-pointer border-b border-ink-200/30 transition-all duration-200 hover:bg-brand-50/40 dark:border-ink-800/30 dark:hover:bg-brand-500/5',
                    isSelected && 'bg-brand-50/60 dark:bg-brand-500/10',
                    r.aiRecommended && !isSelected && 'bg-brand-50/20 dark:bg-brand-500/5',
                  )}
                >
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-brand-100 text-[9px] font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">{r.routeId}</span>
                      <div>
                        <span className="font-medium text-ink-800 dark:text-ink-100">{r.roadName.split(' — ')[0]}</span>
                        {r.aiRecommended && <BrainCircuit className="ml-1.5 inline h-3 w-3 text-brand-500" />}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 text-ink-600 dark:text-ink-300">{r.distanceKm} km</td>
                  <td className="px-3 text-ink-600 dark:text-ink-300">{r.etaMin} min</td>
                  <td className="px-3">
                    <span className="flex items-center gap-1.5 text-ink-600 dark:text-ink-300">
                      <span className="h-2 w-2 rounded-full" style={{ background: TRAFFIC_COLORS[r.traffic] }} />
                      {TRAFFIC_LABEL[r.traffic]}
                    </span>
                  </td>
                  <td className="px-3">
                    <span className="flex items-center gap-1.5 text-ink-600 dark:text-ink-300">
                      <span className="h-2 w-2 rounded-full" style={{ background: FLOOD_RISK_COLORS[r.floodRisk] }} />
                      {FLOOD_RISK_LABEL[r.floodRisk]}
                    </span>
                  </td>
                  <td className="px-3 font-semibold text-success-600 dark:text-success-400">{r.safetyScore}%</td>
                  <td className="px-3 text-ink-600 dark:text-ink-300">{r.capacityUsage}%</td>
                  <td className="px-3">
                    <span className="flex items-center gap-1.5 text-ink-600 dark:text-ink-300">
                      <span className="h-2 w-2 rounded-full" style={{ background: ROUTE_COLORS[r.status] }} />
                      {STATUS_LABEL[r.status]}
                    </span>
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

// ============================================================================
// Quick actions
// ============================================================================

function QuickActions({ onRecalculate, onFindHospital, onViewShelter, onDownload, hospitalRoute, onCloseHospital }: {
  onRecalculate: () => void;
  onFindHospital: () => void;
  onViewShelter: () => void;
  onDownload: () => void;
  hospitalRoute: { hospital: EmergencyPoi; distanceKm: number; etaMin: number; traffic: TrafficLevel } | null;
  onCloseHospital: () => void;
}) {
  return (
    <div className="space-y-3">
      <GlassCard className="p-4">
        <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-ink-900 dark:text-white">
          <Zap className="h-4 w-4 text-warning-500" /> Quick Actions
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onRecalculate} variant="secondary" size="sm"><RotateCw className="h-3.5 w-3.5" /> Recalculate Route</Button>
          <Button onClick={onFindHospital} variant="secondary" size="sm"><HospitalIcon className="h-3.5 w-3.5" /> Find Nearest Hospital</Button>
          <Button onClick={onViewShelter} variant="secondary" size="sm"><Home className="h-3.5 w-3.5" /> View Shelter Info</Button>
          <Button onClick={onDownload} variant="secondary" size="sm"><Download className="h-3.5 w-3.5" /> Download Route</Button>
        </div>
      </GlassCard>

      {/* Hospital route result */}
      {hospitalRoute && (
        <GlassCard className="p-4" glow="brand">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300">
                <HospitalIcon className="h-5 w-5" />
              </span>
              <div>
                <h4 className="font-display text-sm font-semibold text-ink-900 dark:text-white">{hospitalRoute.hospital.name}</h4>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-ink-500 dark:text-ink-400">
                  <span className="flex items-center gap-1"><Navigation className="h-3 w-3" />{hospitalRoute.distanceKm} km</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{hospitalRoute.etaMin} min</span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full" style={{ background: TRAFFIC_COLORS[hospitalRoute.traffic] }} />
                    {TRAFFIC_LABEL[hospitalRoute.traffic]} traffic
                  </span>
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{hospitalRoute.hospital.phone}</span>
                  <span className="flex items-center gap-1"><PlusSquare className="h-3 w-3" />{hospitalRoute.hospital.capacity} beds</span>
                </div>
              </div>
            </div>
            <button onClick={onCloseHospital} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-ink-200">
              <X className="h-4 w-4" />
            </button>
            </div>
        </GlassCard>
      )}
    </div>
  );
}

// ============================================================================
// Persistent map legend
// ============================================================================

function MapLegend() {
  return (
    <div className="fs-map-legend absolute bottom-3 left-3 z-[500] max-w-[220px] rounded-xl border border-white/20 bg-ink-950/85 px-3 py-2.5 text-[10px] text-white backdrop-blur-md">
      <p className="mb-2 flex items-center gap-1.5 font-semibold text-white">
        <Layers className="h-3 w-3" /> Map Legend
      </p>
      <div className="space-y-3">
        {/* Route colors */}
        <div>
          <p className="mb-1 text-[9px] uppercase tracking-wide text-slate-400">Route Status</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <LegendLine color="#22c55e" label="Safe Route" />
            <LegendLine color="#eab308" label="Moderate Traffic" />
            <LegendLine color="#f97316" label="Heavy Traffic" />
            <LegendLine color="#dc2626" label="Closed / Flooded" />
            <LegendLine color="#3b82f6" label="Alternative Route" dash />
          </div>
        </div>
        {/* POI symbols */}
        <div>
          <p className="mb-1 text-[9px] uppercase tracking-wide text-slate-400">Map Symbols</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <LegendDot color="#0ea5e9" glyph="✚" label="Hospital" />
            <LegendDot color="#10b981" glyph="⌂" label="Shelter" />
            <LegendDot color="#1d61f2" glyph="🛡" label="Police" />
            <LegendDot color="#dc2626" glyph="🔥" label="Fire Station" />
            <LegendDot color="#dc2626" glyph="!" label="Flood Zone" pulse />
            <LegendDot color="#f59e0b" glyph="⚠" label="High Risk Area" />
            <LegendDot color="#dc2626" glyph="🚧" label="Road Closure" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendLine({ color, label, dash }: { color: string; label: string; dash?: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-slate-300">
      <span
        className="inline-block h-0.5 w-4 rounded-full"
        style={{ background: dash ? `repeating-linear-gradient(90deg, ${color} 0 3px, transparent 3px 6px)` : color }}
      />
      {label}
    </span>
  );
}

function LegendDot({ color, glyph, label, pulse }: { color: string; glyph: string; label: string; pulse?: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-slate-300">
      <span
        className={cn('flex h-3.5 w-3.5 items-center justify-center rounded-full text-[7px] font-bold text-white', pulse && 'animate-pulse')}
        style={{ background: color }}
      >
        {glyph}
      </span>
      {label}
    </span>
  );
}
