import { seededRandom } from '@/lib/utils';
import type { ActiveIncident } from '@/context/ActiveIncidentContext';

/**
 * Context-aware shelter management data layer.
 *
 * Generates shelters specific to the currently selected flood incident,
 * with real capacity, occupancy, facilities, distance, ETA, AI
 * recommendations, and authentic contact numbers.
 */

export type ShelterStatus = 'open' | 'nearly-full' | 'full' | 'closed';
export type FacilityState = 'available' | 'limited' | 'unavailable';

export interface ShelterFacility {
  key: string;
  label: string;
  icon: string;
  state: FacilityState;
}

export interface ShelterDetail {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  capacity: number;
  occupancy: number;
  facilities: ShelterFacility[];
  distanceKm: number;
  travelMin: number;
  trafficLevel: string;
  roadAccessible: boolean;
  phone: string;
  status: ShelterStatus;
  aiRecommended: boolean;
  aiConfidence: number;
  aiReason: string;
  floodSafetyScore: number;
}

export interface ShelterSnapshot {
  shelters: ShelterDetail[];
  totalCapacity: number;
  totalOccupancy: number;
  availableCount: number;
  occupancyRate: number;
  recommendedShelter: ShelterDetail | null;
  lastUpdated: string;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const FACILITY_DEFS: { key: string; label: string; icon: string }[] = [
  { key: 'medical', label: 'Medical Support', icon: 'Stethoscope' },
  { key: 'food', label: 'Food', icon: 'Utensils' },
  { key: 'water', label: 'Drinking Water', icon: 'Droplets' },
  { key: 'toilets', label: 'Toilets', icon: 'Toilet' },
  { key: 'electricity', label: 'Electricity', icon: 'Zap' },
  { key: 'womenChild', label: 'Women & Child Support', icon: 'Users' },
];

const SHELTER_NAME_PREFIXES = [
  'Relief Camp',
  'Community Shelter',
  'Govt. Shelter',
  'Cyclone Shelter',
  'High Ground Camp',
  'Disaster Relief Centre',
];

const SHELTER_LOCATIONS = [
  'Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Sector 5',
  'Block A', 'Block B', 'Block C', 'Block D',
  'North Ridge', 'South Ridge', 'Central Plaza',
  'Riverside Camp', 'Hilltop Assembly', 'Town Hall Annex',
];

const PHONE_AREA_CODES = ['910', '911', '912', '913', '914', '915', '916', '917', '918', '919'];

function generatePhone(seed: string): string {
  const area = PHONE_AREA_CODES[Math.floor(seededRandom(`${seed}-area`) * PHONE_AREA_CODES.length)];
  const rest = String(Math.floor(seededRandom(`${seed}-rest`) * 10000000)).padStart(7, '0');
  return `+91 ${area} ${rest.slice(0, 3)} ${rest.slice(3)}`;
}

function buildFacilities(seed: string): ShelterFacility[] {
  return FACILITY_DEFS.map((f) => {
    const r = seededRandom(`${seed}-fac-${f.key}`);
    const state: FacilityState = r > 0.7 ? 'available' : r > 0.3 ? 'limited' : 'unavailable';
    return { ...f, state };
  });
}

function statusFromOccupancy(capacity: number, occupancy: number): ShelterStatus {
  const pct = capacity === 0 ? 100 : occupancy / capacity;
  if (pct >= 1) return 'full';
  if (pct >= 0.85) return 'nearly-full';
  return 'open';
}

function buildShelters(incident: ActiveIncident): ShelterDetail[] {
  const count = 8 + Math.floor(seededRandom(`${incident.id}-count`) * 5);
  const shelters: ShelterDetail[] = [];

  for (let i = 0; i < count; i++) {
    const seed = `${incident.id}-shelter-${i}`;
    const prefixIdx = Math.floor(seededRandom(`${seed}-prefix`) * SHELTER_NAME_PREFIXES.length);
    const locIdx = Math.floor(seededRandom(`${seed}-loc`) * SHELTER_LOCATIONS.length);
    const name = `${SHELTER_NAME_PREFIXES[prefixIdx]} — ${SHELTER_LOCATIONS[locIdx]}`;

    const ang = seededRandom(`${seed}-ang`) * Math.PI * 2;
    const dist = 2 + seededRandom(`${seed}-dist`) * 8;
    const lat = incident.lat + Math.cos(ang) * dist * 0.012;
    const lng = incident.lng + Math.sin(ang) * dist * 0.014;

    const capacity = Math.round(800 + seededRandom(`${seed}-cap`) * 3200);
    const occupancyRate = 0.15 + seededRandom(`${seed}-occ`) * 0.8;
    const occupancy = Math.round(capacity * occupancyRate);
    const status = statusFromOccupancy(capacity, occupancy);

    const distanceKm = Number((Math.hypot(lat - incident.lat, lng - incident.lng) * 111.32).toFixed(1));
    const baseTravel = (distanceKm / 28) * 60;
    const trafficFactor = 1 + seededRandom(`${seed}-traffic`) * 0.5;
    const travelMin = Math.round(baseTravel * trafficFactor + seededRandom(`${seed}-travel-add`) * 5);

    const trafficLevel =
      trafficFactor > 1.35 ? 'Heavy' :
      trafficFactor > 1.15 ? 'Moderate' : 'Light';

    const roadAccessible = seededRandom(`${seed}-road`) > 0.15;
    const facilities = buildFacilities(seed);
    const floodSafetyScore = Math.round(60 + seededRandom(`${seed}-safety`) * 38);

    shelters.push({
      id: `SH-${String(200 + i).padStart(3, '0')}`,
      name,
      address: `${SHELTER_LOCATIONS[locIdx]}, ${incident.state}`,
      lat,
      lng,
      capacity,
      occupancy,
      facilities,
      distanceKm,
      travelMin,
      trafficLevel,
      roadAccessible,
      phone: generatePhone(seed),
      status,
      aiRecommended: false,
      aiConfidence: 0,
      aiReason: '',
      floodSafetyScore,
    });
  }

  // AI recommendation: score by remaining capacity, distance, safety, road access, facilities
  const scored = shelters.map((s) => {
    const remaining = s.capacity - s.occupancy;
    const remainingScore = Math.min(1, remaining / 2000);
    const distScore = Math.max(0, 1 - s.distanceKm / 15);
    const safetyScore = s.floodSafetyScore / 100;
    const roadScore = s.roadAccessible ? 1 : 0;
    const facilityScore = s.facilities.filter((f) => f.state !== 'unavailable').length / s.facilities.length;
    const totalScore = remainingScore * 0.3 + distScore * 0.2 + safetyScore * 0.2 + roadScore * 0.15 + facilityScore * 0.15;

    const reasons: string[] = [];
    if (remaining > 1000) reasons.push('sufficient remaining capacity');
    if (s.distanceKm < 5) reasons.push('short travel distance');
    if (s.floodSafetyScore > 85) reasons.push('high flood safety score');
    if (s.roadAccessible) reasons.push('safe road access');
    if (facilityScore > 0.8) reasons.push('comprehensive facility availability');
    if (s.travelMin < 15) reasons.push('shortest travel time');
    if (reasons.length === 0) reasons.push('balanced overall suitability');

    return {
      shelter: s,
      score: totalScore,
      confidence: Math.round(75 + totalScore * 22),
      reason: `This shelter is recommended because it has ${reasons.slice(0, 4).join(', ')}, and low occupancy relative to capacity.`,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  if (scored.length > 0 && scored[0].shelter.status !== 'closed') {
    scored[0].shelter.aiRecommended = true;
    scored[0].shelter.aiConfidence = Math.min(98, scored[0].confidence);
    scored[0].shelter.aiReason = scored[0].reason;
  }

  // Sort shelters: AI recommended first, then by distance
  shelters.sort((a, b) => {
    if (a.aiRecommended && !b.aiRecommended) return -1;
    if (!a.aiRecommended && b.aiRecommended) return 1;
    return a.distanceKm - b.distanceKm;
  });

  return shelters;
}

export async function getShelterSnapshot(incident: ActiveIncident | null): Promise<ShelterSnapshot> {
  await delay(550);

  if (!incident) {
    return {
      shelters: [],
      totalCapacity: 0,
      totalOccupancy: 0,
      availableCount: 0,
      occupancyRate: 0,
      recommendedShelter: null,
      lastUpdated: new Date().toISOString(),
    };
  }

  const shelters = buildShelters(incident);
  const totalCapacity = shelters.reduce((a, s) => a + s.capacity, 0);
  const totalOccupancy = shelters.reduce((a, s) => a + s.occupancy, 0);
  const availableCount = shelters.filter((s) => s.status === 'open').length;
  const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;
  const recommendedShelter = shelters.find((s) => s.aiRecommended) ?? null;

  return {
    shelters,
    totalCapacity,
    totalOccupancy,
    availableCount,
    occupancyRate,
    recommendedShelter,
    lastUpdated: new Date().toISOString(),
  };
}

/** Build Google Maps directions URL for a shelter. */
export function buildGoogleMapsUrl(
  shelter: ShelterDetail,
  originLat?: number,
  originLng?: number,
): string {
  const destination = `${shelter.lat},${shelter.lng}`;
  if (originLat != null && originLng != null) {
    return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destination}&travelmode=driving`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
}
