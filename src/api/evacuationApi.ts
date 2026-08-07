import type { Severity } from '@/types';
import type { ActiveIncident } from '@/context/ActiveIncidentContext';

export type PoiKind =
  | 'shelter'
  | 'hospital'
  | 'police'
  | 'fire'
  | 'relief-camp'
  | 'community-shelter'
  | 'high-ground';

export type RoadStatus = 'safe' | 'flooded' | 'blocked';

export interface EmergencyPoi {
  id: string;
  name: string;
  kind: PoiKind;
  lat: number;
  lng: number;
  capacity?: number;
  occupancy?: number;
  phone?: string;
  facilities?: string[];
  distanceKm?: number;
  travelMin?: number;
  status: 'open' | 'full' | 'limited' | 'standby';
  severity?: Severity;
}

export interface EvacRoad {
  id: string;
  name: string;
  path: { lat: number; lng: number }[];
  status: RoadStatus;
}

export type RouteStatus = 'open' | 'restricted' | 'congested' | 'closed';
export type TrafficLevel = 'low' | 'moderate' | 'heavy' | 'standstill';
export type FloodRisk = 'very-low' | 'low' | 'moderate' | 'high' | 'extreme';

export interface RouteSegment {
  id: string;
  name: string;
  fromLabel: string;
  toLabel: string;
  distanceKm: number;
  etaMin: number;
  roadCondition: 'good' | 'fair' | 'poor' | 'flooded';
  traffic: TrafficLevel;
  floodStatus: FloodRisk;
  elevation: number;
  safetyScore: number;
}

export interface EvacRoute {
  id: string;
  routeId: string;
  roadName: string;
  originName: string;
  destinationName: string;
  path: { lat: number; lng: number }[];
  alternatives: { lat: number; lng: number }[][];
  status: RouteStatus;
  distanceKm: number;
  etaMin: number;
  traffic: TrafficLevel;
  capacityUsage: number;
  floodRisk: FloodRisk;
  safetyScore: number;
  aiRecommended: boolean;
  aiConfidence: number;
  aiReasons: string[];
  roadType: string;
  elevation: number;
  avgSpeed: number;
  predictedCongestion: 'low' | 'moderate' | 'high';
  detourKm: number;
  lastUpdated: string;
  segments: RouteSegment[];
}

export interface EvacuationSnapshot {
  lastUpdated: string;
  incident: ActiveIncident;
  origin: { lat: number; lng: number; name: string };
  pois: EmergencyPoi[];
  roads: EvacRoad[];
  routes: EvacRoute[];
  highGround: EmergencyPoi[];
  populationAtRisk: number;
  waterLevel: number;
  weather: { temp: number; rainfall: number; wind: number; humidity: number; condition: string };
  floodBoundary: { lat: number; lng: number }[];
}

// ---- Shelter management shapes ----

export interface Shelter {
  id: string;
  name: string;
  lat: number;
  lng: number;
  capacity: number;
  occupancy: number;
  facilities: string[];
  distanceKm: number;
  travelMin: number;
  contact: string;
  phone: string;
  status: 'open' | 'full' | 'limited';
}

export interface ShelterSnapshot {
  shelters: Shelter[];
  totalCapacity: number;
  totalOccupancy: number;
  lastUpdated: string;
}

// ---- Deterministic helpers ----

function seeded(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function rnd(seedKey: string, min: number, max: number): number {
  return min + seeded(seedKey) * (max - min);
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ---- POI name pools (generic, location-appropriate) ----

const HOSPITAL_NAMES = [
  'District Civil Hospital', 'Government Medical College', 'AIIMS Campus',
  'Civil Hospital Emergency', 'Primary Health Centre', 'Community Health Centre',
  'Army Medical Facility', 'Railway Hospital', 'Mission Hospital',
];

const POLICE_NAMES = [
  'City Police Headquarters', 'District Police Station', 'Traffic Police Outpost',
  'Riverside Police Post', 'Central Police Station',
];

const FIRE_NAMES = [
  'Fire & Rescue Station — North', 'Fire & Rescue Station — South',
  'Emergency Fire Post', 'Central Fire Station',
];

const SHELTER_NAMES = [
  'Relief Camp — Sector 1', 'Community Shelter — Block A', 'Relief Camp — Sector 2',
  'Community Shelter — Block B', 'Relief Camp — Sector 3', 'High Ground Assembly Point',
  'Relief Camp — Sector 4', 'Community Shelter — Block C', 'Relief Camp — Sector 5',
  'Community Shelter — Block D', 'Relief Camp — Sector 6', 'High Ground — North Ridge',
];

const FACILITIES: Record<PoiKind, string[]> = {
  hospital: ['Emergency care', 'Trauma unit', 'ICU', 'Ambulance bay'],
  shelter: ['Drinking water', 'Medical kit', 'Sanitation', 'Power backup', 'Food supply'],
  police: ['Communications', 'Vehicle fleet', 'Response team'],
  fire: ['Fire engines', 'Rescue equipment', 'Hazmat response'],
  'relief-camp': ['Drinking water', 'Medical kit', 'Sanitation', 'Power backup', 'Food supply'],
  'community-shelter': ['Drinking water', 'Sanitation', 'Power backup', 'Food supply'],
  'high-ground': ['Assembly point', 'Marker beacons', 'Tent space'],
};

function buildPoisForLocation(incident: ActiveIncident): EmergencyPoi[] {
  const { lat: clat, lng: clng, name: incName } = incident;
  const items: Array<Partial<EmergencyPoi> & { name: string; kind: PoiKind; lat: number; lng: number }> = [];

  HOSPITAL_NAMES.forEach((h, i) => {
    const ang = (i / HOSPITAL_NAMES.length) * Math.PI * 2 + seeded(`hos-ang-${incName}-${i}`) * 0.5;
    const dist = 1.5 + seeded(`hos-dist-${incName}-${i}`) * 4;
    items.push({
      name: h, kind: 'hospital',
      lat: clat + Math.cos(ang) * dist * 0.01,
      lng: clng + Math.sin(ang) * dist * 0.012,
      capacity: Math.round(200 + seeded(`hos-cap-${incName}-${i}`) * 800),
      phone: '+91 000 0000 100',
    });
  });

  POLICE_NAMES.forEach((p, i) => {
    const ang = (i / POLICE_NAMES.length) * Math.PI * 2 + seeded(`pol-ang-${incName}-${i}`) * 0.5;
    const dist = 1 + seeded(`pol-dist-${incName}-${i}`) * 3;
    items.push({
      name: p, kind: 'police',
      lat: clat + Math.cos(ang) * dist * 0.01,
      lng: clng + Math.sin(ang) * dist * 0.012,
      phone: '100',
    });
  });

  FIRE_NAMES.forEach((f, i) => {
    const ang = (i / FIRE_NAMES.length) * Math.PI * 2 + seeded(`fir-ang-${incName}-${i}`) * 0.5;
    const dist = 1.5 + seeded(`fir-dist-${incName}-${i}`) * 3;
    items.push({
      name: f, kind: 'fire',
      lat: clat + Math.cos(ang) * dist * 0.01,
      lng: clng + Math.sin(ang) * dist * 0.012,
      phone: '101',
    });
  });

  SHELTER_NAMES.forEach((s, i) => {
    const ang = (i / SHELTER_NAMES.length) * Math.PI * 2 + seeded(`shl-ang-${incName}-${i}`) * 0.8;
    const dist = 3 + seeded(`shl-dist-${incName}-${i}`) * 6;
    const kind: PoiKind = s.includes('High Ground') ? 'high-ground' : s.includes('Community') ? 'community-shelter' : 'relief-camp';
    items.push({
      name: s, kind,
      lat: clat + Math.cos(ang) * dist * 0.01,
      lng: clng + Math.sin(ang) * dist * 0.012,
      capacity: kind === 'high-ground' ? Math.round(3000 + seeded(`shl-cap-${incName}-${i}`) * 3000) : Math.round(500 + seeded(`shl-cap-${incName}-${i}`) * 1500),
      phone: '+91 000 0000 200',
    });
  });

  const origin = { lat: clat, lng: clng, name: incName };
  return items.map((p, i) => {
    const id = `poi-${i}`;
    const distKm = Number(Math.hypot(p.lat - origin.lat, p.lng - origin.lng) * 111.32).toFixed(1);
    const travelMin = Math.round(Number(distKm) / 28 * 60 + rnd(`${id}-t`, 2, 9));
    const capacity = p.capacity ?? 0;
    let occupancy: number | undefined;
    let status: EmergencyPoi['status'] = 'open';
    if (p.kind === 'shelter' || p.kind === 'relief-camp' || p.kind === 'community-shelter' || p.kind === 'high-ground') {
      occupancy = Math.round(capacity * (0.35 + seeded(`${id}-o`) * 0.5));
      status = occupancy / capacity > 0.9 ? 'full' : occupancy / capacity > 0.7 ? 'limited' : 'open';
    } else if (p.kind === 'police' || p.kind === 'fire') {
      status = 'standby';
    }
    return {
      id,
      name: p.name,
      kind: p.kind,
      lat: p.lat,
      lng: p.lng,
      capacity,
      occupancy,
      phone: p.phone,
      facilities: FACILITIES[p.kind],
      distanceKm: Number(distKm),
      travelMin,
      status,
    } as EmergencyPoi;
  });
}

function buildFloodBoundary(incident: ActiveIncident): { lat: number; lng: number }[] {
  const { lat: clat, lng: clng, floodProbability } = incident;
  const radius = 0.02 + floodProbability * 0.0003;
  const points: { lat: number; lng: number }[] = [];
  const sides = 24;
  for (let i = 0; i <= sides; i++) {
    const ang = (i / sides) * Math.PI * 2;
    const wobble = 1 + (seeded(`fb-${incident.id}-${i}`) - 0.5) * 0.2;
    points.push({
      lat: clat + Math.cos(ang) * radius * wobble,
      lng: clng + Math.sin(ang) * radius * 1.15 * wobble,
    });
  }
  return points;
}

// ---- OSRM real road routing ----

interface OsrmRoute {
  geometry: { coordinates: [number, number][] };
  distance: number;
  duration: number;
}

async function fetchOsrmRoutes(start: [number, number], end: [number, number]): Promise<OsrmRoute[]> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&alternatives=true`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.routes?.length) return [];
    return data.routes as OsrmRoute[];
  } catch {
    return [];
  }
}

function trafficFromDuration(duration: number, distance: number): TrafficLevel {
  const speed = distance / (duration / 3600);
  if (speed > 45) return 'low';
  if (speed > 25) return 'moderate';
  if (speed > 12) return 'heavy';
  return 'standstill';
}

function floodRiskFromIncident(incident: ActiveIncident, offset: number): FloodRisk {
  const p = incident.floodProbability - offset;
  if (p >= 60) return 'extreme';
  if (p >= 40) return 'high';
  if (p >= 25) return 'moderate';
  if (p >= 10) return 'low';
  return 'very-low';
}

const ROAD_NAMES = [
  'NH-37 Northern Corridor', 'State Highway 37B — Elevated Corridor',
  'Riverside Expressway — Southern Bypass', 'NH-31 Eastern Flood Bypass',
  'District Road 14 — Inland Detour', 'NH-2 Western Evacuation Highway',
  'State Highway 22 — Northern Bypass', 'NH-44 Highland Corridor',
  'State Highway 15 — West Bank Link', 'NH-6 Eastern Relief Corridor',
];

const ROAD_TYPES = ['National Highway', 'State Highway', 'District Road', 'Expressway', 'Elevated Corridor'];

const AI_REASON_POOL = [
  'Elevated road surface above projected flood level',
  'Lowest flood exposure among available routes',
  'Low congestion with free-flowing traffic',
  'Direct access to operational shelter with available capacity',
  'Suitable for emergency vehicle access',
  'Bypasses known waterlogging hotspots',
  'Bridge structurally verified as safe',
  'Shortest travel time to destination shelter',
  'Road surface condition rated good',
  'Minimal intersection delays',
];

function buildRouteSegments(
  routeName: string,
  path: { lat: number; lng: number }[],
  incident: ActiveIncident,
  baseSeed: string,
): RouteSegment[] {
  if (path.length < 4) return [];
  const segments: RouteSegment[] = [];
  const totalDist = path.reduce((acc, p, i) => i === 0 ? 0 : acc + Math.hypot(p.lat - path[i-1].lat, p.lng - path[i-1].lng) * 111, 0);
  const numSegments = Math.min(4, Math.max(2, Math.floor(path.length / 8)));
  const labels = ['Flood Zone Entry', `${routeName.split(' — ')[0]} Junction`, 'Bypass Intersection', 'Shelter Approach'];

  for (let s = 0; s < numSegments; s++) {
    const segDist = (totalDist / numSegments) * (0.85 + seeded(`${baseSeed}-seg-${s}`) * 0.3);
    const eta = segDist / 28 * 60 + rnd(`${baseSeg}-eta-${s}`, 1, 5);
    const condSeed = seeded(`${baseSeed}-cond-${s}`);
    const cond: RouteSegment['roadCondition'] = condSeed > 0.75 ? 'flooded' : condSeed > 0.5 ? 'poor' : condSeed > 0.25 ? 'fair' : 'good';
    const traffic: TrafficLevel = ['low', 'moderate', 'heavy', 'low'][s % 4] as TrafficLevel;
    const risk = floodRiskFromIncident(incident, s * 8);
    segments.push({
      id: `seg-${s}`,
      name: `${labels[s] ?? `Segment ${s+1}`} → ${labels[s+1] ?? 'Relief Camp'}`,
      fromLabel: labels[s] ?? `Point ${s+1}`,
      toLabel: labels[s+1] ?? 'Relief Camp',
      distanceKm: Number(segDist.toFixed(1)),
      etaMin: Math.round(eta),
      roadCondition: cond,
      traffic,
      floodStatus: risk,
      elevation: Number((20 + seeded(`${baseSeed}-elev-${s}`) * 40).toFixed(1)),
      safetyScore: Math.round(70 + seeded(`${baseSeed}-safe-${s}`) * 28),
    });
  }
  return segments;
}

let baseSeg: string;

async function buildRoutesForIncident(incident: ActiveIncident, pois: EmergencyPoi[]): Promise<EvacRoute[]> {
  const shelters = pois.filter((p) => p.kind === 'relief-camp' || p.kind === 'community-shelter' || p.kind === 'high-ground');
  const destinations = shelters.slice(0, 6);
  const start: [number, number] = [incident.lat, incident.lng];
  const routes: EvacRoute[] = [];

  for (let i = 0; i < destinations.length; i++) {
    const dest = destinations[i];
    const end: [number, number] = [dest.lat, dest.lng];
    const roadName = ROAD_NAMES[i % ROAD_NAMES.length];
    const seedKey = `${incident.id}-${i}`;
    baseSeg = seedKey;

    let path: { lat: number; lng: number }[] = [];
    let distance = dest.distanceKm ?? 5;
    let duration = (dest.travelMin ?? 20) * 60;

    const osrmRoutes = await fetchOsrmRoutes(start, end);
    if (osrmRoutes.length > 0) {
      path = osrmRoutes[0].geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
      distance = osrmRoutes[0].distance / 1000;
      duration = osrmRoutes[0].duration;
    } else {
      // Fallback: generate a wobbled multi-point path
      const steps = 12;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const wobble = (seeded(`${seedKey}-w-${s}`) - 0.5) * 0.01;
        path.push({
          lat: start[0] + (end[0] - start[0]) * t + wobble,
          lng: start[1] + (end[1] - start[1]) * t + wobble * 1.2,
        });
      }
      distance = Math.hypot(end[0] - start[0], end[1] - start[1]) * 111;
      duration = distance / 28 * 3600;
    }

    // Use additional OSRM routes as alternatives (already fetched)
    const alternatives: { lat: number; lng: number }[][] = [];
    for (let a = 1; a < Math.min(osrmRoutes.length, 3); a++) {
      alternatives.push(osrmRoutes[a].geometry.coordinates.map(([lng, lat]) => ({ lat, lng })));
    }

    const traffic = trafficFromDuration(duration, distance);
    const floodRisk = floodRiskFromIncident(incident, i * 10);
    const capacityUsage = Math.round(40 + seeded(`${seedKey}-cap`) * 50);
    const safetyScore = Math.round(72 + seeded(`${seedKey}-safe`) * 26);
    const aiConfidence = Math.round(80 + seeded(`${seedKey}-conf`) * 18);
    const numReasons = 3 + Math.floor(seeded(`${seedKey}-nr`) * 3);
    const reasonIdxs: number[] = [];
    for (let r = 0; r < numReasons; r++) {
      let idx = Math.floor(seeded(`${seedKey}-reason-${r}`) * AI_REASON_POOL.length);
      if (reasonIdxs.includes(idx)) idx = (idx + 1) % AI_REASON_POOL.length;
      reasonIdxs.push(idx);
    }
    const aiReasons = reasonIdxs.map((idx) => AI_REASON_POOL[idx]);

    const status: RouteStatus =
      floodRisk === 'extreme' || floodRisk === 'high' ? 'closed' :
      traffic === 'standstill' || traffic === 'heavy' ? 'congested' :
      capacityUsage > 85 ? 'restricted' : 'open';

    routes.push({
      id: `route-${i}`,
      routeId: `P${i + 1}`,
      roadName,
      originName: incident.name,
      destinationName: dest.name,
      path,
      alternatives,
      status,
      distanceKm: Number(distance.toFixed(1)),
      etaMin: Math.round(duration / 60),
      traffic,
      capacityUsage,
      floodRisk,
      safetyScore,
      aiRecommended: i === 0,
      aiConfidence,
      aiReasons,
      roadType: ROAD_TYPES[i % ROAD_TYPES.length],
      elevation: Number((25 + seeded(`${seedKey}-elev`) * 35).toFixed(1)),
      avgSpeed: Math.round((distance / (duration / 3600))),
      predictedCongestion: seeded(`${seedKey}-pc`) > 0.5 ? 'moderate' : 'low',
      detourKm: Number((distance * 0.15).toFixed(1)),
      lastUpdated: new Date().toISOString(),
      segments: buildRouteSegments(roadName, path, incident, seedKey),
    });
  }

  // Sort by safety score, mark the best as AI recommended
  routes.sort((a, b) => b.safetyScore - a.safetyScore);
  if (routes.length > 0) routes[0].aiRecommended = true;
  return routes;
}

export async function getEvacuationSnapshot(incident: ActiveIncident): Promise<EvacuationSnapshot> {
  await delay(300);
  const pois = buildPoisForLocation(incident);
  const floodBoundary = buildFloodBoundary(incident);
  const routes = await buildRoutesForIncident(incident, pois);
  const highGround = pois.filter((p) => p.kind === 'high-ground');
  const populationAtRisk = Math.round(10000 + incident.floodProbability * 2000);
  const waterLevel = Number((0.5 + incident.floodProbability * 0.03).toFixed(1));
  const weather = {
    temp: Math.round(24 + seeded(`wx-t-${incident.id}`) * 8),
    rainfall: Number((incident.floodProbability * 0.4).toFixed(1)),
    wind: Math.round(12 + seeded(`wx-w-${incident.id}`) * 25),
    humidity: Math.round(60 + seeded(`wx-h-${incident.id}`) * 35),
    condition: incident.floodProbability > 40 ? 'Heavy rain' : incident.floodProbability > 20 ? 'Light rain' : 'Cloudy',
  };

  return {
    lastUpdated: new Date().toISOString(),
    incident,
    origin: { lat: incident.lat, lng: incident.lng, name: incident.name },
    pois,
    roads: [],
    routes,
    highGround,
    populationAtRisk,
    waterLevel,
    weather,
    floodBoundary,
  };
}

export async function getShelters(): Promise<ShelterSnapshot> {
  await delay(550);
  const pois = buildPoisForLocation({
    id: 'default', name: 'Patna Riverside', lat: 25.61, lng: 85.17,
    floodProbability: 35, riskTier: 'moderate', state: 'Bihar', river: 'Ganga',
  }).filter(
    (p) => p.kind === 'shelter' || p.kind === 'relief-camp' || p.kind === 'community-shelter' || p.kind === 'high-ground',
  );
  const shelters: Shelter[] = pois.map((p) => ({
    id: p.id,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    capacity: p.capacity ?? 0,
    occupancy: p.occupancy ?? 0,
    facilities: p.facilities ?? [],
    distanceKm: p.distanceKm ?? 0,
    travelMin: p.travelMin ?? 0,
    contact: p.name,
    phone: p.phone ?? '+91 000 0000 000',
    status: (p.status === 'standby' ? 'open' : p.status) as Shelter['status'],
  }));
  return {
    shelters,
    totalCapacity: shelters.reduce((a, s) => a + s.capacity, 0),
    totalOccupancy: shelters.reduce((a, s) => a + s.occupancy, 0),
    lastUpdated: new Date().toISOString(),
  };
}

// ---- Hospital route for "Find Nearest Hospital" quick action ----

export interface HospitalRoute {
  hospital: EmergencyPoi;
  route: { lat: number; lng: number }[];
  distanceKm: number;
  etaMin: number;
  traffic: TrafficLevel;
  roadStatus: string;
}

export async function findNearestHospitalRoute(
  incident: ActiveIncident,
  pois: EmergencyPoi[],
): Promise<HospitalRoute | null> {
  const hospitals = pois.filter((p) => p.kind === 'hospital' && p.status !== 'full');
  if (hospitals.length === 0) return null;
  const start: [number, number] = [incident.lat, incident.lng];

  let best: HospitalRoute | null = null;
  let bestDist = Infinity;

  for (const h of hospitals) {
    const end: [number, number] = [h.lat, h.lng];
    const osrmRoutes = await fetchOsrmRoutes(start, end);
    let path: { lat: number; lng: number }[] = [];
    let distance = h.distanceKm ?? 5;
    let duration = (h.travelMin ?? 20) * 60;

    if (osrmRoutes.length > 0) {
      path = osrmRoutes[0].geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
      distance = osrmRoutes[0].distance / 1000;
      duration = osrmRoutes[0].duration;
    } else {
      const steps = 10;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const wobble = (seeded(`hosp-${h.id}-${s}`) - 0.5) * 0.008;
        path.push({
          lat: start[0] + (end[0] - start[0]) * t + wobble,
          lng: start[1] + (end[1] - start[1]) * t + wobble * 1.2,
        });
      }
    }

    if (distance < bestDist) {
      bestDist = distance;
      best = {
        hospital: h,
        route: path,
        distanceKm: Number(distance.toFixed(1)),
        etaMin: Math.round(duration / 60),
        traffic: trafficFromDuration(duration, distance),
        roadStatus: 'Open',
      };
    }
  }

  return best;
}
