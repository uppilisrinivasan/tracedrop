/**
 * Firestore Client Service
 *
 * Provides query helpers and real-time listeners for Firestore collections.
 * Handles authentication, caching, and real-time updates.
 */

import {
  Donor,
  Finding,
  Observation,
  CarePlan,
  Appointment,
  Communication,
  Donation,
  ApiResponse,
  PaginatedResponse,
} from '../types/index';

// ============================================================================
// INITIALIZATION & CONFIGURATION
// ============================================================================

/**
 * Initialize Firestore client with API base URL
 * In production, use Firebase SDK directly
 * For MVP, using REST API through backend
 */
const API_BASE_URL = '/api';

interface RequestOptions extends RequestInit {
  retries?: number;
  timeout?: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generic fetch wrapper with error handling and retry logic
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    retries = 3,
    timeout = 10000,
    ...fetchOptions
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (retries > 0 && error instanceof Error && error.name === 'AbortError') {
      return apiRequest<T>(endpoint, { ...options, retries: retries - 1 });
    }
    throw error;
  }
}

/**
 * Cache implementation for query results
 */
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCacheKey(...parts: string[]): string {
  return parts.join(':');
}

function getFromCache<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  cache.delete(key);
  return null;
}

function setInCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

function invalidateCache(pattern: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(pattern)) {
      cache.delete(key);
    }
  }
}

// ============================================================================
// DONOR QUERIES
// ============================================================================

/**
 * Get single donor by ID
 * Typically the currently authenticated user
 */
export async function getDonor(donorId: string): Promise<Donor> {
  const cacheKey = getCacheKey('donor', donorId);
  const cached = getFromCache<Donor>(cacheKey);
  if (cached) return cached;

  const response = await apiRequest<ApiResponse<Donor>>(
    `/donors/${donorId}`,
    { method: 'GET' }
  );

  if (!response.success || !response.data) {
    throw new Error(`Failed to fetch donor: ${response.error}`);
  }

  setInCache(cacheKey, response.data);
  return response.data;
}

/**
 * Get all findings for a donor (paginated)
 */
export async function getDonorFindings(
  donorId: string,
  limit: number = 10,
  offset: number = 0
): Promise<PaginatedResponse<Finding>> {
  const cacheKey = getCacheKey('donor', donorId, 'findings', limit, offset);
  const cached = getFromCache<PaginatedResponse<Finding>>(cacheKey);
  if (cached) return cached;

  const response = await apiRequest<ApiResponse<PaginatedResponse<Finding>>>(
    `/donors/${donorId}/findings?limit=${limit}&offset=${offset}`,
    { method: 'GET' }
  );

  if (!response.success || !response.data) {
    throw new Error(`Failed to fetch findings: ${response.error}`);
  }

  setInCache(cacheKey, response.data);
  return response.data;
}

/**
 * Get vital sign observations for last N days
 * Used for trend charts
 */
export async function getDonorObservations(
  donorId: string,
  days: number = 90,
  type?: 'BP' | 'Hb' | 'HR' | 'RR' | 'BMI' | 'lab'
): Promise<Observation[]> {
  const cacheKey = getCacheKey('donor', donorId, 'observations', days, type || 'all');
  const cached = getFromCache<Observation[]>(cacheKey);
  if (cached) return cached;

  let query = `/donors/${donorId}/observations?days=${days}`;
  if (type) query += `&type=${type}`;

  const response = await apiRequest<ApiResponse<Observation[]>>(
    query,
    { method: 'GET' }
  );

  if (!response.success || !response.data) {
    throw new Error(`Failed to fetch observations: ${response.error}`);
  }

  setInCache(cacheKey, response.data);
  return response.data;
}

/**
 * Get care recommendations and active care plans
 */
export async function getCareRecommendations(
  donorId: string
): Promise<CarePlan[]> {
  const cacheKey = getCacheKey('donor', donorId, 'careplans');
  const cached = getFromCache<CarePlan[]>(cacheKey);
  if (cached) return cached;

  const response = await apiRequest<ApiResponse<CarePlan[]>>(
    `/donors/${donorId}/care-plans`,
    { method: 'GET' }
  );

  if (!response.success || !response.data) {
    throw new Error(`Failed to fetch care plans: ${response.error}`);
  }

  setInCache(cacheKey, response.data);
  return response.data;
}

/**
 * Get last donation for a donor
 */
export async function getLastDonation(donorId: string): Promise<Donation | null> {
  const cacheKey = getCacheKey('donor', donorId, 'lastdonation');
  const cached = getFromCache<Donation | null>(cacheKey);
  if (cached !== null) return cached;

  try {
    const response = await apiRequest<ApiResponse<Donation>>(
      `/donors/${donorId}/donations/last`,
      { method: 'GET' }
    );

    if (!response.success) {
      return null;
    }

    setInCache(cacheKey, response.data || null);
    return response.data || null;
  } catch {
    return null;
  }
}

/**
 * Get upcoming appointments
 */
export async function getUpcomingAppointments(
  donorId: string
): Promise<Appointment[]> {
  const cacheKey = getCacheKey('donor', donorId, 'appointments', 'upcoming');
  const cached = getFromCache<Appointment[]>(cacheKey);
  if (cached) return cached;

  const response = await apiRequest<ApiResponse<Appointment[]>>(
    `/donors/${donorId}/appointments?status=scheduled,confirmed`,
    { method: 'GET' }
  );

  if (!response.success || !response.data) {
    return [];
  }

  setInCache(cacheKey, response.data);
  return response.data;
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

type UnsubscribeFn = () => void;

/**
 * Subscribe to real-time updates for donor
 * Returns unsubscribe function
 */
export function subscribeToUpdates(
  donorId: string,
  callback: (data: Donor) => void
): UnsubscribeFn {
  // In production, use Firebase Firestore real-time listeners
  // For MVP, polling with WebSocket or interval
  const pollInterval = setInterval(async () => {
    try {
      invalidateCache(`donor:${donorId}`);
      const donor = await getDonor(donorId);
      callback(donor);
    } catch (error) {
      console.error('Subscription error:', error);
    }
  }, 30000); // Poll every 30 seconds

  return () => clearInterval(pollInterval);
}

/**
 * Subscribe to findings updates
 */
export function subscribeToFindings(
  donorId: string,
  callback: (findings: Finding[]) => void
): UnsubscribeFn {
  const pollInterval = setInterval(async () => {
    try {
      invalidateCache(`donor:${donorId}:findings`);
      const response = await getDonorFindings(donorId, 20, 0);
      callback(response.items);
    } catch (error) {
      console.error('Findings subscription error:', error);
    }
  }, 30000);

  return () => clearInterval(pollInterval);
}

/**
 * Subscribe to observations (vital signs) updates
 */
export function subscribeToObservations(
  donorId: string,
  callback: (observations: Observation[]) => void,
  type?: 'BP' | 'Hb' | 'HR'
): UnsubscribeFn {
  const pollInterval = setInterval(async () => {
    try {
      invalidateCache(`donor:${donorId}:observations`);
      const observations = await getDonorObservations(donorId, 90, type);
      callback(observations);
    } catch (error) {
      console.error('Observations subscription error:', error);
    }
  }, 30000);

  return () => clearInterval(pollInterval);
}

// ============================================================================
// WRITE OPERATIONS
// ============================================================================

/**
 * Update donor health status
 */
export async function updateDonorHealthStatus(
  donorId: string,
  status: 'healthy' | 'monitored' | 'at_risk' | 'deferred'
): Promise<Donor> {
  const response = await apiRequest<ApiResponse<Donor>>(
    `/donors/${donorId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ healthStatus: status }),
    }
  );

  if (!response.success || !response.data) {
    throw new Error(`Failed to update donor: ${response.error}`);
  }

  invalidateCache(`donor:${donorId}`);
  return response.data;
}

/**
 * Create or update self-reported observation
 */
export async function reportObservation(
  donorId: string,
  observation: Omit<Observation, 'id' | 'createdAt'>
): Promise<Observation> {
  const response = await apiRequest<ApiResponse<Observation>>(
    `/donors/${donorId}/observations`,
    {
      method: 'POST',
      body: JSON.stringify(observation),
    }
  );

  if (!response.success || !response.data) {
    throw new Error(`Failed to report observation: ${response.error}`);
  }

  invalidateCache(`donor:${donorId}:observations`);
  return response.data;
}

/**
 * Acknowledge a finding (mark as read)
 */
export async function acknowledgeFinding(
  donorId: string,
  findingId: string
): Promise<Finding> {
  const response = await apiRequest<ApiResponse<Finding>>(
    `/donors/${donorId}/findings/${findingId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status: 'acknowledged' }),
    }
  );

  if (!response.success || !response.data) {
    throw new Error(`Failed to acknowledge finding: ${response.error}`);
  }

  invalidateCache(`donor:${donorId}:findings`);
  return response.data;
}

/**
 * Book an appointment
 */
export async function bookAppointment(
  donorId: string,
  carePlanId: string,
  facilityId: string,
  startTime: string
): Promise<Appointment> {
  const response = await apiRequest<ApiResponse<Appointment>>(
    `/donors/${donorId}/appointments`,
    {
      method: 'POST',
      body: JSON.stringify({
        carePlanId,
        facilityId,
        startTime,
      }),
    }
  );

  if (!response.success || !response.data) {
    throw new Error(`Failed to book appointment: ${response.error}`);
  }

  invalidateCache(`donor:${donorId}:appointments`);
  return response.data;
}

// ============================================================================
// EXPORT CACHE FUNCTIONS FOR TESTING
// ============================================================================

export const cacheUtils = {
  clear: () => cache.clear(),
  invalidate: invalidateCache,
  getCacheKey,
};
