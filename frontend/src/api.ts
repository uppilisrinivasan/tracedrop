/** Typed client for the TraceDrop API. */

export type Severity = 'urgent' | 'high' | 'moderate' | 'watch';

export interface Donor {
  id: string; name: string; sex: 'M' | 'F'; age: number; bloodGroup: string; language: string; district: string;
  heightCm: number; smoker: boolean; familyHistory: string[]; communityIds: string[];
  consent: { shareHealthWithInsurer: boolean; showOnLeaderboard: boolean; includeInCommunityStats: boolean };
}

export interface Finding { id: string; title: string; severity: Severity; detail: string; evidence?: string[]; protocolId?: string; date?: string }

export interface Recipient { patient: string; context: string; contextKey: string; place: string; outcome: string; generalised: boolean }

export interface Journey {
  id: string; kind: string; name: string; shelf: string; role: string; donationDate: string; centre: string;
  status: string; statusLabel: string; helped: boolean; withheld: boolean;
  events: { type: string; label: string; when: string }[];
  recipient: Recipient | null;
  fractionation: { poolSize: number; albuminVials: number; ivigVials: number; factorViiiIu: number } | null;
}

export interface ImpactSummary {
  components: number; patientsHelped: number; medicineDosesShare: number; children: number; inProgress: number;
  contexts: { context: string; count: number }[];
}

export interface AIStatus { model: string; live: boolean; reason: string | null; tokensUsedToday: number; dailyTokenBudget: number; callsToday: number; cacheReadTokens: number; rateLimitRps: number }

export interface Overview {
  donor: Donor; today: string;
  donations: { completed: number; deferred: number; firstDate: string | null; litres: number };
  impact: ImpactSummary; latestJourney: Journey | null;
  health: { score: number | null; previousScore: number | null; findings: Finding[] };
  eligibility: Eligibility;
  cover: { base: number; current: number; eligible: number; next: number | null; pointsToNext: number | null; blockedBy: string | null };
  communities: { id: string; name: string; kind: string; memberCount: number; totals: { donations: number; patientsHelped: number } }[];
  ai: AIStatus;
}

export interface Eligibility { eligibleNow: boolean; nextEligibleDate: string | null; gapDays: number; lastDonationDate: string | null; blockers: string[] }

export interface ScorePart { name: string; weight: number; points: number; value: string }
export interface LabPoint { date: string; value: number; unit: string; low: number | null; high: number | null; name: string; source: string }
export interface HealthData {
  findings: Finding[];
  scores: { date: string; score: number; parts: ScorePart[] }[];
  vitals: { date: string; status: string; systolic: number; diastolic: number; haemoglobin: number; weightKg: number; pulse: number }[];
  labs: Record<string, LabPoint[]>;
  eligibility: Eligibility;
  bmi: number;
}

export interface CoverData {
  policy: { sponsor: string; kind: string; premium: number };
  baseCover: number; currentCover: number; eligibleCover: number; nextStep: number | null; pointsToNextStep: number | null;
  healthScore: number; relativeRisk: number; blockedBy: string | null; method: string;
  conditions: Record<string, { met: boolean; detail: string }>;
  history: { date: string; score: number; cover: number }[];
}

export interface Stakeholder {
  id: string; name: string; icon: string; headline: string; story: string;
  metrics: { label: string; value: string | number }[];
  drilldown: { label: string; value: number }[];
}

export interface Community {
  id: string; name: string; kind: string; description: string; memberCount: number;
  totals: { donations: number; patientsHelped: number; activeThisYear: number };
  participation: number; contexts: { context: string; count: number }[];
  bloodGroups: { group: string; count: number }[];
  leaderboard: { name: string; isYou: boolean; donations: number; patientsHelped: number }[];
  hiddenMembers: number; privacyNote: string;
}

export interface AgentStep { tool: string; input: Record<string, unknown>; ms: number; summary: string }

export interface PlanAction { title: string; why: string; how: string[]; category: string; timeframe: string; evidence: string[]; expectedEffect: string }
export interface CarePlan {
  plan: { summary: string; urgency: 'routine' | 'soon' | 'urgent'; actions: PlanAction[]; doctorNote: string; coverGoal: string; nextCheck: string };
  steps: AgentStep[]; generatedBy: 'agent' | 'rules'; model?: string; aiUnavailable?: string; generatedAt?: string;
}

export interface ExtractedResult {
  marker: string; printedName: string; printedValue: string; printedUnit: string; value: number; confidence: string;
  name: string; unit: string; loinc: string; plausible: boolean; previous: { value: number; date: string } | null;
}
export interface Extraction { labName: string; reportDate: string; results: ExtractedResult[]; unmapped: string[]; notes: string }

export interface Story { headline: string; story: string; shareText: string; generatedBy: string; aiUnavailable?: string }
export interface Insight { title: string; message: string; cta: string; generatedBy: string; considered: string[]; aiUnavailable?: string }

export interface CopilotReply {
  reply: string; steps: AgentStep[]; actions: { type: string; screen: string; reason: string }[];
  history: unknown[] | null; offline?: boolean; aiUnavailable?: string;
}

export interface Slot { id: string; centreId: string; centre: string; district: string; date: string; time: string }
export interface Appointment extends Slot { status: string; eventId?: string | null; emailSent?: boolean; emailError?: string }
export interface BookingLocation { label: string; lat: number; lng: number; source: 'gps' | 'manual' }
export interface BookingPreferences {
  days: string[];
  timeWindows: string[];
  maxDistanceKm: number | null;
  avoidHolidays: boolean | null;
  reminderMinutes: number[];
  location: BookingLocation | null;
  onboardingComplete: boolean;
  onboardingSkipped: boolean;
}
export interface BookingTurn {
  preferences: BookingPreferences;
  step: string | null;
  prompt: string | null;
  chips: { id: string; label: string }[];
  ready: boolean;
}
export interface RankedSlot extends Slot {
  distanceKm: number | null;
  score: number;
  reasons: string[];
}

export interface Network {
  asOf: string; donors: number; donations: number; deferrals: number; components: number; patientsHelped: number;
  wastage: number; repeatDonorRate: number; labTests: number;
  byKind: { kind: string; name: string; count: number }[];
  byContext: { context: string; count: number }[];
  byHospitalKind: { kind: string; count: number }[];
  screening: { elevatedBp: number; prediabetes: number; lowHb: number; donorsWithCoverIncrease: number };
}

export interface Trace { id: string; at: string; feature: string; model: string; ms: number; stopReason?: string; inputTokens?: number; outputTokens?: number; cacheReadTokens?: number; error?: string }

export interface AuthUser {
  sub?: string;
  email: string;
  name: string;
  picture: string;
  expiresAt: number | null;
  local?: boolean;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

let onUnauthorized = () => {};
export function setUnauthorizedHandler(handler: () => void) { onUnauthorized = handler; }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const body = await response.json().catch(() => ({ success: false, error: `HTTP ${response.status}` }));
  if (response.status === 401) onUnauthorized();
  if (!response.ok || !body.success) throw new ApiError(response.status, body.error || `HTTP ${response.status}`);
  return body.data as T;
}

const post = <T,>(path: string, data?: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(data || {}) });

export const api = {
  authConfig: () => request<{ authDisabled: boolean; clientId: string; sessionMinutes: number }>('/auth/config'),
  me: () => request<AuthUser>('/auth/me'),
  googleSignIn: (credential: string) => post<AuthUser>('/auth/google', { credential }),
  logout: () => post<{ signedOut: boolean }>('/auth/logout'),
  preferences: () => request<BookingPreferences | null>('/auth/preferences'),
  savePreferences: (preferences: Partial<BookingPreferences>) => request<BookingPreferences>('/auth/preferences', { method: 'PUT', body: JSON.stringify(preferences) }),
  bookingTurn: (preferences?: Partial<BookingPreferences>, answer?: { step: string; value: string | BookingPreferences['location'] }) =>
    post<BookingTurn>('/auth/booking/turn', { preferences, answer }),
  personas: () => request<{ id: string; name: string; bloodGroup: string; language: string }[]>('/donors'),
  overview: (id: string) => request<Overview>(`/donors/${id}/overview`),
  impact: (id: string) => request<{ summary: ImpactSummary; journeys: Journey[]; k: number }>(`/donors/${id}/impact`),
  stakeholders: (id: string) => request<Stakeholder[]>(`/donors/${id}/stakeholders`),
  health: (id: string) => request<HealthData>(`/donors/${id}/health`),
  cover: (id: string) => request<CoverData>(`/donors/${id}/cover`),
  simulateCover: (id: string, score: number) => request<{ score: number; cover: number; relativeRisk: number }>(`/donors/${id}/cover/simulate?score=${score}`),
  communities: (id: string) => request<Community[]>(`/donors/${id}/communities`),
  setConsent: (id: string, consent: Partial<Donor['consent']>) => request<Donor['consent']>(`/donors/${id}/consent`, { method: 'PATCH', body: JSON.stringify(consent) }),
  slots: (id: string) => request<{ eligibility: Eligibility; slots: Slot[] }>(`/donors/${id}/slots`),
  appointments: (id: string) => request<Appointment[]>(`/donors/${id}/appointments`),
  recommend: (id: string, preferences: BookingPreferences, accessToken?: string) =>
    post<{ eligibility: Eligibility; slots: RankedSlot[]; calendarConnected: boolean }>(`/donors/${id}/booking/recommend`, { preferences, accessToken }),
  book: (id: string, body: { slotId: string; preferences: BookingPreferences; accessToken?: string }) => post<Appointment>(`/donors/${id}/appointments`, body),
  cancelAppointment: (id: string, appointmentId: string, accessToken?: string) =>
    post<Appointment>(`/donors/${id}/appointments/${appointmentId}/cancel`, { accessToken }),
  checkIn: (id: string, appointmentId: string, vitals: Record<string, number>) =>
    post<{ status: string; reasons: string[]; visitId: string; components: string[] }>(`/donors/${id}/appointments/${appointmentId}/checkin`, vitals),
  copilot: (id: string, message: string, history: unknown[] | null) => post<CopilotReply>(`/donors/${id}/copilot`, { message, history }),
  carePlan: (id: string, refresh = false) => post<CarePlan>(`/donors/${id}/care-plan${refresh ? '?refresh=1' : ''}`),
  extractLabs: (id: string, input: { text?: string; image?: string }) => post<Extraction>(`/donors/${id}/labs/extract`, input),
  saveLabs: (id: string, extraction: Extraction) => post<{ saved: number; date: string }>(`/donors/${id}/labs/save`, extraction),
  story: (id: string, componentId: string) => post<Story>(`/donors/${id}/impact/${componentId}/story`),
  insight: (id: string) => request<Insight>(`/donors/${id}/insights`),
  network: () => request<Network>('/network'),
  aiStatus: () => request<AIStatus>('/ai/status'),
  traces: () => request<Trace[]>('/ai/traces'),
};

export const rupees = (n: number) => (n >= 100000 ? `₹${(n / 100000).toFixed(n % 100000 ? 1 : 0)} lakh` : `₹${n.toLocaleString('en-IN')}`);
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
