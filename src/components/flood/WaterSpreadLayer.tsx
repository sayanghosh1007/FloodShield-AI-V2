import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface WaterSpreadProps {
  /** Flood epicenters [lat, lng, risk 0-1, radiusKm]. */
  epicenters: Array<{ lat: number; lng: number; risk: number; radius: number }>;
  visible: boolean;
  /** Cycle speed — higher = faster spread animation. */
  speed?: number;
}

/**
 * Animated canvas overlay that simulates water spreading outward from flood
 * epicenters. Concentric translucent blue rings pulse outward to convey
 * flood extent growth over the prediction horizon.
 */
export function WaterSpreadLayer({ epicenters, visible, speed = 1 }: WaterSpreadProps) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const tickRef = useRef(0);

  useEffect(() => {
    if (!visible || epicenters.length === 0) return;

    const pane = map.getPane('overlayPane')!;
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '350';
    pane.appendChild(canvas);
    canvasRef.current = canvas;

    function resize() {
      const size = map.getSize();
      canvas.width = size.x;
      canvas.height = size.y;
    }

    function draw() {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const size = map.getSize();
      ctx.clearRect(0, 0, size.x, size.y);
      tickRef.current += 0.012 * speed;

      for (const epi of epicenters) {
        const center = map.latLngToContainerPoint(L.latLng(epi.lat, epi.lng));
        const baseRadiusPx = epi.radius * 8; // scale km to px approx
        const maxRings = 4;

        for (let r = 0; r < maxRings; r++) {
          const phase = (tickRef.current + r / maxRings) % 1;
          const radius = baseRadiusPx * (0.3 + phase * 0.7) * (0.6 + epi.risk * 0.6);
          const alpha = (1 - phase) * 0.35 * (0.4 + epi.risk * 0.6);

          const grad = ctx.createRadialGradient(
            center.x, center.y, radius * 0.3,
            center.x, center.y, radius,
          );
          grad.addColorStop(0, `rgba(30,64,175,${alpha * 0.5})`);
          grad.addColorStop(0.7, `rgba(37,99,235,${alpha})`);
          grad.addColorStop(1, `rgba(59,130,246,0)`);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Core flooded disc
        ctx.fillStyle = `rgba(30,58,138,${0.25 + epi.risk * 0.3})`;
        ctx.beginPath();
        ctx.arc(center.x, center.y, baseRadiusPx * 0.35 * (0.5 + epi.risk), 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    resize();
    map.on('move zoom resize viewreset', resize);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      map.off('move zoom resize viewreset', resize);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      canvasRef.current = null;
    };
  }, [map, epicenters, visible, speed]);

  return null;
}
