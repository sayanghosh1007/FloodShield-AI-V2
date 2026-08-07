import {
  CloudRain,
  Wind,
  Cloud,
  Satellite,
  Thermometer,
  Gauge,
  Zap,
  CloudLightning,
  Eye,
  EyeOff,
  type LucideIcon,
} from 'lucide-react';
import type { WeatherLayerKey, WeatherLayerMeta } from '@/api/weatherApi';
import { cn } from '@/lib/utils';

const ICONS: Record<string, LucideIcon> = {
  CloudRain,
  Wind,
  Cloud,
  Satellite,
  Thermometer,
  Gauge,
  Zap,
  CloudLightning,
};

interface LayerControlsProps {
  layers: WeatherLayerMeta[];
  active: WeatherLayerKey;
  visible: Set<WeatherLayerKey>;
  onSelect: (key: WeatherLayerKey) => void;
  onToggleVisible: (key: WeatherLayerKey) => void;
}

/** Layer control panel — select the primary layer + toggle multi-layer visibility. */
export function LayerControls({ layers, active, visible, onSelect, onToggleVisible }: LayerControlsProps) {
  return (
    <div className="glass-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-ink-900 dark:text-white">Map Layers</h3>
        <span className="label-eyebrow">{visible.size} active</span>
      </div>
      <div className="space-y-1.5">
        {layers.map((l) => {
          const Icon = ICONS[l.icon] ?? Cloud;
          const isActive = l.key === active;
          const isVisible = visible.has(l.key);
          return (
            <div
              key={l.key}
              className={cn(
                'group flex items-center gap-3 rounded-xl border p-2.5 transition-all duration-300 cursor-pointer',
                isActive
                  ? 'border-brand-300 bg-brand-50/70 dark:border-brand-500/40 dark:bg-brand-500/10'
                  : 'border-transparent hover:bg-ink-100/60 dark:hover:bg-ink-800/40',
              )}
              onClick={() => onSelect(l.key)}
            >
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition',
                  isActive ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300',
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-ink-800 dark:text-ink-100">{l.label}</p>
                <p className="truncate text-[11px] text-ink-400 dark:text-ink-500">
                  {l.source} · {l.description}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisible(l.key);
                }}
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition',
                  isVisible
                    ? 'text-brand-600 hover:bg-brand-100 dark:text-brand-300 dark:hover:bg-brand-500/15'
                    : 'text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800',
                )}
                aria-label={isVisible ? `Hide ${l.label}` : `Show ${l.label}`}
              >
                {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
