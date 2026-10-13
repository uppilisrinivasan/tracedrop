# Changes by Mihir Bhatt

One entry per commit, newest first, so any change can be traced or reverted: the Drop-first redesign (branch `feature/drop-home`) and the New donor's Intro and "Your data" (branch `feature/onboarding`).
To revert one: find it with `git log --oneline --grep "<commit title>"`, then `git revert <hash>`.
The design behind these changes is in `CONTEXT.md` (vocabulary) and the build plan.

## 2026-10-14 · Onboarding step 5: the Intro in the chosen language

- **What and why:** step 1 sets the language, and the rest of the Intro appears in it.
  - `backend/src/ai/introWriter.js` (new): for a language other than English, Gemini translates each step's words and buttons, and the Intro's own words (bar, Skip, coming back, the folded line), the first time they are shown, once per language. A translation is used only if every number and every `{placeholder}` survives, the same check as Drop's Cards; otherwise that text stays in English and a quiet note says so ("Shown in English: a translation isn't available right now"). With the AI off, the Intro is in English with that note. The pictures stay in English. Outside English the progress reads "3/8" (the AI sometimes swapped the numbers in "3 of 8").
  - Asking Drop to switch language mid-Intro works: a new `set_language` tool for the AI, and a rule answer ("talk to me in Hindi", "English please") when it is off. Home's language switch (English plus the donor's chosen language) also changes it mid-Intro, and the Intro carries on in the new language; the chat waits for the translated Intro before it stops "thinking".
  - If the AI's reply opens with its own planning ("The user wants…"), Drop answers from the rules instead, or asks to be asked again; answers in the Intro thread are formatted like the rest of the chat.
- **Files:** `backend/src/ai/introWriter.js` (new), `backend/src/routes/intro.js`, `backend/src/ai/tools.js`, `backend/src/ai/agent.js`, `backend/src/ai/copilot.js`, `backend/test/intro.test.js`, `frontend/src/components/intro/Intro.tsx`, `frontend/src/components/Copilot.tsx`, `frontend/src/components/drop/DropFeed.tsx`, `frontend/src/api.ts`, `frontend/src/ui.tsx`.
- **Revert:** safe to revert on its own; the Intro is then English only.

## 2026-10-14 · Onboarding step 4: the Intro on Home, with the tile highlight

- **What and why:** the New donor now meets Drop through the Intro in Home's chat.
  - `frontend/src/components/intro/` (new): the thread and the step pictures (an example journey and an example results card, both labelled "Example"; what is kept and where; the three Choices; when donating suits you; a summary), rewritten from the prototype's variant D.
  - In Home's chat (`Copilot.tsx`, inline only): while the Intro is new or running, the chat shows the Intro thread instead of the normal conversation and hides the suggestion buttons. Drop's Cards and the stat tiles stay. A bar at the top: "Getting started", progress, "3 of 8" and **Skip intro** (Drop asks to confirm). Buttons sit under the latest message only. Typed questions go to the AI and appear in the thread, followed by "Carry on: {step}" and "Skip intro"; with the AI off they get a rule answer that names the step.
  - A new visit (reload or sign-in) folds the finished steps into "Done so far…" and Drop says "Welcome back, we stopped at…"; other screens in the same visit keep the thread.
  - Finished or skipped, the thread folds into one line at the top of the chat, "Intro · finished 10 Oct · Replay" (the demo date), with the questions asked during it; the normal suggestions return. "Book my first donation" opens today's booking steps in the chat. Booking asked for from Home's button while the Intro is still running opens the Donate screen.
  - The account menu gets **Replay intro**, only when viewing the New donor. Replaying highlights the language chosen before; skipping a replay changes nothing (the first run's questions come back too).
  - The full-page "When can you donate?" setup (and `BookingChat.tsx`, which only it used) is removed from `AuthGate.tsx`, with the `tracedrop.localSetupDone` browser flag; the Intro's step 7 replaces it. Booking itself is unchanged.
  - **Tile highlight** (`Home.tsx`): the tile Drop is talking about gets a purple ring and moves to the top of the column (journey: "Your blood has helped"; health: "Health score" and "Doctor check-up"; Choices: "Health insurance cover"; when to donate: "Next donation"). On the data step the account chip pulses instead; with motion turned off it is a still ring.
- **Files:** `frontend/src/components/intro/Intro.tsx`, `pictures.tsx`, `intro.css` (new), `frontend/src/components/Copilot.tsx`, `frontend/src/pages/Home.tsx`, `frontend/src/components/AccountMenu.tsx`, `frontend/src/App.tsx`, `frontend/src/AuthGate.tsx`, `frontend/src/BookingChat.tsx` (deleted), `frontend/src/styles.css` (its style), `frontend/src/api.ts`, `backend/src/domain/intro.js` and `backend/src/routes/intro.js` (the Intro's own words for the bar, Skip and coming back, so they can be translated with the steps), `backend/test/intro.test.js`.
- **Revert:** reverting this brings back the setup screen and leaves the Intro engine unused; nothing else depends on it until "Your data".

## 2026-10-14 · Onboarding step 3: the Intro engine (server, no screens)

- **What and why:** Drop's Intro for a new user, as rules and data on the server, so the screens in the next commit only show it.
  - `backend/src/domain/intro.js` keeps, per demo donor in server memory, the Intro's `status` (new, running, done, skipped), `step` (1–8), `finishedOn` (the demo date) and the questions asked during it. Only the New donor starts as new; every other Persona is done and can't replay it. Demo Reset puts it back.
  - The 8 steps as data: Drop's English words, which picture, and the buttons. Language; what TraceDrop is; your blood's journey, shown with a labelled example built from the demo's 3 Oct donation as it stands on the demo clock (no name), with a story to watch; health between donations, with an example results card from the same donation; your data; your Choices; when you can donate; all set, with "Book my first donation" and "Start using TraceDrop".
  - Answers land where they belong: the language becomes Drop's language and the donor's own (so Home's switch offers English plus it); the Choices become the donor's Choices; "when can you donate" (days, time of day, place) is saved with the signed-in Google account through the same preferences store booking reads, as the old setup screen did. Skip keeps the defaults (insurer off). Replay starts at step 1 with what was chosen before filled in and saves only what changes; skipping a replay changes nothing.
  - Demo Reset now also reloads the donor records, so the New donor's language and every Persona's Choices go back to where they started.
  - Routes under `/api/donors/:id/intro`: read, answer a step, skip, replay, finish. Drop's view includes the Intro's status. Drop's chat is told which step the person is on, so "what's this?" mid-Intro gets a sensible answer; with the AI off the rule answer names the step. Questions asked during the Intro are kept with it.
- **Files:** `backend/src/domain/intro.js` (new), `backend/src/routes/intro.js` (new), `backend/src/server.js` (one line mounting it), `backend/src/data/store.js`, `backend/src/domain/drop.js`, `backend/src/ai/copilot.js`, `backend/src/routes/donors.js`, `backend/test/intro.test.js` (new).
- **Revert:** safe to revert on its own (no screen uses it yet).

## 2026-10-14 · Onboarding step 2: empty states for a donor with no records

- **What and why:** the New donor has no donations, results, blood group, Circles or insurer, and several screens failed or read oddly for them.
  - **Server:** every donor API (overview, health, impact, who benefited, cover and its what-if, community, slots and eligibility, Drop and Drop's line on each screen) now answers normally. Cover for a donor with no insurer says so (`linked: false`; the overview's `cover` is `null`); BMI is `null` without a height; Drop's line on each screen says what their first donation will bring instead of "All 0 of your results are in range". Drop sends no monthly report to someone who has never donated. The chat knows the New donor is the signed-in person (it uses their Google first name, or no name with sign-in off) and never calls them "New"; without the AI, questions about results or BP get "no results yet", and "What happens at a donation?" gets a plain answer.
  - **Home:** greets the New donor by the signed-in person's Google first name ("Hello" with sign-in off); the line under it says "No donations yet" and the countdown "You can book your first donation"; the button reads "Book my first donation". Tiles: "Your blood has helped: your first donation will show here", "Health score: after your first donation", "Doctor check-up: none booked", "Health insurance cover: no cover linked yet", "Next donation: book your first donation", and no "Your circles" tile. The chat's suggestions for a first-time donor are about the first donation. Home is now keyed by donor, so switching donors never shows one donor's numbers under another's name while loading.
  - **Other screens:** My impact, My health (check-ups stay), Health cover and Community ("You're not in a Circle yet") each show one short message instead of empty charts or errors; Donate's booking section reads "Book your first donation".
- **Files:** `backend/src/domain/cover.js`, `backend/src/domain/impact.js`, `backend/src/domain/screenLines.js`, `backend/src/domain/drop.js`, `backend/src/routes/donors.js`, `backend/src/ai/copilot.js`, `backend/src/ai/agent.js`, `backend/src/ai/dropWriter.js`, `backend/src/ai/insights.js`, `backend/src/ai/carePlan.js`, `backend/test/emptystates.test.js` (new), `backend/test/newdonor.test.js`, `frontend/src/api.ts`, `frontend/src/App.tsx`, `frontend/src/pages/Home.tsx`, `frontend/src/components/Copilot.tsx`, `frontend/src/pages/Impact.tsx`, `frontend/src/pages/Health.tsx`, `frontend/src/pages/Cover.tsx`, `frontend/src/pages/Community.tsx`, `frontend/src/pages/Donate.tsx`.
- **Revert:** safe to revert on its own; the New donor's screens then fail again.

## 2026-10-14 · Onboarding step 1: glossary, two fixes, and the New donor

- **What and why:**
  - `CONTEXT.md` gets the onboarding vocabulary: **Intro**, **Choices** and **Circle**, and the **Persona** entry now says choosing one means using the app as that Donor, with the New donor as a new user who starts with the Intro.
  - **Sign-in wiped saved preferences:** every Google sign-in rewrote the user record in Firestore without merging, so saved donation preferences disappeared. It now merges. This matters more now that the Intro saves donation preferences with the account.
  - **Demo Reset left old chat behind:** Drop's Card ids restarted at 1 after a Reset, so the chat could show a new Card under an old one's id. Ids now never repeat (they also carry a per-server-start stamp). The demo bar announces a Reset (also when it sees the demo clock go backwards because someone else reset it), and the chat clears its saved conversation and its list of Cards it showed; the Card list on Home drops its old Cards straight away.
  - **The New donor:** the demo overlay loader accepts donors, so `data/demo/overlay.json` adds one without touching the synthetic data: a new id (`D-NEW`) and no records at all (no donations, results, blood group, Circles, insurer or Plan; Choices at their defaults: insurer off, leaderboard on, totals on; English). `data/demo/drop-seed.json` gives Drop an empty start for them. Drop no longer sends "Get ready to donate" to someone who has never donated (they book their first donation from Home or the Intro). The New donor is kept out of the Ecosystem view's network figures, which stay about the 300 synthetic donors.
  - The donor picker lists **New donor** first, and a first visit (nothing saved in the browser) opens on them. Their screens are fixed in the next commit; until then Home shows an error for them, and the server stays up.
- **Files:** `CONTEXT.md`, `backend/src/auth/accessLog.js`, `backend/src/domain/drop.js`, `backend/src/data/store.js`, `backend/src/routes/donors.js`, `backend/src/routes/platform.js`, `backend/test/newdonor.test.js` (new), `backend/test/domain.test.js` (the cover test covers donors with an insurer), `data/demo/overlay.json`, `data/demo/drop-seed.json`, `frontend/src/App.tsx`, `frontend/src/api.ts`, `frontend/src/components/DemoBar.tsx`, `frontend/src/components/Copilot.tsx`, `frontend/src/components/drop/DropFeed.tsx`.
- **Revert:** safe to revert on its own, but the onboarding commits after it need the New donor.

## 2026-10-13 · Change or cancel bookings any time; Home uses the full width on ultra-wide screens

- **What and why:**
  - Tapping "Book a free check-up" used to leave a "Booking a free check-up…" receipt on Home that never went away. Answers that open a follow-up Card (book a check-up, book a donation after a goal, rebook a missed visit) no longer leave a receipt; the follow-up Card is the response, and a line goes into "Earlier this cycle".
  - Undo only lasts until time moves on, so there was no way to change a booking later. Booked check-ups and donations now show under "Coming up" on Home with Change (removes it and offers new slots) and Cancel. A cancelled visit gets no "How did it go?" check-in; a cancelled donation is removed from appointments.
  - On ultra-wide screens Home left a large empty area. The cards and stats now share the width in proportion; on very wide screens the cards stop at a readable width and the stat tiles spread into columns.
  - "Your week, in 1 taps" now reads "1 tap".
- **Files:** `backend/src/domain/drop.js`, `backend/src/routes/drop.js`, `backend/test/drop.test.js`, `frontend/src/api.ts`, `frontend/src/components/drop/DropFeed.tsx`, `frontend/src/components/drop/drop.css`, `frontend/src/pages/Home.tsx`, `docs/drop/index.html` (test script and rules updated).
- **Revert:** safe to revert on its own.

## 2026-10-13 · Fix empty Drop answers, a wrong donation date, and Home on wide and medium windows

- **What and why:**
  - "Explain my latest results" sometimes got "Done." because Gemini looked up the results and then returned no words. Drop now asks once more for the answer and, if it is still empty, answers from the rules. Gemini 2.5 Flash-Lite also sometimes sends a malformed tool call (`MALFORMED_FUNCTION_CALL`), which used to fall back to the offline answer; it is now retried once.
  - "When can I donate next?" could get an invented past date. The profile tool now gives Drop the same plain sentence the Donate screen uses.
  - Home on wide windows left a large empty gap between the cards and the stats; on medium windows the stats dropped below the cards. The cards and stats now grow together side by side from about 1,000 px wide, Home is capped at 1,360 px, and Drop's header row wraps instead of squeezing the language switch.
- **Files:** `backend/src/ai/agent.js`, `backend/src/ai/copilot.js`, `backend/src/ai/tools.js`, `frontend/src/components/drop/drop.css`, `frontend/src/pages/Home.tsx`.
- **Revert:** safe to revert on its own.

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
