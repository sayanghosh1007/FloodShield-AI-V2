import { useEffect, useState } from 'react';
import {
  X,
  Phone,
  Truck,
  Flame,
  Shield,
  Ship,
  LifeBuoy,
  Zap,
  Construction,
  Tent,
  Activity,
  AlertTriangle,
  Brain,
  Clock,
  Gauge,
  Navigation,
  TentTree,
  Copy,
  Check,
  CloudRain,
  Bot,
  Radio,
  Waves,
} from 'lucide-react';
import type { AlertDetail, AlertSource, EmergencyDepartment } from '@/api/alertApi';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn, formatTime, formatDate, severityColor, severityLabel } from '@/lib/utils';

const SOURCE_META: Record<AlertSource, { label: string; icon: typeof Bot; classes: string }> = {
  ai: { label: 'AI Prediction', icon: Bot, classes: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300' },
  official: { label: 'Official Source', icon: Radio, classes: 'bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-300' },
  verified: { label: 'AI + Official Verification', icon: Check, classes: 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300' },
};

const DEPT_ICONS: Record<string, typeof Truck> = {
  Truck, Flame, Shield, Ship, LifeBuoy, Zap, Construction, Tent,
};

interface AlertDetailPanelProps {
  alert: AlertDetail;
  onClose: () => void;
  onViewAlertArea: () => void;
  onViewEvacuation: () => void;
  onViewShelters: () => void;
}

export function AlertDetailPanel({
  alert,
  onClose,
  onViewAlertArea,
  onViewEvacuation,
  onViewShelters,
}: AlertDetailPanelProps) {
  const [callDept, setCallDept] = useState<EmergencyDepartment | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { if (callDept) setCallDept(null); else onClose(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, callDept]);

  const sev = severityColor(alert.severity);
  const statusTone = alert.status === 'active' ? 'danger' : alert.status === 'monitoring' ? 'warning' : 'success';
  const isWeather = alert.alertType === 'weather';
  const isFloodLive = alert.isFloodLive;
  const src = SOURCE_META[alert.alertSource];
  const SrcIcon = src.icon;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink-950/50 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden />
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col bg-white/95 shadow-2xl backdrop-blur-xl dark:bg-ink-900/95 animate-slide-in-right"
        role="dialog"
        aria-label={`Alert details: ${alert.title}`}
      >
        {/* Header */}
        <div className={cn('flex items-start justify-between border-b border-ink-200/60 p-5 dark:border-ink-700/60', sev.bg)}>
          <div className="flex items-start gap-3">
            <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border', sev.border, sev.text, 'bg-white/80 dark:bg-ink-800/80')}>
              {isFloodLive ? <Waves className="h-5 w-5" /> : isWeather ? <CloudRain className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-ink-500 dark:text-ink-400">{alert.id}</span>
                <Badge tone={alert.severity === 'critical' ? 'danger' : alert.severity === 'warning' ? 'warning' : 'brand'}>
                  {severityLabel(alert.severity)}
                </Badge>
                <Badge tone={statusTone}>{alert.status}</Badge>
              </div>
              <h2 className="mt-1 font-display text-lg font-semibold text-ink-900 dark:text-white">{alert.title}</h2>
              <p className="text-xs text-ink-500 dark:text-ink-400">{alert.affectedDistrict} · {alert.region}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-ink-200"
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Alert Information */}
          <Section title="Alert Information" icon={<Activity className="h-4 w-4" />}>
            <div className="grid grid-cols-2 gap-3">
              <InfoField label="Alert ID" value={alert.id} />
              <InfoField label="Alert Type" value={alert.alertTypeLabel} />
              <InfoField label="Category" value={formatCategory(alert.category)} />
              <InfoField label="Severity" value={severityLabel(alert.severity)} />
              <InfoField label="Affected District" value={alert.affectedDistrict} />
              <InfoField label="Flood Risk Level" value={alert.floodRiskLevel} />
              <InfoField label="Population at Risk" value={alert.populationAtRisk > 0 ? alert.populationAtRisk.toLocaleString() : 'N/A'} />
              <InfoField label="Predicted Water Depth" value={alert.predictedWaterDepth} />
              <InfoField label="Expected Flood Arrival" value={alert.expectedFloodArrival} />
              <InfoField label="Estimated Duration" value={alert.estimatedDuration} />
              <InfoField label="Issued" value={`${formatDate(alert.issuedAt)} ${formatTime(alert.issuedAt)}`} />
              <InfoField label="Last Updated" value={`${formatDate(alert.updatedAt)} ${formatTime(alert.updatedAt)}`} />
            </div>
            {/* Alert source badge */}
            <div className="mt-3">
              <p className="label-eyebrow mb-1.5">Alert Source</p>
              <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold', src.classes)}>
                <SrcIcon className="h-3.5 w-3.5" />
                {src.label}
              </span>
            </div>
            {alert.affectedVillages.length > 0 && (
              <div className="mt-3">
                <p className="label-eyebrow mb-1.5">Affected Villages</p>
                <div className="flex flex-wrap gap-1.5">
                  {alert.affectedVillages.map((v) => (
                    <span key={v} className="rounded-md bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-700 dark:bg-ink-800/60 dark:text-ink-300">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* AI Analysis */}
          <Section title="AI Analysis" icon={<Brain className="h-4 w-4" />}>
            <div className={cn('rounded-xl border p-4', sev.bg, sev.border)}>
              <p className="text-sm leading-relaxed text-ink-800 dark:text-ink-100">{alert.aiSummary}</p>
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <p className="label-eyebrow mb-1">Reason for Alert</p>
                <p className="text-sm text-ink-600 dark:text-ink-300">{alert.aiReason}</p>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-ink-200/60 bg-ink-50/50 p-3 dark:border-ink-700/60 dark:bg-ink-800/40">
                <Gauge className="h-5 w-5 text-brand-500" />
                <div className="flex-1">
                  <p className="label-eyebrow">AI Confidence Score</p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-200/70 dark:bg-ink-700/60">
                      <div className={cn('h-full rounded-full transition-all duration-700', sev.dot)} style={{ width: `${alert.aiConfidence}%` }} />
                    </div>
                    <span className="stat-value text-sm text-ink-900 dark:text-white">{alert.aiConfidence}%</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="label-eyebrow mb-1">Recommended Action</p>
                <div className="rounded-xl border border-brand-200/50 bg-brand-50/50 p-3 dark:border-brand-500/20 dark:bg-brand-500/10">
                  <p className="text-sm text-ink-700 dark:text-ink-200">{alert.recommendedAction}</p>
                </div>
              </div>
            </div>
          </Section>

          {/* Emergency Response Departments */}
          <Section title="Emergency Response Departments" icon={<Shield className="h-4 w-4" />}>
            <div className="space-y-2.5">
              {alert.departments.map((dept) => (
                <DepartmentCard key={dept.id} dept={dept} onCall={() => setCallDept(dept)} />
              ))}
            </div>
          </Section>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-ink-200/60 p-4 dark:border-ink-700/60">
          <div className="grid grid-cols-3 gap-2">
            <Button variant="secondary" size="sm" onClick={onViewAlertArea}>
              {isWeather ? <CloudRain className="h-3.5 w-3.5" /> : <Navigation className="h-3.5 w-3.5" />}
              {isWeather ? 'Weather Area' : 'Flood Area'}
            </Button>
            <Button variant="secondary" size="sm" onClick={onViewEvacuation}>
              <AlertTriangle className="h-3.5 w-3.5" />
              Evacuation
            </Button>
            <Button variant="secondary" size="sm" onClick={onViewShelters}>
              <TentTree className="h-3.5 w-3.5" />
              Shelters
            </Button>
          </div>
        </div>
      </aside>

      {callDept && <DepartmentCallDialog dept={callDept} onClose={() => setCallDept(null)} />}
    </>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          {icon}
        </span>
        <h3 className="font-display text-sm font-semibold text-ink-900 dark:text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink-200/50 bg-ink-50/30 px-3 py-2 dark:border-ink-700/50 dark:bg-ink-800/30">
      <p className="label-eyebrow text-[10px]">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-ink-800 dark:text-ink-100">{value}</p>
    </div>
  );
}

function DepartmentCard({ dept, onCall }: { dept: EmergencyDepartment; onCall: () => void }) {
  const Icon = DEPT_ICONS[dept.icon] ?? Shield;
  const statusConfig = {
    available: { tone: 'success' as const, label: 'Available', color: 'text-success-600 dark:text-success-400' },
    busy: { tone: 'warning' as const, label: 'Busy', color: 'text-warning-600 dark:text-warning-400' },
    responding: { tone: 'danger' as const, label: 'Responding', color: 'text-danger-600 dark:text-danger-400' },
  };
  const sc = statusConfig[dept.status];
  const [pressed, setPressed] = useState(false);

  const handleCall = () => {
    const cleaned = dept.contactNumber.replace(/[^+\d]/g, '');
    const isMobile = /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(navigator.userAgent);
    setPressed(true);
    setTimeout(() => setPressed(false), 600);
    if (isMobile) {
      window.location.href = `tel:${cleaned}`;
    } else {
      onCall();
    }
  };

  return (
    <div className="rounded-xl border border-ink-200/60 bg-white/60 p-3 transition-all duration-300 hover:border-brand-300/50 hover:shadow-sm dark:border-ink-700/60 dark:bg-ink-800/40 dark:hover:border-brand-500/30">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-900 dark:text-white">{dept.name}</p>
            <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">{dept.areaOfResponsibility}</p>
          </div>
        </div>
        <Badge tone={sc.tone} dot>{sc.label}</Badge>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500 dark:text-ink-400">
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          ETA: {dept.estimatedResponseTime}
        </span>
        <span className="flex items-center gap-1 font-mono font-semibold text-ink-700 dark:text-ink-200">
          <Phone className="h-3.5 w-3.5" />
          {dept.contactNumber}
        </span>
      </div>
      <div className="mt-2.5">
        <button
          onClick={handleCall}
          className={cn(
            'inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-all duration-300 hover:bg-brand-700 active:scale-[0.98]',
            pressed && 'ring-2 ring-brand-300 scale-[0.98]',
          )}
        >
          <Phone className="h-3.5 w-3.5" />
          Call Department
        </button>
      </div>
    </div>
  );
}

function DepartmentCallDialog({ dept, onClose }: { dept: EmergencyDepartment; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const cleaned = dept.contactNumber.replace(/[^+\d]/g, '');

  const handleCopy = () => {
    navigator.clipboard?.writeText(cleaned).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-ink-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden />
      <div className="fixed left-1/2 top-1/2 z-[61] w-[90%] max-w-sm -translate-x-1/2 -translate-y-1/2 animate-fade-in-scale">
        <div className="rounded-2xl border border-ink-200/60 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-ink-700/60 dark:bg-ink-900/95">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                <Phone className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900 dark:text-white">{dept.name}</p>
                <p className="text-xs text-ink-500 dark:text-ink-400">24×7 Control Room</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-1 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 rounded-xl border border-ink-200/60 bg-ink-50/40 p-3 dark:border-ink-700/60 dark:bg-ink-800/30">
            <p className="label-eyebrow">Official Contact Number</p>
            <p className="mt-1 font-mono text-lg font-semibold text-ink-900 dark:text-white">{dept.contactNumber}</p>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="primary" size="md" className="flex-1" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Number'}
            </Button>
            <Button variant="secondary" size="md" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </>
  );
}

function formatCategory(cat: string): string {
  const map: Record<string, string> = {
    'information': 'Information',
    'advisory': 'Advisory',
    'watch': 'Watch',
    'warning': 'Warning',
    'emergency': 'Emergency',
    'critical-evacuation': 'Critical Evacuation',
  };
  return map[cat] ?? cat;
}
