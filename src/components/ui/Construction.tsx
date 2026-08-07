import type { ReactNode } from 'react';
import { Hammer, Sparkles } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { Badge } from './Badge';

interface ConstructionProps {
  icon: ReactNode;
  features: string[];
  title: string;
}

/** A polished "module under active development" panel used by placeholder pages. */
export function Construction({ icon, features, title }: ConstructionProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <GlassCard className="lg:col-span-2 p-8" hover>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-600 dark:text-brand-300">
            {icon}
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-white">{title}</h2>
            <p className="text-sm text-ink-500 dark:text-ink-400">Module blueprint · active development</p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-dashed border-brand-300/50 bg-brand-50/40 p-5 dark:border-brand-500/20 dark:bg-brand-500/5">
          <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300">
            <Hammer className="h-4 w-4" />
            <span className="text-sm font-semibold">Coming online soon</span>
          </div>
          <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">
            This module is part of the FloodShield AI roadmap and shares the same data layer,
            design system, and access controls as the live dashboard.
          </p>
        </div>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {features.map((f) => (
            <li
              key={f}
              className="flex items-start gap-2.5 rounded-xl border border-ink-200/60 bg-white/50 p-3 dark:border-ink-800/60 dark:bg-ink-900/40"
            >
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
              <span className="text-sm text-ink-600 dark:text-ink-300">{f}</span>
            </li>
          ))}
        </ul>
      </GlassCard>

      <GlassCard className="p-6">
        <Badge tone="brand" dot>On roadmap</Badge>
        <h3 className="mt-3 font-display text-base font-semibold text-ink-900 dark:text-white">
          Why this matters
        </h3>
        <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
          FloodShield AI modules share a unified telemetry backbone. Every new view — maps,
          forecasts, reports — plugs into the same sensor network that powers the dashboard,
          so operators get one consistent source of truth.
        </p>
        <div className="mt-4 space-y-2">
          {['Unified data layer', 'Role-based access', 'Audit-ready exports'].map((item) => (
            <div key={item} className="flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400">
              <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
              {item}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
