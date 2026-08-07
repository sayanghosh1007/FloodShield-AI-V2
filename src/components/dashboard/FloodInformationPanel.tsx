import {
  X,
  MapPin,
  Waves,
  AlertTriangle,
  Users,
  Clock,
  Gauge,
  Bot,
  Radio,
  CheckCircle2,
  Navigation,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ActiveIncident, AlertSourceBadge } from '@/context/ActiveIncidentContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn, formatTime } from '@/lib/utils';

const SEVERITY_TONE: Record<string, 'danger' | 'warning' | 'success' | 'neutral'> = {
  extreme: 'danger',
  high: 'danger',
  moderate: 'warning',
  low: 'success',
  safe: 'success',
  critical: 'danger',
  warning: 'warning',
  watch: 'warning',
  advisory: 'neutral',
  info: 'neutral',
};

const ALERT_LEVEL_TONE: Record<string, 'danger' | 'warning' | 'success' | 'neutral'> = {
  red: 'danger',
  orange: 'warning',
  yellow: 'warning',
  green: 'success',
  blue: 'neutral',
};

const SOURCE_META: Record<AlertSourceBadge, { label: string; icon: typeof Bot; classes: string }> = {
  ai: { label: 'AI Prediction', icon: Bot, classes: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300' },
  official: { label: 'Official Source', icon: Radio, classes: 'bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-300' },
  verified: { label: 'AI + Official Verification', icon: CheckCircle2, classes: 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300' },
};

interface FloodInformationPanelProps {
  incident: ActiveIncident;
  onClose: () => void;
}

export function FloodInformationPanel({ incident, onClose }: FloodInformationPanelProps) {
  const navigate = useNavigate();
  const sevTone = SEVERITY_TONE[incident.severity ?? incident.riskTier ?? ''] ?? 'neutral';
  const alertTone = ALERT_LEVEL_TONE[incident.alertLevel ?? ''] ?? 'neutral';
  const source = incident.sourceBadge ? SOURCE_META[incident.sourceBadge] : null;
  const SourceIcon = source?.icon ?? Bot;

  return (
    <GlassCard className="overflow-hidden" hover>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-ink-200/50 bg-gradient-to-br from-ink-950 to-brand-950/40 px-5 py-4 dark:border-ink-800/50">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-400">
            Flood Information Panel
          </p>
          <h3 className="mt-1 font-display text-lg font-bold text-white">
            {incident.name}
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-400">
            <MapPin className="h-3 w-3 text-brand-400" />
            {incident.district ?? incident.state} · {incident.state}
          </p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded-lg p-1.5 text-ink-400 transition hover:bg-white/10 hover:text-white"
          aria-label="Close panel"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Body */}
      <div className="space-y-4 p-5">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={sevTone} dot>
            Severity: {incident.severity ?? incident.riskTier}
          </Badge>
          {incident.alertLevel && (
            <Badge tone={alertTone}>
              Alert: {incident.alertLevel}
            </Badge>
          )}
          {source && (
            <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold', source.classes)}>
              <SourceIcon className="h-3 w-3" />
              {source.label}
            </span>
          )}
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-3">
          <MetricRow
            icon={<Waves className="h-4 w-4 text-brand-500" />}
            label="Predicted Water Depth"
            value={incident.predictedDepth != null ? `${incident.predictedDepth.toFixed(1)} m` : '—'}
          />
          <MetricRow
            icon={<Users className="h-4 w-4 text-danger-500" />}
            label="Population at Risk"
            value={incident.populationAtRisk != null ? incident.populationAtRisk.toLocaleString() : '—'}
          />
          <MetricRow
            icon={<Gauge className="h-4 w-4 text-accent-500" />}
            label="AI Confidence"
            value={incident.aiConfidence != null ? `${incident.aiConfidence}%` : '—'}
          />
          <MetricRow
            icon={<Clock className="h-4 w-4 text-ink-400" />}
            label="Last Updated"
            value={incident.lastUpdated ? formatTime(incident.lastUpdated) : '—'}
          />
        </div>

        {/* River + state info */}
        <div className="flex items-center justify-between rounded-xl border border-ink-200/50 bg-white/40 px-4 py-2.5 text-xs dark:border-ink-800/50 dark:bg-ink-900/40">
          <span className="flex items-center gap-1.5 text-ink-500 dark:text-ink-400">
            <Waves className="h-3.5 w-3.5 text-brand-500" />
            River: <span className="font-semibold text-ink-700 dark:text-ink-200">{incident.river}</span>
          </span>
          <span className="flex items-center gap-1.5 text-ink-500 dark:text-ink-400">
            <MapPin className="h-3.5 w-3.5 text-brand-500" />
            State: <span className="font-semibold text-ink-700 dark:text-ink-200">{incident.state}</span>
          </span>
        </div>

        {/* Navigation actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/flood-prediction')}
          >
            <Navigation className="h-3.5 w-3.5" />
            Flood Prediction
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/evacuation')}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Evacuation
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/shelters')}
          >
            Shelters
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}

function MetricRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-200/50 bg-white/40 px-3.5 py-3 dark:border-ink-800/50 dark:bg-ink-900/40">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500">{label}</p>
      </div>
      <p className="mt-1.5 font-display text-lg font-bold text-ink-900 dark:text-white">{value}</p>
    </div>
  );
}
