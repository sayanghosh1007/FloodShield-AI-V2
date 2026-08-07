import type { Severity } from '@/types';

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export type NotificationCategory =
  | 'flood-alert'
  | 'flood-live'
  | 'weather-alert'
  | 'rainfall-alert'
  | 'river-overflow'
  | 'emergency-response'
  | 'shelter-status'
  | 'sensor-network'
  | 'infrastructure'
  | 'system';

export type NotificationStatus = 'new' | 'read';

/** Source badge indicating where the notification originated. */
export type NotificationSource = 'ai' | 'official' | 'verified';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface AppNotification {
  id: string;
  title: string;
  category: NotificationCategory;
  severity: Severity;
  source: NotificationSource;
  priority: NotificationPriority;
  timestamp: string;
  status: NotificationStatus;
  state: string;
  district: string;
  description: string;
  /** Dashboard route to navigate to when clicked. */
  route: string;
  /** Optional incident id to set as active when navigated. */
  incidentId?: string;
  incidentName?: string;
  /** Incident coordinates for map zoom. */
  lat?: number;
  lng?: number;
  /** Flood probability 0–100 for risk tier coloring. */
  floodProbability?: number;
  /** Risk tier label: extreme | high | moderate | low | safe. */
  riskTier?: string;
  /** River name if applicable. */
  river?: string;
  /** Map zoom level for the target dashboard. */
  zoom?: number;
}

export interface NotificationSnapshot {
  notifications: AppNotification[];
  unreadCount: number;
  criticalCount: number;
  readCount: number;
  lastUpdated: string;
}

function nowMinusMin(min: number): string {
  return new Date(Date.now() - min * 60_000).toISOString();
}

const SEEDS: Omit<AppNotification, 'status'>[] = [
  {
    id: 'N-001',
    title: 'Flood Warning — Patna Riverside',
    category: 'flood-alert',
    severity: 'critical',
    source: 'verified',
    priority: 'urgent',
    timestamp: nowMinusMin(2),
    state: 'Bihar',
    district: 'Patna',
    description: 'AI models predict river breach within 6 hours. Official IMD flood warning confirmed. Evacuation recommended for low-lying areas.',
    route: '/flood-prediction',
    incidentId: 'patna-riverside',
    incidentName: 'Patna Riverside',
    lat: 25.5941,
    lng: 85.1376,
    floodProbability: 78,
    riskTier: 'extreme',
    river: 'Ganga',
    zoom: 9,
  },
  {
    id: 'N-002',
    title: 'Heavy Rainfall Alert — Kosi Basin',
    category: 'weather-alert',
    severity: 'warning',
    source: 'official',
    priority: 'high',
    timestamp: nowMinusMin(8),
    state: 'Bihar',
    district: 'Khagaria',
    description: 'IMD issues heavy rainfall warning for Kosi Basin. Expected 80-120mm in next 24 hours. River levels rising rapidly.',
    route: '/weather',
    incidentId: 'kosi-basin',
    incidentName: 'Kosi Basin',
    lat: 25.5108,
    lng: 86.9825,
    floodProbability: 62,
    riskTier: 'high',
    river: 'Kosi',
    zoom: 8,
  },
  {
    id: 'N-003',
    title: 'River Overflow — Ganga at Varanasi',
    category: 'river-overflow',
    severity: 'critical',
    source: 'ai',
    priority: 'urgent',
    timestamp: nowMinusMin(15),
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    description: 'AI hydrological model detects Ganga above danger mark at Varanasi ghats. Immediate monitoring required.',
    route: '/flood-prediction',
    incidentId: 'varanasi-ghats',
    incidentName: 'Varanasi Ghats',
    lat: 25.3176,
    lng: 82.9739,
    floodProbability: 74,
    riskTier: 'extreme',
    river: 'Ganga',
    zoom: 9,
  },
  {
    id: 'N-004',
    title: 'Emergency Response Activated — Darbhanga',
    category: 'emergency-response',
    severity: 'warning',
    source: 'official',
    priority: 'high',
    timestamp: nowMinusMin(22),
    state: 'Bihar',
    district: 'Darbhanga',
    description: 'NDRF teams deployed to Darbhanga. 12 evacuation routes activated. Estimated 45,000 residents in flood path.',
    route: '/evacuation',
    incidentId: 'darbhanga-town',
    incidentName: 'Darbhanga Town',
    lat: 26.1542,
    lng: 85.8918,
    floodProbability: 70,
    riskTier: 'high',
    river: 'Bagmati',
    zoom: 9,
  },
  {
    id: 'N-005',
    title: 'Shelter Nearly Full — Camp Beta, Muzaffarpur',
    category: 'shelter-status',
    severity: 'watch',
    source: 'ai',
    priority: 'medium',
    timestamp: nowMinusMin(35),
    state: 'Bihar',
    district: 'Muzaffarpur',
    description: 'Camp Beta at 92% capacity. 340 of 370 beds occupied. Recommend opening Camp Gamma for overflow.',
    route: '/shelters',
    incidentId: 'muzaffarpur-city',
    incidentName: 'Muzaffarpur City',
    lat: 26.1209,
    lng: 85.3647,
    floodProbability: 55,
    riskTier: 'high',
    river: 'Budhi Gandak',
    zoom: 8,
  },
  {
    id: 'N-006',
    title: 'AI Model Updated — FS-AI Hydro v3.2 deployed',
    category: 'system',
    severity: 'info',
    source: 'ai',
    priority: 'low',
    timestamp: nowMinusMin(50),
    state: '—',
    district: '—',
    description: 'New hydrological prediction model deployed. Improved accuracy by 12% for river basins in Bihar and Assam.',
    route: '/flood-prediction',
    lat: 22.5,
    lng: 80,
    zoom: 5,
  },
  {
    id: 'N-007',
    title: 'Flood Watch — Yamuna at Delhi',
    category: 'flood-alert',
    severity: 'watch',
    source: 'verified',
    priority: 'medium',
    timestamp: nowMinusMin(65),
    state: 'Delhi',
    district: 'Central Delhi',
    description: 'Yamuna river level approaching warning threshold. AI and CWC monitoring. No evacuation needed yet.',
    route: '/flood-prediction',
    incidentId: 'delhi-yamuna',
    incidentName: 'Delhi Yamuna',
    lat: 28.6139,
    lng: 77.209,
    floodProbability: 35,
    riskTier: 'moderate',
    river: 'Yamuna',
    zoom: 8,
  },
  {
    id: 'N-008',
    title: 'Shelter Status Update — Camp Alpha now open',
    category: 'shelter-status',
    severity: 'advisory',
    source: 'official',
    priority: 'low',
    timestamp: nowMinusMin(80),
    state: 'Bihar',
    district: 'Patna',
    description: 'Camp Alpha in Patna now operational. 200 beds available. Medical team onsite. Accepting evacuees.',
    route: '/shelters',
    incidentId: 'patna-riverside',
    incidentName: 'Patna Riverside',
    lat: 25.5941,
    lng: 85.1376,
    floodProbability: 78,
    riskTier: 'extreme',
    river: 'Ganga',
    zoom: 9,
  },
  {
    id: 'N-009',
    title: 'Sensor Offline — SNS-00042, Guwahati',
    category: 'sensor-network',
    severity: 'warning',
    source: 'ai',
    priority: 'high',
    timestamp: nowMinusMin(95),
    state: 'Assam',
    district: 'Guwahati',
    description: 'River level sensor SNS-00042 stopped transmitting 95 minutes ago. Field team dispatched for inspection.',
    route: '/sensors',
    lat: 26.1445,
    lng: 91.7362,
    floodProbability: 40,
    riskTier: 'moderate',
    river: 'Brahmaputra',
    zoom: 8,
  },
  {
    id: 'N-010',
    title: 'Live Flood Detected — Brahmaputra at Dibrugarh',
    category: 'flood-live',
    severity: 'critical',
    source: 'verified',
    priority: 'urgent',
    timestamp: nowMinusMin(110),
    state: 'Assam',
    district: 'Dibrugarh',
    description: 'Satellite imagery confirms active flooding along Brahmaputra near Dibrugarh. Affecting 3 villages, ~12,000 people.',
    route: '/',
    incidentId: 'dibrugarh-brahmaputra',
    incidentName: 'Dibrugarh Brahmaputra',
    lat: 27.4728,
    lng: 94.912,
    floodProbability: 82,
    riskTier: 'extreme',
    river: 'Brahmaputra',
    zoom: 9,
  },
  {
    id: 'N-011',
    title: 'Power Grid Failure — Bhagalpur Substation',
    category: 'infrastructure',
    severity: 'warning',
    source: 'official',
    priority: 'high',
    timestamp: nowMinusMin(125),
    state: 'Bihar',
    district: 'Bhagalpur',
    description: '33kV substation at Bhagalpur offline due to flooding. Backup generators running at shelter sites.',
    route: '/alerts',
    lat: 25.2425,
    lng: 86.9842,
    floodProbability: 50,
    riskTier: 'high',
    river: 'Ganga',
    zoom: 8,
  },
  {
    id: 'N-012',
    title: 'Rainfall Sensor Anomaly — SNS-00078, Silchar',
    category: 'sensor-network',
    severity: 'advisory',
    source: 'ai',
    priority: 'medium',
    timestamp: nowMinusMin(140),
    state: 'Assam',
    district: 'Silchar',
    description: 'Rainfall sensor reporting values 40% above expected range. Possible calibration drift. Maintenance scheduled.',
    route: '/sensors',
    lat: 24.8333,
    lng: 92.7789,
    floodProbability: 30,
    riskTier: 'low',
    river: 'Barak',
    zoom: 8,
  },
  {
    id: 'N-013',
    title: 'Dam Threshold Exceeded — Hathni Kund Barrage',
    category: 'flood-alert',
    severity: 'warning',
    source: 'verified',
    priority: 'high',
    timestamp: nowMinusMin(155),
    state: 'Haryana',
    district: 'Yamunanagar',
    description: 'Hathni Kund barrage discharge at 7.4 lakh cusecs. Downstream districts on alert. Controlled release ongoing.',
    route: '/flood-prediction',
    incidentId: 'hathni-kund',
    incidentName: 'Hathni Kund Barrage',
    lat: 30.3047,
    lng: 77.5411,
    floodProbability: 58,
    riskTier: 'high',
    river: 'Yamuna',
    zoom: 8,
  },
  {
    id: 'N-014',
    title: 'Evacuation Complete — Darbhanga Town',
    category: 'emergency-response',
    severity: 'advisory',
    source: 'official',
    priority: 'low',
    timestamp: nowMinusMin(180),
    state: 'Bihar',
    district: 'Darbhanga',
    description: 'All 45,000 residents successfully evacuated from Darbhanga flood zone. 8 shelters operational. No casualties reported.',
    route: '/evacuation',
    incidentId: 'darbhanga-town',
    incidentName: 'Darbhanga Town',
    lat: 26.1542,
    lng: 85.8918,
    floodProbability: 70,
    riskTier: 'high',
    river: 'Bagmati',
    zoom: 9,
  },
  {
    id: 'N-015',
    title: 'Weather Update — Cyclone Remal weakened',
    category: 'weather-alert',
    severity: 'info',
    source: 'official',
    priority: 'low',
    timestamp: nowMinusMin(210),
    state: 'West Bengal',
    district: 'Kolkata',
    description: 'Cyclone Remal downgraded to deep depression. Wind speeds dropping. Coastal alert lifted for West Bengal.',
    route: '/weather',
    lat: 22.5726,
    lng: 88.3639,
    floodProbability: 20,
    riskTier: 'low',
    river: 'Hooghly',
    zoom: 7,
  },
];

const _readIds = new Set<string>();

export async function getNotifications(): Promise<NotificationSnapshot> {
  await delay(400);
  const notifications = SEEDS.map((s) => ({
    ...s,
    status: (_readIds.has(s.id) ? 'read' : 'new') as NotificationStatus,
  }));
  const unreadCount = notifications.filter((n) => n.status === 'new').length;
  const criticalCount = notifications.filter((n) => n.severity === 'critical' && n.status === 'new').length;
  const readCount = notifications.filter((n) => n.status === 'read').length;
  return {
    notifications,
    unreadCount,
    criticalCount,
    readCount,
    lastUpdated: new Date().toISOString(),
  };
}

export function markNotificationRead(id: string): void {
  _readIds.add(id);
}

export function markAllNotificationsRead(): void {
  SEEDS.forEach((s) => _readIds.add(s.id));
}

export const CATEGORY_META: Record<NotificationCategory, { label: string; dot: string; icon: string }> = {
  'flood-alert': { label: 'Flood Alert', dot: 'bg-danger-500', icon: '🌊' },
  'flood-live': { label: 'Flood Live', dot: 'bg-danger-600', icon: '🌊' },
  'weather-alert': { label: 'Weather Alert', dot: 'bg-brand-500', icon: '🌧' },
  'rainfall-alert': { label: 'Heavy Rainfall', dot: 'bg-brand-500', icon: '🌧' },
  'river-overflow': { label: 'River Overflow', dot: 'bg-accent-500', icon: '🌊' },
  'emergency-response': { label: 'Emergency Response', dot: 'bg-warning-500', icon: '🚨' },
  'shelter-status': { label: 'Shelter Status', dot: 'bg-success-500', icon: '🏕' },
  'sensor-network': { label: 'Sensor Network', dot: 'bg-accent-600', icon: '📡' },
  'infrastructure': { label: 'Infrastructure', dot: 'bg-warning-600', icon: '⚡' },
  'system': { label: 'System', dot: 'bg-ink-400', icon: '⚙' },
};

export const SOURCE_META: Record<NotificationSource, { label: string; icon: string }> = {
  ai: { label: 'AI Prediction', icon: '🤖' },
  official: { label: 'Official Source', icon: '📡' },
  verified: { label: 'AI + Official', icon: '✅' },
};

export const PRIORITY_META: Record<NotificationPriority, { label: string; tone: 'neutral' | 'brand' | 'warning' | 'danger' }> = {
  low: { label: 'Low', tone: 'neutral' },
  medium: { label: 'Medium', tone: 'brand' },
  high: { label: 'High', tone: 'warning' },
  urgent: { label: 'Urgent', tone: 'danger' },
};
