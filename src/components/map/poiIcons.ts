import L from 'leaflet';
import type { PoiKind } from '@/api/evacuationApi';

const POI_COLOR: Record<PoiKind, string> = {
  shelter: '#10b981',
  hospital: '#0ea5e9',
  police: '#1d61f2',
  fire: '#dc2626',
  'relief-camp': '#16a34a',
  'community-shelter': '#22c55e',
  'high-ground': '#f59e0b',
};

const POI_GLYPH: Record<PoiKind, string> = {
  shelter: '⌂',
  hospital: '✚',
  police: '🛡',
  fire: '🔥',
  'relief-camp': '⛺',
  'community-shelter': '🏠',
  'high-ground': '⛰',
};

/** Leaflet divIcon for an evacuation POI. */
export function poiIcon(kind: PoiKind, opts: { pulse?: boolean; size?: number } = {}): L.DivIcon {
  const color = POI_COLOR[kind];
  const size = opts.size ?? 24;
  const glyph = POI_GLYPH[kind];
  return L.divIcon({
    className: 'fs-divicon',
    html: `<div class="fs-marker ${opts.pulse ? 'fs-marker-pulse' : ''}" style="width:${size}px;height:${size}px;background:${color};color:#fff;font-size:${size * 0.5}px;font-weight:700;display:flex;align-items:center;justify-content:center;">${glyph}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export const POI_COLOR_MAP = POI_COLOR;
export const POI_GLYPH_MAP = POI_GLYPH;
