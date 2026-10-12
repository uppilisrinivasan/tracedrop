# TraceDrop

A platform for voluntary blood donors in India. Each donation's free lab panel becomes a health follow-up between donations, and the donor sees where their blood went.

## People

**Donor**:
A person registered to give blood, whether eligible, deferred or lapsed. Everyone who uses the donor app is a Donor; there is no separate "health-only" user.
_Avoid_: User, patient, member

**Persona**:
One of the fixed demo Donors (e.g. Arjun, Meera, Ananya) chosen from the persona switcher, so the whole app shows that Donor's view.
_Avoid_: Test user, demo account

**Drop**:
TraceDrop's AI assistant. It speaks to the Donor first, acts on their behalf and remembers what they said.
_Avoid_: Copilot, chatbot, coach, bot

**Plan**:
The Donor's single, living set of health goals, Reminders and weekly activity target. It is first written from their results and then kept up to date by Drop.
_Avoid_: Care plan, follow-up plan, programme

## Talking to the donor

**Card**:
One message from Drop in the conversation, of a fixed kind (impact, check-in, slots, reminder, weekly report, results), which may contain a small form the Donor answers in place.
_Avoid_: Bubble, notification, widget

**Cycle**:
The time from one donation to the next, or 120 days for a Donor who isn't donating. Drop's conversation starts fresh each Cycle; the Plan and what Drop remembers carry over.
_Avoid_: Period, phase, quarter

**Event**:
A fact about the Donor that Drop may tell them about, such as results ready, a component reaching a patient, a check-in due or becoming eligible to donate.
_Avoid_: Trigger, alert

**Message budget**:
The cap on how many unprompted Cards Drop sends a Donor in a period. Urgent findings bypass it; Reminders don't count against it.
_Avoid_: Notification limit, quota

**Check-in**:
Drop asking the Donor about progress on a health goal, at the interval the clinical protocol sets. Counts against the Message budget.
_Avoid_: Follow-up message, nudge

**Reminder**:
A recurring prompt the Donor asked Drop to set up, such as a tablet at 9 pm, answered with Taken or Skipped. Does not count against the Message budget.
_Avoid_: Alarm, nudge, medication tracking

**Weekly report**:
Drop's single regular summary Card, rolling up Reminders, activity, goal progress, impact and the donation countdown. Healthy Donors get it monthly.
_Avoid_: Digest, newsletter, adherence report

**Story**:
A short set of tap-through slides telling the Donor something worth sharing, such as where their blood went or their Weekly report.
_Avoid_: Carousel, slideshow
