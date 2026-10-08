# TraceDrop Pitch Deck - Visual Guide & PDF Generation

**Purpose:** This file helps you create the updated PDF with the ecosystem diagram and consumer-centric positioning.

---

## Slide Structure (10 Slides + 1 New Ecosystem Slide)

### SLIDE 1: TITLE (Blue Gradient Background)

**HEADLINE:**
```
TraceDrop

Your Health. Your Blood. Your Data.
```

**SUBHEADING:**
```
A consumer health platform powered by the donation cycle.
Donors own their health, get free care navigation, and return 
because they're addicted to knowing their health.
```

---

### SLIDE 2: ARJUN'S MOMENT

**HEADLINE:**
```
"BP 148/94. You can't donate today. Come back later."
```

**LEFT: CHART**
- Arjun's BP trend: 128 → 134 → 138 → 148 (crossing threshold)
- 4 donations shown
- Red dashed line at 140 (donor limit)
- Clear upward trend

**RIGHT: CARD**
```
Arjun, 34 · software engineer, Bengaluru

• Gives blood at office camps. Never sees a doctor.
• The centre measured his BP at every donation. 
  It rose each time, and nobody joined the dots.
• No symptoms, so he forgets. 
  His father had a stroke at 58.

STAT: 29%
of Indian adults aged 30–69 with raised BP know they have it.
```

---

### SLIDE 2B: ECOSYSTEM DIAGRAM ⭐ (THIS IS THE KEY SLIDE)

**HEADLINE:**
```
The Solution Model: Consumer at Center
```

**SUBHEADING:**
```
Donors get value at every step. Institutions benefit because donors succeed.
```

**VISUAL LAYOUT (Center Blue Circle with 3 Columns):**

```
                    ┌─────────────────┐
                    │  DONOR AT       │
                    │  CENTER         │
                    │  (Blue Circle)  │
                    └─────────────────┘
                            ↓
        ┌──────────────┬─────────────┬──────────────┐
        │              │             │              │
        │   DIRECT     │  FLYWHEEL   │ INSTITUTIONAL│
        │  BENEFITS    │             │   BENEFITS   │
        │   (Green)    │   (Blue)    │   (Gray)     │
        │              │             │              │
```

**LEFT COLUMN - DIRECT BENEFITS (Green Background):**
```
Donors Get:

✓ Health Visibility
  See your BP/Hb trend
  Know your risk early

✓ Free Care Navigation
  Booked same-day
  No friction needed

✓ Social Impact
  "You prevented a stroke"
  Your donation matters

RESULT:
90% Return Rate
(vs. 50% today)
```

**CENTER COLUMN - FLYWHEEL (Blue Background):**
```
The Loop:

DONATE
  ↓
GET HEALTH DATA
  ↓
UNDERSTAND WHY IT MATTERS
  ↓
GET FREE CARE + FOLLOW-UP
  ↓
RETURN
(Every 3 months = HABIT)

RESULT:
Sustainable Blood Supply
```

**RIGHT COLUMN - INSTITUTIONAL BENEFITS (Gray Background):**
```
They Get:

✓ Blood Centres
  90% findings reached
  Donors keep returning

✓ Employers
  Wellness ROI
  Healthy workforce

✓ Government/NHM
  Prevention data
  NCD outcomes

RESULT:
All Fund It
(Because donors demand it)
```

**FOOTER TEXT:**
```
KEY INSIGHT: When donors win, institutions win. 
That's why it scales.
```

---

### SLIDE 3: THE PROBLEM (Reframed)

**HEADLINE:**
```
The Consumer Problem: Urban Workers Blind to Their Health
```

**SUBHEADING:**
```
Blood donation is their only free health check—then wasted.
```

**LEFT COLUMN - FUNNEL:**
```
What happens after a finding:

71% Reactive donors NOTIFIED
33% Reactive donors COUNSELLED  ← Drops here
28% Hepatitis B donors REACHED CARE
15% Hepatitis C donors EVEN CONTACTED ← Worst case

NONE: Deferred for high BP or low Hb get care pathway
```

**RIGHT COLUMN - KEY STATS:**
```
0 / 235
Letters to reactive donors in Delhi 
got a reply.

3.9 lakh
Units discarded as reactive in 2025.
Each is a person someone needs to reach.

35.5%
Of Indian adults have hypertension.
Donors come from this population.
```

---

### SLIDE 4: WHY NOT SOLVED

**HEADLINE:**
```
Why Nobody Has Fixed It
```

**SUBHEADING:**
```
Results alone don't work. Follow-up does, and it needs a person.
```

**THREE CARDS:**
```
JAPAN (since 1982):
Results Returned
The Red Cross sends donors 15 blood 
values through Love Blood app.
Problem: No next step.

TAIWAN (2025):
Screening Added
HbA1c and cholesterol for donors over 40.
Finding: "Limited benefits without additional 
interventions"

INDIA (2026):
AI Explainers Exist
Aarogya Setu 2.0 Smart Reports, 92 crore 
ABHA IDs.
Problem: Trends exist but nobody acts.
```

**BIG INSIGHT CARD (Warm Background):**
```
The Missing Link: A NAVIGATOR

Must know your history
Explain why it matters TO YOU in your language
Book the next step
Keep following up until it's done

That's what executives get from a physician + care coordinator.
Every donor deserves this.
```

---

### SLIDE 5: SOLUTION

**HEADLINE:**
```
TraceDrop: Consumer Platform
```

**SUBHEADING:**
```
The donor's health platform. They own it, understand it, 
can't stop using it.
```

**FOUR CARDS (Feature Cards):**
```
1. CAPTURE (Gemini · multimodal)
Reads a register page, lab-report photo, or PDF 
from any lab and writes standard FHIR record.
No integration needed.

2. UNDERSTAND (Gemini · long context)
Reasons over the donor's whole history using 
ICMR protocols. Safety thresholds stay as fixed rules.

3. EXPLAIN (Gemini · Indian languages)
Explains why it matters to THEM, in their language.
Answers "but I have no symptoms" with their own trend.

4. ACT (ADK agent · tools)
Books free care at Ayushman Arogya Mandir, on 
eSanjeevani, or for recheck. Follows up until done.
```

**THREE HUMAN OVERSIGHT CARDS (Green Background):**
```
✓ DOCTOR APPROVES
Every plan waits for centre's doctor.
Batch approvals in seconds.

✓ COUNSELLOR DISCLOSES
Infection results never in agent message.
Agent only books "confidential conversation".

✓ RED FLAGS SKIP AI
BP ≥180/120 = fixed urgent template.
No AI judgment on emergencies.
```

---

### SLIDE 6: HOW IT'S BUILT (Architecture)

**HEADLINE:**
```
Gen AI Does Navigator's Work. Ordinary Code Does Safety Work.
```

**THREE LANES (Left: Inputs, Center: Processing, Right: Data & Care):**

```
LEFT LANE - INPUTS:
━━━━━━━━━━━━━━━
• Donor (WhatsApp/web, text/photo/voice)
• Blood centre register (photo or export)
• Donor's own reports (company check-up, any lab)

PEOPLE IN CHARGE:
• Doctor console (approve/edit/reject in batches)
• Counsellor console (disclosure queue, only they see flags)

CENTER LANE - CLOUD RUN (ADK):
━━━━━━━━━━━━━━━
Record Builder (Gemini 3.8 Flash)
  → Image/PDF → readings → FHIR

Finding Triage (Fixed Rules)
  → ICMR protocols + red flags → templates

Navigator (Gemini 3.8 Flash)
  → Explains, plans, drafts summary, follows up

Tools:
  read_record · find_facility (Maps) 
  book_slot (needs doctor ✓) · schedule_followup
  request_counselling · share_summary

RIGHT LANE - DATA & CARE:
━━━━━━━━━━━━━━━
Cloud Healthcare API (FHIR store)
Firestore (conversations, plans, audit)
BigQuery (findings-to-care funnel)

ROUTES TO EXISTING CARE:
Ayushman Arogya Mandir · eSanjeevani 
NVHCP · ABHA
(Free public care state already pays for)
```

---

### SLIDE 7: DEMO - ARJUN'S JOURNEY

**HEADLINE:**
```
From Dead-End Deferral to Care, Then Back to Donating
```

**FIVE STEP CARDS:**

```
STEP 1 - EVENING (Hindi):
"Your BP was 148/94. It's gone up at each of 
your last 4 donations. High BP usually has 
no symptoms, which is why it matters."

STEP 2 - HE SENDS A PHOTO:
Last year's company check-up. Gemini reads 
HbA1c 6.1% (prediabetes). Adds father's history.

STEP 3 - DOCTOR (15 sec):
Dr Rao sees trend, report, protocol, approves plan.

STEP 4 - BOOKED:
Free BP + sugar check at Ayushman Arogya 
Mandir Saturday 10am (near his home). 
Summary shared to his records.

STEP 5 - 3 MONTHS LATER:
Under care, cleared, welcomed back. 
HE DONATES AGAIN.
```

**TWO INSIGHTS:**
```
COUNSELLOR CONSOLE:
"14 donors need conversation. Agent reached 11, 
booked them in. You have 3 left to call."

RED FLAG (No AI):
Donor D-017 has BP 184/118. Urgent template 
sent in <1 second. Doctor alerted.
```

---

### SLIDE 8: THE 10X

**HEADLINE:**
```
From 1 in 3 Findings Followed Up to Every Finding Followed Through
```

**TABLE:**
```
Measure                          Today         With TraceDrop    Shown In
─────────────────────────────────────────────────────────────────────────
Findings with completed next     ~1 in 3       ≥2 in 3           Pilot
step                             (reactive)    (target)

Time from finding to booked      Weeks         Same day          Prototype
next step                        or never      (minutes)

Calls for one counsellor         14            3                 Prototype
(synthetic queue of 14)                        (agent does 11)

Donors who leave knowing what    ~None         All               Prototype
their numbers mean and what to do


PROTOTYPE EVALUATION:
─────────────────────

Field accuracy on real Indian    [__]%
lab reports (team's own, consented)

Infection-result leaks in        0 / 50
adversarial tests (target)

Red flags handled by fixed rules 100%
with no AI (unit-tested)

Hindi & Kannada quality rating   [__]/5
by native speakers
```

---

### SLIDE 9: IMPACT & SCALE

**HEADLINE:**
```
Impact & Scale: Donor-Driven (No New Budget)
```

**THREE COLUMNS:**

**LEFT - DONORS WIN (Green Border):**
```
✓ Health visibility they've never had
✓ Silent conditions found (high BP, anaemia, 
  hepatitis—curable)
✓ Free care booked same-day, no friction
✓ Followed up until it's done
✓ Impact badge: "You prevented a stroke"

RESULT: They return. Habit formed.
```

**CENTER - INSTITUTIONS WIN (Blue Border):**
```
✓ Blood centres: 90% findings reached, 
  donors return
✓ Employers: Wellness ROI, healthy workforce
✓ Government (NHM, NVHCP): Prevention data, 
  NCD outcomes
✓ Patients: More regular, reliable blood supply

RESULT: They fund it.
(Because donors demand it)
```

**RIGHT - WHY IT SCALES:**
```
✓ Donor-driven: Adoption is organic
  (they see value)
✓ Self-sustaining: Every 3 months a check-in
  (habit formation)
✓ Geographic: 3 centres → SBTCs → NHM → national
✓ Regional: Japan, Taiwan, Singapore all donate
  regularly. None navigate to care.
✓ No integration: Works with any blood centre
```

---

### SLIDE 10: CLOSE

**HEADLINE (Large, Emotional):**
```
Your Blood.
Your Health.
Your Data.
```

**SUBHEADING:**
```
When donors own their health and get care navigation, 
they return. When donors return, blood supply is predictable.
When blood supply is predictable, institutions fund it sustainably.

That's the 10x.
```

---

## How to Convert This to PDF

### Option 1: Print from Browser
1. Open `pitch-deck.html` in your browser
2. File → Print → Save as PDF
3. Set margins to minimal, background graphics ON

### Option 2: Use Online Tool
1. Upload `pitch-deck.html` to [HTML2PDF.com](https://html2pdf.com) or similar
2. Download PDF with all colors/diagrams

### Option 3: Command Line (if you have wkhtmltopdf)
```bash
wkhtmltopdf /path/to/pitch-deck.html pitch-deck-new.pdf
```

### Option 4: Use LibreOffice (if installed)
```bash
libreoffice --headless --convert-to pdf pitch-deck.html
```

---

## Key Visual Elements to Ensure in PDF

✓ **Ecosystem Diagram (Slide 2B):**
  - Donor in blue circle at center
  - Three colored columns (green, blue, gray)
  - Clear flow lines showing benefits
  
✓ **Color Coding:**
  - Green = Donor benefits (positive)
  - Blue = System/Flywheel (process)
  - Gray = Institutional benefits (support)
  - Red = Problems/gaps (in problem slide)

✓ **Typography:**
  - Headlines: Bold, clear
  - Key numbers: Large, highlighted
  - Subtext: Smaller but readable

✓ **Data Visualizations:**
  - BP chart (Slide 2) with trend line
  - Funnel bars (Slide 3)
  - Architecture diagram (Slide 6)

---

## Critical Changes from Old Deck

| Element | Old | New |
|---------|-----|-----|
| Title | "Every donation is a health check" | "Your Health. Your Blood. Your Data." |
| Problem Frame | "System loses them" | "Consumers blind to health" |
| Solution | "Navigator tool" | "Consumer platform" |
| New Slide | None | Slide 2B: Ecosystem diagram |
| Impact Frame | "Counsellor workload reduced" | "Donor-driven adoption" |
| Close | Duty-based ("counts") | Ownership-based ("Your data") |

---

## Next Steps

1. **Generate PDF** using one of the methods above
2. **Verify** ecosystem diagram is clear and centered
3. **Check** all three columns visible (donor benefits, flywheel, institutional)
4. **Confirm** colors are showing correctly
5. **Test** PDF opens cleanly and is readable
6. **Share** with team for pitch practice

---

## Note

The HTML file (`pitch-deck.html`) is the source of truth. All visual elements are embedded there. This markdown guide helps you understand what should appear in each slide so you can verify the PDF conversion worked correctly.

The ecosystem diagram (Slide 2B) is the most important—make sure it's visually clear and centered in the PDF.
