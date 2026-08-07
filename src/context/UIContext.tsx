import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'floodshield:sidebar-open';

function readInitial(): boolean {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === 'true';
  } catch {
    // sessionStorage unavailable — fall through to default
  }
  return false;
}

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

const UIContext = createContext<UIState | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpenState] = useState<boolean>(readInitial);

  const setSidebarOpen = (open: boolean) => {
    setSidebarOpenState(open);
    try {
      sessionStorage.setItem(STORAGE_KEY, String(open));
    } catch {
      // ignore write failure
    }
  };

  const value = useMemo<UIState>(
    () => ({
      sidebarOpen,
      setSidebarOpen,
      toggleSidebar: () => setSidebarOpen(!sidebarOpen),
    }),
    [sidebarOpen],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUI(): UIState {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within a UIProvider');
  return ctx;
}
