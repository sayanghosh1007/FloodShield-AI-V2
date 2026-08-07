import { ThemeProvider } from '@/context/ThemeContext';
import { UIProvider } from '@/context/UIContext';
import { ActiveIncidentProvider } from '@/context/ActiveIncidentContext';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { AppRouter } from '@/router';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <UIProvider>
          <ActiveIncidentProvider>
            <AppRouter />
          </ActiveIncidentProvider>
        </UIProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
