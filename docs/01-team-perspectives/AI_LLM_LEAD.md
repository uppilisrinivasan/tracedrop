# AI/LLM Lead Perspective

**Role Summary**: Implement agentic AI reasoning (not a chatbot) to make the donor journey frictionless, from finding discovery to care navigation without hallucination or data leaks.

---

## Primary Goals

- Build a **Navigator Agent** that reads findings → understands context → proposes care without user asking
- Achieve **≥4/5 message quality rating** from judges/users
- Ensure **0 confidential data leaks** to LLM (protocol-enforced safety)
- Implement **RAG fallback** so the system works even if LLM is down
- Keep token usage within budget (**100k tokens/day max**, with rate limiting)

---

## Perspective on Solution

As AI/LLM Lead, I see the critical difference between what fails and what wins:

**The Chatbot Trap**: Other solutions add a chatbot. "Ask the AI about your BP." Fake. Donors don't want to talk to an AI. They want care without asking.

**Our Win**: The AI is invisible. Arjun's BP rises. No user interaction. The system:
1. **Reads** findings automatically (BP observation + protocol rules)
2. **Understands** context (age 35, first high reading, mild elevation)
3. **Proposes** care (this clinic, today, 2km away, doctor briefed)
4. **Follows up** (day 3, then weekly for 6 weeks)

The AI is doing cognitive work, not chatting. Agentic.

**Why It Matters**:
- Judges see: "System found this, proposed this, booked this" vs. "Chat with the AI"
- Frictionless feels magical; chat feels like overhead
- Measurable 3x comes from automation, not conversation

**What "Agentic" Means**:
- Tool use (can call Firestore, care provider API)
- Reasoning (considers context + protocols + exceptions)
- Safety gates (never processes confidential data, falls back gracefully)
- Determinism (same input = same output, auditable)

---

## Key Decisions They Make

1. **Navigator Agent Architecture**
   - **Trigger**: New finding in Firestore (via listener)
   - **Input**: Finding (BP 148/92, age 35, M, location)
   - **Processing Pipeline**:
     a. Protocol layer: Is this actionable? (Yes, high BP)
     b. Context layer: Any exceptions? (On medication? Recent stress?)
     c. RAG layer: What's the recommended care? (Clinic + counselor queue routing)
     d. Composition layer: Generate message + book appointment
   - **Output**: Message to donor + appointment booking request
   - **Safety**: If LLM confidence <80%, escalate to counselor queue

2. **Message Generation Strategy**
   - **Template-based with AI augmentation**:
     - Base: "Hey Arjun, we noticed your BP is 148/92, which is elevated."
     - Context: "This is your first reading that high; let's check on it."
     - Action: "We have care available today at AAM clinic, 2km away, 10am. Already told the doctor. Ready?"
   - **Tone**: Friendly, not clinical. Like a health coach, not a doctor.
   - **Language**: Use Indian English (colloquial, accessible)
   - **Length**: <160 chars for SMS, <500 chars for WhatsApp
   - **Localization**: Hindi/Kannada via LLM (not static translation)

3. **Rate Limiting & Cost Control**
   - **Budget**: 100k tokens/day max
   - **Strategy**:
     - Protocol rules execute before LLM (rule-based fallback)
     - Batch processing (don't call LLM for every small action)
     - Caching (same message template reused)
     - Token estimation before calls (fail fast if over budget)
   - **Implementation**: Bottleneck library + custom token tracker
   - **Alerts**: If usage >80% of daily budget, escalate

4. **RAG (Retrieval-Augmented Generation) Fallback**
   - **Purpose**: If LLM is rate-limited or down, system still works
   - **Vector DB**: Firestore + embeddings cache
   - **Fallback Flow**:
     - LLM unavailable? Query knowledge graph for similar cases
     - Show similar message + care plan from past (no LLM)
     - Works 99% as well, costs nothing, always available
   - **Refresh**: Weekly embeddings refresh of new protocols

5. **Data Privacy Protocol** (Critical)
   - **Never pass to LLM**:
     - Real patient names (use ID instead)
     - Exact home addresses (use ZIP code)
     - Specific diagnoses from confidential queue (summarize only)
     - Family member data (aggregate only)
   - **Always pass**:
     - Age, gender, observation values (BP, Hb)
     - Finding type (high BP, low Hb)
     - Protocol name (e.g., "high_bp_protocol_v2")
   - **Audit**: Every LLM call logged (finding_id, tokens, output) for review

6. **Tool Use Design**
   - **Available Tools**:
     1. `get_care_providers(location, condition, available_now)` → returns clinics
     2. `book_appointment(provider_id, time_slot, finding_id)` → creates appointment
     3. `get_protocol_rules(finding_type)` → returns care pathway
     4. `check_user_context(donor_id)` → allergies, medications, history
     5. `send_message(donor_id, message, channel)` → SMS/WhatsApp/email
   - **Safety**: Tool use only if LLM confidence >80% + manual audit for critical actions

---

## Concerns They Have

### Token Budget Overrun
**What if message generation costs more than budgeted?** 100k tokens/day = ~500 messages. If avg message = 200 tokens, we hit limit in half day.
- *Mitigation*: Batch processing, template reuse, protocol-based filtering, RAG fallback

### Hallucination (Critical Risk)
**What if the LLM makes up a clinic location or care pathway?** Donors get false information. Trust destroyed.
- *Mitigation*: 
  - LLM only composes messages, doesn't make decisions
  - All decisions (booking, care routing) from deterministic protocols
  - LLM confidence <80% → escalate to counselor queue
  - Audit every message before sending (or immediate review after)

### Data Leakage
**What if we accidentally pass a real name/address to the LLM?** Privacy nightmare, losing points, legal issue.
- *Mitigation*: 
  - Never construct full records; build minimal inputs
  - Unit tests proving no real data in LLM inputs
  - Firestore security rules block confidential data from LLM processors

### LLM Rate Limiting (Anthropic API Throttle)
**What if Anthropic rate-limits our 100k token budget?** The system stalls.
- *Mitigation*:
  - Pre-emptive rate limiting (Bottleneck library)
  - Queue-based processing (not real-time)
  - RAG fallback (no LLM needed)
  - Escalate to counselor queue if rate-limited

### Message Quality (Subjective)
**What if judges read the messages and say "This feels generic/clinical"?** Low score on execution.
- *Mitigation*:
  - Native Hindi speaker on messaging team
  - Test messages with real users (beta testers)
  - Message diversity (vary phrasing, not templated)
  - Localization expert reviews Hindi tone

### Privacy Audit Failure
**What if judges ask: "Did any real data go to the LLM?" and we can't prove it didn't?** Disqualification risk.
- *Mitigation*:
  - Logging every LLM call + inputs (redacted for review)
  - Automated tests proving no real data
  - Firestore security rules audit
  - Pre-submission security review

---

## Success Metrics

### Message Quality Rating
- **Target**: ≥4/5 from user surveys or judge feedback
- **Measured**: 
  - Clarity: Does it explain the finding clearly? (1-5)
  - Tone: Does it feel personal, not clinical? (1-5)
  - Actionability: Does it propose next steps? (1-5)
- **Judgment**: Quality of AI outputs = credibility of whole system

### Zero Data Leakage
- **Target**: Audit shows 0 real PII passed to LLM
- **Evidence**: 
  - Log review (last 1,000 LLM calls)
  - No real names, addresses, diagnoses in request bodies
  - Security rules enforce redaction
- **Judgment**: Privacy is binary (pass/fail); failure = disqualification

### RAG Fallback Reliability
- **Target**: System works at 99% quality even if LLM down
- **Test**: Disable LLM for 1 hour; verify messages still generated from RAG
- **Judgment**: Resilience shows production thinking

### Token Budget Adherence
- **Target**: Never exceed 100k tokens/day; maintain <80% utilization
- **Tracked**: Daily token usage dashboard in BigQuery
- **Judgment**: Staying under budget proves efficient design

### Message Generation Latency
- **Target**: Message ready within 30 seconds of finding (p95)
- **Tracked**: Firestore timestamps (finding_created → message_ready)
- **Judgment**: Fast = feels responsive to user

### Protocol Coverage
- **Target**: ≥95% of findings have protocol rules (don't need LLM for every decision)
- **Measured**: Findings with routing decisions / total findings
- **Judgment**: High protocol coverage = AI assistant, not AI decision-maker

---

## Feature Priority Lens

### Tier 1 (Must Have by Day 5)
1. **Protocol-Based Finding Router**
   - High BP → care center + counselor queue
   - Low Hb → iron clinic + dietary advice
   - Rules-based, no LLM needed yet
   - Audit trail (which rule fired?)

2. **Message Composition via LLM**
   - Input: Finding type, donor context, protocol routing
   - Output: Natural language message in Hindi/English
   - Max 200 tokens per message
   - Confidence scoring + escalation

3. **Care Provider Integration**
   - API to local clinics/hospitals
   - Check availability (real-time or cached)
   - Book appointment (send doctor brief + appointment time)
   - Confirmation to donor

### Tier 2 (Nice to Have by Day 5, Must by Day 7)
1. **RAG Fallback System**
   - Vector DB of past messages + outcomes
   - If LLM down, retrieve similar case
   - Reuse message template
   - Track quality vs. LLM-generated

2. **Context Retrieval from Firestore**
   - Donor's allergy history
   - Current medications (don't suggest conflicting care)
   - Past findings (is this a pattern?)
   - Care outcomes (did previous advice help?)

3. **Follow-up Message Scheduling**
   - Day 3 post-care: "How was your appointment?"
   - Day 30: "Are you on the recommended treatment?"
   - Day 90: "Check-in — health improving?"
   - Auto-generate via template (not LLM each time)

### Tier 3 (Not for Competition)
- Conversational agent (if user initiates chat)
- AI-powered counselor queue routing (match to specialist)
- Outcome prediction (will this care plan work?)

---

## Trade-offs

### If Token Budget Gets Tight
1. **Sacrifice**: Real-time message generation
   - **Keep**: Batch processing (daily digest of findings)
   - **Why**: Saves 50% of tokens, slightly less responsive

2. **Sacrifice**: Contextual message variation
   - **Keep**: Template-based messages (structured variations)
   - **Why**: Templates use 30% fewer tokens

3. **Sacrifice**: LLM-generated Hindi (from English)
   - **Keep**: Pre-translated Hindi templates
   - **Why**: Fewer tokens, better quality (native speakers translated)

4. **Sacrifice**: Follow-up message personalization
   - **Keep**: Templated follow-ups (still personal via insertion fields)
   - **Why**: 5-10 templates cover 90% of cases

5. **Sacrifice**: Hallucination prevention (confidence scoring)
   - **Keep**: Protocol rules + manual audit on all findings
   - **Why**: Manual review scales to <50 findings/day if needed

---

## Collaboration Points

### With Consumer UX Lead
- **Notification tone**: How should message feel in-app vs. SMS?
- **Message display**: How long should message stay visible? (Scroll history?)
- **Feedback loop**: Can donors rate message quality? (Helps us improve)

### With Data Lead
- **Schema**: Finding + care plan structure (what fields LLM sees?)
- **Protocol storage**: Where do protocol rules live? (Firestore or config?)
- **Context queries**: Can we fast-fetch donor history? (Performance?)

### With Infrastructure Lead
- **LLM endpoint**: Is it rate-limited? Retries + backoff?
- **Firestore reads**: Tool use queries hitting quotas?
- **Logging**: Can we audit every LLM call without blowing logs?

### With Product/Demo Lead
- **Demo script**: Show message generation live or pre-recorded?
- **Demo safety**: How do we avoid LLM errors during demo?
- **Metrics**: What AI metrics visible to judges? (Quality, latency, fallback%)

---

## Decision Template

**When Adding LLM Use**:
1. Can protocol rules handle this? (Yes = use rules, not LLM)
2. Is user data involved? (Yes = redact before LLM)
3. What's the token cost? (>10% of budget = deprioritize)
4. What's the fallback if LLM fails? (None = don't do it)
5. Can we audit the output? (No = escalate to human)

**Red Flags**:
- "LLM will figure it out" → That's hallucination waiting to happen
- "We'll add safety later" → Data leaks are permanent
- "Users won't see this, so..." → Every LLM call is auditable
- "We can retry infinitely" → That's throttling yourself to death

---

**Created**: October 8, 2026 | **Role**: AI/LLM Lead | **Status**: READY FOR AGENT DESIGN
