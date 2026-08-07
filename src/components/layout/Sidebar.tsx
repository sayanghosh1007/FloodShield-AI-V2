import {
  LayoutDashboard,
  AlertTriangle,
  Map,
  Activity,
  CloudSun,
  BrainCircuit,
  Route,
  Home,
  Bell,
  X,
  Waves,
  Siren,
  Tent,
  ShieldCheck,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useUI } from '@/context/UIContext';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { useQuery } from '@/hooks/useQuery';
import { getFloodPrediction } from '@/api/floodPredictionApi';
import { getAlertSnapshot } from '@/api/alertApi';
import { getShelters } from '@/api/evacuationApi';

const PRIMARY = [
  { to: '/', label: 'Main Dashboard', icon: LayoutDashboard, end: true },
  { to: '/weather', label: 'Weather Intelligence', icon: CloudSun },
  { to: '/flood-prediction', label: 'Flood Prediction', icon: BrainCircuit },
  { to: '/evacuation', label: 'Evacuation Planning', icon: Route },
  { to: '/shelters', label: 'Shelter Management', icon: Home },
  { to: '/alerts', label: 'Alerts & Warnings', icon: AlertTriangle },
];

const INTELLIGENCE = [
  { to: '/map', label: 'Flood Map', icon: Map },
  { to: '/sensors', label: 'Sensor Network', icon: Activity },
];

const SECONDARY = [
  { to: '/notifications', label: 'Notifications', icon: Bell },
];

interface NavItemProps {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  badge?: string;
  onClick?: () => void;
}

function NavItem({ to, label, icon: Icon, end, badge, onClick }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <Badge tone="danger" className="px-1.5 py-0 text-[10px]">
          {badge}
        </Badge>
      )}
    </NavLink>
  );
}

type SystemHealth = 'operational' | 'maintenance' | 'partial' | 'critical';

const HEALTH_META: Record<SystemHealth, { label: string; dot: string; text: string; pulse: boolean }> = {
  operational: { label: 'Operational', dot: 'bg-success-500', text: 'text-success-600 dark:text-success-400', pulse: true },
  maintenance: { label: 'Maintenance', dot: 'bg-warning-500', text: 'text-warning-600 dark:text-warning-400', pulse: false },
  partial: { label: 'Partial Outage', dot: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400', pulse: false },
  critical: { label: 'Critical Issue', dot: 'bg-danger-500', text: 'text-danger-600 dark:text-danger-400', pulse: true },
};

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUI();
  const { data: floodPrediction } = useQuery(getFloodPrediction, []);
  const { data: alertSnapshot } = useQuery(() => getAlertSnapshot(null), []);
  const { data: shelterSnapshot } = useQuery(getShelters, []);

  const activeFloodAreas = floodPrediction?.liveFloods?.length ?? 0;
  const activeAlerts = alertSnapshot?.analytics?.activeAlerts ?? 0;
  const activeShelters = shelterSnapshot?.shelters?.filter(
    (s) => s.status === 'open' || s.status === 'active',
  ).length ?? 0;
  const activeEmergencyResponses = Math.max(0, activeFloodAreas + Math.floor(activeAlerts / 2));
  const systemHealth: SystemHealth = 'operational';

  const health = HEALTH_META[systemHealth];

  return (
    <>
      {/* Scrim — click outside to close on all devices */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink-950/40 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/30 bg-white/80 shadow-glass-lg backdrop-blur-xl transition-transform ease-smooth dark:border-white/10 dark:bg-ink-950/80',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ transitionDuration: '300ms' }}
        aria-label="Primary navigation"
        aria-hidden={!sidebarOpen}
      >
        {/* Brand block */}
        <div className="flex h-16 items-center justify-between border-b border-ink-200/50 px-5 dark:border-ink-800/50">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="FloodShield AI"
              className="h-8 w-auto shrink-0 object-contain"
              style={{ maxHeight: 32 }}
            />
            <div>
              <p className="font-display text-sm font-semibold leading-tight text-ink-900 dark:text-white">
                FloodShield<span className="text-brand-500"> AI</span>
              </p>
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-400 dark:text-ink-500">
                Disaster Management
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* System status card */}
        <div className="px-4 pt-4">
          <div className="glass-panel rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="label-eyebrow">System Status</span>
              <span className={cn('flex items-center gap-1.5 text-[11px] font-semibold', health.text)}>
                <span className="relative flex h-2 w-2">
                  {health.pulse && (
                    <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-75', health.dot)} />
                  )}
                  <span className={cn('relative inline-flex h-2 w-2 rounded-full', health.dot)} />
                </span>
                {health.label}
              </span>
            </div>
            <div className="mt-3 space-y-2.5">
              <StatusRow icon={<Waves className="h-3.5 w-3.5" />} label="Active Flood Areas" value={activeFloodAreas} tone="text-danger-600 dark:text-danger-400" />
              <StatusRow icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Active Alerts" value={activeAlerts} tone="text-warning-600 dark:text-warning-400" />
              <StatusRow icon={<Tent className="h-3.5 w-3.5" />} label="Active Shelters" value={activeShelters} tone="text-success-600 dark:text-success-400" />
              <StatusRow icon={<Siren className="h-3.5 w-3.5" />} label="Emergency Responses" value={activeEmergencyResponses} tone="text-brand-600 dark:text-brand-400" />
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="label-eyebrow mb-2 px-3">Operations</p>
          {PRIMARY.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              end={item.end}
              badge={item.badge}
              onClick={() => setSidebarOpen(false)}
            />
          ))}

          <p className="label-eyebrow mb-2 mt-5 px-3">Intelligence</p>
          {INTELLIGENCE.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              onClick={() => setSidebarOpen(false)}
            />
          ))}

          <p className="label-eyebrow mb-2 mt-5 px-3">System</p>
          {SECONDARY.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              onClick={() => setSidebarOpen(false)}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-ink-200/50 p-4 dark:border-ink-800/50">
          <div className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 p-3.5 text-white shadow-glow">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-xs font-semibold">National EOC Coverage</p>
              <p className="mt-0.5 text-[11px] text-brand-100">
                {activeFloodAreas + activeShelters + activeEmergencyResponses} active operations
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function StatusRow({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-[11px] text-ink-500 dark:text-ink-400">
        <span className={tone}>{icon}</span>
        {label}
      </span>
      <span className={cn('stat-value text-sm font-bold', tone)}>{value}</span>
    </div>
  );
}
