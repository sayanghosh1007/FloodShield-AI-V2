import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMap, type MapContainerProps } from 'react-leaflet';
import L from 'leaflet';
import type { ReactNode } from 'react';

// Fix default marker icon paths under bundlers
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LeafletMapProps extends Omit<MapContainerProps, 'center'> {
  /** Center as [lat, lng]. */
  center: [number, number];
  children?: ReactNode;
  /** Additional tile layers to render (e.g. RainViewer radar, Windy). */
  overlayTiles?: ReactNode;
  /** Tile theme: 'osm' standard streets, 'dark' for night-mode cartography. */
  theme?: 'osm' | 'dark' | 'satellite';
}

/** Tile URL builders for supported basemaps. */
function baseTileUrl(theme: LeafletMapProps['theme']): { url: string; attribution: string } {
  switch (theme) {
    case 'dark':
      return {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; OpenStreetMap &copy; CARTO',
      };
    case 'satellite':
      return {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; Esri, Maxar, Earthstar Geographics',
      };
    default:
      return {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; OpenStreetMap contributors',
      };
  }
}

/** Inner helper to imperatively fly to a new center when it changes. */
function FlyController({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom ?? map.getZoom(), { duration: 0.8 });
  }, [center, zoom, map]);
  return null;
}

/**
 * Reusable Leaflet base map. Renders an OpenStreetMap / dark / satellite
 * basemap with zoom controls positioned bottom-right. Overlay tile layers
 * (RainViewer radar, wind, etc.) are passed as children or overlayTiles.
 */
export function LeafletMap({
  center,
  zoom = 5,
  theme = 'osm',
  children,
  overlayTiles,
  className,
  ...rest
}: LeafletMapProps) {
  const tile = useMemo(() => baseTileUrl(theme), [theme]);
  const mapRef = useRef<L.Map | null>(null);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      zoomControl={false}
      ref={mapRef}
      className={className}
      worldCopyJump
      {...rest}
    >
      <TileLayer key={theme} url={tile.url} attribution={tile.attribution} />
      {overlayTiles}
      <ZoomControl position="bottomright" />
      <FlyController center={center} zoom={zoom} />
      {children}
    </MapContainer>
  );
}

// ---- Custom div-icon marker factory ----

const MARKER_COLORS: Record<string, string> = {
  brand: '#1d61f2',
  accent: '#06b6d4',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#dc2626',
  neutral: '#64748b',
  purple: '#8b5cf6',
};

/**
 * Build a Leaflet divIcon — a circular colored pin with optional pulse
 * animation. Used for all point markers (shelters, hospitals, sensors...).
 */
export function makeIcon(opts: {
  color: keyof typeof MARKER_COLORS | string;
  size?: number;
  pulse?: boolean;
  glyph?: string; // emoji or short text
}): L.DivIcon {
  const size = opts.size ?? 22;
  const color = MARKER_COLORS[opts.color] ?? opts.color;
  return L.divIcon({
    className: 'fs-divicon',
    html: `<div class="fs-marker ${opts.pulse ? 'fs-marker-pulse' : ''}" style="width:${size}px;height:${size}px;background:${color};color:#fff;font-size:${size * 0.55}px;font-weight:700;">${opts.glyph ?? ''}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

/** Build a pulsing alert icon for active warnings / floods. */
export function makeAlertIcon(color: keyof typeof MARKER_COLORS = 'danger'): L.DivIcon {
  return makeIcon({ color, size: 26, pulse: true, glyph: '!' });
}
