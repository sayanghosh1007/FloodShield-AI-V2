import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  fullPage?: boolean;
}

/** Inline error panel used inside data views. */
export function ErrorState({
  title = 'Unable to load data',
  message = 'The telemetry stream could not be reached. Please retry.',
  onRetry,
  fullPage = false,
}: ErrorStateProps) {
  return (
    <div
      className={
        fullPage
          ? 'app-bg flex min-h-screen flex-col items-center justify-center px-6 text-center'
          : 'glass-panel flex flex-col items-center justify-center px-6 py-12 text-center'
      }
    >
      <div className="relative mb-5 flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 rounded-2xl bg-danger-500/20 animate-pulse-ring" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-500/15 text-danger-600 dark:text-danger-400">
          <AlertTriangle className="h-7 w-7" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-ink-900 dark:text-ink-50">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-ink-500 dark:text-ink-400">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary" size="sm" className="mt-5">
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
}

interface NotFoundProps {
  code?: string;
  message?: string;
}

export function NotFound({ code = '404', message = 'This page could not be located in the FloodShield network.' }: NotFoundProps) {
  return (
    <div className="app-bg flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-7xl font-bold gradient-text sm:text-8xl">{code}</p>
      <h2 className="mt-4 text-xl font-semibold text-ink-900 dark:text-ink-50">Page not found</h2>
      <p className="mt-1.5 max-w-md text-sm text-ink-500 dark:text-ink-400">{message}</p>
      <Link to="/" className="mt-6">
        <Button variant="primary" size="md">
          <Home className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}

/** Top-level error boundary fallback. */
export function AppCrash({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    if (import.meta.env.DEV) console.error(error);
  }, [error]);

  return (
    <div className="app-bg flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
        <span className="absolute inset-0 rounded-2xl bg-danger-500/20 animate-pulse-ring" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-500/15 text-danger-600 dark:text-danger-400">
          <AlertTriangle className="h-8 w-8" />
        </div>
      </div>
      <h1 className="text-2xl font-semibold text-ink-900 dark:text-ink-50">FloodShield hit an unexpected fault</h1>
      <p className="mt-2 max-w-lg text-sm text-ink-500 dark:text-ink-400">
        The application encountered an error and needs to recover. Your data is safe.
      </p>
      <Button onClick={reset} variant="primary" size="md" className="mt-6">
        <RefreshCw className="h-4 w-4" />
        Recover application
      </Button>
    </div>
  );
}
