import {
  X,
  MapPin,
  Battery,
  Wifi,
  Clock,
  Calendar,
  Activity,
  Radio,
} from 'lucide-react';
import type { Sensor, SensorStatus } from '@/api/sensorApi';
import { sensorTypeLabel, SENSOR_TYPE_LIST } from '@/api/sensorApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { cn, formatTime, formatDate, severityColor } from '@/lib/utils';

const STATUS_META: Record<SensorStatus, { tone: 'success' | 'warning' | 'danger' | 'neutral'; label: string }> = {
  online: { tone: 'success', label: 'Online' },
  maintenance: { tone: 'warning', label: 'Maintenance' },
  warning: { tone: 'danger', label: 'Warning' },
  offline: { tone: 'danger', label: 'Offline' },
};

interface SensorDetailPanelProps {
  sensor: Sensor;
  onClose: () => void;
}

export function SensorDetailPanel({ sensor, onClose }: SensorDetailPanelProps) {
  const status = STATUS_META[sensor.status];
  const typeMeta = SENSOR_TYPE_LIST.find((t) => t.key === sensor.type);
  const batteryTone = sensor.battery < 20 ? 'danger' : sensor.battery < 40 ? 'warning' : 'success';
  const batteryColor = sensor.battery < 20 ? 'bg-danger-500' : sensor.battery < 40 ? 'bg-warning-500' : 'bg-success-500';
  const signalTone = sensor.signalStrength < 40 ? 'danger' : sensor.signalStrength < 60 ? 'warning' : 'success';

  return (
    <GlassCard className="overflow-hidden animate-fade-in-scale" hover>
      <div className="flex items-start justify-between gap-3 border-b border-ink-200/50 bg-gradient-to-br from-ink-950 to-brand-950/40 px-5 py-4 dark:border-ink-800/50">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">{typeMeta?.glyph ?? '📡'}</span>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-400">
              {sensorTypeLabel(sensor.type)}
            </p>
          </div>
          <h3 className="mt-1 font-display text-lg font-bold text-white">{sensor.name}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-400">
            <MapPin className="h-3 w-3 text-brand-400" />
            {sensor.district}, {sensor.state}
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

      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={status.tone} dot>{status.label}</Badge>
          <Badge tone={batteryTone}>
            <Battery className="mr-1 h-3 w-3" /> {sensor.battery}%
          </Badge>
          <Badge tone={signalTone}>
            <Wifi className="mr-1 h-3 w-3" /> {sensor.signalStrength}%
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InfoRow icon={<Radio className="h-4 w-4 text-brand-500" />} label="Sensor ID" value={sensor.id} mono />
          <InfoRow icon={<MapPin className="h-4 w-4 text-accent-500" />} label="GPS" value={`${sensor.lat.toFixed(3)}, ${sensor.lng.toFixed(3)}`} />
          <InfoRow icon={<Calendar className="h-4 w-4 text-ink-400" />} label="Installed" value={formatDate(sensor.installedAt)} />
          <InfoRow icon={<Clock className="h-4 w-4 text-ink-400" />} label="Last Comms" value={formatTime(sensor.lastCommunication)} />
        </div>

        <div className="space-y-3 rounded-xl border border-ink-200/50 bg-white/40 p-3.5 dark:border-ink-800/50 dark:bg-ink-900/40">
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-ink-500 dark:text-ink-400">
                <Battery className="h-3.5 w-3.5" /> Battery Level
              </span>
              <span className="font-semibold text-ink-700 dark:text-ink-200">{sensor.battery}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-200/70 dark:bg-ink-800/70">
              <div className={cn('h-full rounded-full transition-all duration-700', batteryColor)} style={{ width: `${sensor.battery}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-ink-500 dark:text-ink-400">
                <Wifi className="h-3.5 w-3.5" /> Signal Strength
              </span>
              <span className="font-semibold text-ink-700 dark:text-ink-200">{sensor.signalStrength}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-200/70 dark:bg-ink-800/70">
              <div
                className={cn('h-full rounded-full transition-all duration-700', sensor.signalStrength < 40 ? 'bg-danger-500' : sensor.signalStrength < 60 ? 'bg-warning-500' : 'bg-success-500')}
                style={{ width: `${sensor.signalStrength}%` }}
              />
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500">
            <Activity className="h-3.5 w-3.5" /> Live Readings
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {sensor.readings.map((reading) => {
              const sev = severityColor(reading.severity);
              return (
                <div key={reading.label} className={cn('rounded-xl border p-3', sev.bg, sev.border)}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400">{reading.label}</p>
                  <p className={cn('mt-1 font-display text-xl font-bold', sev.text)}>
                    {reading.value}
                    <span className="ml-1 text-xs font-medium text-ink-400">{reading.unit}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function InfoRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-ink-200/50 bg-white/40 px-3.5 py-2.5 dark:border-ink-800/50 dark:bg-ink-900/40">
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500">{label}</p>
      </div>
      <p className={cn('mt-1 text-sm font-semibold text-ink-800 dark:text-ink-100', mono && 'font-mono')}>{value}</p>
    </div>
  );
}
