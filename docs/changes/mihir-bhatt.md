# Changes by Mihir Bhatt

One entry per commit on the Drop-first redesign (branch `feature/drop-home`), newest first, so any change can be traced or reverted.
To revert one: find it with `git log --oneline --grep "<commit title>"`, then `git revert <hash>`.
The design behind these changes is in `CONTEXT.md` (vocabulary) and the build plan.

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
