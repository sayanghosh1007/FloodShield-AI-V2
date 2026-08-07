import { Loader2, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FullPageLoaderProps {
  label?: string;
}

/** Full-viewport loader shown while the app shell boots. */
export function FullPageLoader({ label = 'Initializing FloodShield AI' }: FullPageLoaderProps) {
  return (
    <div className="app-bg fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink-50 dark:bg-ink-950">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <span className="absolute inset-0 rounded-2xl bg-brand-500/20 animate-pulse-ring" />
        <span className="absolute inset-2 rounded-2xl bg-brand-500/30 animate-pulse-ring [animation-delay:0.4s]" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 shadow-glow">
          <ShieldAlert className="h-8 w-8 text-white" strokeWidth={2.2} />
        </div>
      </div>
      <div className="mt-6 flex items-center gap-2 text-sm font-medium text-ink-500 dark:text-ink-400">
        <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
        <span>{label}</span>
      </div>
      <div className="mt-3 h-1 w-40 overflow-hidden rounded-full bg-ink-200/60 dark:bg-ink-800/60">
        <div className="h-full w-1/2 animate-shimmer rounded-full bg-gradient-to-r from-transparent via-brand-500 to-transparent" />
      </div>
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin', className)} />;
}

export function CardSkeleton() {
  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="skeleton h-9 w-9 rounded-xl" />
          <div className="space-y-1.5">
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton h-2.5 w-16 rounded" />
          </div>
        </div>
        <div className="skeleton h-5 w-12 rounded-full" />
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div className="skeleton h-7 w-20 rounded" />
        <div className="skeleton h-9 w-24 rounded" />
      </div>
      <div className="skeleton mt-3 h-1.5 w-full rounded-full" />
    </div>
  );
}

export function DashboardSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ animationDelay: `${i * 0.04}s` }} className="animate-fade-in-scale">
          <CardSkeleton />
        </div>
      ))}
    </div>
  );
}
