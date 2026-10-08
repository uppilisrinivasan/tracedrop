# Donor Perspective: "My Health. My Blood. My Data."

**User Profile**: Regular urban adult (22-50), wants health visibility without burden

---

## What Donors Need

### Primary Needs
1. **Health Visibility** - "I never knew my health status after donating"
   - Clear trend visualization (is my BP rising?)
   - Explain findings in plain language (not medical jargon)
   - Know if I'm okay or need care

2. **Effortless Care** - "I want help, not hassle"
   - Same-day care booking (not weeks of waiting)
   - Free care options (not expensive consultations)
   - Care near me (not travel across city)

3. **Habit Formation** - "I want to keep using this"
   - Celebrate my wins ("You caught high BP before a stroke")
   - Track progress (BP improving over 3 months)
   - Feel valued (impact badges, social proof)

4. **Control** - "This is MY data"
   - Download my records
   - Choose who sees what (ABHA consent)
   - Privacy guaranteed

### Secondary Needs
5. **Language Support** - "Speak to me in my language"
   - Messages in Hindi, Kannada, Tamil, Telugu
   - Conversational tone (friend, not doctor)

6. **Convenience** - "Make it easy"
   - Mobile-first (I use my phone)
   - Offline support (works without internet)
   - One-tap actions (no forms)

---

## Donor Journey (What They Experience)

### Step 1: Donation
```
Donate blood → Blood centre takes BP, Hb measurements
             → "You're cleared to donate today"
             → App notifies: "Donation complete ✓"
```
**Donor expectation**: "I'm healthy, right?"

### Step 2: Finding (If There's an Issue)
```
Finding: BP 148/94 (deferred from donation)
       → WhatsApp in Hindi: "Your BP is 148/94. 
         It's been going up: 128→134→138→148.
         Catching it now could prevent a stroke."
       → App shows trend chart
```
**Donor expectation**: "Oh! I need to do something about this."

### Step 3: Care Booking (Same Day)
```
"See care options" tap
→ Map shows 3 AAMs nearby
→ "Saturday 10am, 2km away, free BP check"
→ One tap: booked
→ Confirmation: "Dr approves: Booked ✓"
```
**Donor expectation**: "Wow, that was easy. I have care this weekend."

### Step 4: Follow-Up
```
Day 3: "How was your appointment?"
Day 30: "Are you on medication?"
Day 90: "Your BP is 132/88 now—well controlled!
        Ready to donate? You're cleared."
```
**Donor expectation**: "The system cares about my outcome."

### Step 5: Return & Habit
```
3 months later: Donate again
               BP: 132/88 (normal, no deferral)
               App: 🏆 "You caught high BP in time.
                    You might have saved your life."
               Dashboard: Health improving, habits forming
```
**Donor expectation**: "I'll keep using this. It's for me."

---

## Donor Success Metrics

| Metric | Target | Why It Matters |
|--------|--------|---|
| Day-1 app return | ≥85% | They come back to see their health |
| Care completion | ≥90% | They actually get care (not just book) |
| Donor retention (6mo) | ≥90% | They return to donate again |
| Message quality | ≥4/5 rating | They understand and trust the advice |
| Booking time | <30 min | Frictionless (same-day experience) |
| Mobile usage | ≥95% | They access via phone, not desktop |

---

## What Kills the Donor Experience

❌ **Confusing Medical Language** - "You have hypertension"  
❌ **Delayed Care** - "We'll call you next week"  
❌ **Data Feels Unsafe** - "Who sees my infection results?"  
❌ **Broken Promises** - "Booked" → never calls back  
❌ **Irrelevant Notifications** - "Blood centre needs donors" (not about me)  
❌ **Difficult Navigation** - Too many clicks to book  
❌ **No Feedback Loop** - "Did I improve? Who knows?"  

---

## Features Donors Love (Priority Order)

### Tier 1: Must Have (Days 1-4 Build)
1. **Home Screen** - Donation date, health status (red/yellow/green), next steps
2. **Health Dashboard** - Trends (BP/Hb over 6 months), findings, care status
3. **Deferral Message** - Explanation in their language, with trend
4. **Care Booking** - Find facility, pick time, confirm in app
5. **Impact Badge** - "You caught BP before a stroke"

### Tier 2: Should Have (Days 5-8 Build)
6. **Follow-Up Messages** - Day 3, 30, 90 check-ins
7. **Trend Visualization** - Chart showing their improvement
8. **Care Completion** - Mark when they finished care, record outcome
9. **Report Upload** - Share company health check with app
10. **Language Toggle** - Switch between Hindi, Kannada, English

### Tier 3: Nice to Have (If Time)
11. **Calendar Integration** - Add appointment to phone calendar
12. **Social Proof** - "500 donors like you caught health issues"
13. **Lifestyle Tips** - Salt <5g/day, 30min activity (from protocol)
14. **Data Export** - Download my records as PDF
15. **Referral** - Invite friends to donate (social loop)

---

## Donor Concerns We Must Address

| Concern | How We Solve |
|---------|---|
| "Will my data be private?" | FHIR schema + donor controls sharing |
| "What if I don't understand the message?" | Plain language + "talk to person" option |
| "What if care is expensive?" | Only AAM + eSanjeevani (free) in bookings |
| "What if I can't go?" | No penalty, can reschedule anytime |
| "What if my BP is still high?" | "It's a journey, not a one-time fix" |
| "Why should I come back in 3 months?" | Show them: health improved, lives saved |

---

## Donor Messaging Principles

**DO**:
- ✓ Use their language and conversational tone
- ✓ Explain with their data (trends, context)
- ✓ Make care accessible (free, near, easy)
- ✓ Celebrate wins and progress
- ✓ Make them feel valued and heard

**DON'T**:
- ✗ Use medical jargon ("hypertension", "anaemia")
- ✗ Hide what's happening (opaque process)
- ✗ Rush them or create urgency without reason
- ✗ Ask for more data than necessary
- ✗ Assume they understand healthcare

---

## Donor Interaction Patterns

**Frequency**: 
- At donation: 1 check-in
- If finding: 1 message (explanation) + 1 booking prompt
- Care phase: 3 messages (day 3, 30, 90)
- Return: 1 welcome message
- **Total**: 5-7 messages per donor per 3-month cycle

**Timing**:
- Deferral message: Within 1 hour of donation
- Care booking: Within 4 hours (same-day experience)
- Follow-ups: Scheduled (not intrusive)

**Channels**:
- Primary: WhatsApp (they check daily)
- Secondary: In-app (if WhatsApp unavailable)
- Fallback: SMS (if WhatsApp fails)

---

## Donor Features Align to Competition Scoring

| Feature | Judges See | Competition Score Impact |
|---------|---|---|
| Beautiful home screen | "I'd use this" | +0.3 (UX excellence) |
| Trend visualization | "It shows my health rising" | +0.2 (clarity) |
| Hindi messages | "It's for India, not US" | +0.2 (localization) |
| Same-day care | "Real friction-free experience" | +0.3 (usability) |
| 92% reach care funnel | "Measured 3x improvement" | +1.0 (outcomes) |
| App return 85% | "Donors want this" | +0.4 (adoption) |
| Retention 90% | "Self-sustaining flywheel" | +0.5 (sustainability) |

**Total donor-focused score**: 3.3/10 of judges' evaluation

---

**Key Insight**: Donors are the center of everything. If we nail the donor experience, judges see an app they'd use. If we nail donor retention, we've proven the 3x improvement. Everything else follows from donor success.

