import { useState } from 'react';
import { Waves, TrendingUp } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

type Horizon = '24h' | '48h' | '72h';

interface RiverChartProps {
  series: number[];
  warningLevel: number;
  criticalLevel: number;
  unit?: string;
  /** Optional multi-horizon series — when provided, shows 24h/48h/72h tabs. */
  multiSeries?: {
    '24h': number[];
    '48h': number[];
    '72h': number[];
  };
  regionName?: string;
}

/** River-level chart with optional 24h / 48h / 72h horizon selector. */
export function RiverChart({
  series,
  warningLevel,
  criticalLevel,
  unit = 'm',
  multiSeries,
  regionName = 'Eastern Flood Basin · Station 04',
}: RiverChartProps) {
  const [horizon, setHorizon] = useState<Horizon>('24h');
  const active = multiSeries ? multiSeries[horizon] : series;
  const points = multiSeries ? (horizon === '24h' ? 24 : horizon === '48h' ? 48 : 72) : 24;

  const W = 600;
  const H = 180;
  const pad = 6;
  const values = active.length ? active : Array.from({ length: points }, () => 5.5);
  const min = Math.min(...values, warningLevel - 1);
  const max = Math.max(...values, criticalLevel + 0.5);
  const range = max - min || 1;
  const step = (W - pad * 2) / Math.max(1, values.length - 1);

  const yOf = (v: number) => H - pad - ((v - min) / range) * (H - pad * 2);
  const xOf = (i: number) => pad + i * step;

  const linePath = values
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xOf(i).toFixed(1)} ${yOf(v).toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L ${xOf(values.length - 1)} ${H - pad} L ${xOf(0)} ${H - pad} Z`;

  const warningY = yOf(warningLevel);
  const criticalY = yOf(criticalLevel);
  const current = values[values.length - 1];
  const overCritical = current >= criticalLevel;

  return (
    <GlassCard className="p-5" glow={overCritical ? 'danger' : 'brand'}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500/15 text-accent-600 dark:text-accent-400">
            <Waves className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-base font-semibold text-ink-900 dark:text-white">
              River Level Forecast
            </h3>
            <p className="text-xs text-ink-500 dark:text-ink-400">{regionName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={overCritical ? 'danger' : 'warning'} dot>
            {current.toFixed(2)} {unit}
          </Badge>
          <span className="flex items-center gap-1 text-xs font-semibold text-success-600 dark:text-success-400">
            <TrendingUp className="h-3.5 w-3.5" />
            {((current / criticalLevel) * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* 24h / 48h / 72h tabs */}
      {multiSeries && (
        <div className="mt-3 flex items-center gap-1.5">
          {(['24h', '48h', '72h'] as Horizon[]).map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={cn(
                'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-300',
                horizon === h
                  ? 'bg-brand-600 text-white shadow-glass-sm'
                  : 'bg-ink-100/70 text-ink-500 hover:bg-brand-50 hover:text-brand-700 dark:bg-ink-800/60 dark:text-ink-400',
              )}
            >
              {h}
            </button>
          ))}
          <span className="ml-1 text-[10px] text-ink-400 dark:text-ink-500">
            {horizon === '24h' ? 'Next 24 hours' : horizon === '48h' ? 'Next 48 hours' : 'Next 72 hours'}
          </span>
        </div>
      )}

      <div className="mt-4 -mx-1 overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-44 w-full min-w-[480px]" preserveAspectRatio="none">
          <defs>
            <linearGradient id="river-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3380fc" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#3380fc" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* threshold bands */}
          <rect x={pad} y={criticalY} width={W - pad * 2} height={H - pad - criticalY} fill="#ef4444" opacity="0.07" />
          <rect x={pad} y={warningY} width={W - pad * 2} height={criticalY - warningY} fill="#f59e0b" opacity="0.08" />

          {/* threshold lines */}
          <line x1={pad} y1={warningY} x2={W - pad} y2={warningY} stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 4" opacity="0.7" />
          <line x1={pad} y1={criticalY} x2={W - pad} y2={criticalY} stroke="#ef4444" strokeWidth="1" strokeDasharray="4 4" opacity="0.8" />

          {/* data */}
          <path d={areaPath} fill="url(#river-fill)" />
          <path
            d={linePath}
            fill="none"
            stroke="#3380fc"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {/* current marker */}
          <circle cx={xOf(values.length - 1)} cy={yOf(current)} r="4" fill="#3380fc" className="animate-pulse-soft" />
          <circle cx={xOf(values.length - 1)} cy={yOf(current)} r="8" fill="#3380fc" opacity="0.2" />
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-ink-500 dark:text-ink-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-sm bg-brand-500" /> River level
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full bg-warning-500" /> Warning ({warningLevel} {unit})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full bg-danger-500" /> Critical ({criticalLevel} {unit})
        </span>
      </div>
    </GlassCard>
  );
}

/** Stat tile used inside the hero banner. */
export function HeroStat({ label, value, tone = 'brand' }: { label: string; value: string; tone?: 'brand' | 'danger' | 'warning' | 'success' }) {
  const toneClass = {
    brand: 'text-brand-600 dark:text-brand-300',
    danger: 'text-danger-600 dark:text-danger-400',
    warning: 'text-warning-600 dark:text-warning-400',
    success: 'text-success-600 dark:text-success-400',
  };
  return (
    <div className="rounded-xl border border-white/30 bg-white/40 px-3.5 py-2.5 backdrop-blur-md dark:border-white/10 dark:bg-ink-900/40">
      <p className="label-eyebrow">{label}</p>
      <p className={cn('stat-value mt-0.5 text-lg', toneClass[tone])}>{value}</p>
    </div>
  );
}
