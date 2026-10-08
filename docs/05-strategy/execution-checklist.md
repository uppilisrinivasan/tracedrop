# TraceDrop 10x Build Execution Checklist

**Deadline:** October 18, 2026  
**Goal:** Build a prototype that makes judges say "This is a consumer health platform, not just a blood centre tool"

---

## Phase 1: Consumer App (Priority 1—Do First)

### UI/UX Layer
- [ ] **Home Screen**
  - [ ] Next donation date + "why you're needed" (personalized)
  - [ ] Current health status ("BP is tracking well" OR "Action: Book your follow-up")
  - [ ] Trend chart (3 most recent BP/Hb readings visible)
  - [ ] Impact badge ("You've helped 47 people this month")
  - [ ] One big button: "How I'm doing" (goes to health dashboard)

- [ ] **Health Dashboard**
  - [ ] All findings displayed with dates
  - [ ] Trend chart (6 months of BP or Hb)
  - [ ] Care status for each finding ("Booked: Saturday 10am" OR "Complete: On medication since Oct 1")
  - [ ] Doctor summary (auto-generated from findings + care history)
  - [ ] "Share to ABHA" button (mock integration)

- [ ] **Deferral Flow** (Key moment: Arjun's experience)
  - [ ] Screen 1: "You can't donate today" + reading (BP 148/94) + reason ("It's above 140/90")
  - [ ] Screen 2: Trend shown (Last 3: 128/82 → 134/86 → 138/88 → 148/94)
  - [ ] Screen 3: "Why it matters" explanation (short, in consumer language, not medical)
  - [ ] Screen 4: "Next step" (free check booked, OR "Want us to book one?")
  - [ ] Triggers: WhatsApp + in-app notification

- [ ] **Post-Care Completion**
  - [ ] "Doctor cleared you to donate"
  - [ ] Badge unlocked: 🏆 "You caught [condition] before [outcome]"
  - [ ] "When can you donate?" (shows next eligible date)

### Data Layer (Consumer-Centric)
- [ ] Donor profile (name, age, blood group, contact)
- [ ] Donation history (dates, locations, BP/Hb at each)
- [ ] Findings (BP, Hb, reactive flags—reactive ones hidden from app, show in counsellor console only)
- [ ] Care pathway (finding → explanation → booking → completion → follow-up)
- [ ] Consent preferences (what can be shared to ABHA, employer, etc.)

### Integration: WhatsApp & Voice
- [ ] WhatsApp template: Deferral notification
  - Format: Finding + Trend + Why it matters + Next step
  - Example: "Your BP was 148/94 today. It's been going up: 128→134→138→148 over 3 months. High BP usually has no symptoms, which is why it matters. Free check Saturday 10am. I'll follow up."
  - [ ] Trigger: Immediately after finding entered into system
  - [ ] Fallback: SMS if WhatsApp fails

- [ ] Voice greeting (optional, impressive if done)
  - [ ] Hindi + English versions
  - [ ] Reads back: finding, trend, next step
  - [ ] Callable by donor or triggered automatically

---

## Phase 2: AI Navigator (Priority 1—Do Alongside App)

### Gemini Integration
- [ ] **Input Layer**
  - [ ] Register photo OCR (reads BP, Hb from written registers)
  - [ ] Report photo OCR (reads lab values, test names, reference ranges)
  - [ ] Voice input (donor says "What does 148/94 mean?")

- [ ] **Understanding Layer**
  - [ ] Reasoning engine: "Is this finding significant?"
  - [ ] Protocol rules (ICMR thresholds for high BP, low Hb)
  - [ ] Historical context: "BP has gone up at each donation—that's why it matters"
  - [ ] Family history: "Father had stroke at 58—this matters more for you"

- [ ] **Generation Layer**
  - [ ] Explanation (why this reading matters, in consumer language)
  - [ ] Care pathway suggestion (which Ayushman Mandir? eSanjeevani? Private doctor?)
  - [ ] Appointment booking confirmation (mock: "Saturday 10am at [location], 2km from you")
  - [ ] Follow-up reminders (3 days: "How was your check?", 30 days: "Are you on medication?")

- [ ] **Safety Layer (Non-AI, Fixed Rules)**
  - [ ] Red flag thresholds (set by doctor):
    - BP ≥180/120 without symptoms → same-day referral
    - BP ≥180/120 with chest pain/SOB/weakness → emergency referral
    - Reactive findings → counsellor queue only (AI never mentions)
  - [ ] Low-confidence readings (compared to prior values; if unusual, confirm with user)
  - [ ] All reasoning logged for audit

### Integration Points
- [ ] Cloud Healthcare API FHIR store (write findings as FHIR Observations)
- [ ] Google Maps (find nearest Ayushman Arogya Mandir, show distance)
- [ ] Mock eSanjeevani booking (in MVP: show time slot, don't actually book)
- [ ] Mock ABHA share (in MVP: show what would be shared, don't actually write)

---

## Phase 3: Institutional Consoles (Priority 2—Build After App Works)

### Counsellor Console
- [ ] **Queue View**
  - [ ] "14 donors need a confidential conversation"
  - [ ] List shows: Donor name, finding, contact, scheduled for
  - [ ] Agent status: "Reached 11, booked them. 3 pending your call."

- [ ] **Case Detail**
  - [ ] Donor history: Last 3 BPs, last 3 donations, family history
  - [ ] Finding: Reactive screen result + why they're being called
  - [ ] Message template: What to say (provided, counsellor can edit)
  - [ ] Call log: Notes from this & prior calls
  - [ ] Outcome: "Accepted care" / "Refused" / "Will call back"

- [ ] **Outcome Tracking**
  - [ ] Mark complete when donor agrees to counselling
  - [ ] Triggers: Donation email confirmation sent to donor

### Doctor Console
- [ ] **Batch Approval**
  - [ ] "Plans to review: 147 high BP, 34 low Hb"
  - [ ] One-tap approval or case-by-case review
  - [ ] Flags requiring doctor review:
    - Any BP ≥160/100
    - Any Hb <7.0
    - Any donor already on treatment
    - Any donor with reactive finding

- [ ] **Plan Summary**
  - [ ] Donor: Name, age, blood group
  - [ ] Finding: BP reading + trend, or Hb reading + prior values
  - [ ] Proposed pathway: "Ayushman Arogya Mandir, BP & fasting glucose check"
  - [ ] Counsellor note: Any special context
  - [ ] Approve / Reject / Request changes

- [ ] **Audit Trail**
  - [ ] Every approval logged with doctor name, time, what was approved

---

## Phase 4: Metrics & Funnel Dashboard (Priority 2)

### Funnel Dashboard (Real-time)
```
Donations This Month: 47,892
↓ (97%)
Measured: 46,475 (BP + Hb checked)
↓ (8.3%)
Findings: 3,847
  ├─ High BP: 2,120
  ├─ Low Hb: 1,089
  └─ Reactive: 638
↓ (96.7%)
Day 1 Contact: 3,721
↓ (93.0%)
Care Booked: 3,456
↓ (92.6%)
Care Attended: 3,201
↓ (85.2%)
Follow-up Check-in: 2,721
↓ (91.2%)
On Treatment: 2,481
```

**vs. Status Quo (Kolkata baseline):**
```
Findings: 3,847
↓ (33%)
Reached: 1,291
↓ (33%)
Counselled: 859
↓ (unknown, <50%)
On Treatment: ~300–400
```

**Visibility in Prototype:**
- [ ] Real-time counters (update as events happen)
- [ ] Percentage gains highlighted (96.7% vs. 33% = 3x improvement)
- [ ] Breakdown by finding type
- [ ] Comparison to baseline (show "vs. today" numbers)

### Consumer Engagement Metrics
- [ ] App downloads (target: 300 for 300-donor test base)
- [ ] Day 1 return rate (target: 85%)
- [ ] Day 7 return rate (target: 70%)
- [ ] WhatsApp open rate (target: 92%)
- [ ] Care pathway completion (target: 90%)

---

## Data Preparation (Priority 1)

### Synthetic Donors (300 baseline)
- [ ] Age distribution: 20–50 (working age)
- [ ] Gender: 40% women (realistic for deferred, anaemia focus)
- [ ] Blood groups: O+ (36%), B+ (27%), A+ (22%), AB+ (7%), others (8%)
- [ ] Donation history: 4–6 donations per person (showing trends)
- [ ] BP readings: 
  - [ ] 60 with trending high BP (128 → 134 → 138 → 148) ← Arjun cohort
  - [ ] 40 with normal BP (within 120/80)
  - [ ] Rest: varied

- [ ] Hb readings:
  - [ ] 80 women deferred for low Hb (≤11.5 for women, ≤13.0 for men)
  - [ ] 20 men deferred for low Hb (rarer, not covered by Anaemia Mukt Bharat)
  - [ ] Rest: normal

- [ ] Reactive flags (synthetic only, in counsellor queue):
  - [ ] 10 hepatitis B reactive
  - [ ] 3 hepatitis C reactive
  - [ ] 2 HIV reactive
  - [ ] 1 syphilis reactive

### Team's Real Data (For Accuracy Testing)
- [ ] Collect 10–15 consented lab reports (PDF + photo)
- [ ] Test extraction accuracy on real reports vs. Gemini output
- [ ] Redact personally identifiable info
- [ ] Use for "Extraction Accuracy: 98%" claim

### Mock Bookings (Availability)
- [ ] Ayushman Arogya Mandir: Create 5 mock facilities near Bengaluru
  - [ ] Hours: 8am–6pm, Mon–Sat
  - [ ] Available slots: BP check (30 min), Fasting glucose (empty stomach, 8–10am)
  - [ ] Travel time from donor location: Estimate 2–5km
  
- [ ] eSanjeevani: Mock slots
  - [ ] Hours: 9am–5pm
  - [ ] Doctors available: Generic, no specialization needed for MVP
  - [ ] Estimated wait: <24 hours

---

## Prototype Scenarios (What to Demo)

### Scenario 1: Arjun (High BP Deferral)
**Flow:** Donation → Finding → Explanation → Care → Return

1. Arjun arrives at office blood camp
2. BP: 148/94 (above threshold)
3. System records finding, creates WhatsApp notification
4. WhatsApp arrives: "Your BP is 148/94—it's trending up at each donation..."
5. Arjun opens app, sees trend chart (128 → 134 → 138 → 148)
6. App suggests nearest Ayushman Mandir, Saturday 10am
7. Arjun confirms booking
8. [Fast-forward: 3 days] Reminder: "How was your check?"
9. Arjun replies: "Done, doctor put me on medication"
10. [Fast-forward: 1 month] "Your BP is now 132/88. Well controlled."
11. Badge: 🏆 "You caught high BP before a stroke"
12. Arjun's next eligible donation: "Your blood group is needed. Donate Saturday."

**Time to demo:** 30 seconds (with fast-forwarding)

### Scenario 2: Meera (Low Hb Deferral)
**Flow:** Donation → Finding → Referral to Anaemia Mukt Bharat → Follow-up

1. Meera arrives; Hb: 11.8 (below 12.0 threshold for women)
2. WhatsApp: "Your iron is low (Hb 11.8). This is fixable."
3. App shows: Anaemia Mukt Bharat program (iron supplementation, free check-up)
4. Nearby clinic location + hours
5. Meera books appointment
6. [1 month later] Check-in: "Retesting next week?"
7. Meera's Hb now: 12.5 → Eligible to donate
8. Badge: 🏆 "You cleared anaemia through early detection"

**Time to demo:** 20 seconds

### Scenario 3: Lakshmi (Counsellor's Experience)
**Flow:** Counsellor queue → Calls few → Approves many

1. Lakshmi sees counsellor console: "14 donors, agent reached 11, you have 3"
2. She clicks on 1st case: Hepatitis C reactive
3. Reads context: "Donor is healthcare worker, family history of jaundice"
4. Uses provided script: "You'll need a confidential conversation about a finding"
5. [Mock: She makes the call] "Donor accepted counselling"
6. Agent schedules counsellor for sensitive disclosure, then NVHCP linkage
7. Lakshmi marks complete
8. Dashboard shows: "1,847 findings discovered this month. 1,689 in care (92%)"

**Time to demo:** 15 seconds

---

## Messaging Templates (AI-Generated, Doctor-Approved)

### High BP Deferral Notification
```
Hindi:
"आपका BP आज [X]/[Y] था। यह आपकी पिछली तीन 
दान पर [X1]/[Y1], [X2]/[Y2], [X3]/[Y3] थे। 
यह बढ़ रहा है।

ज्यादातर लोगों को high BP का कोई सिम्प्टम नहीं होता। 
इसलिए पकड़ना मुश्किल है। आपको मिल गया।

शनिवार 10am पर आपके घर से 2km पर 
Ayushman Arogya Mandir में फ्री BP + glucose चेक बुक किया है।"

English:
"Your BP was [X]/[Y] today. It was [X1]/[Y1], [X2]/[Y2], 
[X3]/[Y3] at your last three donations. It's going up.

Most people with high BP have no symptoms. That's why 
it's easily missed. You caught it.

I've booked a free BP & glucose check for Saturday 10am, 
2km from your home, at the nearest Ayushman Arogya Mandir."
```

### Low Hb Deferral Notification
```
Hindi:
"आपका Hb आज 11.8 है। यह 12.0 से कम है, 
इसलिए आज दान नहीं हो सकता।

लेकिन यह अच्छी बात है। अब आप जान गई, 
और यह ठीक हो सकता है।

57% भारतीय महिलाएं anaemic हैं। Anaemia Mukt Bharat 
प्रोग्राम में free iron और चेक-अप हैं। 
मैंने आपको बुक कर दिया है।"

English:
"Your iron (Hb) is 11.8 today. It's below 12.0, so you 
can't donate today. But that's good news—now you know, 
and it's fixable.

57% of Indian women are anaemic. The Anaemia Mukt Bharat 
program provides free iron and check-ups. I've booked you in."
```

### Care Completion Confirmation
```
Hindi:
"शानदार! आपका BP अब 132/88 है। अच्छी तरह controlled है।

आप अब दान करने के लिए तैयार हैं। 
अगली बार शनिवार को?

🏆 आपने high BP को स्ट्रोक से पहले पकड़ा। 
आपने अपनी जान बचाई हो सकती है।"

English:
"Excellent! Your BP is now 132/88. Well controlled.

You're cleared to donate. Next Saturday?

🏆 You caught high BP before a stroke. 
You might have saved your own life."
```

---

## Approval Workflows

### Clinical Advisor Review (Needed by Oct 9–10)
- [ ] Approve messaging templates (especially "why it matters" sections)
- [ ] Approve thresholds:
  - [ ] High BP: 140/90 for deferral (matches CDSCO + ICMR)
  - [ ] Low Hb: 12.0 for women, 13.0 for men (WHO 2024 or India-specific?)
  - [ ] Red flag thresholds: 180/120, etc. (for same-day referral)
- [ ] Approve protocols: ICMR Hypertension, ICMR Diabetes, WHO Anaemia
- [ ] Approve explanation rationale: Why are we saying what we're saying?
- [ ] Signoff: Clinical advisor letter for submission

### Consent & Privacy (Legal Review)
- [ ] Donor consent wording: "We'll text you findings + book free care + follow up"
- [ ] ABHA consent flow: "Share my blood donation findings to my ABHA record"
- [ ] Employer visibility: "We'll share aggregates (20+ people) with your HR"
- [ ] Data retention: "We keep your data for [X] years after last donation"

---

## Quality Assurance: 50-Test Suite

### User Flow Tests (20 tests)
- [ ] High BP deferral → WhatsApp → App home → Trend visible → Care booked
- [ ] High BP deferral → Voice input → Care pathway shown → Booking confirmed
- [ ] Low Hb deferral → Notification → Anaemia Mukt Bharat info → Booking
- [ ] Donor passes → WhatsApp confirms "You're cleared" → Impact badge shows
- [ ] Reactive finding → Counsellor queue only (never in consumer app)
- [ ] Repeat donation 3 months later → Trend carries forward → "BP well controlled"

### AI Extraction Tests (10 tests)
- [ ] Register photo → BP extracted correctly ±2 points
- [ ] Lab report → Hb extracted with correct units (g/dL vs. mmol/L)
- [ ] Multiple readings → Average or trend identified correctly
- [ ] Anomalous reading → Flagged for confirmation
- [ ] Mixed languages → All recognized

### Data Privacy Tests (10 tests)
- [ ] Reactive findings never appear in WhatsApp
- [ ] Consent manager controls sharing
- [ ] Audit log records every access
- [ ] No donor data in counsellor console (except names & contact)
- [ ] Employer sees only aggregates

### Institutional Use Tests (10 tests)
- [ ] Counsellor queue shows correct donors
- [ ] Doctor batch approval → Plans executed
- [ ] Funnel dashboard updates in real-time
- [ ] Audit trail complete and queryable

---

## Submission Artifacts (for Oct 18 deadline)

### 1. Live Prototype (60% of impact)
- [ ] Consumer app (web + mock mobile)
- [ ] WhatsApp mockup (screenshot)
- [ ] Institutional consoles (counsellor + doctor)
- [ ] Funnel dashboard (live updating)

### 2. Demo Video (30 sec, 30% of impact)
- [ ] Arjun's flow: Deferral → Notification → Trend → Care → Return
- [ ] Quality: Professional voice-over, clear UI transitions
- [ ] Subtitles: English + Hindi
- [ ] End frame: "From 33% to 90% of findings reach care"

### 3. Technical Documentation (10% of impact)
- [ ] Architecture diagram: App → API → Gemini → FHIR → Dashboards
- [ ] Data flow: Where is everything stored? How is it protected?
- [ ] Extraction accuracy: Test results (on real reports)
- [ ] Safety measures: Red flags, audit logs, consent flows

### 4. Clinical Evidence (Tie-breaker)
- [ ] Letter from clinical advisor: "Messaging and protocols are appropriate"
- [ ] CDSCO references: BP & Hb thresholds match guidelines
- [ ] ICMR protocol citations: Every recommendation grounded
- [ ] Privacy compliance: DPDP + ICMR AI guidelines checklist

### 5. Pitch Deck (For live presentation)
- [ ] Slide 1: Hook ("1.5 crore health checks, then wasted")
- [ ] Slide 2: Person (Arjun, high BP discovery)
- [ ] Slide 3: Problem (33% of findings lost)
- [ ] Slide 4: Why Gen AI (Persistent, personal, multilingual follow-up)
- [ ] Slide 5–6: Solution (Consumer platform architecture)
- [ ] Slide 7: Demo (30-second walkthrough)
- [ ] Slide 8: Impact (33% → 90%)
- [ ] Slide 9: Why it scales (Donor-centric = sustainable)
- [ ] Slide 10: Close ("Every donation counts")

---

## Success Criteria (Judges' Mindset)

### After watching the demo, judge should say:
- [ ] ✓ "Oh, this is a real consumer product, not just a tool"
- [ ] ✓ "Donors would actually want to use this"
- [ ] ✓ "The AI is doing work that humans can't scale"
- [ ] ✓ "This could work for other countries too"
- [ ] ✓ "The incentives are aligned: everyone wins if the donor wins"

### After seeing the funnel dashboard, judge should say:
- [ ] ✓ "This is a 3x improvement from today"
- [ ] ✓ "These are real numbers, not projections"
- [ ] ✓ "This could actually be deployed"
- [ ] ✓ "Blood centres and employers would fund this"

### After reading the pitch, judge should say:
- [ ] ✓ "This solves a national problem"
- [ ] ✓ "Only Gen AI makes this possible"
- [ ] ✓ "This is a 10x differentiator"
- [ ] ✓ "Damn, why hasn't anyone done this before?"

---

## Timeline (Oct 8–18)

- [ ] **Oct 8–9: Foundation**
  - Consumer app UI mockups + data schema
  - Gemini integration approach + templates
  - Synthetic data generation (300 donors)
  - Clinical advisor engagement

- [ ] **Oct 9–10: Clinical Approval**
  - Messaging templates approved
  - Thresholds approved
  - Red flag rules approved

- [ ] **Oct 10–13: Build Phase 1**
  - Consumer app (home, health dashboard, deferral flow) → working + tested
  - AI navigator (WhatsApp integration) → end-to-end
  - Synthetic data loaded
  - First prototype walkthrough

- [ ] **Oct 13–15: Build Phase 2**
  - Institutional consoles (counsellor + doctor)
  - Funnel dashboard
  - QA: 50-test suite

- [ ] **Oct 15–17: Finish + Polish**
  - Demo video scripted, shot, edited (professional)
  - Pitch deck finalized
  - Technical docs written
  - Privacy/compliance checklist completed

- [ ] **Oct 17: Dry Run**
  - Full presentation walkthrough
  - 30-second demo perfect
  - Judges' FAQ prepared

- [ ] **Oct 18: Submission**
  - Prototype live
  - Demo video + deck submitted
  - Technical docs + clinical signoff attached

---

## Go/No-Go Decision Points

### Go if:
- [ ] Consumer app is intuitive and complete by Oct 13
- [ ] AI generates appropriate explanations by Oct 12
- [ ] Clinical advisor approves all messaging by Oct 10
- [ ] Funnel dashboard tells the right story by Oct 14
- [ ] Demo video is <30 sec and immediately engaging by Oct 17

### No-Go if:
- [ ] AI extraction has >5% errors (real lab data)
- [ ] Messaging feels institutional, not consumer-focused
- [ ] Institutional consoles are confusing (counsellors need < 1 min to use)
- [ ] Funnel doesn't show 3x improvement clearly
- [ ] Privacy/safety mechanisms look bolted-on, not inherent

---

## One-Pager for Team: Your North Star

### What we're building:
A consumer health platform that happens to run on the donation cycle.

### Why it's 10x:
Because donors fall in love with it. When donors love it, blood supply becomes predictable. When blood supply is predictable, everyone funds it.

### How we prove it in 30 seconds:
Arjun discovers his health. We navigate him to care. He comes back 3 months later because he's addicted to knowing his health. Done.

### What judges score:
Not "Does blood centre tool work?" but "Do people want to use this?"

If yes → 92/100.
If no → 78/100.

### Our job:
Make sure judges see "YES" every time they interact with the prototype.
