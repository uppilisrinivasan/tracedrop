/**
 * TraceDrop Phase 3: AI Agents Type Definitions
 *
 * Comprehensive TypeScript interfaces for all agent components, tool signatures,
 * and their interactions with Firestore and the ontology.
 */

// ============================================================================
// Navigator Agent Output Types
// ============================================================================

/**
 * Output from the Navigator Agent - determines next best action
 */
export interface NavigatorOutput {
  /** Primary action to take: book appointment, lifestyle intervention, wait, or urgent referral */
  nextAction: 'book_visit' | 'wait' | 'lifestyle' | 'urgent';

  /** Timeline for the action in human-readable format (e.g., "2-4 weeks", "within 24 hours") */
  timeline: string;

  /** Care partner information if booking visit is recommended */
  carePartner?: CarePartner;

  /** Contextual message for the donor */
  message: string;

  /** Alternative actions the donor could take */
  alternatives: string[];

  /** Urgency level: 0 (routine) to 5 (emergency) */
  urgencyLevel: number;

  /** Whether follow-up monitoring is required */
  requiresFollowUp: boolean;

  /** Recommended follow-up interval in days */
  followUpIntervalDays?: number;
}

/**
 * Care partner information (hospital, clinic, AAM center)
 */
export interface CarePartner {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'aam' | 'urgent_care';
  phone: string;
  distance_km?: number;
  availableSlots?: string[];
}

// ============================================================================
// Message Generation Output Types
// ============================================================================

/**
 * Output from the Message Generator Agent
 */
export interface MessageOutput {
  /** The generated message in requested language */
  message: string;

  /** What action is required from the donor */
  actionRequired: string;

  /** Timeline for the action */
  timeline: string;

  /** Language code of the message (ISO 639-1) */
  language: string;

  /** Alternative actions or explanations */
  alternatives: string[];

  /** Tone used: 'urgent', 'supportive', 'informative', 'preventive' */
  tone: 'urgent' | 'supportive' | 'informative' | 'preventive';

  /** Whether this message includes medical terminology explanation */
  includesEducation: boolean;

  /** Recommended channel for message delivery: SMS, WhatsApp, email, etc. */
  recommendedChannel: 'sms' | 'whatsapp' | 'email' | 'app_notification';
}

// ============================================================================
// Record Builder Input/Output Types
// ============================================================================

/**
 * Input for the Record Builder Agent - supports multimodal input
 */
export interface RecordInput {
  /** Donor ID */
  donorId: string;

  /** Input data: text description, voice transcription, or image buffer */
  input: string | Buffer;

  /** Type of input: text description, voice transcription, or image */
  type: 'text' | 'voice' | 'image';

  /** Optional: URL to voice file if voice type */
  voiceUrl?: string;

  /** Optional: URL to image file if image type */
  imageUrl?: string;

  /** Optional: metadata about the input source */
  source?: 'app' | 'whatsapp' | 'sms' | 'web' | 'device';

  /** Optional: timestamp when input was recorded (ISO 8601) */
  recordedAt?: string;
}

/**
 * Output from the Record Builder Agent
 */
export interface RecordOutput {
  /** ID of created Observation */
  observationId: string;

  /** ID of created Finding (if applicable) */
  findingId?: string;

  /** Generated message for donor */
  message?: string;

  /** Any warnings or notes from processing */
  notes?: string;

  /** Whether the record requires immediate attention */
  urgent: boolean;

  /** Extracted vitals/observations for user confirmation */
  extractedData?: Record<string, string>;
}

// ============================================================================
// Observation & Finding Types (Extended from Firestore Schema)
// ============================================================================

/**
 * FHIR-based Observation for vital signs
 */
export interface Observation {
  id: string;
  donorId: string;
  type: 'BP' | 'Hb' | 'lab' | 'RR' | 'HR' | 'BMI' | 'FBS' | 'HbA1c' | 'TTI';
  value: string;
  unit: string;
  recordedAt: string;
  source: 'donation_centre' | 'self_reported' | 'clinic' | 'lab';
  recordedBy?: string;
  donationId?: string;
  isConfidential?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Clinical Finding - result of protocol analysis on observation
 */
export interface Finding {
  id: string;
  donorId: string;
  category: string; // e.g., 'BP_GRADE1', 'HB_LOW', 'DEFERRED'
  sourceObservationId: string;
  trend: 'stable' | 'improving' | 'declining' | 'first_time';
  status: 'active' | 'acknowledged' | 'archived';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  protocolCode: string;
  recommendedAction?: string;
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

// ============================================================================
// Agent Tool Signatures
// ============================================================================

/**
 * Standardized tool result format
 */
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

/**
 * Tool: Get donor health history
 */
export interface GetDonorInfoInput {
  donorId: string;
}

export interface GetDonorInfoOutput extends ToolResult {
  data?: {
    name: string;
    language: string;
    age: number;
    gender: string;
    healthStatus: string;
    recentFindings: Finding[];
    deferralHistory?: Array<{ date: string; reason: string }>;
  };
}

/**
 * Tool: Get specific finding details
 */
export interface GetFindingInput {
  findingId: string;
}

export interface GetFindingOutput extends ToolResult {
  data?: Finding & {
    ontologyContext?: any;
    relatedFindings?: Finding[];
  };
}

/**
 * Tool: Get protocol for condition
 */
export interface GetProtocolInput {
  conditionId: string; // e.g., 'BP-G1', 'HB-DEF'
}

export interface GetProtocolOutput extends ToolResult {
  data?: {
    id: string;
    name: string;
    severity: string;
    recommendedAction: string;
    lifestyle: string[];
    followUpDays: number;
    monitoringIntervals: Record<string, string>;
    medicationConsideration: string;
  };
}

/**
 * Tool: Find nearby care facilities
 */
export interface GetCarePartnersInput {
  donorId: string;
  type?: 'hospital' | 'clinic' | 'aam' | 'urgent_care';
  maxResults?: number;
}

export interface GetCarePartnersOutput extends ToolResult {
  data?: CarePartner[];
}

/**
 * Tool: Book appointment
 */
export interface BookAppointmentInput {
  donorId: string;
  carePartnerId: string;
  preferredDate?: string;
  preferredTime?: string;
  reason: string;
}

export interface BookAppointmentOutput extends ToolResult {
  data?: {
    appointmentId: string;
    scheduledAt: string;
    confirmationCode: string;
    location: string;
    phone: string;
  };
}

/**
 * Tool: Get lifestyle recommendations
 */
export interface GetLifestyleRecommendationsInput {
  conditionId: string; // e.g., 'hypertension', 'anemia'
}

export interface GetLifestyleRecommendationsOutput extends ToolResult {
  data?: Array<{
    category: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
    expectedImpact: string;
  }>;
}

// ============================================================================
// Rate Limiter Types
// ============================================================================

/**
 * Rate limiter configuration
 */
export interface RateLimiterConfig {
  rpsLimit: number; // Requests per second
  dailyTokenLimit: number;
  modelName: string;
  exponentialBackoff: boolean;
}

/**
 * Rate limiter status
 */
export interface RateLimiterStatus {
  tokensUsedToday: number;
  tokensRemaining: number;
  requestsThisSecond: number;
  requestsRemaining: number;
  nextReset: string; // ISO 8601
  backoffActive: boolean;
}

// ============================================================================
// LLM Client Types
// ============================================================================

/**
 * LLM message for Anthropic API
 */
export interface LLMMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * LLM response wrapper
 */
export interface LLMResponse {
  content: string;
  tokensUsed: number;
  model: string;
  finishReason: 'end_turn' | 'max_tokens' | 'tool_use';
}

/**
 * Context for LLM prompting
 */
export interface LLMContext {
  donorId?: string;
  finding?: Finding;
  observation?: Observation;
  protocolContext?: any;
  ontologyContext?: string;
  language?: string;
  previousMessages?: LLMMessage[];
}

// ============================================================================
// Message Template Fallback Types
// ============================================================================

/**
 * Template variable substitution record
 */
export interface TemplateVariables {
  [key: string]: string | number | boolean;
}

/**
 * Message template with variables
 */
export interface MessageTemplate {
  id: string;
  template: string;
  language: string;
  category: string;
  variables: string[];
  tone: string;
  urgencyLevel: number;
}

// ============================================================================
// Ontology Integration Types
// ============================================================================

/**
 * Concept from ontology knowledge graph
 */
export interface Concept {
  id: string;
  name: string;
  snomedCode: string;
  definition: string;
  category: string;
  relatedProtocols: string[];
  symptoms: string[];
  measurements: string[];
  referenceRanges: Record<string, string>;
  riskFactors: string[];
  complications: string[];
  metadata: Record<string, any>;
}

/**
 * Protocol rule from ontology
 */
export interface Protocol {
  id: string;
  name: string;
  category: string;
  applicableCondition: string;
  severity: string;
  recommendedAction: string;
  lifestyle: string[];
  followUpDays: number;
  escalationThreshold: string;
  monitoringIntervals: Record<string, string>;
  targetPopulation: string;
  medicationConsideration: string;
}

/**
 * Lifestyle intervention recommendation
 */
export interface LifestyleIntervention {
  id: string;
  category: string;
  recommendation: string;
  description: string;
  duration: string;
  difficulty: 'easy' | 'moderate' | 'challenging';
  evidenceLevel: 'high' | 'medium' | 'low';
  applicableConditions: string[];
  language: string;
  alternatives?: string[];
}

// ============================================================================
// Protocol Engine Types
// ============================================================================

/**
 * Protocol analysis result
 */
export interface ProtocolAnalysisResult {
  protocolCode: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'wait' | 'defer' | 'refer' | 'urgent' | 'emergency';
  timeline: string;
  details: string;
  requiresFollowUp: boolean;
  followUpIntervalDays?: number;
}

// ============================================================================
// Message Formatter Types
// ============================================================================

/**
 * Platform-specific formatting options
 */
export interface FormattingOptions {
  platform: 'whatsapp' | 'sms' | 'email' | 'web';
  characterLimit?: number;
  supportedFeatures: string[];
}

/**
 * Formatted message output
 */
export interface FormattedMessage {
  raw: string;
  formatted: string;
  platform: string;
  metadata: Record<string, any>;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * POST /api/agents/navigate request
 */
export interface NavigateRequest {
  donorId: string;
  findingId: string;
  context?: Record<string, any>;
}

/**
 * POST /api/agents/navigate response
 */
export interface NavigateResponse {
  success: boolean;
  data?: NavigatorOutput;
  error?: string;
}

/**
 * POST /api/agents/generate-message request
 */
export interface GenerateMessageRequest {
  findingId: string;
  donorId: string;
  language: string;
  context?: Record<string, any>;
}

/**
 * POST /api/agents/generate-message response
 */
export interface GenerateMessageResponse {
  success: boolean;
  data?: MessageOutput;
  error?: string;
}

/**
 * POST /api/agents/record request
 */
export interface CreateRecordRequest {
  donorId: string;
  input: string | Buffer;
  type: 'text' | 'voice' | 'image';
  source?: string;
}

/**
 * POST /api/agents/record response
 */
export interface CreateRecordResponse {
  success: boolean;
  data?: RecordOutput;
  error?: string;
}

/**
 * GET /api/agents/status response
 */
export interface AgentStatusResponse {
  success: boolean;
  data?: {
    tokensUsed: number;
    tokensRemaining: number;
    rpsUsed: number;
    rpsRemaining: number;
    nextReset: string;
    backoffActive: boolean;
  };
  error?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export class AgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export class ValidationError extends AgentError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AgentError {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AgentError {
  constructor(
    message: string,
    public retryAfterSeconds: number
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
    this.name = 'RateLimitError';
  }
}

export class LLMError extends AgentError {
  constructor(message: string, public retryable: boolean = true) {
    super(message, 'LLM_ERROR', 500);
    this.name = 'LLMError';
  }
}
