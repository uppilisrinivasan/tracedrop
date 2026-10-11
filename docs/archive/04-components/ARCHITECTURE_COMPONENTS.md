# TraceDrop Component Architecture

**Organized by: Tier, Layer, User Priority**

---

## System Layers

```
┌─────────────────────────────────────────────────────────┐
│            CONSUMER LAYER (Donor First)                 │
│  React App + PWA (next-gen UX, responsive)             │
└─────────────────────────────────┬───────────────────────┘
                                  ↕
┌─────────────────────────────────────────────────────────┐
│        ORCHESTRATION LAYER (Agentic AI)                 │
│  Node.js + Express + Anthropic ADK                     │
│  - Navigator Agent (reasoning)                          │
│  - Message Generator (contextual)                       │
│  - Record Builder (multimodal)                          │
│  - Tools (Maps, Booking, Follow-up)                    │
└─────────────────────────────────┬───────────────────────┘
                                  ↕
┌─────────────────────────────────────────────────────────┐
│           DATA LAYER (Multi-Source)                     │
│  Firestore (primary)  BigQuery (analytics)              │
│  Neo4j (ontology)     FHIR (standard)                   │
└─────────────────────────────────────────────────────────┘
```

---

## TIER 1: Consumer Layer Components (Days 1-4)

### Frontend Pages (Hero Components)

**1. Home.tsx** (Donor first)
```
Component: <HomePage />
Purpose: Health status at a glance
Visual: 
  - Header: "Your Health"
  - Status card: Green/Yellow/Red (health status)
  - Donation date: "Next eligible: Saturday"
  - Impact badge: "🏆 You helped X people"
  - CTA buttons: "View Health", "Book Care"
Data needed:
  - Donor profile (name, language, next eligible date)
  - Latest findings (if any)
  - Impact metrics (self-calculated)
Load time target: <1s
Mobile: Full width, touch-friendly buttons
```

**2. Dashboard.tsx** (Health visibility)
```
Component: <HealthDashboard />
Purpose: 6-month trend + findings + care status
Visual:
  - Trend chart (BP/Hb over 6 months, color zones)
  - Findings list (date, type, status)
  - Care status for each finding
  - Doctor summary (if completed)
Data needed:
  - Last 6 months observations (BP, Hb)
  - All findings
  - Care plans linked to findings
  - Outcomes (if any)
Load time target: <2s
Mobile: Swipeable sections, readable chart
```

**3. DeferralFlow.tsx** (4-screen deferral journey)
```
Component: <DeferralFlow />
Purpose: Deferred → Understanding → Care Booking → Confirmation

Screen 1: Finding Alert
  - Display: "Your BP is 148/94"
  - Trend chart: Last 4 readings
  - Context: "It's been rising"

Screen 2: Explanation (AI-generated)
  - Message: Plain language, their language
  - Why it matters: "Most people don't have symptoms"
  - Next step: "Let's get you checked"

Screen 3: Care Booking
  - Map: 3 nearest AAMs
  - Pick time: Calendar picker
  - Confirm: "Book now"

Screen 4: Confirmation
  - Appointment details
  - Calendar add button
  - Reassurance: "Doctor approves" ✓

Data needed:
  - Finding details
  - Care booking availability
  - Doctor approval status
Flow time target: <2 minutes
Mobile: Large touch targets, step indicator
```

**4. Funnel.tsx** (Measurable 3x)
```
Component: <FunnelDashboard />
Purpose: Prove the 3x improvement with real numbers
Visual:
  - Funnel stages (Finding → Explained → Booked → Completed)
  - Real numbers at each stage
  - Percentage reaching care (92% vs 33%)
  - Consumer metrics (85% day-1 return, 90% retention)

Data needed:
  - BigQuery: Funnel aggregates
  - Synthetic run results
Load time target: <1s
Mobile: Vertical funnel visualization
```

### Frontend Components (Building Blocks)

**TrendChart.tsx**
```
Purpose: Visualize BP/Hb trend over 6 months
Props: observations[], metric ('BP' | 'Hb')
Visual: Line chart with color zones (normal, elevated, urgent)
Library: recharts
```

**FindingCard.tsx**
```
Purpose: Display single finding
Props: finding object
Visual: Date, type, status badge, care status
Interactive: Click to see detail
```

**MessageBubble.tsx**
```
Purpose: Display AI-generated message
Props: message, language, sender
Visual: WhatsApp-style bubble, can render Markdown
```

**ImpactBadge.tsx**
```
Purpose: Celebrate donor achievement
Props: impact text, icon
Visual: Badge with emoji + text
Psychology: Habit formation trigger
```

### Frontend Hooks (Data Binding)

**useFirestore.ts**
```
Purpose: Real-time Firestore listener
Usage: const [donor] = useFirestore('donors', donorId)
Behavior: Re-render when Firestore data changes
Fallback: Use cached data if offline
```

**useDonor.ts**
```
Purpose: Fetch and manage donor profile
Returns: donor object, loading, error
Dependencies: useFirestore
```

**useFindings.ts**
```
Purpose: Fetch donor's findings
Returns: findings array, loading, error
Caching: TanStack Query for optimization
Dependencies: useFirestore
```

**useTrends.ts**
```
Purpose: Calculate trend direction and slope
Input: observations array
Returns: direction ('up'|'down'|'stable'), slope
```

---

## TIER 1: Orchestration Layer Components (Days 5-6)

### Agents (Anthropic ADK)

**NavigatorAgent**
```
Purpose: Main agentic loop for donor journey
Tools:
  - read_record: Get FHIR data
  - find_facility: Maps API call
  - book_slot: Create appointment
  - schedule_followup: Add to queue
  - request_counselling: For confidential findings

System prompt:
  "You are Arjun's health friend. Explain findings in {language},
   using his trend data and family history. Sound conversational, 
   not medical. Never say diagnosis words. Always offer 'talk to person'."

Loop flow:
  1. Read donor's record
  2. Understand finding + trend
  3. Propose care (via AI reasoning)
  4. Get doctor approval
  5. Book appointment
  6. Schedule follow-ups
  7. Update donor in app

Max iterations: 10 (prevent infinite loops)
```

**RecordBuilder** (Multimodal)
```
Purpose: Extract data from lab reports
Input: Image, PDF, or photo of lab report
Model: Gemini 3.5 multimodal
Output: Extracted fields with confidence scores
Process:
  1. Receive image/PDF
  2. Call Gemini with image
  3. Extract: Hb, glucose, lipids, etc.
  4. For each field: value + confidence
  5. Ask back for fields <0.8 confidence
  6. Convert to FHIR Observation
  7. Store in Firestore

Accuracy target: ≥95%
```

### Services (Business Logic)

**MessageGenerationService**
```
Purpose: Generate personalized health messages
Input: donor, finding, context
Process:
  1. Retrieve from knowledge graph:
     - Concept definition
     - Protocol (BP-G1, HB-DEF, etc.)
     - Lifestyle steps (from ICMR)
  2. Get donor context:
     - Trend data
     - Family history
     - Language preference
  3. Build prompt with ontology context
  4. Call Claude API
  5. Store reasoning (method, confidence, KG used)
  6. Return message

Output: Message text + metadata
Rate limit: 10 RPS, track tokens
```

**BookingService**
```
Purpose: Handle care booking workflow
Process:
  1. Find nearby facilities (Maps API)
  2. Get availability (mock schedule)
  3. Create CarePlan (proposed)
  4. Notify doctor for approval
  5. Wait for approval (async)
  6. Create Appointment
  7. Confirm to donor
  8. Schedule follow-ups

Approval gate: CRITICAL (keeps humans in charge)
Timeout: 5 minutes (if no approval, book anyway)
```

**FollowUpService**
```
Purpose: Schedule and send follow-up messages
Schedule:
  - Day 3: "How was your appointment?"
  - Day 30: "Are you on medication?"
  - Day 90: "You're cleared. Ready to donate?"

Uses: Cloud Tasks or Cloud Scheduler
Message generation: Via MessageGenerationService
```

**CounsellorService**
```
Purpose: Manage confidential findings
Safety: AI NEVER sees the reason for flag
Process:
  1. Flag identified (reactive test result)
  2. Route to counsellor_queue (separate collection)
  3. Send generic message to donor:
     "We'd like a confidential conversation. 
      Our counsellor will call you soon."
  4. Counsellor sees queue: "14 to reach / 11 reached / 3 your-call"
  5. Counsellor marks done, audit logged

Privacy design: AI sees only "counselling_required: true"
```

---

## TIER 1: Data Layer Components (Days 1-2)

### Firestore Collections

**Collection: donors**
```
Document: D-001
{
  id: "D-001",
  name: "Arjun Singh",
  phone: "+919876543210",
  language: "hi",
  gender: "M",
  age: 34,
  nextEligibleDate: "2026-10-18",
  healthStatus: "monitoring",  // 'healthy' | 'monitoring' | 'urgent'
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Collection: findings**
```
Document: F-001
{
  donorId: "D-001",
  category: "BP_GRADE1",  // Protocol rule applied
  sourceObservation: "148/94",
  trend: {
    readings: [128, 134, 138, 148],
    direction: "rising",
    slope: 6.7
  },
  status: "pending",  // 'pending' | 'explained' | 'booked' | 'completed'
  createdAt: timestamp
}
```

**Collection: observations**
```
Document: OBS-001
{
  donorId: "D-001",
  type: "BP",  // 'BP' | 'Hb' | 'lab'
  value: 148,
  unit: "mmHg",
  recordedAt: timestamp,
  source: "blood-centre" | "lab" | "donor-upload"
}
```

**Collection: communications**
```
Document: COMM-001
{
  donorId: "D-001",
  type: "finding_explanation",
  channel: "whatsapp" | "web" | "sms",
  payload: "आपका BP 148/94 है...",
  generationMethod: "claude-3-5-sonnet-with-kg",
  knowledgeUsed: ["family_history", "trend_analysis", "BP_G1"],
  confidence: 0.95,
  sentAt: timestamp
}
```

**Collection: care_plans**
```
Document: CP-001
{
  donorId: "D-001",
  findingId: "F-001",
  status: "pending_approval" | "approved" | "rejected",
  proposedAction: "AAM visit for BP check",
  proposedFacilityId: "AAM-101",
  proposedTime: timestamp,
  approvedBy: "doctor-id",
  approvedAt: timestamp
}
```

**Collection: appointments**
```
Document: APT-001
{
  donorId: "D-001",
  carePlanId: "CP-001",
  facilityId: "AAM-101",
  startTime: timestamp,
  endTime: timestamp,
  status: "booked" | "attended" | "cancelled",
  confirmationSentAt: timestamp
}
```

**Collection: outcomes**
```
Document: OUT-001
{
  appointmentId: "APT-001",
  donorId: "D-001",
  attended: true,
  resultValue: 132,  // New BP reading
  resultUnit: "mmHg",
  status: "cleared" | "needs_followup",
  recordedAt: timestamp
}
```

**Collection: counsellor_queue** (CONFIDENTIAL)
```
Document: CQ-001
{
  donorId: "D-001",
  flagType: "reactive_flag",  // Never disclose reason to AI
  urgency: "routine" | "within_48h",
  status: "pending" | "reached" | "done",
  counsellorNotes: "Called, disclosed result, referred to ICTC",
  handledBy: "counsellor-id",
  handledAt: timestamp
}
```

### BigQuery Tables (Analytics)

**Table: funnel**
```
Columns:
  - donor_id
  - finding_id
  - stage: 'identified' | 'explained' | 'booked' | 'completed' | 'cleared' | 'returned'
  - timestamp

Query for dashboard:
  SELECT 
    COUNT(DISTINCT donor_id) as total,
    COUNT(DISTINCT IF(stage='identified', donor_id, null)) as findings,
    COUNT(DISTINCT IF(stage='explained', donor_id, null)) as explained,
    ...
```

**Table: donor_metrics**
```
Columns:
  - date
  - day1_return_rate
  - care_completion_rate
  - retention_rate_6mo
  - avg_message_rating
```

---

## Component Dependency Order (Build Sequence)

```
Day 1-2: Foundation
├─ Firestore schema (all collections)
├─ BigQuery tables
├─ Synthetic data generation
└─ Docker setup

Day 3: Consumer Layer
├─ Home.tsx
├─ Dashboard.tsx
├─ TrendChart component
├─ useFirestore hook
└─ useFindings hook

Day 4: Deferral Flow
├─ DeferralFlow.tsx (4 screens)
├─ MessageBubble component
├─ useBooking hook
└─ Funnel.tsx (for metrics)

Day 5-6: AI Layer
├─ NavigatorAgent (ADK)
├─ RecordBuilder (multimodal)
├─ MessageGenerationService
└─ BookingService

Day 7-8: Integration
├─ FollowUpService
├─ CounsellorService
├─ CareOutcome tracking
└─ Doctor approval console

Day 9-10: Polish
├─ Multi-language support
├─ Record upload
├─ Security review
├─ Cloud Run deployment
└─ Demo setup
```

---

**All components prioritize: Donors first, then other users.**

