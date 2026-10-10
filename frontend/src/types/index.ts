/**
 * TraceDrop Frontend TypeScript Types
 * Re-exports all types from backend Firestore schema
 * Ensures frontend type safety matches backend database schema
 */

// ============================================================================
// DONOR Types
// ============================================================================

export interface Donor {
  id: string;
  name: string;
  phone: string;
  email: string;
  language: string;
  gender: 'M' | 'F' | 'O' | 'N';
  age: number;
  healthStatus: 'healthy' | 'monitored' | 'at_risk' | 'deferred';
  createdAt: string;
  updatedAt: string;
  associatedBloodCentreId?: string;
  emergencyContactPhone?: string;
}

// ============================================================================
// DONATION Types
// ============================================================================

export interface Donation {
  id: string;
  donorId: string;
  status: 'completed' | 'deferred' | 'cancelled';
  performedAt: string;
  bloodCentreId: string;
  amountCollected?: number;
  bloodType?: string;
  deferralReason?: string;
  recordedBy: string;
  createdAt: string;
}

// ============================================================================
// OBSERVATION Types (Vital Signs & Lab Results)
// ============================================================================

export interface Observation {
  id: string;
  donorId: string;
  type: 'BP' | 'Hb' | 'lab' | 'RR' | 'HR' | 'BMI';
  value: string; // Store as string for consistency (e.g., "120/80" for BP)
  unit: string; // mmHg, g/dL, bpm, etc.
  recordedAt: string;
  source: 'donation_centre' | 'self_reported' | 'clinic' | 'lab';
  recordedBy?: string;
  donationId?: string;
  isConfidential?: boolean;
  createdAt: string;
}

// ============================================================================
// FINDING Types (Synthesized Clinical Findings)
// ============================================================================

export interface Finding {
  id: string;
  donorId: string;
  category: string; // BP_GRADE1, BP_GRADE2, Hb_LOW, Hb_CRITICAL, etc.
  sourceObservationId: string;
  trend: 'stable' | 'improving' | 'declining' | 'first_time';
  status: 'active' | 'acknowledged' | 'archived';
  description: string;
  recommendedAction: string;
  urgency: 'routine' | 'soon' | 'urgent' | 'critical';
  carePlanId?: string;
  needsEscalation: boolean;
  protocolId?: string;
  followUpDays?: number; // protocol follow-up / deferral period
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// CARE_PLAN Types
// ============================================================================

export interface CarePlan {
  id: string;
  donorId: string;
  findingId: string;
  status: 'draft' | 'pending' | 'active' | 'completed' | 'rejected' | 'archived';
  proposedAction: string;
  notes: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  expectedCompletionDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// APPOINTMENT Types
// ============================================================================

export interface Appointment {
  id: string;
  donorId: string;
  carePlanId: string;
  facilityId: string;
  facilityName: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'no_show' | 'cancelled' | 'rescheduled';
  type: 'clinic_visit' | 'lab_test' | 'counselling' | 'follow_up';
  staffNotes?: string;
  bookedBy: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// COMMUNICATION Types (Message Log)
// ============================================================================

export interface Communication {
  id: string;
  donorId: string;
  type: string; // finding_alert, appointment_reminder, care_plan, etc.
  channel: 'whatsapp' | 'sms' | 'web' | 'email';
  payload: Record<string, any>;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'bounced';
  attemptCount: number;
  failureReason?: string;
  createdAt: string;
}

// ============================================================================
// OUTCOME Types (Follow-up from Appointments)
// ============================================================================

export interface Outcome {
  id: string;
  appointmentId: string;
  donorId: string;
  attended: boolean;
  resultValue?: string;
  status: 'pending' | 'recorded' | 'reviewed' | 'acted_upon';
  recordedBy: string;
  linkedFindingId?: string;
  recordedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// TEMPLATE Types (Message Templates)
// ============================================================================

export interface Template {
  id: string;
  language: string;
  findingCategory: string;
  channel: 'sms' | 'whatsapp' | 'email' | 'web';
  template: string;
  variables: string[];
  name: string;
  characterCount: number;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// PROTOCOL Types (Clinical Rules)
// ============================================================================

export interface Protocol {
  id: string;
  name: string;
  category: 'BP' | 'Hb' | 'HR' | 'deferred' | 'pattern';
  rule: string;
  action: 'find_clinician' | 'create_care_plan' | 'schedule_appointment' | 'escalate_immediate';
  urgency: 'routine' | 'soon' | 'urgent' | 'critical';
  metadata: Record<string, any>;
  isActive: boolean;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// UI-Specific Types
// ============================================================================

export type HealthStatusType = 'healthy' | 'warning' | 'urgent';

export interface TrendDataPoint {
  date: string;
  value: number;
  grade: string;
  reading?: string; // For BP readings like "120/80"
}

export interface TrendChartProps {
  data: TrendDataPoint[];
  title: string;
  unit: string;
  lineColor: string;
  getColor: (grade: string) => string;
}

export interface FindingCardProps {
  finding: Finding;
  observation?: Observation;
  onClick?: () => void;
}

export interface HealthStatusBadgeProps {
  status: HealthStatusType;
  description?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseQueryState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface UseMultiLanguageReturn {
  translate: (key: string, variables?: Record<string, any>) => string;
  currentLanguage: string;
}

// ============================================================================
// Context Types
// ============================================================================

export interface AuthContextType {
  user: Donor | null;
  isAuthenticated: boolean;
  logout: () => void;
}

export interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}
