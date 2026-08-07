import { useEffect, useRef, useState } from 'react';
import { TileLayer, useMap } from 'react-leaflet';

interface RainFrame { time: number; path: string; }

/**
 * Fetches RainViewer radar frame list and cycles through them as animated
 * TileLayer overlays, giving a rainfall animation on the map.
 */
export function RainfallAnimation({ visible }: { visible: boolean }) {
  const [frames, setFrames] = useState<RainFrame[]>([]);
  const [frameIdx, setFrameIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const past: RainFrame[] = (data?.radar?.past ?? []).slice(-6);
        const nowcast: RainFrame[] = (data?.radar?.nowcast ?? []).slice(0, 3);
        setFrames([...past, ...nowcast]);
        setFrameIdx(0);
      })
      .catch(() => {/* silently fall back to no animation */});
    return () => { cancelled = true; };
  }, [visible]);

  useEffect(() => {
    if (!visible || frames.length === 0) return;
    intervalRef.current = setInterval(() => {
      setFrameIdx((i) => (i + 1) % frames.length);
    }, 600);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [visible, frames]);

  if (!visible || frames.length === 0) return null;

  const frame = frames[frameIdx];
  const url = `https://tilecache.rainviewer.com${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;

  return (
    <TileLayer
      key={frame.path}
      url={url}
      opacity={0.55}
      attribution="RainViewer radar"
      zIndex={10}
    />
  );
}
