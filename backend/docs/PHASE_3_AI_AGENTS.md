# Phase 3: AI Agents & Intelligent Orchestration

## Overview

Phase 3 implements TraceDrop's core AI agent system, which intelligently orchestrates health protocols, generates contextual messages, and builds comprehensive health records. This phase transforms TraceDrop from a static data platform to a proactive health companion.

**Target Completion**: October 10, 2026  
**Implementation Team**: Full stack with AI/ML focus

---

## Architecture

### Core Components

#### 1. **Navigator Agent** (`agents/navigator.ts`)
- **Purpose**: Orchestrates user flow and protocol navigation
- **Responsibilities**:
  - Analyzes user health status in real-time
  - Determines appropriate protocol recommendations
  - Handles escalation to human counsellors
  - Manages protocol state transitions
  
- **Key Methods**:
  - `analyze()`: Analyzes user state and recommends next action
  - `handleActiveProtocol()`: Manages ongoing protocol execution
  - `assessHealthStatus()`: Evaluates risk level and symptoms
  - `selectProtocol()`: Recommends protocol based on health data

- **Integration Points**:
  - Firestore for user state persistence
  - Protocol engine for state management
  - Ontology service for semantic understanding

#### 2. **Message Generator Agent** (`agents/messageGenerator.ts`)
- **Purpose**: Generates contextual, personalized health messages
- **Capabilities**:
  - Template-based generation (fast, consistent)
  - LLM-based generation (flexible, personalized)
  - Hybrid approach for optimal balance
  - Multi-platform formatting (SMS, WhatsApp, Web, Email)
  - A/B testing variants for messaging optimization

- **Key Methods**:
  - `generateMessage()`: Creates contextual message
  - `generateFromTemplate()`: Uses predefined templates
  - `generateWithLLM()`: Uses Claude for dynamic generation
  - `generateVariants()`: Creates variants for A/B testing
  - `validateMessage()`: Quality assurance check

- **Workflow**:
  ```
  Template Available? → Generate from Template → Validate & Format
              ↓
           NO → Use LLM → Parse Response → Format → Validate
  ```

#### 3. **Record Builder Agent** (`agents/recordBuilder.ts`)
- **Purpose**: Constructs and manages comprehensive health records
- **Capabilities**:
  - Creates structured health records from interactions
  - Aggregates multi-source health data
  - Generates alerts based on trends
  - Maintains record relationships and lineage
  - Supports complex queries and analytics

- **Record Types**:
  - Assessment: User health assessments and surveys
  - Visit: Counsellor interactions and consultations
  - Protocol: Protocol execution and completion
  - Prescription: Medication and treatment prescriptions
  - Measurement: Biometric data and measurements

- **Key Methods**:
  - `createRecord()`: Create new health record
  - `queryRecords()`: Query with filters and pagination
  - `generateSummary()`: Aggregated health timeline
  - `generateAlerts()`: Alert generation based on trends
  - `verifyRecord()`: Mark record as verified

---

## Utility Layer

### Protocol Engine (`utils/protocolEngine.ts`)
- Deterministic execution of health protocols
- Condition-based step transitions
- Session management and state tracking
- Timeout and validation support

**Core Concepts**:
- Protocol: Sequence of steps for health management
- Step: Individual action (assessment, action, decision, education, referral)
- ExecutionContext: Runtime state for protocol execution
- Condition: Evaluation criteria for step execution

### Logger (`utils/logger.ts`)
- Structured logging with multiple levels (DEBUG, INFO, WARN, ERROR, CRITICAL)
- Context-aware logging with trace IDs
- Extensible for Firebase Cloud Logging

### Message Formatter (`utils/messageFormatter.ts`)
- Platform-specific message formatting
- Character limit enforcement (SMS: 160, Push: 240, etc.)
- URL shortening support
- Emoji handling per platform

---

## LLM Integration

### LLM Client (`llm/llmClient.ts`)
- Anthropic SDK wrapper with error handling
- Exponential backoff retry logic (max 3 retries)
- Token usage tracking
- Streaming support for real-time responses
- Batch processing capability

**Configuration**:
```typescript
{
  model: 'claude-3-5-sonnet-20241022',
  maxTokens: 1024,
  temperature: 0.7,
  retryConfig: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000
  }
}
```

### Rate Limiter (`llm/rateLimiter.ts`)
- Bottleneck library for request throttling
- Configurable min time between requests (default: 100ms)
- Max concurrent requests (default: 3)
- Token-bucket algorithm support
- Real-time stats and monitoring

### Message Template System (`llm/messageTemplate.ts`)
- Predefined templates for common messages
- Dynamic variable substitution
- Platform-specific variants
- Fallback mechanism for missing templates
- Template validation and management

**Built-in Templates**:
- `welcome`: User onboarding
- `assessment-reminder`: Prompt user action
- `follow-up-schedule`: Schedule counsellor session
- `health-alert`: Emergency/urgent notifications
- `protocol-completion`: Protocol done feedback
- `resource-share`: Educational resources

---

## Middleware

### Authentication Middleware (`middleware/authMiddleware.ts`)
- Firebase token verification
- User context extraction
- Role-based access control (RBAC)
- Rate limiting per user
- Optional authentication support

**Features**:
- Extract JWT from Authorization header
- Verify token with Firebase Admin SDK
- Configurable skip paths
- Email verification requirement
- API key authentication support

---

## API Routes (`routes/agents.ts`)

### Navigation Endpoints

#### `POST /api/agents/navigate`
Get navigation decision for user
```json
{
  "request": {
    "healthData": { "symptom_fever": true, "fever_level": 101.5 },
    "platform": "web",
    "language": "en"
  },
  "response": {
    "action": "start_new_protocol",
    "targetProtocolId": "protocol-fever-management",
    "reason": "Elevated fever detected",
    "nextSteps": ["initialize_protocol", "send_protocol_intro"]
  }
}
```

### Message Generation Endpoints

#### `POST /api/agents/generate-message`
Generate contextual message
```json
{
  "request": {
    "messageType": "greeting",
    "language": "en",
    "platform": "sms"
  },
  "response": {
    "id": "msg-1728520800000-user123",
    "content": "Hello John! Welcome to TraceDrop Health.",
    "platform": "sms",
    "generationMethod": "template"
  }
}
```

#### `POST /api/agents/batch-messages`
Generate multiple messages efficiently

### Record Management Endpoints

#### `POST /api/agents/create-record`
Create new health record
```json
{
  "recordType": "measurement",
  "data": {
    "measurementType": "temperature",
    "value": 98.6,
    "unit": "F"
  }
}
```

#### `GET /api/agents/records`
Query user's health records
- Query params: `limit`, `offset`, `types`, `startDate`, `endDate`

#### `GET /api/agents/health-summary`
Get aggregated health timeline
- Query params: `days` (default: 30)

#### `GET /api/agents/health-status`
Get current health record statistics

---

## Data Models

### HealthRecord
```typescript
{
  recordId: string;
  userId: string;
  recordType: 'assessment' | 'visit' | 'protocol' | 'prescription' | 'measurement';
  timestamp: Date;
  data: Record<string, any>;
  source: 'user_input' | 'sensor' | 'counsellor' | 'protocol' | 'integration';
  verified: boolean;
  metadata: RecordMetadata;
}
```

### NavigationDecision
```typescript
{
  action: 'continue_protocol' | 'start_new_protocol' | 'escalate' | 'provide_education' | 'schedule_followup';
  targetProtocolId?: string;
  reason: string;
  context: Record<string, any>;
  nextSteps: string[];
}
```

### GeneratedMessage
```typescript
{
  id: string;
  userId: string;
  platform: Platform;
  content: string;
  originalContent: string;
  generationMethod: 'template' | 'llm' | 'hybrid';
  metadata: {
    messageType: string;
    generatedAt: Date;
    tokens?: number;
    personalizationLevel: string;
  };
}
```

---

## Ontology Service (`services/ontologyService.ts`)

Semantic knowledge graph for health concepts
- Node types: symptom, disease, treatment, medication, protocol, measurement
- Relationship types: causes, treats, related_to, precedes, contraindicated_with, requires
- Semantic search with similarity scoring
- Concept hierarchy traversal

**Example Query**:
```typescript
const matches = ontologyService.semanticSearch('fever', topK=5);
const relatedTreatments = ontologyService.getRelatedConcepts('symptom-fever', 'treats');
```

---

## Integration Points

### With Firestore Schema
- User state stored in `users/{userId}/profile`
- Health records in `users/{userId}/records/{recordId}`
- Protocol execution in `users/{userId}/protocols/{sessionId}`
- Messages in `users/{userId}/messages/{messageId}`

### With Frontend
- Real-time health summary updates via `/api/agents/health-summary`
- Message display from generation API
- Navigation recommendations for UX flow
- Record querying for health dashboard

### With Counsellor Tools
- Escalation events trigger counsellor notification
- Records accessible for counsellor consultation
- Follow-up scheduling integration

---

## Execution Flow

### Typical User Interaction

```
1. User opens app → optionalAuthMiddleware
2. Fetch health summary → GET /api/agents/health-summary
3. Get navigation decision → POST /api/agents/navigate
4. If escalation: notify counsellor
5. If new protocol: POST /api/agents/create-record (protocol start)
6. Generate greeting message → POST /api/agents/generate-message
7. Display protocol steps to user
8. On completion: POST /api/agents/create-record (protocol end)
```

### Message Generation Flow

```
1. Request arrives at POST /api/agents/generate-message
2. Check for matching template
3. If found: substitute variables, format for platform
4. If not found: call Claude LLM with system prompt
5. Parse LLM response
6. Validate message quality
7. Return formatted message
```

### Record Aggregation Flow

```
1. Query records from user's history (30-day window)
2. Group by type and measurement category
3. Calculate trends (improving, stable, declining)
4. Identify alerts based on trends
5. Generate summary with alert list
6. Return to frontend for display
```

---

## Error Handling

### Retry Logic
- LLM calls: Exponential backoff (1s → 2s → 4s, max 30s)
- Rate limiter: Queue and throttle automatically
- Firestore: Standard Firebase retry mechanism

### Fallback Mechanisms
- No LLM available → Use template system
- Template missing → Use generic fallback
- Record not found → Return empty result
- Authentication failed → Return 401 Unauthorized

### Logging
All errors logged with:
- Timestamp and log level
- User ID (if available)
- Trace ID for request correlation
- Context-specific metadata

---

## Performance Considerations

### Caching Strategy
- Ontology service: In-memory (load on startup)
- Templates: In-memory cache with update support
- Records: Query from Firestore with pagination (limit 50)

### Rate Limiting
- LLM API: 100 requests/minute (token-bucket)
- User API: 100 requests/minute per user
- Message generation: 10 concurrent LLM calls

### Database Queries
- Index on `userId` and `timestamp` for fast queries
- Batch writes for multi-record operations
- Query pagination (default: 50 records per page)

---

## Testing Strategy

### Unit Tests
- Protocol engine condition evaluation
- Message template substitution
- Ontology search algorithms
- Record aggregation logic

### Integration Tests
- End-to-end message generation
- Navigation decision with various health states
- Record creation and querying
- API endpoint validation

### Performance Tests
- Batch message generation (1000 messages)
- Record aggregation (10,000 records)
- Concurrent requests (100 simultaneous users)

---

## Future Enhancements

### Phase 4 Candidates
1. **Advanced Analytics**: Predictive health insights
2. **Personalization Engine**: User preference learning
3. **Multi-language Support**: Localization framework
4. **Real-time Alerts**: WebSocket integration
5. **Prescription Management**: Integration with pharmacies
6. **Family Health Management**: Multi-user accounts
7. **Wearable Integration**: IoT device data ingestion
8. **Voice Interface**: Speech-to-text message generation

---

## Deployment

### Environment Variables
```
ANTHROPIC_API_KEY=sk-...
LOG_LEVEL=INFO
LLM_MODEL=claude-3-5-sonnet-20241022
FIRESTORE_PROJECT_ID=tracedrop-...
FIREBASE_ADMIN_SDK_PATH=./firebase-key.json
```

### Docker Container
- Node 18+ runtime
- Dependencies installed via npm
- Health check endpoint on port 3000
- Log output to stdout

---

## Monitoring & Observability

### Key Metrics
- Message generation success rate
- Average LLM response time
- Navigation decision accuracy
- Record creation frequency
- API endpoint latency

### Trace & Debugging
- Request trace ID in all logs
- User ID correlation
- Timestamp precision (millisecond)
- Error stack traces for debugging

---

## Contributing

### Code Style
- TypeScript strict mode enabled
- ESLint configuration
- Prettier for formatting
- 2-space indentation

### Adding New Agents
1. Extend `BaseAgent` (if available)
2. Implement required methods
3. Add integration tests
4. Document in this file
5. Create API route if external-facing

---

## Support

For questions or issues, refer to:
- Phase 1: Foundation & Schema (BUILD_START.md)
- Phase 2: Data & APIs (API documentation)
- Phase 3: This document
- Team: Full daily standups at 9 AM IST

---

**Last Updated**: October 8, 2026  
**Version**: 1.0 (Phase 3 Initial Release)
