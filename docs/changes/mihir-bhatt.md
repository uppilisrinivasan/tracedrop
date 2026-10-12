# Changes by Mihir Bhatt

One entry per commit on the Drop-first redesign (branch `feature/drop-home`), newest first, so any change can be traced or reverted.
To revert one: find it with `git log --oneline --grep "<commit title>"`, then `git revert <hash>`.
The design behind these changes is in `CONTEXT.md` (vocabulary) and the build plan.

## 2026-10-13 · Make Home Drop-first: Cards, demo bar, Stories and lab report upload

- **What and why:** Home now leads with Drop's open Cards (urgent first, at most 3 before "N more"), each with one sentence, an optional form, one main button and one way out, plus a ⋯ menu to snooze (1 hour / tonight 7 pm / tomorrow / next week) or hide. Answers turn into a one-line receipt with Undo and fold into "Earlier this cycle". Numbers are typed into plain boxes on desktop; scroll wheels appear only on touch screens (swipe-left also only on touch). The numbers (impact, health score, cover, next donation, circles) move to a quiet right-hand column, and the donation countdown sits in the header. New: a tap-through Story viewer (arrow keys, Esc, share via the share sheet or a WhatsApp link), the "What Drop remembers" list, an "Add a lab report" dialog (a photo the AI reads, or the demo's synthetic sample, confirmed before saving), and a demo bar above every screen (+ few hours, +1 day, +1 week, Next event, Reset, and an ⓘ note saying it is demo-only). The old "For you today" and "Try the AI" tiles are replaced by Drop's Cards. Drop's wording keeps marker names like HbA1c intact.
- **Files:** `frontend/src/pages/Home.tsx`, `frontend/src/App.tsx` (two lines: import and mount the demo bar), `frontend/src/components/DemoBar.tsx` (new), `frontend/src/components/drop/` (new: `DropFeed.tsx`, `DropCardView.tsx`, `ScrollWheel.tsx`, `StoryViewer.tsx`, `ReportUpload.tsx`, `MemorySheet.tsx`, `drop.css`), `backend/src/domain/drop.js`.
- **Revert:** reverting this restores the previous Home; the Drop API keeps working underneath.

## 2026-10-13 · Add the Drop API and the demo "next event" jump

- **What and why:** routes under `/api/donors/:donorId/drop` let the app read a Donor's Drop state (open Cards with their wording and forms, receipts, Earlier this cycle, memory, Plan, readings, budget, what's waiting and why) and act on it: answer, snooze, hide, undo, reopen, forget memories, undo a memory, delete an added reading, hide a blood-centre result. Rule violations (e.g. hiding an urgent Card) return 400 with the reason. `POST /api/demo/next` jumps the clock to the next moment any demo Donor gets a new Card. `frontend/src/api.ts` gets the matching types and calls.
- **Files:** `backend/src/routes/drop.js` (new), `backend/src/server.js` (one line mounting it), `backend/src/routes/demo.js`, `backend/src/domain/drop.js`, `frontend/src/api.ts`.
- **Revert:** safe to revert on its own; the UI commits that follow use these routes.

## 2026-10-13 · Add the Drop engine: Events to Cards under the message budget

- **What and why:** `backend/src/domain/drop.js` decides which Cards each Donor sees and when, using the rules agreed in the redesign: at most 1 new Card a day; Donors with a goal get 2 a week plus a Weekly report on Sunday afternoon, healthy Donors 1 a week plus a monthly report; priority urgent > results > donating > check-ins and Plan > goal reached > impact; quiet hours from 9 pm (only urgent Cards and the Donor's own Reminders); Cards that follow up on something the Donor did skip the budget; snooze (1 hour / tonight 7 pm / tomorrow / next week), urgent Cards only an hour and never hidden; 3 snoozes or 7 days unanswered fold into the next report; only the first unit per donation gets an Impact Card; skipped Reminders become "no answer"; memory with replace and undo; undo of an answer, including results or bookings it added. State is in memory, seeded from `data/demo/drop-seed.json`, and resets with the demo clock (Firestore is pending after the demo). The demo day now has four parts (8 am, 2 pm, 7 pm, 9 pm) so "Tonight" (7 pm) and quiet hours both work. Haemoglobin findings now use the newest Hb, including an uploaded lab report, so Meera's report can clear her deferral.
- **Files:** `backend/src/domain/drop.js` (new), `backend/test/drop.test.js` (new, the prototype's walkthroughs as tests), `backend/src/domain/health.js`, `backend/src/data/store.js`, `backend/src/routes/demo.js`.
- **Revert:** revert this and the later Drop API / UI commits together; on its own it only changes the Hb rule and the four-part day.

## 2026-10-13 · Add demo data: Arjun's 3 Oct donation, Drop's starting state, Meera's sample report

- **What and why:** the demo story needs Arjun to have donated on 3 Oct with BP 148/94 (trend 132 → 136 → 148), with his platelets used on 8 Oct and his red cells on 15 Oct. This lives in `data/demo/overlay.json`, applied on top of the synthetic data at load time so regenerating synthetic data doesn't remove it. Lab results can carry an `availableOn` date and stay hidden until the demo clock reaches it (Arjun's arrive on 11 Oct). `data/demo/drop-seed.json` holds each demo Persona's starting state for Drop (open Cards, earlier Cards, Plan, memories, Reminders, language). `frontend/public/demo/sample-lab-report-meera.png` is a clearly-labelled synthetic report (Hb 12.6) for Meera's comeback.
- **Files:** `data/demo/overlay.json` (new), `data/demo/drop-seed.json` (new), `frontend/public/demo/sample-lab-report-meera.png` (new), `backend/src/data/store.js`, `backend/test/domain.test.js` (the "rising BP before hypertension" check moves to Karthik, since Arjun is now stage 1 by design; a new check covers Arjun).
- **Revert:** safe to revert on its own; Arjun goes back to his June donation and the Drop seed is unused until the engine lands.

## 2026-10-13 · Add a demo clock that can move forward and reset

- **What and why:** the fixed simulation date (`store.TODAY`) becomes a demo clock (`store.today()`, with morning / afternoon / night) so the jump-ahead bar can show Drop over days and weeks. New `/api/demo` routes read, advance and reset it (on by default since all data is synthetic; `DEMO_MODE=false` turns them off). Reset also reloads donations, results and components and clears demo-session data. Impact journeys now only show steps that have happened by the demo date, so a unit used "next week" isn't shown as used today.
- **Files:** `backend/src/data/store.js`, `backend/src/routes/demo.js` (new), `backend/src/server.js` (one line mounting `/api/demo`), `backend/src/domain/impact.js`, and `store.TODAY` → `store.today()` in `ai/copilot.js`, `ai/tools.js`, `ai/carePlan.js`, `ai/labReader.js`, `domain/cover.js`, `domain/health.js`, `domain/donation.js`, `domain/community.js`, `routes/platform.js`, `routes/donors.js`.
- **Revert:** safe to revert on its own until the Drop engine lands (later commits listen to the clock).

## 2026-10-13 · Start the Drop-first redesign: glossary and change log

- **What and why:** adds `CONTEXT.md`, the shared vocabulary for the redesign (Donor, Persona, Drop, Plan, Card, Cycle, Event, Message budget, Check-in, Reminder, Weekly report, Story), and this change log.
- **Files:** `CONTEXT.md`, `docs/changes/mihir-bhatt.md`.
- **Revert:** safe to revert on its own; nothing depends on it at runtime.
