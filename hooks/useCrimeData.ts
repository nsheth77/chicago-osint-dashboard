import { useState, useEffect } from 'react';
import { Crime } from '@/types/crime';

interface CrimeApiResponse {
  success: boolean;
  count: number;
  lastUpdated: string;
  data: Crime[];
  error?: string;
}

/**
 * Hook to fetch crime data with automatic 5-minute refresh
 * @param limit - Maximum number of crimes to fetch
 * @param daysBack - Number of days to look back
 */
export function useCrimeData(limit: number = 1000, daysBack: number = 7) {
  const [crimes, setCrimes] = useState<Crime[]>([]);
  const [count, setCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const fetchData = async () => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
      const url = `${API_BASE}/crimes?limit=${limit}&days=${daysBack}`;
      console.log('🔵 Starting fetch...', url);
      setIsLoading(true);
      const response = await fetch(url);

      console.log('🟢 Fetch response received:', response.status);

      if (!response.ok) {
        throw new Error('Failed to fetch crime data');
      }

      const data: CrimeApiResponse = await response.json();
      console.log('🟢 Data parsed:', data.count, 'crimes');

      if (data.success) {
        setCrimes(data.data);
        setCount(data.count);
        setLastUpdated(new Date(data.lastUpdated));
        setIsError(false);
        setError(undefined);
        console.log('✅ State updated with', data.data.length, 'crimes');
      } else {
        setIsError(true);
        setError(data.error || 'Unknown error');
        console.log('❌ API returned error:', data.error);
      }
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err.message : 'Failed to fetch crime data');
      console.error('❌ Crime data fetch error:', err);
    } finally {
      setIsLoading(false);
      console.log('🏁 Fetch complete');
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Set up auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, daysBack]);

  return {
    crimes,
    count,
    lastUpdated,
    isLoading,
    isError,
    error,
    refresh: fetchData,
  };
}
