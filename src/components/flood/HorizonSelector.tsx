import { Clock } from 'lucide-react';
import type { PredictionHorizon } from '@/api/floodPredictionApi';
import { cn } from '@/lib/utils';

interface HorizonSelectorProps {
  value: PredictionHorizon;
  onChange: (h: PredictionHorizon) => void;
  confidence: Record<PredictionHorizon, number>;
}

const HORIZONS: PredictionHorizon[] = [24, 48, 72];

export function HorizonSelector({ value, onChange, confidence }: HorizonSelectorProps) {
  return (
    <div className="glass-panel p-4">
      <div className="mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4 text-brand-500" />
        <h3 className="font-display text-sm font-semibold text-ink-900 dark:text-white">Prediction Timeline</h3>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {HORIZONS.map((h) => (
          <button
            key={h}
            onClick={() => onChange(h)}
            className={cn(
              'rounded-xl border p-3 text-center transition-all duration-300',
              value === h
                ? 'border-brand-400 bg-brand-50/70 shadow-glass-sm dark:border-brand-500/40 dark:bg-brand-500/10'
                : 'border-ink-200/60 hover:border-brand-300 hover:bg-brand-50/40 dark:border-ink-800/60 dark:hover:bg-brand-500/5',
            )}
          >
            <p className={cn('stat-value text-lg', value === h ? 'text-brand-700 dark:text-brand-300' : 'text-ink-700 dark:text-ink-200')}>
              {h}h
            </p>
            <p className="mt-0.5 text-[10px] text-ink-400 dark:text-ink-500">
              {Math.round(confidence[h] * 100)}% conf.
            </p>
          </button>
        ))}
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-200/60 dark:bg-ink-800/60">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-500"
          style={{ width: `${(value / 72) * 100}%` }}
        />
      </div>
      <p className="mt-1.5 text-[10px] text-ink-400 dark:text-ink-500">
        Forecast horizon: {value} hours from now
      </p>
    </div>
  );
}
