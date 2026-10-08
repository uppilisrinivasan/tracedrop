# Remaining Documents to Update (Template + Priorities)

These are the documents that still need consumer-centric updates. Use these templates as a starting point.

---

## Priority 1: demo-video-script.md
**Location:** `/docs/04-submission/demo-video-script.md`

**Current Focus:** Technical flow demonstration  
**New Focus:** Consumer journey that judges can't look away from

### Changes Needed:

#### Scene 1: Setup (New Framing)
**OLD:**
```
Arjun is a 34-year-old software engineer...
At his blood camp, his BP is 148/94...
He's turned away...
```

**NEW:**
```
Meet Arjun. He's 34. He gives blood at his office every 3 months because he cares.

At today's donation: BP 148/94. Turned away. "Come back later."

But here's the invisible tragedy:
- His last 3 donations: BP 128, 134, 138
- It's been going UP every single time
- He has ZERO symptoms, so he forgets
- His dad had a stroke at 58

He leaves with nothing. No data. No explanation. No plan.

THIS IS THE PROBLEM.
```

**Why:** Humanize the moment. Make judges FEEL the loss, not just understand it intellectually.

#### Scene 2: The Magic (New Framing)
**OLD:**
```
That evening, Arjun receives a WhatsApp notification...
The system has created a plan...
The doctor has approved...
```

**NEW:**
```
That evening: His phone buzzes.

ARJUN'S PHONE - WhatsApp

"Hi Arjun! Your BP today was 148/94. 

Look at your last 3 donations:
128 → 134 → 138 → 148

It's been going UP each time.

Most people with high BP feel fine. That's the danger. 

You caught yours before it became a stroke.

Free BP check Saturday 10am, 2km from you. 
I've booked it for you."

[Arjun OPENS THE APP]

Home screen shows:
- Trend chart (visual, clear)
- Saturday appointment confirmed
- Impact badge: "You discovered high BP"

Arjun feels HEARD. He feels EMPOWERED.
```

**Why:** Show the EXPERIENCE judges will have with the product. Let them feel what Arjun feels.

#### Scene 3: Follow-Up (New Framing)
**OLD:**
```
3 days later: Reminder
30 days later: Check-in
...
```

**NEW:**
```
3 DAYS LATER

WhatsApp: "Hi Arjun! How was your Saturday check?"

Arjun replies: "Done. They found my BP is high. Doctor started me on medicine."

App updates: "On treatment, following protocol."

───

30 DAYS LATER

WhatsApp: "Arjun, are you taking your medicine?"

Arjun: "Yes, just checked—BP is 132/88 now"

App shows:
- Badge: 🏆 "You caught high BP before a stroke"
- Graph showing improvement
- Summary for his doctor

Arjun feels SUCCESSFUL, not just compliant.
```

**Why:** Show that the system is PERSISTENT and CARING, not just one-off.

#### Scene 4: Return to Donation (New Framing)
**OLD:**
```
3 months later: Arjun returns to donate
He's cleared. He donates again.
```

**NEW:**
```
3 MONTHS LATER

WhatsApp: "Arjun! Your blood type is needed this week.
You've been cleared. Ready to donate Saturday?"

Arjun clicks: "Yes"

He arrives at the blood camp.
His BP: 132/88 ✓
He donates successfully.
His phone shows badge: "You're back! 3 months of consistency. You're saving lives."

The cycle repeats.

ARJUN IS NOW ADDICTED TO KNOWING HIS HEALTH.

He will keep coming back.
```

**Why:** End on the SUSTAINED BEHAVIOR CHANGE. This is how the system works: not one-time compliance, but habit formation.

#### Scene 5: The Scale (New Framing)
**OLD:**
```
Funnel dashboard shows findings processed...
```

**NEW:**
```
TRACEDROP DASHBOARD - ONE MONTH

Findings: 1,847
Found by: 1,847 donors (like Arjun)
Explained: 1,847 ✓
In care: 1,689 (92%)

vs. Today's reality:
In care: 609 (33%)

That's 1,080 MORE LIVES SAVED THIS MONTH.

Scaled across India: 15 lakh people getting care who never would before.

This is what happens when you put the donor at the center.
```

**Why:** Close on the IMPACT, not the technology. Let judges imagine the scale.

---

## Priority 2: submission-checklist.md
**Location:** `/docs/04-submission/submission-checklist.md`

**Current Focus:** Technical completeness  
**New Focus:** Consumer delight signals

### Add New Section:

```markdown
## Submission Quality Checklist: Consumer Delight

Before you submit, judges should be able to:

- [ ] Download the app and immediately understand what it does (without reading docs)
- [ ] See their own health data (from synthetic Arjun donor)
- [ ] Understand why a finding matters (not medical jargon)
- [ ] See their trend (visual chart, not numbers)
- [ ] Know exactly what care is booked (date, time, location, distance)
- [ ] See the impact they're having (badge, number of people helped)
- [ ] Watch the 30-second demo without looking away
- [ ] Read the pitch and nod (not frown)
- [ ] Hold the prototype and say "I'd use this"

If judges can do all 9 things, you've succeeded.
If judges struggle with any, fix it before submission.
```

---

## Priority 3: pitch-deck.html
**Location:** `/docs/02-pitch/pitch-deck.html`

**Current Focus:** Institution-first messaging  
**New Focus:** Consumer-first messaging

### Key Slides to Update:

#### Slide 1: Hook
**OLD:** "Every blood donation is a health check. India runs 1.5 crore of them a year, and then throws the results away."

**NEW:** 
```
Your Blood. Your Health. Your Data.

1.5 crore times a year, Indians get a free health check.
Then it disappears.
```

Add visual: Silhouette of person with question mark over chest (health blindness)

#### Slide 2: Person
**OLD:** Arjun narrative (fine, but rewrite for consumer focus)

**NEW:**
```
ARJUN, 34, BENGALURU

He gives blood every 3 months.
He cares.

Today: BP 148/94. Turned away. "Come back later."

But he never knew:
- His BP went 128 → 134 → 138 → 148
- It's been going UP
- He has no symptoms (the danger)
- His dad had a stroke at 58

He leaves with data nobody explained.
He has a health crisis nobody warned him about.

THAT'S THE PROBLEM.
```

Add visual: Arjun's trend chart showing upward line with question marks

#### Slide 3: Scale
**OLD:** Institutional problem ("only 15% reach care")

**NEW:**
```
THE CONSUMER PROBLEM:

- 35% of Indians have high BP
- 29% know they have it
- Blood donation is their only free check
- They learn NOTHING from it

1.5 crore people/year with health data
Zero action taken on it

This is a HEALTH EQUITY problem,
not just a system problem.
```

Add visual: Pie charts showing what donors know vs. what they should know

#### Slide 4–5: Solution
**OLD:** Technical flow

**NEW:**
```
TRACEDROP: YOUR HEALTH PLATFORM

You give blood
↓
You get your health data (same day, your language)
↓
You understand why it matters (your trend, your history)
↓
You get free care booked (Saturday 10am, 2km away)
↓
You're tracked until it's done (follow-ups, reminders)
↓
You return in 3 months because you're addicted to knowing your health
↓
BLOOD SUPPLY IS PREDICTABLE
```

Add visual: Home screen of the app (actually screenshot from prototype)

#### Slide 6–7: Demo
**OLD:** Technical walkthrough

**NEW:** Timestamp-based journey
```
ARJUN'S DAY

3pm: Turned away at donation
    BP: 148/94

3:30pm: WhatsApp arrives (Hindi)
    "Your BP is 148/94... it's been going up... here's free care"

4pm: Opens app
    Sees trend chart (128→134→138→148)
    Sees care booked: Saturday 10am

IMMEDIATELY: Feels heard, empowered

30 days later: BP now 132/88
    Badge: "You caught high BP before a stroke"

90 days: Returns to donate
    Cycle repeats (now a habit)
```

Add video embed or animation showing day-by-day journey

#### Slide 8: Impact
**OLD:** Institutional metrics ("counsellor workload")

**NEW:**
```
THE 10X

From → To:

ARJUN:
"Come back later" → "Saturday 10am, free, 2km away"
No explanation → "Here's why it matters"
Forgotten → Tracked + followed up
50% never return → 90% return

BLOOD CENTRES:
14 counsellor calls → 3 (agent does 11)
33% find care → 90% find care

INDIA:
15 lakh people finding disease early
This month: 1,689 in care who weren't before
```

Add visual: Funnel diagram or sankey showing flow

#### Slide 9: Why It Works
**OLD:** Tech stack

**NEW:**
```
WHY THIS SCALES

Donor love
↓
Donors return (blood supply predictable)
↓
Blood centres fund it (ROI clear)
↓
Employers fund it (wellness)
↓
Government funds it (prevention)
↓
System self-sustains at scale

Everyone wins when the donor wins.
```

Add visual: Circular flow showing incentive alignment

#### Slide 10: Close
**OLD:** "Every donation is a health check. TraceDrop makes sure it counts."

**NEW:**
```
YOUR BLOOD.
YOUR HEALTH.
YOUR DATA.

Every donation counts.

Track it. Own it. Use it.

Three months later, donate again.
```

Add visual: Donor holding phone with app home screen, smiling

---

## Priority 4: build-plan.md
**Location:** `/docs/03-build/build-plan.md`

**Minimal Changes Needed:**

Update Section 1 "What we're building":

**OLD:**
```
We're building a Gen AI navigator that follows donors from blood findings to care.
```

**NEW:**
```
We're building a consumer health platform where donors own their health data 
and get AI-powered navigation to free care. The platform is powered by the 
3-4 month donation cycle, making health tracking a recurring habit instead of 
a one-time event.
```

Update "Build Order" to match execution-checklist.md priorities:

**OLD:**
```
1. Record builder
2. Finding triage
3. Navigator
...
```

**NEW:**
```
1. Consumer app (home, health dashboard, deferral flow) ← HERO SURFACE
2. Record builder (reads reports, builds FHIR)
3. Navigator (AI that explains + books)
4. Doctor console (plan approval)
5. Counsellor console (disclosure queue)
6. Funnel dashboard (metrics)
```

---

## Priority 5: protocol-rules.md
**Location:** `/docs/03-build/protocol-rules.md`

**Reframe the Whole Doc:**

**OLD:** "Here are the medical thresholds for categorizing findings"

**NEW:** "Here's how the AI explains findings to donors in a way that helps them understand"

### Changes:

Add new section at top:

```markdown
## Why Protocol Rules Exist

These rules do TWO jobs:
1. Medical correctness (what ICMR says)
2. Donor understanding (how to explain so donors ACT)

Example:
- Medical rule: "BP ≥140/90 requires follow-up under ICMR hypertension workflow"
- Donor explanation: "Your BP is above 140/90. That puts you at risk of stroke. 
  Here's why: high BP silently damages blood vessels. You likely feel fine, which 
  is why it's dangerous. Your trend shows it's going up. That's urgent."

One rule serves both purposes.
```

---

## Priority 6: synthetic-data.md
**Location:** `/docs/03-build/synthetic-data.md`

**Minor reframe:** Emphasize realistic donor journeys

### Changes:

Add new section:

```markdown
## Synthetic Donors: What Judges Should See

The 300 synthetic donors tell a story:

**Arjun (Persona 1): High BP discovery**
- Last 3 BP readings: 128 → 134 → 138 → 148
- Gets explanation and care
- Returns in 3 months with BP 132/88
- App shows badge: "You caught this in time"
- **Judges see:** The full happy path (what we want)

**Meera (Persona 2): Low Hb + anaemia**
- Deferred for Hb 11.8 (woman)
- Gets explanation: "57% of women are anaemic, it's fixable"
- Referral to Anaemia Mukt Bharat
- Returns with Hb 12.5
- **Judges see:** Different finding type works too

**Reactive donors (synthetic only, counsellor queue only)**
- 10 hepatitis B, 3 hepatitis C, etc.
- Never shown to app (only counsellor sees)
- Counsellor handles disclosure
- **Judges see:** Privacy by design

**Churners (didn't return)**
- 20 donors who were deferred previously and didn't return
- With TraceDrop, they DO return
- Shows the difference
- **Judges see:** Sustainable adoption

Each donor has a journey that shows a different part of the platform's value.
```

---

## Quick Template: "Before/After" for Any Doc

Use this template when updating any remaining document:

```markdown
## [Document Name] Consumer-Centric Update

BEFORE:
- [Old focus: institutional/technical]
- [Example: institutional metric]
- [Example: system problem]

AFTER:
- [New focus: consumer-centric]
- [Example: consumer metric]
- [Example: consumer problem]

KEY PHRASE TO ADD:
"[New messaging from consumer-platform-positioning.md]"

VISUAL TO ADD:
[What should judges see to understand the consumer value?]

JUDGES' REACTION SHOULD CHANGE FROM:
"That's a clever system" 
TO:
"I would use this product"
```

---

## Prioritization Guide

### By Oct 9 (URGENT):
- ✅ pitch-narrative.md (DONE)
- ✅ architecture.md (DONE)
- ✅ prototype-spec.md (DONE)
- 🔲 pitch-deck.html (USE TEMPLATE ABOVE)
- 🔲 demo-video-script.md (USE TEMPLATE ABOVE)

### By Oct 13 (BUILD STARTS):
- 🔲 build-plan.md (MINIMAL UPDATE)
- 🔲 submission-checklist.md (ADD CONSUMER DELIGHT SECTION)

### By Oct 15 (IF AHEAD):
- 🔲 protocol-rules.md (REFRAME CONTEXT)
- 🔲 synthetic-data.md (EMPHASIZE JOURNEYS)

---

## How to Coordinate With Build Team

When you update these docs, share with the build team:

1. **To frontend team:** Updated prototype-spec.md + app UI requirements
2. **To AI team:** Updated architecture.md + messaging examples from pitch-narrative.md
3. **To pitch team:** Updated pitch-narrative.md + pitch-deck.html updates
4. **To demo team:** Updated demo-video-script.md template

**One North Star Everyone Should Know:**
"Your Health. Your Blood. Your Data." — This is in every doc, every screen, every message.

---

## Validation: How to Know You're Done

For each doc, ask:

- [ ] Does it lead with CONSUMER VALUE, not institutional benefit?
- [ ] Does it use examples (Arjun, Meera) not generic donors?
- [ ] Does it show VISUAL outcomes, not just text metrics?
- [ ] Could a non-technical person understand why they'd use this?
- [ ] Would judges nod reading it (not frown)?

If all 5 are YES, the doc is ready.

If any is NO, revise using the "Before/After" template above.
