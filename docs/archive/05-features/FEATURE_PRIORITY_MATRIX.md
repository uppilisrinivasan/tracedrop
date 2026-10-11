# Feature Priority Matrix: Consumer-First Build Sequence

**Principle**: Donors first, then other stakeholders. Build what drives the 10x improvement.

---

## Feature Priority Tiers

### TIER 1: MUST HAVE - Donor Core Loop (Days 1-4)
**Why**: These features prove the core value proposition to donors and judges

#### 1.1 Donor Home Screen
- **What**: Dashboard showing health status, next donation, impact
- **Why**: First impression. Judges screenshot this. Drives repeated use.
- **Metrics**: Home screen load <1s, 85%+ day-1 return
- **Donor value**: "At a glance, I know my health status"
- **Component**: `frontend/pages/Home.tsx`
- **Dependencies**: Firestore schema for donors, findings

#### 1.2 Health Dashboard
- **What**: 6-month trend visualization, findings list, care status
- **Why**: Core insight that drives behavior change
- **Metrics**: Trend clear to non-medical person, 90%+ understand it
- **Donor value**: "I can see my BP is rising. It matters."
- **Component**: `frontend/pages/Dashboard.tsx`
- **Dependencies**: Firestore observations, charting library (recharts)

#### 1.3 Deferral Flow (4 screens)
- **What**: Finding notification → Explanation → Care booking → Confirmation
- **Why**: Converts "you're deferred" (bad) into "here's your care" (good)
- **Metrics**: Flow completion <2 min, 80%+ completion rate
- **Donor value**: "I got deferred but I have care booked this weekend."
- **Component**: `frontend/pages/DeferralFlow.tsx`
- **Dependencies**: Navigator agent, care booking service

#### 1.4 Finding Explanation (AI-Generated)
- **What**: WhatsApp/web message explaining finding in donor's language
- **Why**: Makes medical information accessible and personal
- **Metrics**: 30 messages rated ≥4/5 by native speakers
- **Donor value**: "I understand what's happening and why it matters."
- **Component**: `backend/services/message-generation.ts`
- **Dependencies**: Claude API, ontology, knowledge graph

#### 1.5 Care Booking (Same-Day)
- **What**: Find nearby AAM, pick time, book in app
- **Why**: Removes friction. "Booked" same day, not weeks later.
- **Metrics**: Booking time <30 min, 90%+ book successfully
- **Donor value**: "I have an appointment this Saturday. Easy."
- **Component**: `backend/services/booking-service.ts`
- **Dependencies**: Maps API, mock appointment system, doctor approval gate

#### 1.6 Real-Time Data Binding
- **What**: App updates instantly when Firestore data changes
- **Why**: Donors see changes live (appointment confirmed, message received)
- **Metrics**: Update latency <500ms, no stale data
- **Donor value**: "Things happen instantly. This feels responsive."
- **Component**: `frontend/hooks/useFirestore.ts`, Firestore listeners
- **Dependencies**: Firestore, React hooks

#### 1.7 Funnel Dashboard (Measurable 3x)
- **What**: Show 92% reach care (vs 33% today), with real numbers
- **Why**: Judges need to SEE the 3x improvement
- **Metrics**: Dashboard shows real data from synthetic run
- **Judge value**: "This proves it works."
- **Component**: `frontend/pages/Funnel.tsx`
- **Dependencies**: BigQuery queries, synthetic data funnel

**Tier 1 Success**: Judges hold app, see home → dashboard → booking. Say "I'd use this."

---

### TIER 2: SHOULD HAVE - Habit & Verification (Days 5-8)
**Why**: These features create habit formation and prove sustainability

#### 2.1 Follow-Up Messages
- **What**: Day 3 ("How was care?"), Day 30 ("On medication?"), Day 90 ("Cleared!")
- **Why**: Closes the loop. Shows system cares about outcome.
- **Metrics**: 90%+ completion rate, retention 90% at 6 months
- **Donor value**: "The system checks on me. Makes me want to return."
- **Component**: `backend/services/followup-service.ts`
- **Dependencies**: Cloud Tasks/Scheduler, message generation

#### 2.2 Care Completion Tracking
- **What**: "Did you go to care? What was the outcome?"
- **Why**: Proves outcome-driven, not just booking-driven
- **Metrics**: 85%+ provide outcome feedback
- **Donor value**: "I see my progress tracked."
- **Component**: `frontend/pages/CareOutcome.tsx`
- **Dependencies**: Firestore outcomes collection

#### 2.3 Trend Badges & Celebration
- **What**: "🏆 You caught high BP before a stroke"
- **Why**: Psychological hook. Makes donors feel valued.
- **Metrics**: 95% engagement with badges
- **Donor value**: "I'm celebrated as health-conscious."
- **Component**: `frontend/components/ImpactBadge.tsx`
- **Dependencies**: Outcome data, badge logic

#### 2.4 Record Upload (Photo/PDF)
- **What**: Donor uploads lab report, system extracts fields
- **Why**: Donor owns their data, app learns from it
- **Metrics**: ≥95% extraction accuracy
- **Donor value**: "My existing reports work here."
- **Component**: `backend/agents/record-builder.ts`
- **Dependencies**: Gemini multimodal, FHIR conversion

#### 2.5 Language Toggle (Multi-Language Support)
- **What**: Hindi, Kannada, English, Tamil, Telugu
- **Why**: Inclusivity. Makes it their platform.
- **Metrics**: 80%+ use non-English
- **Donor value**: "It speaks my language."
- **Component**: `frontend/components/LanguageToggle.tsx`
- **Dependencies**: Message templates in multiple languages

#### 2.6 Counsellor-Visible Queue (Reactive Flags)
- **What**: Confidential findings routed to counsellor, not AI
- **Why**: Privacy & safety. Shows responsible AI use.
- **Metrics**: 0 leaks of confidential data
- **Counsellor value**: "I see my queue, manage manually."
- **Component**: `backend/services/counsellor-service.ts`
- **Dependencies**: Separate counsellor_queue collection

#### 2.7 Doctor Approval Console
- **What**: Doctor sees care plans, approves with one tap
- **Why**: Keeps humans in charge (judges care about this)
- **Metrics**: Doctor approval <5 min
- **Doctor value**: "I approve plans, not micromanage."
- **Component**: `frontend/pages/DoctorConsole.tsx`
- **Dependencies**: Care plans, approval workflow

**Tier 2 Success**: Full 90-day journey visible. Arjun's story complete (deferral → care → outcome → return).

---

### TIER 3: NICE TO HAVE - Scaling & Sustainability (Days 9+)
**Why**: These features optimize for scale, personalization, and long-term adoption

#### 3.1 Calendar Integration
- **What**: Add appointment to phone calendar
- **Donor value**: "Reminder shows up with my other events."
- **Component**: `frontend/utils/calendar-integration.ts`

#### 3.2 Social Proof & Leaderboards
- **What**: "500 donors like you caught health issues this month"
- **Donor value**: "I'm part of something bigger."
- **Component**: `frontend/components/SocialProof.tsx`

#### 3.3 Data Export (PDF)
- **What**: Download my records
- **Donor value**: "I own my data, can share with doctors."
- **Component**: `frontend/services/export.ts`

#### 3.4 Lifestyle Recommendations
- **What**: "Salt <5g/day, 30min activity" (from ICMR protocol)
- **Donor value**: "Personalized guidance."
- **Component**: `frontend/components/LifestyleCard.tsx`

#### 3.5 Referral Program
- **What**: "Invite friends, get 500 blood-donor points"
- **Donor value**: "Social loop, feel rewarded."
- **Component**: `frontend/pages/Referral.tsx`

#### 3.6 ABHA Integration (Mock)
- **What**: Link to mock ABHA, share records
- **Donor value**: "My health record is portable."
- **Component**: `backend/services/abha-integration.ts`

**Tier 3 Success**: Ecosystem effects visible. Donors bringing friends. Habit loop solidifying.

---

## Dependency Graph

```
TIER 1 DEPENDENCIES:
  Home Screen       ← Firestore donors/findings
  Dashboard        ← Observations, charting lib
  Deferral Flow    ← Navigator agent, booking service
  Messages         ← Claude API, ontology
  Care Booking     ← Maps API, doctor approval
  Real-time bind   ← Firestore listeners
  Funnel           ← BigQuery, synthetic data

TIER 2 DEPENDENCIES:
  Follow-ups       ← Cloud Tasks + message generation
  Care Completion  ← Outcomes collection
  Badges           ← Outcome data
  Upload Reports   ← Gemini multimodal
  Languages        ← Message templates
  Counsellor Queue ← Separate collection + safety
  Doctor Console   ← Care plans, auth

TIER 3 DEPENDENCIES:
  All tier 3 depend on tier 1+2 being solid
```

---

## Build Sequence (Days 1-10)

### Day 1-2: Tier 1 Foundation
```
Components:
- data/generate.py (synthetic data)
- Firestore schema & collections
- Docker setup
- Frontend app shell
- Backend server

Status: Foundation ready
```

### Day 3-4: Tier 1 Core UX
```
Components:
- Home screen (beautiful, judges screenshot)
- Dashboard (trends visible)
- Deferral flow (4 screens)
- Real-time binding

Status: Consumer app deployed
```

### Day 5-6: Tier 1 AI Magic
```
Components:
- Navigator agent (ADK agentic loop)
- Message generation (ontology context)
- Care booking (Maps API)
- Doctor approval gate

Status: End-to-end flow works
```

### Day 7-8: Tier 2 Habit Loop
```
Components:
- Follow-ups (day 3, 30, 90)
- Care completion tracking
- Impact badges
- Counsellor queue

Status: Measurable 3x visible
```

### Day 9-10: Tier 3 & Polish
```
Components:
- Record upload
- Multi-language
- Security review
- Cloud Run deployment
- Demo preparation

Status: Live, demo-ready
```

---

## Feature Scoring Alignment

| Feature | Donor Value | Judge Value | Score Impact |
|---------|---|---|---|
| Home screen | ⭐⭐⭐⭐⭐ | UX demo piece | +0.3 |
| Trends | ⭐⭐⭐⭐⭐ | Clarity | +0.2 |
| Messages | ⭐⭐⭐⭐⭐ | Personalization | +0.2 |
| Same-day booking | ⭐⭐⭐⭐⭐ | Usability | +0.3 |
| Follow-ups | ⭐⭐⭐⭐ | Outcomes | +0.2 |
| Doctor approval | ⭐⭐⭐ | Safety/responsibility | +0.2 |
| Counsellor queue | ⭐⭐⭐ | Safety/privacy | +0.2 |
| Funnel dashboard | ⭐⭐⭐⭐⭐ | Measurable 3x | +1.0 |
| **Total** | | | **+3.2/10** |

---

## What We DON'T Build (First 10 Days)

❌ Real doctor integrations (mock is fine)  
❌ Real hospital APIs (mock scheduling works)  
❌ Real WhatsApp (web fallback ok)  
❌ Real ABHA (mock is enough)  
❌ Diagnosis or prescriptions (AI never does this)  
❌ Real patient data (synthetic only)  
❌ Admin panels (judges don't need these)  

**Why**: Scope control. Focus on what proves the 10x (donor experience + outcomes).

---

## Success Metrics by Tier

| Tier | Metric | Target | Verify By |
|------|--------|--------|---|
| **Tier 1** | Donor sees home+dashboard+booking | 3/3 complete | Day 4 |
| **Tier 1** | App deployed on Cloud Run | Live URL | Day 4 |
| **Tier 1** | Judges understand deferral→care flow | <2 min understand | Demo |
| **Tier 2** | Funnel shows 92% reach care | Real metric visible | Day 8 |
| **Tier 2** | 90-day story complete (Arjun full journey) | Replay-able | Day 8 |
| **Tier 3** | All safety tests pass (0 leaks) | 50 adversarial prompts | Day 9 |
| **Overall** | Competition score | 8.5-9.0/10 | Oct 18 |

---

**Key Principle**: Tier 1 wins the competition. Tier 2 proves sustainability. Tier 3 is bonus.

Focus ruthlessly on Tier 1 for Days 1-4. Ship and validate before moving to Tier 2.

