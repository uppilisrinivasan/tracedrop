/**
 * TraceDrop Phase 1 Firestore Schema
 *
 * This file defines all TypeScript interfaces and types for the Firestore collections.
 * Each collection is documented with:
 * - Purpose and role in the system
 * - Field definitions with types
 * - Index strategies and composite index requirements
 * - Privacy and access control considerations
 * - Data retention policies
 *
 * All timestamps use RFC 3339 format (ISO 8601) with millisecond precision.
 * All IDs are Firestore auto-generated unless otherwise specified.
 */

// ============================================================================
// 1. DONORS Collection
// ============================================================================

/**
 * Donor Patient Records
 *
 * Purpose: Central patient identity and demographic data. Single source of truth
 * for all donor-related information.
 *
 * Privacy: Donors see only their own record. PII (name, phone, email) is encrypted
 * at rest. Language preference drives all communications.
 *
 * Index Strategy: None needed (simple queries by ID or bulk scans for admin).
 * Document queries by ID are fast by default.
 *
 * Data Retention: Keep indefinitely for historical blood bank records.
 * Implement GDPR right-to-deletion: archive or pseudonymize on request.
 */
export interface Donor {
  /** Firestore document ID (auto-generated) */
  id: string;

  /** Full name of donor */
  name: string;

  /** Phone number (E.164 format: +1234567890) */
  phone: string;

  /** Email address for notifications */
  email: string;

  /**
   * Preferred communication language.
   * ISO 639-1 code (e.g., 'en', 'hi', 'ta', 'te', 'ka', 'ml')
   */
  language: string;

  /**
   * Biological gender for eligibility rules.
   * Values: 'M' (Male), 'F' (Female), 'O' (Other), 'N' (Not disclosed)
   */
  gender: 'M' | 'F' | 'O' | 'N';

  /** Age in years at registration */
  age: number;

  /**
   * Current health status summary.
   * Used for quick eligibility checks.
   * Values: 'healthy', 'monitored', 'at_risk', 'deferred'
   */
  healthStatus: 'healthy' | 'monitored' | 'at_risk' | 'deferred';

  /** ISO 8601 timestamp when donor registered in system */
  createdAt: string;

  /** ISO 8601 timestamp of last update */
  updatedAt: string;

  /** Optional: Association with blood centre for recurring donors */
  associatedBloodCentreId?: string;

  /** Optional: Emergency contact phone */
  emergencyContactPhone?: string;
}

// ============================================================================
// 2. DONATIONS Collection
// ============================================================================

/**
 * Donation Events
 *
 * Purpose: Track each blood donation event and its outcome.
 *
 * Privacy: Donors see only their donations. Blood centre staff see all donations
 * at their centre.
 *
 * Index Strategy: Composite index (donorId, performedAt DESC) for retrieving
 * donor's donation history in chronological order. This is the primary access
 * pattern for the care timeline.
 *
 * Data Retention: Keep permanently for blood bank medical records.
 */
export interface Donation {
  /** Firestore document ID (auto-generated) */
  id: string;

  /** Reference to donor document ID */
  donorId: string;

  /**
   * Status of donation.
   * 'completed': Blood collected and processed.
   * 'deferred': Donor deferred (usually temporary, triggers care plan).
   * 'cancelled': Donation cancelled by staff.
   */
  status: 'completed' | 'deferred' | 'cancelled';

  /** ISO 8601 timestamp when donation was performed (or attempted) */
  performedAt: string;

  /** Reference to blood centre where donation occurred */
  bloodCentreId: string;

  /** Amount collected in mL (null if deferred) */
  amountCollected?: number;

  /** Blood type if collected (e.g., 'O+', 'A-', 'B+', 'AB-') */
  bloodType?: string;

  /** Reason for deferral if status is 'deferred' */
  deferralReason?: string;

  /** Staff member ID who recorded the donation */
  recordedBy: string;

  /** ISO 8601 timestamp when record was created */
  createdAt: string;
}

// ============================================================================
// 3. OBSERVATIONS Collection
// ============================================================================

/**
 * Vital Signs & Lab Observations
 *
 * Purpose: Store all vital sign measurements and lab results for temporal analysis.
 * The raw source of truth for finding and trending generation.
 *
 * Privacy: Donors see their own observations. Doctors see observations for patients
 * under their care. Lab results are marked confidential if needed.
 *
 * Index Strategy:
 * - Composite (donorId, recordedAt DESC): Get donor's observations in reverse time order
 * - Composite (type, recordedAt DESC): Analytics queries grouping by observation type
 *
 * Data Retention: Keep for at least 2 years for trending. Older records can be
 * archived to cold storage.
 */
export interface Observation {
  /** Firestore document ID (auto-generated) */
  id: string;

  /** Reference to donor document ID */
  donorId: string;

  /**
   * Type of observation.
   * 'BP': Blood pressure
   * 'Hb': Hemoglobin level
   * 'lab': Other lab result
   * 'RR': Respiratory rate
   * 'HR': Heart rate
   * 'BMI': Body mass index
   */
  type: 'BP' | 'Hb' | 'lab' | 'RR' | 'HR' | 'BMI';

  /**
   * Observation value. For BP: store as string "systolic/diastolic" (e.g., "120/80").
   * For Hb, HR, RR, BMI: store numeric value as string for consistency.
   */
  value: string;

  /**
   * Unit of measurement.
   * Examples: 'mmHg' (BP), 'g/dL' (Hb), 'bpm' (heart rate), '%' (O2 sat), 'kg/m2' (BMI)
   */
  unit: string;

  /** ISO 8601 timestamp when observation was recorded */
  recordedAt: string;

  /**
   * Source of observation.
   * 'donation_centre': Measured during donation drive.
   * 'self_reported': Donor reported via app/SMS.
   * 'clinic': Clinical appointment measurement.
   * 'lab': Laboratory test result.
   */
  source: 'donation_centre' | 'self_reported' | 'clinic' | 'lab';

  /** Reference to staff member who recorded it (if source is 'donation_centre' or 'clinic') */
  recordedBy?: string;

  /** Reference to donation event if measured during donation */
  donationId?: string;

  /** Whether this observation is marked confidential (e.g., sensitive lab result) */
  isConfidential?: boolean;

  /** ISO 8601 timestamp when record was created */
  createdAt: string;
}

// ============================================================================
// 4. FINDINGS Collection
// ============================================================================

/**
 * Synthesized Clinical Findings
 *
 * Purpose: Store AI-synthesized findings that combine multiple observations.
 * These trigger care plans and escalations.
 *
 * Privacy: Doctors see findings for patients under their care. Counsellors see
 * only findings marked for escalation in the counsellor_queue.
 *
 * Index Strategy:
 * - Composite (donorId, createdAt DESC): Get all findings for a donor
 * - Composite (category, createdAt DESC): Filter findings by category
 *
 * Data Retention: Keep indefinitely for care history. Archive findings after
 * corresponding outcomes are recorded (30+ days old).
 */
export interface Finding {
  /** Firestore document ID (auto-generated) */
  id: string;

  /** Reference to donor document ID */
  donorId: string;

  /**
   * Clinical finding category. Maps to protocol rules.
   * Examples:
   * - 'BP_GRADE1': Elevated systolic 130-139 or diastolic 80-89
   * - 'BP_GRADE2': High blood pressure systolic >= 140 or diastolic >= 90
   * - 'Hb_LOW': Hemoglobin below threshold
   * - 'Hb_CRITICAL': Hemoglobin critically low
   * - 'HR_ELEVATED': Heart rate consistently elevated
   * - 'DEFERRED': Recent deferral from donation
   * - 'OTHER': Custom AI-detected pattern
   */
  category: string;

  /** Reference to the primary observation that triggered this finding */
  sourceObservationId: string;

  /**
   * Trend status for this category.
   * 'stable': Consistent measurements around threshold
   * 'improving': Trend toward better health
   * 'declining': Trend toward worse health
   * 'first_time': New finding, no prior trend
   */
  trend: 'stable' | 'improving' | 'declining' | 'first_time';

  /**
   * Current status of the finding.
   * 'active': Requires attention
   * 'acknowledged': Doctor has reviewed
   * 'archived': Old finding no longer relevant
   */
  status: 'active' | 'acknowledged' | 'archived';

  /** Human-readable description of the finding */
  description: string;

  /**
   * Recommended action based on protocol.
   * Examples: 'recommend_clinic_visit', 'schedule_lab_test', 'escalate_to_counsellor'
   */
  recommendedAction: string;

  /**
   * Urgency level for follow-up.
   * 'routine': Schedule within 1-2 months
   * 'soon': Schedule within 1-2 weeks
   * 'urgent': Schedule within 24-48 hours
   * 'critical': Immediate medical attention
   */
  urgency: 'routine' | 'soon' | 'urgent' | 'critical';

  /** Reference to care plan if one was created from this finding */
  carePlanId?: string;

  /** Whether this should be escalated to counsellor_queue */
  needsEscalation: boolean;

  /** ISO 8601 timestamp when finding was generated */
  createdAt: string;

  /** ISO 8601 timestamp when finding was last updated */
  updatedAt: string;
}

// ============================================================================
// 5. CARE_PLANS Collection
// ============================================================================

/**
 * Doctor-Approved Care Plans
 *
 * Purpose: Store actionable care plans derived from findings.
 * Care plans represent the doctor's clinical decision and prescription.
 *
 * Privacy: Doctors see all care plans. Donors see care plans pertaining to them.
 * Each care plan records approval by a specific doctor.
 *
 * Index Strategy: Composite (donorId, createdAt DESC) for donor's care history.
 *
 * Data Retention: Keep indefinitely for care history audit trail.
 */
export interface CarePlan {
  /** Firestore document ID (auto-generated) */
  id: string;

  /** Reference to donor document ID */
  donorId: string;

  /** Reference to finding that prompted this care plan */
  findingId: string;

  /**
   * Status of care plan.
   * 'draft': Created but awaiting doctor approval
   * 'pending': Approved, awaiting appointment booking
   * 'active': Appointment booked and scheduled
   * 'completed': All actions completed
   * 'rejected': Doctor rejected the plan
   * 'archived': Old plan no longer relevant
   */
  status: 'draft' | 'pending' | 'active' | 'completed' | 'rejected' | 'archived';

  /**
   * Proposed action for the donor.
   * Examples:
   * - 'visit_clinic': Schedule clinic visit
   * - 'lab_test': Perform specific lab test
   * - 'monitor': Continued self-monitoring with app
   * - 'referral': Refer to specialist
   * - 'deferral': Advise deferral from donation
   * - 'lifestyle': Lifestyle modification counselling
   */
  proposedAction: string;

  /** Detailed notes about the proposed action and clinical reasoning */
  notes: string;

  /** Doctor or healthcare provider ID who created the plan */
  createdBy: string;

  /** Doctor or healthcare provider ID who approved the plan (may differ from createdBy) */
  approvedBy?: string;

  /** ISO 8601 timestamp when doctor approved the plan */
  approvedAt?: string;

  /** Reason if the plan was rejected */
  rejectionReason?: string;

  /** ISO 8601 timestamp of expected action completion */
  expectedCompletionDate?: string;

  /** ISO 8601 timestamp when plan was created */
  createdAt: string;

  /** ISO 8601 timestamp when plan was last updated */
  updatedAt: string;
}

// ============================================================================
// 6. APPOINTMENTS Collection
// ============================================================================

/**
 * Care Appointment Bookings
 *
 * Purpose: Track scheduled clinical appointments and their fulfillment.
 *
 * Privacy: Donors see their own appointments. Clinic staff see appointments
 * at their facility.
 *
 * Index Strategy: Composite (donorId, startTime) for donor's appointment schedule.
 * Supports queries like "get all upcoming appointments for a donor".
 *
 * Data Retention: Keep indefinitely for appointment history.
 */
export interface Appointment {
  /** Firestore document ID (auto-generated) */
  id: string;

  /** Reference to donor document ID */
  donorId: string;

  /** Reference to care plan this appointment fulfills */
  carePlanId: string;

  /** Reference to care facility (clinic, lab, blood centre) */
  facilityId: string;

  /** Facility name for quick reference */
  facilityName: string;

  /** ISO 8601 timestamp of appointment start */
  startTime: string;

  /** ISO 8601 timestamp of appointment end */
  endTime: string;

  /**
   * Status of appointment.
   * 'scheduled': Confirmed and waiting for date
   * 'confirmed': Donor confirmed attendance
   * 'completed': Appointment occurred
   * 'no_show': Donor did not attend
   * 'cancelled': Appointment cancelled
   * 'rescheduled': Appointment rescheduled
   */
  status: 'scheduled' | 'confirmed' | 'completed' | 'no_show' | 'cancelled' | 'rescheduled';

  /** Type of appointment: 'clinic_visit', 'lab_test', 'counselling', 'follow_up' */
  type: 'clinic_visit' | 'lab_test' | 'counselling' | 'follow_up';

  /** Notes about the appointment for clinic staff */
  staffNotes?: string;

  /** Staff member ID who booked the appointment */
  bookedBy: string;

  /** ISO 8601 timestamp when appointment was booked */
  createdAt: string;

  /** ISO 8601 timestamp when appointment was last updated */
  updatedAt: string;
}

// ============================================================================
// 7. COMMUNICATIONS Collection
// ============================================================================

/**
 * Communication Message Log
 *
 * Purpose: Audit trail of all messages sent to donors (SMS, WhatsApp, web notifications).
 * Used for retries, analytics, and compliance.
 *
 * Privacy: Donors see their messages. Staff see sent messages for audit.
 * Messages are encrypted in transit and at rest for sensitive content.
 *
 * Index Strategy: Composite (donorId, sentAt DESC) for donor's message history.
 *
 * Data Retention: Keep for at least 1 year for compliance and retries.
 * Archive older messages to cold storage.
 */
export interface Communication {
  /** Firestore document ID (auto-generated) */
  id: string;

  /** Reference to donor document ID */
  donorId: string;

  /**
   * Type of message.
   * 'finding_alert': Alert about a new clinical finding
   * 'appointment_reminder': Appointment reminder notification
   * 'care_plan': Care plan notification
   * 'feedback_request': Request for feedback or measurement
   * 'transactional': System notification
   * 'educational': Educational content or tips
   */
  type: string;

  /**
   * Communication channel.
   * 'whatsapp': WhatsApp message
   * 'sms': SMS text message
   * 'web': In-app web notification
   * 'email': Email notification
   */
  channel: 'whatsapp' | 'sms' | 'web' | 'email';

  /**
   * Structured payload containing the message content.
   * Schema varies by type and channel.
   * Example:
   * {
   *   "title": "Blood Pressure Alert",
   *   "body": "Your recent BP reading is elevated. Please schedule a clinic visit.",
   *   "findingId": "finding123",
   *   "actionUrl": "app://findings/finding123"
   * }
   */
  payload: Record<string, any>;

  /** ISO 8601 timestamp when message was sent */
  sentAt: string;

  /** ISO 8601 timestamp when message was delivered (if confirmed) */
  deliveredAt?: string;

  /** ISO 8601 timestamp when message was read (if tracked) */
  readAt?: string;

  /**
   * Status of message delivery.
   * 'pending': Queued for sending
   * 'sent': Successfully transmitted to provider
   * 'delivered': Confirmed delivery by provider
   * 'read': Confirmed read by donor
   * 'failed': Delivery failed
   * 'bounced': Invalid address/number
   */
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'bounced';

  /** Number of delivery attempts */
  attemptCount: number;

  /** Error message if delivery failed */
  failureReason?: string;

  /** ISO 8601 timestamp when record was created */
  createdAt: string;
}

// ============================================================================
// 8. OUTCOMES Collection
// ============================================================================

/**
 * Follow-up Outcomes from Appointments
 *
 * Purpose: Record results and follow-up from clinical appointments.
 * Links appointment attendance to new observations.
 *
 * Privacy: Doctors see outcomes for patients under their care.
 * Donors see outcomes from their appointments.
 *
 * Index Strategy: Composite (donorId, recordedAt DESC) for donor's outcome history.
 *
 * Data Retention: Keep indefinitely for care continuity.
 */
export interface Outcome {
  /** Firestore document ID (auto-generated) */
  id: string;

  /** Reference to appointment document ID */
  appointmentId: string;

  /** Reference to donor document ID */
  donorId: string;

  /**
   * Did the donor attend the appointment?
   * true = attended, false = no-show
   */
  attended: boolean;

  /**
   * Result value from the appointment/test.
   * For clinic visit: summary of findings.
   * For lab test: test result value or reference to observation.
   * For counselling: notes from counsellor.
   */
  resultValue?: string;

  /**
   * Status of outcome.
   * 'pending': Appointment completed but outcome not yet recorded
   * 'recorded': Outcome has been recorded
   * 'reviewed': Outcome reviewed by doctor
   * 'acted_upon': Follow-up action initiated from outcome
   */
  status: 'pending' | 'recorded' | 'reviewed' | 'acted_upon';

  /** Doctor or healthcare provider ID who recorded the outcome */
  recordedBy: string;

  /**
   * Optional: Reference to new finding created from this outcome.
   * If the outcome resulted in a new clinical finding, link it here.
   */
  linkedFindingId?: string;

  /** ISO 8601 timestamp when outcome was recorded */
  recordedAt: string;

  /** ISO 8601 timestamp when record was created */
  createdAt: string;

  /** ISO 8601 timestamp when outcome was last updated */
  updatedAt: string;
}

// ============================================================================
// 9. COUNSELLOR_QUEUE Collection (CONFIDENTIAL)
// ============================================================================

/**
 * Counsellor Queue - CONFIDENTIAL FINDINGS
 *
 * Purpose: Isolated collection for urgent/sensitive findings requiring human
 * counsellor intervention. Separate from main findings to implement strict access control.
 *
 * Privacy: CONFIDENTIAL ACCESS ONLY. Only users with 'counsellor' role can read/write.
 * Donors never see these records directly. Findings are removed from this queue
 * after counsellor handles them (30-day auto-archive).
 *
 * Security Rules: Read/write restricted to counsellor role only.
 * No batch operations - must be modified individually.
 *
 * Index Strategy: Composite (status, urgency DESC) for counsellor dashboard.
 * Allows filtering: "Show me all active urgent items".
 *
 * Data Retention: Archive after 30 days or when status = 'resolved'.
 * Keep archived records for 1 year for audit trail.
 */
export interface CounsellorQueue {
  /** Firestore document ID (auto-generated) */
  id: string;

  /** Reference to donor document ID (encrypted in audit logs) */
  donorId: string;

  /**
   * Type of flag requiring counsellor attention.
   * 'mental_health_risk': Donor expressed mental health concerns
   * 'deferral_pattern': Repeated deferrals suggesting health issue
   * 'high_risk_condition': Critical vital sign pattern detected
   * 'non_compliance': Donor not attending recommended appointments
   * 'other': Custom escalation reason
   */
  flagType: string;

  /**
   * Urgency level.
   * 'routine': Standard review within 1 week
   * 'soon': Review within 24-48 hours
   * 'urgent': Immediate attention required
   */
  urgency: 'routine' | 'soon' | 'urgent';

  /**
   * Current status.
   * 'pending': Awaiting counsellor assignment
   * 'assigned': Assigned to counsellor
   * 'in_progress': Counsellor actively working on case
   * 'resolved': Issue addressed
   * 'escalated': Escalated beyond counsellor (emergency)
   */
  status: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'escalated';

  /** Brief description of the flag reason */
  description: string;

  /** Reference to finding(s) that triggered this escalation */
  relatedFindingIds: string[];

  /** Counsellor user ID assigned to handle this case */
  handledBy?: string;

  /** ISO 8601 timestamp when counsellor started handling */
  handledAt?: string;

  /** Notes from counsellor's interaction with donor */
  counsellorNotes?: string;

  /** Reference to action taken (e.g., emergency contact, referral) */
  actionTaken?: string;

  /** ISO 8601 timestamp when flag was created */
  createdAt: string;

  /** ISO 8601 timestamp when status was last updated */
  updatedAt: string;
}

// ============================================================================
// 10. TEMPLATES Collection
// ============================================================================

/**
 * Message Templates
 *
 * Purpose: Store predefined message templates for different communication scenarios.
 * Templates support variable substitution and are localized by language.
 *
 * Privacy: Templates are system data, visible to admins and content managers.
 *
 * Index Strategy: Composite (language, findingCategory) for quick lookup.
 * Allows template retrieval: "Get template for Hb_CRITICAL in Hindi".
 *
 * Data Retention: Keep indefinitely. Archive old template versions.
 */
export interface Template {
  /** Firestore document ID (auto-generated) */
  id: string;

  /**
   * Target language for this template.
   * ISO 639-1 code: 'en', 'hi', 'ta', 'te', 'ka', 'ml'
   */
  language: string;

  /**
   * Finding category this template applies to.
   * Matches Finding.category values.
   * Can also use: 'appointment_reminder', 'care_plan', 'generic_alert'
   */
  findingCategory: string;

  /** Communication channel: 'sms', 'whatsapp', 'email', 'web' */
  channel: 'sms' | 'whatsapp' | 'email' | 'web';

  /**
   * Template text with variable placeholders.
   * Variables use {{varName}} syntax.
   * Common variables:
   * - {{donorName}}: Donor's first name
   * - {{vitals}}: Summary of vital signs
   * - {{actionRequired}}: Recommended action
   * - {{facilityName}}: Healthcare facility name
   * - {{appointmentDate}}: Appointment date/time
   */
  template: string;

  /**
   * List of variable names used in this template.
   * Used for validation and testing.
   * Example: ['donorName', 'vitals', 'actionRequired']
   */
  variables: string[];

  /** Human-readable name of template for admin reference */
  name: string;

  /** Character count of template (useful for SMS length validation) */
  characterCount: number;

  /** Whether this template is active and should be used */
  isActive: boolean;

  /** Version number for template tracking */
  version: number;

  /** ISO 8601 timestamp when template was created */
  createdAt: string;

  /** ISO 8601 timestamp when template was last updated */
  updatedAt: string;
}

// ============================================================================
// 11. PROTOCOLS Collection
// ============================================================================

/**
 * Clinical Protocol Rules
 *
 * Purpose: Store protocol rules that drive automated finding generation and care plan
 * recommendations. These rules encode clinical decision logic.
 *
 * Privacy: Protocols are system data. Doctors can view. Modified by admin only.
 *
 * Index Strategy: None needed. Typically queried by ID or bulk-loaded on app startup.
 *
 * Data Retention: Keep indefinitely. Archive old versions when protocols change.
 */
export interface Protocol {
  /** Firestore document ID (auto-generated) */
  id: string;

  /**
   * Protocol name/identifier.
   * Should map to Finding.category values.
   * Examples: 'BP-G1', 'BP-G2', 'Hb-Low', 'Hb-Critical', 'HR-Elevated', 'DEFERRED'
   */
  name: string;

  /**
   * Category of health metric this protocol governs.
   * 'BP': Blood pressure
   * 'Hb': Hemoglobin
   * 'HR': Heart rate
   * 'deferred': Deferral pattern
   * 'pattern': Multi-metric pattern
   */
  category: 'BP' | 'Hb' | 'HR' | 'deferred' | 'pattern';

  /**
   * Clinical rule for triggering this protocol.
   * Can be a single threshold or complex logic.
   * Examples:
   * - For BP_GRADE1: "systolic >= 130 and systolic < 140 or diastolic >= 80 and diastolic < 90"
   * - For Hb_CRITICAL: "value < 7.5 and type = 'Hb'"
   * - For deferred: "status = 'deferred' in last donation"
   */
  rule: string;

  /**
   * Recommended action when rule is triggered.
   * 'find_clinician': Create finding, don't auto-escalate
   * 'create_care_plan': Create care plan for review
   * 'schedule_appointment': Automatically schedule appointment
   * 'escalate_immediate': Escalate to counsellor immediately
   */
  action: 'find_clinician' | 'create_care_plan' | 'schedule_appointment' | 'escalate_immediate';

  /**
   * Urgency level assigned to findings from this protocol.
   * 'routine', 'soon', 'urgent', 'critical'
   */
  urgency: 'routine' | 'soon' | 'urgent' | 'critical';

  /**
   * Additional metadata about the protocol.
   * May include:
   * - clinical_evidence: Citation or guideline reference
   * - affected_population: Who this applies to (e.g., "women_donors", "all")
   * - threshold_systolic: For BP protocols
   * - threshold_diastolic: For BP protocols
   * - threshold_hb: For Hb protocols
   */
  metadata: Record<string, any>;

  /** Whether this protocol is currently active */
  isActive: boolean;

  /** Version number for protocol tracking and auditing */
  version: number;

  /** Author/organization that created this protocol */
  createdBy: string;

  /** ISO 8601 timestamp when protocol was created */
  createdAt: string;

  /** ISO 8601 timestamp when protocol was last updated */
  updatedAt: string;
}

// ============================================================================
// COMPOSITE INDEX DEFINITIONS
// ============================================================================

/**
 * Firestore Composite Indexes Required for Phase 1
 *
 * These indexes are essential for the query patterns defined in the system.
 * Each index is listed with its collection, fields, and query pattern it optimizes.
 */
export const COMPOSITE_INDEXES = [
  {
    collection: 'donations',
    fields: [
      { fieldPath: 'donorId', direction: 'ASCENDING' },
      { fieldPath: 'performedAt', direction: 'DESCENDING' },
    ],
    queryPattern: 'Get all donations for a donor, most recent first',
  },

  {
    collection: 'observations',
    fields: [
      { fieldPath: 'donorId', direction: 'ASCENDING' },
      { fieldPath: 'recordedAt', direction: 'DESCENDING' },
    ],
    queryPattern: 'Get observation history for a donor',
  },

  {
    collection: 'observations',
    fields: [
      { fieldPath: 'type', direction: 'ASCENDING' },
      { fieldPath: 'recordedAt', direction: 'DESCENDING' },
    ],
    queryPattern: 'Get all observations of a type (e.g., all BP readings) sorted by date',
  },

  {
    collection: 'findings',
    fields: [
      { fieldPath: 'donorId', direction: 'ASCENDING' },
      { fieldPath: 'createdAt', direction: 'DESCENDING' },
    ],
    queryPattern: 'Get all findings for a donor',
  },

  {
    collection: 'findings',
    fields: [
      { fieldPath: 'category', direction: 'ASCENDING' },
      { fieldPath: 'createdAt', direction: 'DESCENDING' },
    ],
    queryPattern: 'Get findings by category (analytics, protocol lookup)',
  },

  {
    collection: 'care_plans',
    fields: [
      { fieldPath: 'donorId', direction: 'ASCENDING' },
      { fieldPath: 'createdAt', direction: 'DESCENDING' },
    ],
    queryPattern: 'Get care plan history for a donor',
  },

  {
    collection: 'appointments',
    fields: [
      { fieldPath: 'donorId', direction: 'ASCENDING' },
      { fieldPath: 'startTime', direction: 'ASCENDING' },
    ],
    queryPattern: 'Get upcoming appointments for a donor',
  },

  {
    collection: 'communications',
    fields: [
      { fieldPath: 'donorId', direction: 'ASCENDING' },
      { fieldPath: 'sentAt', direction: 'DESCENDING' },
    ],
    queryPattern: 'Get message history for a donor',
  },

  {
    collection: 'outcomes',
    fields: [
      { fieldPath: 'donorId', direction: 'ASCENDING' },
      { fieldPath: 'recordedAt', direction: 'DESCENDING' },
    ],
    queryPattern: 'Get outcome history for a donor',
  },

  {
    collection: 'counsellor_queue',
    fields: [
      { fieldPath: 'status', direction: 'ASCENDING' },
      { fieldPath: 'urgency', direction: 'DESCENDING' },
    ],
    queryPattern: 'Get urgent items for counsellor dashboard',
  },

  {
    collection: 'templates',
    fields: [
      { fieldPath: 'language', direction: 'ASCENDING' },
      { fieldPath: 'findingCategory', direction: 'ASCENDING' },
    ],
    queryPattern: 'Get templates for language + category',
  },
];

// ============================================================================
// SECURITY RULES SUMMARY
// ============================================================================

/**
 * Firestore Security Rules Summary
 *
 * These rules enforce role-based access control and data privacy.
 * Full implementation is in firestore.rules file.
 *
 * Access Patterns:
 * - Public: Cannot read/write anything without authentication
 * - Donors (role: 'donor'): Read own records, read findings/care plans, write self-reported observations
 * - Doctors (role: 'doctor'): Read patients under care, create/approve care plans
 * - Counsellors (role: 'counsellor'): Read/write counsellor_queue only
 * - Blood Centre Staff (role: 'centre_staff'): Create donations and observations at their centre
 * - Admins (role: 'admin'): Full read/write access
 *
 * Collection Rules:
 *
 * donors:
 *   - Donors can read own document
 *   - Doctors can read patients under care
 *   - No one can update (managed by admin)
 *
 * donations:
 *   - Donors can read own
 *   - Centre staff can write
 *   - Doctors can read
 *
 * observations:
 *   - Donors can read own + write self_reported
 *   - Doctors can read for patients
 *   - Centre staff can write from donation centre
 *
 * findings:
 *   - Doctors can read + create
 *   - Donors can read own
 *   - System service can create
 *
 * care_plans:
 *   - Doctors can read + write + approve
 *   - Donors can read own + acknowledge
 *   - Admins can archive old plans
 *
 * counsellor_queue:
 *   - ONLY counsellors can read/write
 *   - Individual doc level access (no batches)
 *   - Strict audit logging
 *
 * Confidence Fields:
 *   - Read-only to public (no override possible)
 *   - Only system service can set confidence scores
 */

export const SECURITY_RULES_SUMMARY = {
  publicAccess: false,
  authentication: 'required',
  roleBasedAccess: true,
  roles: ['donor', 'doctor', 'counsellor', 'centre_staff', 'admin'],
  confidentialCollections: ['counsellor_queue'],
  auditLogging: ['counsellor_queue', 'care_plans'],
};

// ============================================================================
// MIGRATION & VERSIONING
// ============================================================================

/**
 * Schema Version
 *
 * Increment this version whenever the schema is updated.
 * Used for database migration tracking and compatibility checks.
 */
export const SCHEMA_VERSION = '1.0.0';

/**
 * Supported Firebase SDK Versions
 *
 * This schema is compatible with:
 * - firebase-admin v11.0.0+
 * - @firebase/app v9.0.0+
 * - @firebase/firestore v9.0.0+
 */
export const SUPPORTED_SDK_VERSIONS = {
  firebaseAdmin: '11.0.0+',
  firebaseApp: '9.0.0+',
  firebaseFirestore: '9.0.0+',
};
