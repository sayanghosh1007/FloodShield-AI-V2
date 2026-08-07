import { useId } from 'react';
import { sparklinePath } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
  fill?: boolean;
}

/**
 * Lightweight inline SVG sparkline. Renders a smooth path + optional area fill,
 * plus a pulsing end-dot to signal a live feed.
 */
export function Sparkline({
  values,
  width = 120,
  height = 36,
  color = 'currentColor',
  className,
  fill = true,
}: SparklineProps) {
  const gid = useId().replace(/:/g, '');
  const path = sparklinePath(values, width, height);
  const areaPath = path ? `${path} L ${width} ${height} L 0 ${height} Z` : '';
  const last = values[values.length - 1] ?? 0;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const lastY = height - ((last - min) / range) * (height - 4) - 2;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn('overflow-visible', className)}
      style={{ color }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`spark-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.32" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && areaPath && <path d={areaPath} fill={`url(#spark-${gid})`} />}
      {path && (
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
      <circle
        cx={width}
        cy={lastY}
        r="2.5"
        fill="currentColor"
        className="animate-pulse-soft"
      />
    </svg>
  );
}
