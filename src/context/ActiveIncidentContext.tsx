import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type AlertSourceBadge = 'ai' | 'official' | 'verified';

export interface ActiveIncident {
  id: string;
  name: string;
  lat: number;
  lng: number;
  floodProbability: number;
  riskTier: string;
  state: string;
  river: string;
  /** District name if available. */
  district?: string;
  /** Severity label, e.g. "Extreme", "High", "Moderate". */
  severity?: string;
  /** Alert level, e.g. "Red", "Orange", "Yellow". */
  alertLevel?: string;
  /** Predicted water depth in meters. */
  predictedDepth?: number;
  /** Population at risk. */
  populationAtRisk?: number;
  /** ISO timestamp of last update. */
  lastUpdated?: string;
  /** AI confidence score 0–100. */
  aiConfidence?: number;
  /** Source badge: AI prediction, official source, or verified. */
  sourceBadge?: AlertSourceBadge;
  /** Radius of the flood area in meters (for map circle). */
  radius?: number;
}

interface ActiveIncidentState {
  incident: ActiveIncident | null;
  setIncident: (incident: ActiveIncident | null) => void;
  clearIncident: () => void;
}

const ActiveIncidentContext = createContext<ActiveIncidentState | undefined>(undefined);

export function ActiveIncidentProvider({ children }: { children: ReactNode }) {
  const [incident, setIncident] = useState<ActiveIncident | null>(null);

  const value = useMemo<ActiveIncidentState>(
    () => ({
      incident,
      setIncident,
      clearIncident: () => setIncident(null),
    }),
    [incident],
  );

  return <ActiveIncidentContext.Provider value={value}>{children}</ActiveIncidentContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useActiveIncident(): ActiveIncidentState {
  const ctx = useContext(ActiveIncidentContext);
  if (!ctx) throw new Error('useActiveIncident must be used within an ActiveIncidentProvider');
  return ctx;
}
