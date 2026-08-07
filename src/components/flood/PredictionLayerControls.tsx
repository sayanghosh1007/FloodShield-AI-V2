import {
  ShieldAlert,
  Waves,
  Droplets,
  Route,
  PlusSquare,
  Home,
  Trees,
  Map as MapIcon,
  Radio,
  Siren,
  Eye,
  EyeOff,
  type LucideIcon,
} from 'lucide-react';
import type { PredictionLayerKey, PredictionLayerMeta } from '@/api/floodPredictionApi';
import { cn } from '@/lib/utils';

const ICONS: Record<string, LucideIcon> = {
  ShieldAlert,
  Waves,
  Droplets,
  Road: Route,
  PlusSquare,
  Home,
  Trees,
  Map: MapIcon,
  Radio,
  Siren,
};

interface PredictionLayerControlsProps {
  layers: PredictionLayerMeta[];
  primary: PredictionLayerKey;
  visible: Set<PredictionLayerKey>;
  onSelectPrimary: (key: PredictionLayerKey) => void;
  onToggleVisible: (key: PredictionLayerKey) => void;
}

export function PredictionLayerControls({
  layers,
  primary,
  visible,
  onSelectPrimary,
  onToggleVisible,
}: PredictionLayerControlsProps) {
  const prediction = layers.filter((l) => l.group === 'prediction');
  const infrastructure = layers.filter((l) => l.group === 'infrastructure');

  const renderGroup = (title: string, items: PredictionLayerMeta[]) => (
    <div>
      <p className="label-eyebrow mb-2">{title}</p>
      <div className="space-y-1.5">
        {items.map((l) => {
          const Icon = ICONS[l.icon] ?? Waves;
          const isPrimary = l.key === primary;
          const isVisible = visible.has(l.key);
          return (
            <div
              key={l.key}
              className={cn(
                'group flex items-center gap-3 rounded-xl border p-2.5 transition-all duration-300 cursor-pointer',
                isPrimary
                  ? 'border-brand-300 bg-brand-50/70 dark:border-brand-500/40 dark:bg-brand-500/10'
                  : 'border-transparent hover:bg-ink-100/60 dark:hover:bg-ink-800/40',
              )}
              onClick={() => onSelectPrimary(l.key)}
            >
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition',
                  isPrimary ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300',
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-ink-800 dark:text-ink-100">{l.label}</p>
                <p className="truncate text-[11px] text-ink-400 dark:text-ink-500">{l.description}</p>
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

  return (
    <div className="glass-panel p-4 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-ink-900 dark:text-white">Prediction Layers</h3>
        <span className="label-eyebrow">{visible.size} on</span>
      </div>
      {renderGroup('Prediction field', prediction)}
      {renderGroup('Infrastructure', infrastructure)}
    </div>
  );
}
