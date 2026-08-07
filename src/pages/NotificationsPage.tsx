import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  Filter,
  RefreshCw,
  CheckCheck,
  Mail,
  MailOpen,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  X,
} from 'lucide-react';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  CATEGORY_META,
  SOURCE_META,
  PRIORITY_META,
  type AppNotification,
  type NotificationCategory,
  type NotificationStatus,
  type NotificationSource,
} from '@/api/notificationApi';
import type { Severity } from '@/types';
import { useQuery } from '@/hooks/useQuery';
import { useActiveIncident } from '@/context/ActiveIncidentContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn, timeAgo, severityColor, formatDate, formatTime } from '@/lib/utils';

type CatFilter = 'all' | NotificationCategory;
type SevFilter = 'all' | Severity;
type StatusFilter = 'all' | NotificationStatus;
type SourceFilter = 'all' | NotificationSource;
type DateRange = 'all' | '1h' | '6h' | '24h';

const SEVERITY_FILTERS: { key: SevFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'critical', label: 'Critical' },
  { key: 'warning', label: 'Warning' },
  { key: 'watch', label: 'Watch' },
  { key: 'advisory', label: 'Advisory' },
  { key: 'info', label: 'Info' },
];

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'read', label: 'Read' },
];

const SOURCE_FILTERS: { key: SourceFilter; label: string }[] = [
  { key: 'all', label: 'All Sources' },
  { key: 'ai', label: '🤖 AI Prediction' },
  { key: 'official', label: '📡 Official' },
  { key: 'verified', label: '✅ Verified' },
];

const DATE_FILTERS: { key: DateRange; label: string }[] = [
  { key: 'all', label: 'All Time' },
  { key: '1h', label: 'Last 1h' },
  { key: '6h', label: 'Last 6h' },
  { key: '24h', label: 'Last 24h' },
];

export function NotificationsPage() {
  const { data: snapshot, loading, error, refetch } = useQuery(getNotifications, []);
  const navigate = useNavigate();
  const { setIncident } = useActiveIncident();

  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState<CatFilter>('all');
  const [sevFilter, setSevFilter] = useState<SevFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateRange>('all');
  const [selected, setSelected] = useState<AppNotification | null>(null);

  useEffect(() => {
    const interval = setInterval(() => refetch(), 30_000);
    return () => clearInterval(interval);
  }, [refetch]);

  const notifications = useMemo(() => snapshot?.notifications ?? [], [snapshot?.notifications]);

  const allCategories = useMemo(
    () => Array.from(new Set(notifications.map((n) => n.category))) as NotificationCategory[],
    [notifications],
  );

  const filtered = useMemo(() => {
    const now = Date.now();
    return notifications
      .filter((n) => catFilter === 'all' || n.category === catFilter)
      .filter((n) => sevFilter === 'all' || n.severity === sevFilter)
      .filter((n) => statusFilter === 'all' || n.status === statusFilter)
      .filter((n) => sourceFilter === 'all' || n.source === sourceFilter)
      .filter((n) => {
        if (dateFilter === 'all') return true;
        const mins = (now - new Date(n.timestamp).getTime()) / 60_000;
        if (dateFilter === '1h') return mins <= 60;
        if (dateFilter === '6h') return mins <= 360;
        return mins <= 1440;
      })
      .filter((n) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          n.title.toLowerCase().includes(q) ||
          n.incidentName?.toLowerCase().includes(q) ||
          n.state.toLowerCase().includes(q) ||
          n.district.toLowerCase().includes(q)
        );
      });
  }, [notifications, catFilter, sevFilter, statusFilter, sourceFilter, dateFilter, query]);

  const handleMarkRead = useCallback((id: string) => {
    markNotificationRead(id);
    refetch();
  }, [refetch]);

  const handleMarkAllRead = useCallback(() => {
    markAllNotificationsRead();
    refetch();
  }, [refetch]);

  const handleNotificationClick = useCallback(
    (n: AppNotification) => {
      markNotificationRead(n.id);
      if (n.incidentId && n.incidentName) {
        setIncident({
          id: n.incidentId,
          name: n.incidentName,
          lat: n.lat ?? 22.5,
          lng: n.lng ?? 80,
          floodProbability: n.floodProbability ?? 0,
          riskTier: n.riskTier ?? 'moderate',
          state: n.state,
          river: n.river ?? '',
          district: n.district !== '—' ? n.district : undefined,
          severity: n.severity,
          lastUpdated: n.timestamp,
          sourceBadge: n.source === 'ai' ? 'ai' : n.source === 'official' ? 'official' : 'verified',
        });
      }
      navigate(n.route);
    },
    [navigate, setIncident],
  );

  const handleClearFilters = useCallback(() => {
    setQuery('');
    setCatFilter('all');
    setSevFilter('all');
    setStatusFilter('all');
    setSourceFilter('all');
    setDateFilter('all');
  }, []);

  const hasFilters = catFilter !== 'all' || sevFilter !== 'all' || statusFilter !== 'all' || sourceFilter !== 'all' || dateFilter !== 'all' || query.trim() !== '';

  if (loading && !snapshot) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-10 w-64 rounded" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  if (error && !snapshot) {
    return <ErrorState fullPage title="Notifications unavailable" message={error} onRetry={refetch} />;
  }

  const total = notifications.length;
  const unread = notifications.filter((n) => n.status === 'new').length;
  const critical = notifications.filter((n) => n.severity === 'critical' && n.status === 'new').length;
  const read = notifications.filter((n) => n.status === 'read').length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Communications"
        title="Notifications Dashboard"
        description="Full-page notification management — synchronized in real time with the header notification center. View, filter, search, and act on all platform alerts."
        actions={
          <div className="flex items-center gap-2">
            <Badge tone="brand" dot>Live · {snapshot ? timeAgo(snapshot.lastUpdated) : '—'}</Badge>
            <Button variant="secondary" size="sm" onClick={refetch}>
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button variant="primary" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="h-3.5 w-3.5" />
              Mark All Read
            </Button>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard icon={<Bell className="h-4 w-4" />} label="Total Notifications" value={total} sub="All categories" tone="brand" />
        <SummaryCard icon={<Mail className="h-4 w-4" />} label="Unread" value={unread} sub="Requires attention" tone="danger" pulse={unread > 0} />
        <SummaryCard icon={<AlertTriangle className="h-4 w-4" />} label="Critical" value={critical} sub="Emergency level" tone="danger" />
        <SummaryCard icon={<CheckCircle2 className="h-4 w-4" />} label="Read" value={read} sub="Acknowledged" tone="success" />
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, incident, state, or district..."
              className="h-11 w-full rounded-xl border border-ink-200/70 bg-white/60 pl-9 pr-3 text-sm text-ink-800 placeholder:text-ink-400 transition focus:border-brand-400 dark:border-ink-700/70 dark:bg-ink-900/50 dark:text-ink-100"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 shrink-0 text-ink-400" />
            {/* Status */}
            {STATUS_FILTERS.map((f) => (
              <FilterChip key={f.key} active={statusFilter === f.key} onClick={() => setStatusFilter(f.key)}>
                {f.label}
              </FilterChip>
            ))}
            <div className="mx-1 h-4 w-px bg-ink-200 dark:bg-ink-700" />
            {/* Severity */}
            {SEVERITY_FILTERS.map((f) => (
              <FilterChip key={f.key} active={sevFilter === f.key} onClick={() => setSevFilter(f.key)}>
                {f.label}
              </FilterChip>
            ))}
            <div className="mx-1 h-4 w-px bg-ink-200 dark:bg-ink-700" />
            {/* Category */}
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value as CatFilter)}
              className="rounded-full border border-ink-200/70 bg-white/60 px-3 py-1.5 text-xs font-semibold text-ink-600 transition focus:border-brand-400 dark:border-ink-700/70 dark:bg-ink-900/50 dark:text-ink-300"
            >
              <option value="all">All Categories</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>{CATEGORY_META[c].icon} {CATEGORY_META[c].label}</option>
              ))}
            </select>
            {/* Source */}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
              className="rounded-full border border-ink-200/70 bg-white/60 px-3 py-1.5 text-xs font-semibold text-ink-600 transition focus:border-brand-400 dark:border-ink-700/70 dark:bg-ink-900/50 dark:text-ink-300"
            >
              {SOURCE_FILTERS.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
            {/* Date */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateRange)}
              className="rounded-full border border-ink-200/70 bg-white/60 px-3 py-1.5 text-xs font-semibold text-ink-600 transition focus:border-brand-400 dark:border-ink-700/70 dark:bg-ink-900/50 dark:text-ink-300"
            >
              {DATE_FILTERS.map((d) => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </select>
            {hasFilters && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1 rounded-full bg-danger-50 px-3 py-1.5 text-xs font-semibold text-danger-600 transition hover:bg-danger-100 dark:bg-danger-500/10 dark:text-danger-400"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Notification list + detail panel */}
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        {/* List */}
        <div className="space-y-2.5">
          {filtered.length === 0 ? (
            <GlassCard className="flex flex-col items-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400 dark:bg-ink-800/60">
                <Bell className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-ink-800 dark:text-ink-100">No notifications found</h3>
              <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">Try adjusting your filters or search query.</p>
            </GlassCard>
          ) : (
            filtered.map((n) => (
              <NotificationCard
                key={n.id}
                notification={n}
                isSelected={selected?.id === n.id}
                onSelect={() => setSelected(n)}
                onMarkRead={() => handleMarkRead(n.id)}
                onNavigate={() => handleNotificationClick(n)}
              />
            ))
          )}
        </div>

        {/* Detail panel */}
        <div className="xl:sticky xl:top-4 xl:self-start">
          {selected ? (
            <NotificationDetail notification={selected} onClose={() => setSelected(null)} onMarkRead={() => handleMarkRead(selected.id)} onNavigate={() => handleNotificationClick(selected)} />
          ) : (
            <GlassCard className="flex flex-col items-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
                <MailOpen className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-ink-800 dark:text-ink-100">Select a notification</h3>
              <p className="mt-1.5 max-w-xs text-sm text-ink-500 dark:text-ink-400">
                Click any notification to view full details and navigate to the relevant dashboard.
              </p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationCard({
  notification: n,
  isSelected,
  onSelect,
  onMarkRead,
  onNavigate,
}: {
  notification: AppNotification;
  isSelected: boolean;
  onSelect: () => void;
  onMarkRead: () => void;
  onNavigate: () => void;
}) {
  const sev = severityColor(n.severity);
  const catMeta = CATEGORY_META[n.category];
  const srcMeta = SOURCE_META[n.source];
  const prioMeta = PRIORITY_META[n.priority];
  const isNew = n.status === 'new';

  return (
    <GlassCard
      hover
      glow={n.severity === 'critical' ? 'danger' : n.severity === 'warning' ? 'warning' : 'brand'}
      className={cn(
        'cursor-pointer p-4 transition-all duration-300',
        isSelected && 'ring-2 ring-brand-400',
        isNew && 'border-l-4',
        isNew && sev.border,
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        {/* Category icon */}
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg', sev.bg)}>
          {catMeta.icon}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {isNew && (
                  <span className="rounded-full bg-danger-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                    New
                  </span>
                )}
                <p className={cn('truncate text-sm font-semibold', sev.text)}>{n.title}</p>
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs text-ink-500 dark:text-ink-400">{n.description}</p>
            </div>
            <span className="shrink-0 text-[10px] text-ink-400">{timeAgo(n.timestamp)}</span>
          </div>

          {/* Badges */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <Badge tone="neutral" dot>{catMeta.label}</Badge>
            <Badge tone={prioMeta.tone}>{prioMeta.label}</Badge>
            <span className="flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-medium text-ink-600 dark:bg-ink-800/60 dark:text-ink-300">
              {srcMeta.icon} {srcMeta.label}
            </span>
            <span className="text-[10px] text-ink-400">
              {n.district !== '—' ? `${n.district}, ${n.state}` : n.state}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2 border-t border-ink-100/50 pt-2.5 dark:border-ink-800/40">
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(); }}
          className="flex items-center gap-1 text-xs font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400"
        >
          Go to Dashboard <ArrowRight className="h-3 w-3" />
        </button>
        {isNew && (
          <button
            onClick={(e) => { e.stopPropagation(); onMarkRead(); }}
            className="flex items-center gap-1 text-xs font-medium text-ink-500 transition hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200"
          >
            <CheckCheck className="h-3 w-3" /> Mark Read
          </button>
        )}
      </div>
    </GlassCard>
  );
}

function NotificationDetail({
  notification: n,
  onClose,
  onMarkRead,
  onNavigate,
}: {
  notification: AppNotification;
  onClose: () => void;
  onMarkRead: () => void;
  onNavigate: () => void;
}) {
  const sev = severityColor(n.severity);
  const catMeta = CATEGORY_META[n.category];
  const srcMeta = SOURCE_META[n.source];
  const prioMeta = PRIORITY_META[n.priority];

  return (
    <GlassCard className="overflow-hidden animate-fade-in-scale" hover>
      {/* Header */}
      <div className={cn('flex items-start justify-between gap-3 border-b px-5 py-4', sev.border, sev.bg)}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">{catMeta.icon}</span>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-400">
              {catMeta.label}
            </p>
          </div>
          <h3 className={cn('mt-1 font-display text-lg font-bold', sev.text)}>{n.title}</h3>
          <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
            {n.district !== '—' ? `${n.district}, ${n.state}` : n.state}
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
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {n.status === 'new' && (
            <Badge tone="danger" dot>New</Badge>
          )}
          <Badge tone={prioMeta.tone}>{prioMeta.label} Priority</Badge>
          <Badge tone={n.severity === 'critical' ? 'danger' : n.severity === 'warning' ? 'warning' : n.severity === 'watch' ? 'brand' : 'neutral'}>
            {n.severity}
          </Badge>
          <span className="flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-medium text-ink-600 dark:bg-ink-800/60 dark:text-ink-300">
            {srcMeta.icon} {srcMeta.label}
          </span>
        </div>

        {/* Description */}
        <div className={cn('rounded-xl border p-4', sev.bg, sev.border)}>
          <p className="text-sm leading-relaxed text-ink-700 dark:text-ink-200">{n.description}</p>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-3">
          <DetailRow label="Notification ID" value={n.id} mono />
          <DetailRow label="Category" value={catMeta.label} />
          <DetailRow label="State" value={n.state} />
          <DetailRow label="District" value={n.district} />
          <DetailRow label="Date" value={formatDate(n.timestamp)} />
          <DetailRow label="Time" value={formatTime(n.timestamp)} />
          {n.incidentName && <DetailRow label="Incident" value={n.incidentName} />}
          <DetailRow label="Status" value={n.status === 'new' ? 'New' : 'Read'} />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={onNavigate} className="flex-1">
            <ArrowRight className="h-3.5 w-3.5" />
            Go to Dashboard
          </Button>
          {n.status === 'new' && (
            <Button variant="secondary" size="sm" onClick={onMarkRead}>
              <CheckCheck className="h-3.5 w-3.5" />
              Mark Read
            </Button>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

function SummaryCard({ icon, label, value, sub, tone, pulse }: { icon: React.ReactNode; label: string; value: number; sub: string; tone: 'brand' | 'danger' | 'success' | 'warning'; pulse?: boolean }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
    danger: 'bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-400',
    success: 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400',
    warning: 'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400',
  };
  return (
    <GlassCard className="p-4" hover glow={tone === 'danger' ? 'danger' : 'brand'}>
      <div className="flex items-center gap-2.5">
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', tones[tone])}>
          {pulse ? (
            <span className="relative flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 bg-danger-500" />
              <span className="relative">{icon}</span>
            </span>
          ) : icon}
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500">{label}</p>
          <p className="font-display text-xl font-bold text-ink-900 dark:text-white">{value}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-ink-500 dark:text-ink-400">{sub}</p>
    </GlassCard>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-ink-200/50 bg-white/40 px-3.5 py-2.5 dark:border-ink-800/50 dark:bg-ink-900/40">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500">{label}</p>
      <p className={cn('mt-1 text-sm font-semibold text-ink-800 dark:text-ink-100', mono && 'font-mono')}>{value}</p>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-300',
        active
          ? 'bg-brand-600 text-white shadow-glass-sm'
          : 'bg-white/60 text-ink-600 hover:bg-brand-50 hover:text-brand-700 dark:bg-ink-900/50 dark:text-ink-300',
      )}
    >
      {children}
    </button>
  );
}
