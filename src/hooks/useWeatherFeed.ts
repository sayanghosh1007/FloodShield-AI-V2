import { useCallback, useEffect, useRef, useState } from 'react';
import { getWeatherSnapshot, WEATHER_REFRESH_MS, type WeatherSnapshot } from '@/api/weatherApi';

interface WeatherFeedState {
  data: WeatherSnapshot | undefined;
  loading: boolean;
  refreshing: boolean;
  error: string | undefined;
  lastUpdated: string | undefined;
  refresh: () => void;
}

/**
 * Weather data feed with automatic 10-minute refresh and graceful error
 * handling. On a refresh failure, the previous good snapshot is retained
 * and the error is surfaced without blanking the dashboard.
 */
export function useWeatherFeed(): WeatherFeedState {
  const [data, setData] = useState<WeatherSnapshot | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  // Initial + manual refresh fetch
  useEffect(() => {
    let cancelled = false;
    const firstLoad = !data;
    firstLoad ? setLoading(true) : setRefreshing(true);
    setError(undefined);

    getWeatherSnapshot()
      .then((snap) => {
        if (!cancelled) {
          setData(snap);
          setLoading(false);
          setRefreshing(false);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Weather feed unavailable');
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);

  // Automatic refresh every 10 minutes
  const nonceRef = useRef(nonce);
  nonceRef.current = nonce;
  useEffect(() => {
    const id = window.setInterval(() => {
      setNonce((n) => n + 1);
    }, WEATHER_REFRESH_MS);
    return () => window.clearInterval(id);
  }, []);

  return {
    data,
    loading,
    refreshing,
    error,
    lastUpdated: data?.lastUpdated,
    refresh,
  };
}
