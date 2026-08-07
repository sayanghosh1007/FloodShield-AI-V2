import { seededRandom } from '@/lib/utils';
import type { Severity } from '@/types';

export type SensorType =
  | 'river-level'
  | 'rainfall'
  | 'water-level'
  | 'temperature'
  | 'wind'
  | 'weather-station'
  | 'dam'
  | 'iot-gateway';

export type SensorStatus = 'online' | 'maintenance' | 'warning' | 'offline';
export type NetworkHealth = 'healthy' | 'minor' | 'partial' | 'critical';

export interface SensorReading {
  label: string;
  value: number;
  unit: string;
  icon: string;
  severity: Severity;
}

export interface Sensor {
  id: string;
  name: string;
  type: SensorType;
  district: string;
  state: string;
  lat: number;
  lng: number;
  installedAt: string;
  lastCommunication: string;
  battery: number;
  status: SensorStatus;
  signalStrength: number;
  readings: SensorReading[];
}

export interface SensorAlert {
  id: string;
  sensorId: string;
  sensorName: string;
  type: SensorType;
  title: string;
  severity: Severity;
  confidence: number;
  timestamp: string;
  recommendedAction: string;
  district: string;
  state: string;
}

export interface SensorAnalytics {
  sensorsReportingAbnormal: number;
  risingRiverLevels: number;
  heavyRainfallDetected: number;
  rapidWaterLevelIncrease: number;
  communicationFailures: number;
  areasRequiringInspection: number;
}

export interface SensorSnapshot {
  sensors: Sensor[];
  totalOnline: number;
  riverStations: number;
  weatherStations: number;
  networkHealth: NetworkHealth;
  analytics: SensorAnalytics;
  alerts: SensorAlert[];
  lastUpdated: string;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const SENSOR_TYPE_LABELS: Record<SensorType, string> = {
  'river-level': 'River Level Sensor',
  'rainfall': 'Rainfall Sensor',
  'water-level': 'Water Level Sensor',
  'temperature': 'Temperature Sensor',
  'wind': 'Wind Sensor',
  'weather-station': 'Weather Station',
  'dam': 'Dam Monitoring Sensor',
  'iot-gateway': 'IoT Gateway Station',
};

export const SENSOR_TYPE_LIST: { key: SensorType; label: string; glyph: string; color: string }[] = [
  { key: 'river-level', label: 'River Level', glyph: '🌊', color: '#1d61f2' },
  { key: 'rainfall', label: 'Rainfall', glyph: '🌧', color: '#06b6d4' },
  { key: 'water-level', label: 'Water Level', glyph: '💧', color: '#0ea5e9' },
  { key: 'temperature', label: 'Temperature', glyph: '🌡', color: '#f59e0b' },
  { key: 'wind', label: 'Wind', glyph: '💨', color: '#8b5cf6' },
  { key: 'weather-station', label: 'Weather Station', glyph: '⚡', color: '#10b981' },
  { key: 'dam', label: 'Dam Monitoring', glyph: '🏞', color: '#dc2626' },
  { key: 'iot-gateway', label: 'IoT Gateway', glyph: '📡', color: '#64748b' },
];

export function sensorTypeLabel(t: SensorType): string {
  return SENSOR_TYPE_LABELS[t];
}

const STATES = [
  'Bihar', 'Assam', 'West Bengal', 'Uttar Pradesh', 'Odisha',
  'Gujarat', 'Maharashtra', 'Tamil Nadu', 'Karnataka', 'Kerala',
  'Punjab', 'Rajasthan', 'Andhra Pradesh', 'Telangana', 'Jharkhand',
];

const DISTRICTS: Record<string, string[]> = {
  'Bihar': ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga'],
  'Assam': ['Guwahati', 'Dibrugarh', 'Silchar', 'Tezpur', 'Jorhat'],
  'West Bengal': ['Kolkata', 'Howrah', 'Malda', 'Murshidabad', 'Hooghly'],
  'Uttar Pradesh': ['Lucknow', 'Varanasi', 'Prayagraj', 'Gorakhpur', 'Agra'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Puri', 'Sambalpur', 'Balasore'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nashik', 'Nagpur', 'Aurangabad'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Hubli', 'Mangaluru', 'Belagavi'],
  'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Kurnool'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh'],
};

const STATE_COORDS: Record<string, { lat: number; lng: number }> = {
  'Bihar': { lat: 25.6, lng: 85.1 },
  'Assam': { lat: 26.5, lng: 92.7 },
  'West Bengal': { lat: 22.9, lng: 88.3 },
  'Uttar Pradesh': { lat: 27.0, lng: 80.9 },
  'Odisha': { lat: 20.9, lng: 85.8 },
  'Gujarat': { lat: 22.3, lng: 71.0 },
  'Maharashtra': { lat: 19.0, lng: 75.0 },
  'Tamil Nadu': { lat: 11.0, lng: 78.5 },
  'Karnataka': { lat: 15.3, lng: 75.7 },
  'Kerala': { lat: 10.0, lng: 76.5 },
  'Punjab': { lat: 30.7, lng: 76.0 },
  'Rajasthan': { lat: 27.0, lng: 74.0 },
  'Andhra Pradesh': { lat: 15.9, lng: 79.7 },
  'Telangana': { lat: 17.9, lng: 79.0 },
  'Jharkhand': { lat: 23.6, lng: 85.3 },
};

function sevFromThreshold(v: number, warning: number, critical: number): Severity {
  if (v >= critical) return 'critical';
  if (v >= warning) return 'warning';
  return 'info';
}

const SENSOR_TYPES: SensorType[] = [
  'river-level', 'rainfall', 'water-level', 'temperature',
  'wind', 'weather-station', 'dam', 'iot-gateway',
];

function buildReadings(type: SensorType, seed: string): SensorReading[] {
  const r = seededRandom;
  switch (type) {
    case 'river-level':
      return [
        { label: 'River Level', value: Number((4 + r(`${seed}-rl`) * 5).toFixed(2)), unit: 'm', icon: 'Waves', severity: 'info' },
        { label: 'Water Flow', value: Number((100 + r(`${seed}-wf`) * 400).toFixed(0)), unit: 'm³/s', icon: 'Wind', severity: 'info' },
        { label: 'Water Velocity', value: Number((0.5 + r(`${seed}-wv`) * 2.5).toFixed(2)), unit: 'm/s', icon: 'Gauge', severity: 'info' },
      ];
    case 'rainfall':
      return [
        { label: 'Rainfall Rate', value: Number((r(`${seed}-rr`) * 45).toFixed(1)), unit: 'mm/h', icon: 'CloudRain', severity: 'info' },
        { label: 'Daily Rainfall', value: Number((r(`${seed}-dr`) * 120).toFixed(1)), unit: 'mm', icon: 'Droplets', severity: 'info' },
        { label: 'Weekly Rainfall', value: Number((r(`${seed}-wr`) * 350).toFixed(1)), unit: 'mm', icon: 'Cloud', severity: 'info' },
      ];
    case 'water-level':
      return [
        { label: 'Water Level', value: Number((2 + r(`${seed}-wl`) * 4).toFixed(2)), unit: 'm', icon: 'Waves', severity: 'info' },
        { label: 'Flow Rate', value: Number((50 + r(`${seed}-fr`) * 200).toFixed(0)), unit: 'm³/s', icon: 'Wind', severity: 'info' },
      ];
    case 'temperature':
      return [
        { label: 'Temperature', value: Number((20 + r(`${seed}-t`) * 22).toFixed(1)), unit: '°C', icon: 'Thermometer', severity: 'info' },
        { label: 'Humidity', value: Math.round(40 + r(`${seed}-h`) * 55), unit: '%', icon: 'Droplets', severity: 'info' },
      ];
    case 'wind':
      return [
        { label: 'Wind Speed', value: Number((r(`${seed}-ws`) * 70).toFixed(1)), unit: 'km/h', icon: 'Wind', severity: 'info' },
        { label: 'Wind Direction', value: Math.round(r(`${seed}-wd`) * 360), unit: '°', icon: 'Compass', severity: 'info' },
      ];
    case 'weather-station':
      return [
        { label: 'Temperature', value: Number((20 + r(`${seed}-t`) * 22).toFixed(1)), unit: '°C', icon: 'Thermometer', severity: 'info' },
        { label: 'Humidity', value: Math.round(40 + r(`${seed}-h`) * 55), unit: '%', icon: 'Droplets', severity: 'info' },
        { label: 'Wind Speed', value: Number((r(`${seed}-ws`) * 70).toFixed(1)), unit: 'km/h', icon: 'Wind', severity: 'info' },
        { label: 'Wind Direction', value: Math.round(r(`${seed}-wd`) * 360), unit: '°', icon: 'Compass', severity: 'info' },
        { label: 'Pressure', value: Math.round(990 + r(`${seed}-p`) * 30), unit: 'hPa', icon: 'Gauge', severity: 'info' },
      ];
    case 'dam':
      return [
        { label: 'Reservoir Level', value: Math.round(60 + r(`${seed}-rl`) * 40), unit: '%', icon: 'Database', severity: 'info' },
        { label: 'Gate Status', value: r(`${seed}-gs`) > 0.7 ? 1 : 0, unit: r(`${seed}-gs`) > 0.7 ? 'Open' : 'Closed', icon: 'DoorOpen', severity: 'info' },
        { label: 'Discharge Rate', value: Number((r(`${seed}-dc`) * 500).toFixed(0)), unit: 'm³/s', icon: 'Waves', severity: 'info' },
      ];
    case 'iot-gateway':
      return [
        { label: 'Connected Devices', value: Math.round(20 + r(`${seed}-cd`) * 80), unit: 'count', icon: 'Radio', severity: 'info' },
        { label: 'Throughput', value: Number((r(`${seed}-tp`) * 100).toFixed(1)), unit: 'Mbps', icon: 'Activity', severity: 'info' },
      ];
  }
}

function buildSensors(): Sensor[] {
  const sensors: Sensor[] = [];
  let idx = 0;
  for (const state of STATES) {
    const districts = DISTRICTS[state];
    const stateCoord = STATE_COORDS[state];
    const perState = 4 + Math.floor(seededRandom(`state-${state}`) * 4);
    for (let i = 0; i < perState; i++) {
      const district = districts[Math.floor(seededRandom(`${state}-${i}-d`) * districts.length)];
      const type = SENSOR_TYPES[Math.floor(seededRandom(`${state}-${i}-t`) * SENSOR_TYPES.length)];
      const lat = stateCoord.lat + (seededRandom(`${state}-${i}-lat`) - 0.5) * 2;
      const lng = stateCoord.lng + (seededRandom(`${state}-${i}-lng`) - 0.5) * 2;
      const statusRoll = seededRandom(`${state}-${i}-st`);
      const status: SensorStatus = statusRoll > 0.92 ? 'offline' : statusRoll > 0.85 ? 'warning' : statusRoll > 0.80 ? 'maintenance' : 'online';
      const battery = Math.round(20 + seededRandom(`${state}-${i}-bat`) * 80);
      const signal = Math.round(30 + seededRandom(`${state}-${i}-sig`) * 70);
      const now = Date.now();
      const lastCommMin = status === 'offline' ? Math.floor(seededRandom(`${state}-${i}-lc`) * 120) : Math.floor(seededRandom(`${state}-${i}-lc`) * 5);
      const installedMonthsAgo = Math.floor(seededRandom(`${state}-${i}-inst`) * 36);
      const id = `SNS-${String(idx).padStart(5, '0')}`;
      const readings = buildReadings(type, `${state}-${i}`).map((reading) => {
        if (reading.label === 'River Level' || reading.label === 'Water Level') {
          return { ...reading, severity: sevFromThreshold(reading.value, 7, 8.5) };
        }
        if (reading.label === 'Rainfall Rate') {
          return { ...reading, severity: sevFromThreshold(reading.value, 20, 35) };
        }
        if (reading.label === 'Reservoir Level') {
          return { ...reading, severity: sevFromThreshold(reading.value, 92, 98) };
        }
        if (reading.label === 'Wind Speed') {
          return { ...reading, severity: sevFromThreshold(reading.value, 50, 65) };
        }
        return reading;
      });
      sensors.push({
        id,
        name: `${SENSOR_TYPE_LABELS[type]} — ${district}`,
        type,
        district,
        state,
        lat,
        lng,
        installedAt: new Date(now - installedMonthsAgo * 30 * 86400_000).toISOString(),
        lastCommunication: new Date(now - lastCommMin * 60_000).toISOString(),
        battery,
        status,
        signalStrength: signal,
        readings,
      });
      idx++;
    }
  }
  return sensors;
}

const ALERT_TEMPLATES: { title: string; sev: Severity; action: string; type: SensorType }[] = [
  { title: 'Sensor offline — communication failure', sev: 'critical', action: 'Dispatch field team to inspect gateway connectivity', type: 'iot-gateway' },
  { title: 'Abnormal river level detected', sev: 'critical', action: 'Issue flood watch for downstream communities', type: 'river-level' },
  { title: 'Heavy rainfall detected', sev: 'warning', action: 'Monitor river levels and prepare evacuation routes', type: 'rainfall' },
  { title: 'Rapid water level rise', sev: 'warning', action: 'Alert nearby districts and verify sensor calibration', type: 'water-level' },
  { title: 'Low battery warning', sev: 'advisory', action: 'Schedule battery replacement within 7 days', type: 'temperature' },
  { title: 'Dam threshold exceeded', sev: 'critical', action: 'Initiate controlled discharge and notify downstream authorities', type: 'dam' },
  { title: 'Sensor drift detected — calibration needed', sev: 'advisory', action: 'Schedule recalibration during next maintenance window', type: 'wind' },
  { title: 'Signal degradation on IoT gateway', sev: 'warning', action: 'Check antenna alignment and network backhaul', type: 'iot-gateway' },
];

function buildAlerts(sensors: Sensor[]): SensorAlert[] {
  const alerts: SensorAlert[] = [];
  const now = Date.now();
  for (let i = 0; i < 12; i++) {
    const sensor = sensors[Math.floor(seededRandom(`alert-${i}-s`) * sensors.length)];
    const template = ALERT_TEMPLATES[Math.floor(seededRandom(`alert-${i}-t`) * ALERT_TEMPLATES.length)];
    const minutesAgo = Math.floor(seededRandom(`alert-${i}-ts`) * 180);
    alerts.push({
      id: `SA-${String(i).padStart(4, '0')}`,
      sensorId: sensor.id,
      sensorName: sensor.name,
      type: template.type,
      title: template.title,
      severity: template.sev,
      confidence: Math.round(75 + seededRandom(`alert-${i}-c`) * 23),
      timestamp: new Date(now - minutesAgo * 60_000).toISOString(),
      recommendedAction: template.action,
      district: sensor.district,
      state: sensor.state,
    });
  }
  const rank: Record<Severity, number> = { critical: 4, warning: 3, watch: 2, advisory: 1, info: 0 };
  alerts.sort((a, b) => rank[b.severity] - rank[a.severity]);
  return alerts;
}

export async function getSensorSnapshot(): Promise<SensorSnapshot> {
  await delay(600);
  const sensors = buildSensors();
  const online = sensors.filter((s) => s.status === 'online');
  const riverStations = sensors.filter((s) => s.type === 'river-level').length;
  const weatherStations = sensors.filter((s) => s.type === 'weather-station').length;
  const offlineCount = sensors.filter((s) => s.status === 'offline').length;
  const warningCount = sensors.filter((s) => s.status === 'warning').length;
  const networkHealth: NetworkHealth =
    offlineCount > 8 ? 'critical' : offlineCount > 4 ? 'partial' : warningCount > 6 ? 'minor' : 'healthy';

  const alerts = buildAlerts(sensors);
  const analytics: SensorAnalytics = {
    sensorsReportingAbnormal: sensors.filter((s) => s.status === 'warning' || s.status === 'offline').length,
    risingRiverLevels: alerts.filter((a) => a.title.includes('river')).length,
    heavyRainfallDetected: alerts.filter((a) => a.title.includes('rainfall')).length,
    rapidWaterLevelIncrease: alerts.filter((a) => a.title.includes('water level')).length,
    communicationFailures: alerts.filter((a) => a.title.includes('offline') || a.title.includes('Signal')).length,
    areasRequiringInspection: new Set(alerts.filter((a) => a.severity === 'critical' || a.severity === 'warning').map((a) => a.district)).size,
  };

  return {
    sensors,
    totalOnline: online.length,
    riverStations,
    weatherStations,
    networkHealth,
    analytics,
    alerts,
    lastUpdated: new Date().toISOString(),
  };
}
