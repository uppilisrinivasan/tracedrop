# Changes by Mihir Bhatt

One entry per commit on the Drop-first redesign (branch `feature/drop-home`), newest first, so any change can be traced or reverted.
To revert one: find it with `git log --oneline --grep "<commit title>"`, then `git revert <hash>`.
The design behind these changes is in `CONTEXT.md` (vocabulary) and the build plan.

## 2026-10-13 · Ship the demo data in the Docker image

- **What and why:** the live site was missing Arjun's 3 Oct donation and every demo donor's starting Drop state, because the Dockerfile only copied `data/synthetic` and `data/ontology`. It now also copies `data/demo`.
- **Files:** `Dockerfile`.
- **Revert:** don't; without it the live demo has no results card for Arjun.

## 2026-10-13 · Add the team guide to Drop, and refuse medicine names as memories

- **What and why:** `docs/drop/index.html` is a self-contained page (open it in a browser, no build) for the team: why Drop exists, the six demo donors, how Drop decides with a diagram, the rules, card types, where the AI comes in, how to run it locally, the demo controls, what isn't built yet, where the code is, and ten test scripts with expected results, tick boxes saved in the browser, and a "Copy my results" button for the team chat. `docs/drop/README.md` points to it, since GitHub shows HTML as source. Drop's memory guard now also refuses medicine names and doses (e.g. "metformin 500 mg"), which belong in the Plan.
- **Files:** `docs/drop/index.html` (new), `docs/drop/README.md` (new), `backend/src/ai/tools.js`, `backend/test/drop.test.js`.
- **Revert:** safe to revert on its own.

## 2026-10-13 · Add the "What Drop knows" panel

- **What and why:** a "What Drop knows" button on the demo bar opens a side panel with the Drop engine's real state for the Donor being viewed: the demo date and quiet hours, the message budget used today and this week, which Cards are on Home and whether they counted against the budget, what is waiting and why, what is snoozed, hidden or folded, what is coming up, a log of what just happened, the Plan, memories and readings, and how many open Cards the AI worded. It explains why a Card appeared, waited or folded away. Demo mode only; Esc closes it.
- **Files:** `frontend/src/components/drop/DropKnows.tsx` (new), `frontend/src/components/DemoBar.tsx`, `frontend/src/components/drop/drop.css`.
- **Revert:** safe to revert on its own.

## 2026-10-13 · Fixes from the full click-through

- **What and why:** problems found by clicking through every Drop flow at desktop width.
  - AI wording now applies only while it matches exactly what the rules say. Before, after "Weekday evenings instead" the slots Card kept the AI's Saturday labels while its buttons booked evening slots.
  - "Next event" moves to the next Card for the Donor being viewed and skips routine Reminders (Meera's daily reminder used to stop it every day).
  - Pressing Enter in the BP number boxes saves the reading.
  - After a goal is reached, the next check-in moves to a month later instead of staying in the past.
  - The demo bar keeps its date in step with the server (it showed a stale date after a backend restart).
  - Locally, the "When can you donate?" question is remembered in the browser once answered or skipped; the backend only keeps it in memory, so it came back after every restart.
  - Drop's chat replies are held to two short sentences.
- **Files:** `backend/src/domain/drop.js`, `backend/src/ai/dropWriter.js`, `backend/src/ai/copilot.js`, `backend/src/routes/demo.js`, `backend/test/drop.test.js`, `frontend/src/components/drop/DropCardView.tsx`, `frontend/src/components/drop/DropFeed.tsx`, `frontend/src/components/DemoBar.tsx`, `frontend/src/App.tsx` (passes the donor to the demo bar), `frontend/src/AuthGate.tsx` (local-only memory of the preferences answer), `frontend/src/api.ts`.
- **Revert:** safe to revert on its own; the bugs above come back.

## 2026-10-13 · Give Drop its voice and put it on every screen

- **What and why:** finishes groups 1 and 2 of the local build.
  - **AI wording:** Gemini rewrites the sentence and button labels of up to 3 open Cards in the Donor's language whenever the conversation is read (`backend/src/ai/dropWriter.js`). A Card keeps its rule wording if the AI is unavailable or drops any number. A language switch next to Drop on Home (English / the Donor's own language) rewrites open Cards; Rohan defaults to Hindi.
  - **Drop's chat panel:** the old chat panel becomes Drop (`frontend/src/components/Copilot.tsx`). Replies are one or two sentences plus at most one Card. New tools: `show_chart` (BP including readings the Donor added, Hb, labs), `offer_care_slots` and `offer_reminder` (real Drop Cards, also shown on Home, outside the budget), `remember` (preferences only; health facts, religion, caste, income are refused) with a "Remembered: … · Undo" line, and `log_reading`. Drop reads its memory and the Plan on every turn. When Gemini ends with no text after a tool call, the reply says what was done instead of failing. Without AI, common questions (results, BP, impact, donating, cover, check-up, memory) get rule-based answers. Card chips such as "Explain my results" now open the panel and ask.
  - **Drop's line on each screen:** Health, Impact, Donate, Cover and Community open with one true sentence from fixed rules (`backend/src/domain/screenLines.js`); tapping it opens Drop with 2–3 questions for that screen; × hides it on that screen for the rest of the demo day.
  - **Health shows what Drop keeps:** "Your Plan" (goals, weekly activity, reminders, notes, next check-in); "Readings and results" with the readings the Donor added (Delete) and the blood centre's latest results ("Hide from my app", which only hides them from the list and never changes eligibility). BP readings the Donor added appear on the BP trend chart. The AI care-plan card is renamed "Detailed analysis" so there is one Plan.
- **Files:** `backend/src/ai/dropWriter.js` (new), `backend/src/domain/screenLines.js` (new), `backend/src/ai/copilot.js`, `backend/src/ai/agent.js`, `backend/src/ai/tools.js`, `backend/src/domain/drop.js`, `backend/src/routes/drop.js`, `backend/src/routes/donors.js` (copilot fallback gets the donor; lab results carry their id), `backend/test/drop.test.js`, `frontend/src/components/Copilot.tsx`, `frontend/src/components/drop/` (`DropLine.tsx`, `HealthDrop.tsx` new; `DropFeed.tsx`, `drop.css`), `frontend/src/pages/` (`Health.tsx`, and one `DropLine` line plus its import in `Impact.tsx`, `Donate.tsx`, `Cover.tsx`, `Community.tsx`), `frontend/src/api.ts`, `frontend/src/ui.tsx`.
- **Revert:** reverting this returns Drop to rule wording and the old chat panel; Home's Cards keep working.

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
