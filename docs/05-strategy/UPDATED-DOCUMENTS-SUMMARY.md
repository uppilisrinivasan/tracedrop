# Updated Documents Summary: Consumer-Centric Alignment

**Date:** October 8, 2026  
**Changes:** All core TraceDrop documents updated to reflect consumer-platform positioning

---

## What Changed: Reframing Across All Documents

### From → To

| Document | Old Framing | New Framing | Impact |
|----------|-------------|-------------|--------|
| **README.md** | "TraceDrop" | "Your Health. Your Blood. Your Data." | Lead with consumer promise |
| **Pitch Narrative** | "Blood centre tool that helps donors" | "Consumer platform driven by donation cycle" | Flip hero from institution to person |
| **Architecture** | Design principles were institution-first | Added consumer-center principle first | Foundation is consumer experience |
| **Prototype Spec** | "Shows Gen AI does the work" | "Judges see a consumer product they'd use" | Goal is consumer love, not tech proof |

---

## Document-by-Document Changes

### 1. README.md
**Change:** Added consumer-centric tagline

```
OLD:
# tracedrop

NEW:
# TraceDrop: Your Health. Your Blood. Your Data.
**Consumer-centric health platform powered by the donation cycle**
Every blood donation is a health check. TraceDrop makes sure every finding matters by putting the donor in control.
```

**Why:** First thing judges and developers see should reflect the 10x insight, not just a name.

---

### 2. docs/02-pitch/pitch-narrative.md
**Major Reframe:** 9 slides rewritten with consumer-first messaging

**Key Changes:**

#### Slide 1 (Hook) - OLD vs. NEW
- OLD: "Every blood donation is a health check. India runs 1.5 crore of them a year, and then throws the results away."
- NEW: "1.5 crore times a year, Indians get a free health measurement at a blood bank. Then that health data disappears."
- **Why:** Lead with the consumer loss (health blindness), not institutional failure

#### Slide 3 (Problem) - OLD vs. NEW
- OLD: "India's blood centres measure... then lose most of the people they find"
- NEW: "35% of Indian adults have high BP. Only 29% know it. Blood donation is their only free health check. They leave with nothing."
- **Why:** Frame as consumer health equity problem, not system logistics

#### Slide 4 (Why This Matters) - NEW SLIDE
- "Arjun would want to know: 'My BP is trending up. Here's why it matters. Here's what I can do about it.'"
- **Why:** Show what donors DESERVE, not just what institutions fail to do

#### Slide 8 (Why It Scales) - OLD vs. NEW
- OLD: "Blood centres, employers, insurers can all fund it"
- NEW: "Donors love it because they get value. Blood centres fund it because donors return. Everyone wins when the donor wins."
- **Why:** Make clear the donor-driven engine, not institution-first adoption

#### Slide 10 (Close) - OLD vs. NEW
- OLD: "Every donation is a health check. TraceDrop makes sure it counts."
- NEW: "Your blood. Your health. Your data. Every donation counts."
- **Why:** End on consumer ownership, not institutional duty

---

### 3. docs/03-build/architecture.md
**Change 1: Design Principles**

**OLD:**
```
1. Gen AI does the navigator's work...
2. Humans approve at defined points...
3. No integration needed to start...
4. No infection result ever reaches...
```

**NEW:**
```
1. The consumer is the center, not the margin...
2. Gen AI does the navigator's work (UNCHANGED BUT SUBORDINATE)...
3. Humans approve at defined points (UNCHANGED BUT MORE VISIBLE TO DONOR)...
4. No integration needed to start (DONOR-OWNED FOCUS)...
5. No infection result ever reaches... (PRIVACY BY DESIGN)
```

**Why:** Every design choice must serve the donor first.

---

**Change 2: System Diagram**

**OLD:** One technical diagram (mermaid flowchart)

**NEW:** 
- Added consumer journey visualization first
- Shows: Donation → Measurement → Finding → WhatsApp explanation → Care booking → App home screen → Care completed → Return to donate
- Then technical diagram with green highlight on consumer app surfaces

**Why:** Judges first see what donors experience, then the tech.

---

**Change 3: Components Table**

Added "Consumer-First Notes" column to show how each component serves the donor:

| Component | Old Notes | New Consumer Notes |
|-----------|-----------|-------------------|
| Record builder | Technical details | **Donor uploads their own reports** |
| Navigator agent | Agent reasoning | **Donor is the conversational partner** |
| book_slot | Tool confirmation process | **Donor sees booking confirmed same-day** |
| find_facility | Technical routing | **Donor sees distance and travel time** |
| NEW: Donor App Home | (not in old architecture) | **This is the hero surface for donors** |

**Why:** Every component's value to the donor is explicit.

---

### 4. docs/03-build/prototype-spec.md
**Major Reframe:** "What the demo must prove" table

**OLD Column 1: "Claim"**
- Gen AI does navigator's work
- Humans stay in charge
- etc. (6 technical claims)

**NEW Column 1: "Claim" → 3 columns:**
- Claim
- Consumer-Platform Proof
- How judges experience it

**Example:**

```
OLD:
| # | Claim | How prototype shows it |
| 1 | Gen AI does navigator's work | Agent reads records, reasons, explains, books |

NEW:
| # | Claim | Consumer-Platform Proof | How judges experience it |
| 1 | Donors want to use this | Arjun gets explanation, care booked same-day, returns in 3 months | App is beautiful. Judges say "I'd use this" |
```

**Why:** Shift success metric from "tech works" to "people adopt it"

---

**Change 2: Goal Statement**

**OLD:**
```
Goal: a deployed prototype that shows, end to end, that Gen AI can do a navigator's work
```

**NEW:**
```
Goal: a deployed prototype that shows a consumer health platform powered by the donation cycle. 
Judges will hold it in their hands and see:
- A beautiful donor app where health is visible and owned
- A 30-second demo showing the full journey
- Real metrics proving 3x improvement
- Gen AI doing the navigator's work under human supervision
```

**Why:** Lead with what judges will experience, not what we're proving technically.

---

**Change 3: Scope "Must Have" Section**

**Added as #2 (before AI):**

```
2. Donor App (HERO SURFACE):
   - Home screen: next donation, health status, trend chart, impact badge
   - Health dashboard: findings, trends, care status, doctor summary
   - Deferral flow: finding → explanation → "Why it matters" → booking confirmation
   - App UX is beautiful enough judges want to screenshot it
```

**Why:** App is the first thing judges see, so it's the first thing we build.

---

**Change 4: User Stories Table**

**OLD:** 9 acceptance tests (S1–S9)

**NEW:** 10 acceptance tests with "Judges' Experience" column added

```
Example:

OLD S1:
| S1 | When donor deferred for BP... | Given Arjun's 4 readings, message has all 4 values... |

NEW S1:
| S1 | Donor Experience: Arjun deferred... | Given Arjun's 4 readings... | Judges read message and say "That's what I'd want to hear" |
```

**Plus NEW Stories:**
- S4: Trend Awareness ("Donors never knew they were trending...")
- S9: Donor Returns (Badge + re-donation cycle)
- S10: The 10x Is Real (Actual funnel numbers with consumer metrics)

**Why:** Acceptance tests must show consumer value, not just technical correctness.

---

## Messaging Phrases Updated Across All Docs

### Old Messaging (Removed)
- "Blood centre tool"
- "Follows up on findings"
- "Removes counsellor workload"
- "Every finding gets explained"

### New Messaging (Added)
- "Consumer health platform"
- "Donor discovers their health"
- "Donor becomes engaged"
- "Every donor owns their data"
- "Donors choose to return"
- "Donor-driven scale"

---

## Key Frames That Now Appear in Every Doc

### Frame 1: Consumer Is Center
"The consumer is the center, not the margin." (Now in design principles, prototype goal, and user stories)

### Frame 2: Value at Every Step
"Donors get value at every step: visibility, action, impact." (Now in pitch, architecture, and scope)

### Frame 3: Donor-Driven Scale
"Donors love it → they return → blood supply is predictable → institutions fund it." (Now in pitch closing and why-it-scales section)

### Frame 4: New Category
"Consumer health platform driven by the donation cycle" (Now in README, pitch, and goal statements)

---

## Documents NOT Changed (But Should Reference Updated Docs)

These documents still exist unchanged but now reference the consumer-first strategy:

- **01-problem-brief.md** — Still valid; now understood as the problem the consumer faces
- **build-plan.md** — Still valid; now understands consumer app as Priority 1
- **protocol-rules.md** — Still valid; now understands donor explanation comes before medical protocol
- **synthetic-data.md** — Still valid; now includes focus on realistic donor journeys

**Action:** When you read these, interpret them through the consumer-platform lens. E.g., "protocol rules" are how we explain findings to donors, not how we triage them internally.

---

## Updated Docs Checklist

- [x] README.md — Consumer tagline added
- [x] pitch-narrative.md — All 9 slides reframed
- [x] architecture.md — Design principles + system diagram + components table updated
- [x] prototype-spec.md — Goal + scope + user stories reframed
- [x] Memory updated — Consumer-centric vision documented
- [x] Strategy docs created — 5 new strategy documents (differentiator, positioning, checklist, quick-ref, visual-summary)

---

## How to Use These Updated Docs

### For Your Team Building the Prototype:
1. Read: Updated **prototype-spec.md** (new priorities)
2. Review: Updated **architecture.md** (consumer surfaces are primary)
3. Execute: Use **execution-checklist.md** (Phase 1: Build donor app first)

### For Your Pitch Deck:
1. Use: Updated **pitch-narrative.md** (new speaker script)
2. Add: Slides matching new messaging (consumer value, then institutional benefits)
3. Demo: Match 30-second demo to new framing (journey, not process)

### For Judges at H2S:
1. They read: README (consumer tagline immediately establishes frame)
2. They see: Pitch (consumer-first flow)
3. They use: Prototype (beautiful app first, consoles secondary)
4. They understand: This is a new category, not an improved tool

---

## The Frame That Now Appears Everywhere

**"Your Health. Your Blood. Your Data."**

This is now:
- The README tagline
- The close of the pitch
- The hero message on the app home screen
- The mental model every team member should carry

When judges, teammates, or anyone asks "What is TraceDrop?", the answer is:

"A consumer health platform powered by the donation cycle. You give blood, you get health visibility, free care navigation, and return because you're addicted to knowing your health. Blood supply becomes predictable because donors keep coming back."

---

## Next Steps

1. ✅ Strategy docs created (DONE)
2. ✅ Core documents updated (DONE)
3. **→ Update pitch deck HTML to match new narrative** (Oct 8-9)
4. **→ Update demo video script to match consumer journey** (Oct 9-10)
5. **→ Build prototype with consumer app as Priority 1** (Oct 10-15)
6. **→ Dry-run pitch and refine** (Oct 15-17)
7. **→ Submit with new positioning** (Oct 18)

---

## Document Location Quick Reference

```
/docs/
├── 01-problem-brief.md (unchanged, reinterpreted)
├── 02-pitch/
│   ├── pitch-narrative.md ✅ UPDATED
│   └── pitch-deck.html (to be updated)
├── 03-build/
│   ├── architecture.md ✅ UPDATED
│   ├── prototype-spec.md ✅ UPDATED
│   ├── build-plan.md (unchanged, reinterpreted)
│   ├── protocol-rules.md (unchanged, reinterpreted)
│   └── synthetic-data.md (unchanged, reinterpreted)
├── 04-submission/
│   ├── demo-video-script.md (to be updated)
│   └── submission-checklist.md (to be updated)
└── 05-strategy/ ✅ NEW
    ├── tracedrop-10x-differentiator-solution.md
    ├── consumer-platform-positioning.md
    ├── execution-checklist.md
    ├── QUICK-REFERENCE.md
    ├── VISUAL-SUMMARY.txt
    └── UPDATED-DOCUMENTS-SUMMARY.md (this file)

/README.md ✅ UPDATED
```

---

## Success: How Judges Will Experience This

**Before:** They read the brief, see a blood centre tool
**After:** They read the brief, see a consumer platform they'd download

**Before:** They see pitch, think "Healthcare logistics problem"  
**After:** They see pitch, think "Health equity problem, solved through consumer love"

**Before:** They demo, see institutional consoles
**After:** They demo, hold an app, see "This is a real product"

**That's the shift. Everything's been reframed to enable it.**
