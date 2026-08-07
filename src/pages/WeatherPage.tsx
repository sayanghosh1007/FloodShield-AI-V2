import { useState, useCallback, useMemo } from 'react';
import { TileLayer, Marker, CircleMarker, Polyline, Popup, useMapEvents } from 'react-leaflet';
import {
  CloudSun,
  RefreshCw,
  Radio,
  MapPin,
  Zap,
  CloudLightning,
  Crosshair,
  Thermometer,
  Wind,
  Gauge,
  CloudRain,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import L from 'leaflet';
import { useWeatherFeed } from '@/hooks/useWeatherFeed';
import {
  WEATHER_LAYERS,
  getForecastForLocation,
  LIVE_SOURCE_CREDIT,
  type WeatherLayerKey,
  type ForecastRow,
} from '@/api/weatherApi';
import { PageHeader } from '@/components/ui/PageHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { LeafletMap } from '@/components/map/LeafletMap';
import { LayerControls } from '@/components/weather/LayerControls';
import { WeatherCharts } from '@/components/weather/WeatherCharts';
import { RainfallAnimation } from '@/components/weather/RainfallAnimation';
import { ForecastTable } from '@/components/weather/ForecastTable';
import { WeatherAlertsPanel } from '@/components/weather/WeatherAlertsPanel';
import { AIInsightsPanel } from '@/components/weather/AIInsightsPanel';
import { formatTime, cn } from '@/lib/utils';

const ASIA_PACIFIC_CENTER: [number, number] = [15, 120];

/** Captures map clicks and reports the lat/lng to the parent. */
function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const SEV_COLOR: Record<string, string> = {
  critical: '#7f1d1d',
  warning: '#dc2626',
  watch: '#f59e0b',
  advisory: '#eab308',
  info: '#3b82f6',
};

export function WeatherPage() {
  const { data, loading, refreshing, error, lastUpdated, refresh } = useWeatherFeed();
  const [activeLayer, setActiveLayer] = useState<WeatherLayerKey>('rainfall');
  const [visible, setVisible] = useState<Set<WeatherLayerKey>>(() => new Set(['rainfall']));

  // Click-to-forecast state
  const [clickedPos, setClickedPos] = useState<[number, number] | null>(null);
  const [locForecast, setLocForecast] = useState<ForecastRow[] | null>(null);
  const [locName, setLocName] = useState<string | null>(null);
  const [locLoading, setLocLoading] = useState(false);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setClickedPos([lat, lng]);
    setLocLoading(true);
    setLocForecast(null);
    try {
      const result = await getForecastForLocation(lat, lng);
      setLocForecast(result.forecast);
      setLocName(result.locationName);
    } finally {
      setLocLoading(false);
    }
  }, []);

  function toggleVisible(key: WeatherLayerKey) {
    setVisible((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  // Charts reflect the map-selected region's temp / wind / pressure / rainfall.
  const chartSeries = useMemo(() => {
    if (!data || !locForecast) {
      return data?.series ?? { temperature: [], rainfall: [], wind: [], humidity: [], pressure: [] };
    }
    return {
      temperature: locForecast.map((r) => r.temp),
      rainfall: locForecast.map((r) => r.rain),
      wind: locForecast.map((r) => r.wind),
      humidity: locForecast.map((r) => r.humidity),
      pressure: locForecast.map((r) => r.pressure),
    };
  }, [data, locForecast]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-10 w-64 rounded" />
        <div className="skeleton h-[500px] w-full rounded-2xl" />
        <div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState fullPage title="Weather feed offline" message={error ?? 'Unable to load live weather data.'} onRetry={refresh} />;
  }

  const activeMeta = WEATHER_LAYERS.find((l) => l.key === activeLayer);
  const current = locForecast?.[0];

  const clickIcon = L.divIcon({
    className: 'fs-divicon',
    html: '<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:#1d61f2;border:3px solid #fff;box-shadow:0 0 0 4px rgba(29,97,242,0.3),0 2px 8px rgba(0,0,0,.4);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Weather Intelligence"
        title="Weather Intelligence Dashboard"
        description="Interactive GIS map of the Asia-Pacific region — click any location to load an accurate 36-hour forecast with temperature, wind, pressure, and rainfall. Active storms and lightning strikes overlaid in real time."
        actions={
          <div className="flex items-center gap-2">
            <Badge tone="success" dot>
              <Radio className="h-3 w-3" /> Auto-refresh 10m
            </Badge>
            <Button onClick={refresh} variant="secondary" size="md" disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Syncing' : 'Refresh'}
            </Button>
          </div>
        }
      />

      {/* Source attribution + last updated */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-200/50 bg-white/40 px-4 py-2.5 text-xs text-ink-500 backdrop-blur-md dark:border-ink-800/50 dark:bg-ink-900/40 dark:text-ink-400">
        <span className="flex items-center gap-1.5">
          <CloudSun className="h-3.5 w-3.5 text-brand-500" />
          {LIVE_SOURCE_CREDIT} · {data.source}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-ink-400" />
          Coverage: Asia-Pacific · Last sync {lastUpdated ? formatTime(lastUpdated) : '—'}
        </span>
      </div>

      {error && (
        <div className="rounded-xl border border-warning-300/50 bg-warning-50/70 px-4 py-2.5 text-xs text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300">
          A refresh attempt failed — showing last good snapshot. {error}
        </div>
      )}

      {/* Map + controls */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <GlassCard className="relative overflow-hidden p-2" hover>
            <div className="mb-2 flex items-center justify-between px-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="label-eyebrow">Active layer</span>
                <Badge tone="brand">{activeMeta?.label ?? activeLayer}</Badge>
              </div>
              <span className="flex items-center gap-1.5 text-[11px] text-brand-600 dark:text-brand-300">
                <Crosshair className="h-3 w-3" />
                Click map for 36h forecast
              </span>
            </div>
            <div className="relative h-[500px] w-full overflow-hidden rounded-xl">
              <LeafletMap center={ASIA_PACIFIC_CENTER} zoom={4} theme="osm" className="absolute inset-0" minZoom={3} maxBounds={[[-20, 60], [55, 185]]}>
                <MapClickHandler onClick={handleMapClick} />

                {/* Rainfall radar animation */}
                <RainfallAnimation visible={visible.has('rainfall')} />

                {/* Lightning strike markers */}
                {visible.has('lightning') &&
                  data.lightning.map((s) => (
                    <CircleMarker
                      key={s.id}
                      center={[s.lat, s.lng]}
                      radius={4 + s.intensity / 14}
                      pathOptions={{ color: '#facc15', weight: 1, fillColor: '#facc15', fillOpacity: 0.85 }}
                      eventHandlers={{ click: () => handleMapClick(s.lat, s.lng) }}
                    >
                      <Popup>
                        <strong>Lightning strike</strong><br />
                        Intensity: {s.intensity.toFixed(1)} kA<br />
                        Time: {formatTime(s.time)}
                      </Popup>
                    </CircleMarker>
                  ))}

                {/* Storm cells + tracks */}
                {visible.has('storms') &&
                  data.storms.map((st) => {
                    const color = SEV_COLOR[st.severity] ?? '#dc2626';
                    return (
                      <div key={st.id}>
                        <Polyline
                          positions={st.track.map((p) => [p.lat, p.lng] as [number, number])}
                          pathOptions={{ color, weight: 2.5, opacity: 0.7, dashArray: '6 5' }}
                        />
                        <CircleMarker
                          center={[st.lat, st.lng]}
                          radius={10}
                          pathOptions={{ color: '#fff', weight: 2, fillColor: color, fillOpacity: 0.85 }}
                          eventHandlers={{ click: () => handleMapClick(st.lat, st.lng) }}
                        >
                          <Popup>
                            <strong>{st.name}</strong><br />
                            Severity: {st.severity}<br />
                            Wind: {st.windSpeed} km/h<br />
                            Pressure: {st.centralPressure} hPa
                          </Popup>
                        </CircleMarker>
                      </div>
                    );
                  })}

                {clickedPos && <Marker position={clickedPos} icon={clickIcon} />}
              </LeafletMap>

              {/* Map legend */}
              <div className="fs-map-legend absolute bottom-3 left-3 z-[500] rounded-lg border border-white/30 bg-white/85 px-3 py-2 text-[10px] backdrop-blur-md dark:border-white/10 dark:bg-ink-900/85">
                <p className="mb-1 font-semibold text-ink-600 dark:text-ink-300">{activeMeta?.label}</p>
                <div className="space-y-1">
                  <span className="flex items-center gap-1.5 text-ink-500 dark:text-ink-400">
                    <Zap className="h-3 w-3 text-yellow-500" /> Lightning strikes
                  </span>
                  <span className="flex items-center gap-1.5 text-ink-500 dark:text-ink-400">
                    <CloudLightning className="h-3 w-3 text-red-500" /> Storm cells & tracks
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="space-y-4">
          <LayerControls
            layers={WEATHER_LAYERS}
            active={activeLayer}
            visible={visible}
            onSelect={setActiveLayer}
            onToggleVisible={toggleVisible}
          />

          {/* Selected location weather card */}
          {clickedPos && (
            <GlassCard className="p-4" glow="brand">
              <div className="mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-500" />
                <div>
                  <h3 className="font-display text-sm font-semibold text-ink-900 dark:text-white">
                    {locLoading ? 'Calculating…' : locName ?? 'Selected location'}
                  </h3>
                  <p className="text-[11px] text-ink-400 dark:text-ink-500">
                    {clickedPos[0].toFixed(4)}°{clickedPos[0] >= 0 ? 'N' : 'S'}, {clickedPos[1].toFixed(4)}°{clickedPos[1] >= 0 ? 'E' : 'W'}
                  </p>
                </div>
              </div>
              {locLoading || !current ? (
                <div className="flex items-center gap-2 py-6 text-xs text-ink-400 dark:text-ink-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating current conditions…
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <WeatherStat icon={<Thermometer className="h-3.5 w-3.5" />} label="Temperature" value={`${current.temp.toFixed(1)}°C`} tone="text-warning-600 dark:text-warning-400" />
                  <WeatherStat icon={<Wind className="h-3.5 w-3.5" />} label="Wind Speed" value={`${current.wind.toFixed(1)} km/h`} tone="text-brand-600 dark:text-brand-300" />
                  <WeatherStat icon={<Gauge className="h-3.5 w-3.5" />} label="Pressure" value={`${current.pressure.toFixed(0)} hPa`} tone="text-accent-600 dark:text-accent-300" />
                  <WeatherStat icon={<CloudRain className="h-3.5 w-3.5" />} label="Rainfall" value={`${current.rain.toFixed(1)} mm`} tone="text-brand-600 dark:text-brand-300" />
                </div>
              )}
            </GlassCard>
          )}
        </div>
      </div>

      {/* Charts — reflect the selected map region */}
      {clickedPos && locName && (
        <div className="flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400">
          <MapPin className="h-3.5 w-3.5 text-brand-500" />
          Charts showing telemetry for <span className="font-semibold text-brand-600 dark:text-brand-300">{locName}</span>
        </div>
      )}
      <WeatherCharts series={chartSeries} />

      {/* 36-hour forecast (updates on map click) + alerts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ForecastTable
            forecast={locForecast ?? data.forecast}
            locationLabel={locName ?? undefined}
            loading={locLoading}
          />
        </div>
        <WeatherAlertsPanel alerts={data.alerts} />
      </div>

      <AIInsightsPanel snapshot={data} />
    </div>
  );
}

function WeatherStat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-ink-200/50 bg-white/50 p-2.5 dark:border-ink-800/50 dark:bg-ink-900/40">
      <div className="flex items-center gap-1.5">
        <span className={cn('flex h-6 w-6 items-center justify-center rounded-lg bg-ink-100 dark:bg-ink-800', tone)}>{icon}</span>
      </div>
      <p className={cn('mt-1.5 font-display text-base font-bold', tone)}>{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wider text-ink-400 dark:text-ink-500">{label}</p>
    </div>
  );
}
