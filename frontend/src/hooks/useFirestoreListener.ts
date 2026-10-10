/**
 * useFirestoreListener Hook
 *
 * Real-time listener hook for Firestore collections.
 * Handles subscription, unsubscription, caching, and error states.
 */

import { useEffect, useState, useCallback } from 'react';
import { UseQueryState } from '../types/index';

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Generic Firestore listener hook
 *
 * Usage:
 * const donor = useFirestoreListener('donors', 'donor-id');
 * const findings = useFirestoreListener('findings', { donorId: 'donor-1' });
 */
export function useFirestoreListener<T>(
  collectionPath: string,
  filterOrId?: string | Record<string, any>,
  options: { realtime?: boolean; cacheTime?: number } = {}
): UseQueryState<T> {
  const { realtime = true, cacheTime = 0 } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query endpoint
      let endpoint = `/api/${collectionPath}`;
      if (typeof filterOrId === 'string') {
        endpoint += `/${filterOrId}`;
      } else if (typeof filterOrId === 'object') {
        const params = new URLSearchParams();
        Object.entries(filterOrId).forEach(([key, value]) => {
          params.append(key, String(value));
        });
        endpoint += `?${params.toString()}`;
      }

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const json = await response.json();
      setData(json.data || json);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [collectionPath, filterOrId]);

  useEffect(() => {
    fetchData();

    if (realtime) {
      // Poll for updates at specified interval (default 30 seconds)
      const interval = setInterval(fetchData, cacheTime || 30000);
      return () => clearInterval(interval);
    }
  }, [fetchData, realtime, cacheTime]);

  return { data, loading, error };
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook to fetch donor by ID
 */
export function useDonor(donorId: string) {
  const [donor, setDonor] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!donorId) {
      setLoading(false);
      return;
    }

    const fetchDonor = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/donors/${donorId}`);
        if (!response.ok) throw new Error('Failed to fetch donor');
        const json = await response.json();
        setDonor(json.data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchDonor();
  }, [donorId]);

  return { donor, loading, error };
}

/**
 * Hook to fetch donor's findings
 */
export function useDonorFindings(donorId: string, limit: number = 10) {
  const [findings, setFindings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!donorId) {
      setLoading(false);
      return;
    }

    const fetchFindings = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/donors/${donorId}/findings?limit=${limit}`
        );
        if (!response.ok) throw new Error('Failed to fetch findings');
        const json = await response.json();
        setFindings(json.data?.items || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchFindings();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchFindings, 30000);
    return () => clearInterval(interval);
  }, [donorId, limit]);

  return { findings, loading, error };
}

/**
 * Hook to fetch donor's observations (vital signs)
 */
export function useDonorObservations(
  donorId: string,
  type?: 'BP' | 'Hb' | 'HR' | 'RR' | 'BMI',
  days?: number // omit for full history
) {
  const [observations, setObservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!donorId) {
      setLoading(false);
      return;
    }

    const fetchObservations = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (days) params.set('days', String(days));
        if (type) params.set('type', type);
        const query = `/api/donors/${donorId}/observations?${params}`;

        const response = await fetch(query);
        if (!response.ok) throw new Error('Failed to fetch observations');
        const json = await response.json();
        setObservations(json.data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchObservations();

    // Poll for updates every 60 seconds for vital signs
    const interval = setInterval(fetchObservations, 60000);
    return () => clearInterval(interval);
  }, [donorId, type, days]);

  return { observations, loading, error };
}

/**
 * Hook to fetch upcoming appointments
 */
export function useUpcomingAppointments(donorId: string) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!donorId) {
      setLoading(false);
      return;
    }

    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/donors/${donorId}/appointments?status=scheduled,confirmed`
        );
        if (!response.ok) throw new Error('Failed to fetch appointments');
        const json = await response.json();
        setAppointments(json.data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();

    // Poll for updates every 60 seconds
    const interval = setInterval(fetchAppointments, 60000);
    return () => clearInterval(interval);
  }, [donorId]);

  return { appointments, loading, error };
}

/**
 * Hook to fetch care plans
 */
export function useCarePlans(donorId: string) {
  const [carePlans, setCarePlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!donorId) {
      setLoading(false);
      return;
    }

    const fetchCarePlans = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/donors/${donorId}/care-plans`);
        if (!response.ok) throw new Error('Failed to fetch care plans');
        const json = await response.json();
        setCarePlans(json.data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchCarePlans();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchCarePlans, 30000);
    return () => clearInterval(interval);
  }, [donorId]);

  return { carePlans, loading, error };
}
