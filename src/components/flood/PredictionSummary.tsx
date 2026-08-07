import { Waves, Users, MapPinned, Gauge } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useCountUp } from '@/hooks/useCountUp';
import type { FloodPredictionSnapshot, PredictionHorizon } from '@/api/floodPredictionApi';
import { formatNumber } from '@/lib/utils';

interface PredictionSummaryProps {
  snapshot: FloodPredictionSnapshot;
  horizon: PredictionHorizon;
}

function StatCard({ icon, label, value, unit, tone }: { icon: React.ReactNode; label: string; value: number; unit: string; tone: string }) {
  const animated = useCountUp(value);
  return (
    <GlassCard className="p-4" hover>
      <div className="flex items-center justify-between">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>{icon}</span>
        <span className="text-[11px] text-ink-400 dark:text-ink-500">{unit}</span>
      </div>
      <p className="stat-value mt-3 text-2xl text-ink-900 dark:text-white">{formatNumber(animated, 0)}</p>
      <p className="text-xs text-ink-500 dark:text-ink-400">{label}</p>
    </GlassCard>
  );
}

export function PredictionSummary({ snapshot, horizon }: PredictionSummaryProps) {
  const h = snapshot.horizons[horizon];
  const cellsAtRisk = h.cells.filter((c) => c.severity === 'critical' || c.severity === 'warning').length;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        icon={<Waves className="h-5 w-5" />}
        label="Flooded area"
        value={h.floodedAreaKm2}
        unit="km²"
        tone="bg-brand-500/15 text-brand-600 dark:text-brand-300"
      />
      <StatCard
        icon={<Users className="h-5 w-5" />}
        label="Population affected"
        value={h.populationAffected}
        unit="people"
        tone="bg-danger-500/15 text-danger-600 dark:text-danger-400"
      />
      <StatCard
        icon={<MapPinned className="h-5 w-5" />}
        label="Cells at risk"
        value={cellsAtRisk}
        unit="grid cells"
        tone="bg-warning-500/15 text-warning-600 dark:text-warning-400"
      />
      <StatCard
        icon={<Gauge className="h-5 w-5" />}
        label="Model confidence"
        value={Math.round(h.confidence * 100)}
        unit="%"
        tone="bg-success-500/15 text-success-600 dark:text-success-400"
      />
    </div>
  );
}
