import { useEffect, useMemo } from 'react';
import { Marker, useMap } from 'react-leaflet';
import { LeafletMap, makeIcon } from '@/components/map/LeafletMap';
import type { Sensor } from '@/api/sensorApi';
import { SENSOR_TYPE_LIST } from '@/api/sensorApi';

const STATUS_COLOR: Record<string, string> = {
  online: 'success',
  maintenance: 'warning',
  warning: 'warning',
  offline: 'danger',
};

interface SensorMapProps {
  sensors: Sensor[];
  selectedId: string | null;
  onSelect: (sensor: Sensor) => void;
  theme?: 'osm' | 'dark';
}

function FlyController({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom ?? map.getZoom(), { duration: 0.6 });
  }, [center, zoom, map]);
  return null;
}

export function SensorMap({ sensors, selectedId, onSelect, theme = 'dark' }: SensorMapProps) {
  const selected = sensors.find((s) => s.id === selectedId);
  const flyCenter: [number, number] = selected ? [selected.lat, selected.lng] : [22.5, 80];
  const flyZoom = selected ? 8 : 5;

  const markers = useMemo(
    () =>
      sensors.map((sensor) => {
        const typeMeta = SENSOR_TYPE_LIST.find((t) => t.key === sensor.type);
        const color = STATUS_COLOR[sensor.status] ?? 'neutral';
        const pulse = sensor.status === 'offline' || sensor.status === 'warning';
        return {
          sensor,
          icon: makeIcon({ color, size: sensor.status === 'offline' ? 24 : 20, pulse, glyph: typeMeta?.glyph ?? '📡' }),
        };
      }),
    [sensors],
  );

  return (
    <LeafletMap center={flyCenter} zoom={flyZoom} theme={theme} className="h-full w-full rounded-2xl">
      <FlyController center={flyCenter} zoom={flyZoom} />
      {markers.map(({ sensor, icon }) => (
        <Marker
          key={sensor.id}
          position={[sensor.lat, sensor.lng]}
          icon={icon}
          eventHandlers={{ click: () => onSelect(sensor) }}
        />
      ))}
    </LeafletMap>
  );
}
