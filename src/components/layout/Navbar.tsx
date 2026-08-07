import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Moon, Sun, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useUI } from '@/context/UIContext';
import { useActiveIncident } from '@/context/ActiveIncidentContext';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@/hooks/useQuery';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  CATEGORY_META,
  type AppNotification,
} from '@/api/notificationApi';
import { cn, timeAgo } from '@/lib/utils';

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { toggleSidebar } = useUI();
  const { setIncident } = useActiveIncident();
  const navigate = useNavigate();
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { data: notifSnapshot, refetch } = useQuery(getNotifications, []);

  // Auto-refresh notifications every 30s
  useEffect(() => {
    const interval = setInterval(refetch, 30_000);
    return () => clearInterval(interval);
  }, [refetch]);

  // Close panel on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    }
    if (panelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [panelOpen]);

  const unreadCount = notifSnapshot?.unreadCount ?? 0;
  const notifications = notifSnapshot?.notifications ?? [];

  function handleNotificationClick(n: AppNotification) {
    markNotificationRead(n.id);
    if (n.incidentId && n.incidentName) {
      setIncident({
        id: n.incidentId,
        name: n.incidentName,
        lat: n.lat ?? 25.61,
        lng: n.lng ?? 85.17,
        floodProbability: n.floodProbability ?? 65,
        riskTier: n.riskTier ?? 'high',
        state: n.state,
        river: n.river ?? 'Ganga',
        district: n.district !== '—' ? n.district : undefined,
        severity: n.severity,
        lastUpdated: n.timestamp,
        sourceBadge: n.source === 'ai' ? 'ai' : n.source === 'official' ? 'official' : 'verified',
      });
    }
    navigate(n.route);
    setPanelOpen(false);
    refetch();
  }

  function handleMarkAll() {
    markAllNotificationsRead();
    refetch();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/30 bg-white/80 shadow-sm backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-ink-950/80">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        {/* Sidebar toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="transition-transform duration-300 hover:scale-105"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo + platform name */}
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="FloodShield AI"
            className="h-9 w-auto shrink-0 object-contain"
            style={{ maxHeight: 36 }}
          />
          <div className="hidden sm:block">
            <p className="font-display text-base font-semibold leading-tight text-ink-900 dark:text-white">
              FloodShield AI
            </p>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-400 dark:text-ink-500">
              Disaster Management Platform
            </p>
          </div>
        </Link>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Notification center */}
          <div className="relative" ref={panelRef}>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              onClick={() => setPanelOpen((v) => !v)}
              className="relative"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-ink-950">
                  {unreadCount}
                </span>
              )}
            </Button>

            {/* Notification panel */}
            {panelOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 origin-top-right animate-fade-in-scale rounded-2xl border border-white/30 bg-white/90 shadow-glass-lg backdrop-blur-xl dark:border-white/10 dark:bg-ink-900/90 sm:w-96">
                <div className="flex items-center justify-between border-b border-ink-200/50 px-4 py-3 dark:border-ink-800/50">
                  <div>
                    <p className="text-sm font-semibold text-ink-900 dark:text-white">Notifications</p>
                    <p className="text-[11px] text-ink-500 dark:text-ink-400">
                      {unreadCount} unread
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAll}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-brand-600 transition hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
                    >
                      <Check className="h-3 w-3" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-ink-400 dark:text-ink-500">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const cat = CATEGORY_META[n.category];
                      const isNew = n.status === 'new';
                      return (
                        <button
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={cn(
                            'flex w-full items-start gap-3 border-b border-ink-100/50 px-4 py-3 text-left transition hover:bg-brand-50/50 dark:border-ink-800/40 dark:hover:bg-brand-500/5',
                            isNew && 'bg-brand-50/30 dark:bg-brand-500/5',
                          )}
                        >
                          <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', cat.dot, !isNew && 'opacity-40')} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-ink-800 dark:text-ink-100">
                              {n.title}
                            </p>
                            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-ink-500 dark:text-ink-400">
                              <span>{cat.icon} {cat.label}</span>
                              <span>·</span>
                              <span>{timeAgo(n.timestamp)}</span>
                              {isNew && (
                                <span className="ml-auto rounded-full bg-danger-500 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                                  New
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            className="transition-transform duration-300 hover:scale-105"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
