# Submission checklist (due 18 Oct 2026)

Requirements from the competition brief (H2S × Google Cloud Gen AI hackathon). Confirm the exact cutoff time and the form fields on the portal.

## Eligibility

- [ ] 2–4 members, all eligible under the rules.
- [ ] All submitted code and assets were made during the official hackathon window. The repo's first commit is 8 Oct 2026, 14:31 IST. Check this against the official start date and time before submitting.
- [ ] Each member has checked their employer's IP and outside-work rules.

## Required items

| Item | Requirement | Ours | Status |
|---|---|---|---|
| **Theme** | State it clearly | Sustainability & Social Impact | [ ] |
| **Functional prototype** | Built with Gemini or Gemma (or Agent Platform, Antigravity, AI Studio); deployed on Cloud Run or Firebase | Gemini 3.1 Flash-Lite on Vertex AI; Cloud Run (asia-south1), deployed by GitHub Actions on every push to `main`: https://tracedrop-25mgkruoeq-el.a.run.app | [ ] Opens in an incognito window; **Continue as guest** works; the AI console says "Verified" |
| **Video** | About 3 minutes or less; public YouTube, Vimeo or Drive link | [demo-video-script.md](demo-video-script.md) | [ ] Public, under 3:00 |
| **Proposal deck (PDF)** | Vision, impact, problem alignment, who benefits, feasibility, scalability | [pitch-deck.pdf](../04-pitch/pitch-deck.pdf) (from [pitch-deck.html](../04-pitch/pitch-deck.html)) | [ ] Team name, members and video link filled in; PDF re-exported |
| **GitHub repo** | Public | https://github.com/uppilisrinivasan/tracedrop (public) | [ ] README, licence, synthetic-data notice |
| **Language** | Everything in English | Code, docs, deck, voice-over | [ ] Non-English lines subtitled |

## Fill in before submitting

- [ ] Deck slides 1 and 8: team name, members, contact, and the video link.
- [ ] Re-export the PDF. From the repo root, run:

  ```sh
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --no-pdf-header-footer \
    --print-to-pdf=docs/04-pitch/pitch-deck.pdf "file://$PWD/docs/04-pitch/pitch-deck.html"
  ```

  The deck sets its own page size (13.333 × 7.5 in). Check that each slide fits on one page.
- [ ] Add a `LICENSE` file. The backend's `package.json` says MIT, but there is no licence file at the root.

## Quality gates

- [ ] The first 60 seconds of the video show a Story, real results becoming a Goal, and Gemini answering in Kannada.
- [ ] Every number in the deck and video is in [pitch-narrative.md](../04-pitch/pitch-narrative.md) under "Numbers to keep consistent". None of the first plan's projected metrics appear.
- [ ] Nothing in the deck, video or README claims what the prototype doesn't do: no WhatsApp, voice, doctor or counsellor console, FHIR store, BigQuery, Maps or real bookings.
- [ ] The README states the data is synthetic and the prototype isn't for medical use. Cover, slots and check-ups are labelled illustrative or demo in the app.
- [ ] `cd backend && npm test` passes (152 tests) and `cd frontend && npm run type-check` is clean. CI runs both on every deploy.
- [ ] The latest **Deploy TraceDrop to Cloud Run** run on `main` is green, and `/api/health` answers.
- [ ] The Vertex AI daily budget (50,000 tokens, 200 calls per instance) isn't exhausted before judging. It resets daily and on restart. Check the AI console on the morning of judging.
- [ ] A Google Cloud budget alert is set on the project.

## Special prizes to target

- **Most Impactful Solution:** blood supply through donors who return; health follow-up for donors who would otherwise get nothing.
- **Best Use of Google Cloud AI Tools:** Gemini on Vertex AI as an agent with 18 tools, multimodal report reading and six languages, on Cloud Run, with Firestore, Google Sign-In, Calendar and Gmail.
- **Best UI/UX:** Drop on every screen, at most one Card a day, a one-minute Intro in six languages, Stories with shareable postcards, and Your data with real deletes.
