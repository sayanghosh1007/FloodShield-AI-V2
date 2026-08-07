import { ShieldAlert, Github, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const COLS = [
  {
    title: 'Platform',
    links: ['Dashboard', 'Flood Map', 'AI Forecast', 'Sensor Network'],
  },
  {
    title: 'Resources',
    links: ['Reports', 'Documentation', 'API Reference', 'Status'],
  },
  {
    title: 'Agency',
    links: ['About', 'Privacy', 'Terms', 'Contact'],
  },
];

export function Footer() {
  return (
    <footer className="mt-12 border-t border-ink-200/50 bg-white/50 backdrop-blur-xl dark:border-ink-800/50 dark:bg-ink-950/40">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 shadow-glow">
                <ShieldAlert className="h-5 w-5 text-white" strokeWidth={2.2} />
              </div>
              <div>
                <p className="font-display text-base font-semibold text-ink-900 dark:text-white">
                  FloodShield<span className="text-brand-500"> AI</span>
                </p>
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-400 dark:text-ink-500">
                  Disaster Management Platform
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm text-ink-500 dark:text-ink-400">
              Government-grade flood forecasting, sensor telemetry, and emergency response
              coordination — built for resilience in the face of climate volatility.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200/70 text-ink-500 transition hover:border-brand-300 hover:text-brand-600 dark:border-ink-700/70 dark:text-ink-400">
                <Github className="h-4 w-4" />
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200/70 text-ink-500 transition hover:border-brand-300 hover:text-brand-600 dark:border-ink-700/70 dark:text-ink-400">
                <Globe className="h-4 w-4" />
              </span>
            </div>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <p className="label-eyebrow mb-3">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l}>
                    <Link
                      to="/"
                      className="text-sm text-ink-500 transition hover:text-brand-600 dark:text-ink-400 dark:hover:text-brand-300"
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-ink-200/50 pt-6 text-xs text-ink-400 dark:border-ink-800/50 dark:text-ink-500 sm:flex-row">
          <p>© {new Date().getFullYear()} FloodShield AI · All telemetry simulated for demonstration.</p>
          <p className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
            All systems operational
          </p>
        </div>
      </div>
    </footer>
  );
}
