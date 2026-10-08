# Submission checklist (due 18 Oct 2026)

The requirements below come from the competition brief ([references](../../../.claude/skills/frame-10x-problem/references/competition-brief.md)) and the team's [selection guide](../../AI_Builder_Cup_Idea_Selection_Guide.pdf). Confirm the exact cutoff time and the form fields on the portal.

## Eligibility (by 11 Oct)

- [ ] 2–4 members. All are JAPAC-based working professionals aged 21 or over, with no students.
- [ ] Two members are chosen to travel if the team is shortlisted. Visas are each person's own responsibility.
- [ ] All work is new and built during the window, with no pre-existing code. The repo history starts after 7 Sep.
- [ ] Each member has checked their employer's IP and outside-work rules.

## Required items

| Item | Requirement | Ours | Status |
|---|---|---|---|
| **Category / theme** | State the theme clearly | Sustainability & Social Impact | [ ] |
| **Functional prototype** | Built with Gemini/Gemma or Agent Platform/Antigravity/AI Studio; deployed on Cloud Run or Firebase | ADK + Gemini 3.8 on Cloud Run; consoles on Firebase Hosting | [ ] Link works in an incognito window |
| **Video** | About 3 minutes or less; public YouTube, Vimeo or Drive link; shows the solution in action | [demo-video-script.md](demo-video-script.md) | [ ] Public, under 3:00 |
| **Proposal deck (PDF)** | Vision, impact, alignment with the problem, who benefits, feasibility, scalability | [pitch-deck.pdf](../02-pitch/pitch-deck.pdf) | [ ] Placeholders filled |
| **GitHub repo** | Public (FAQ) | Layout in [architecture.md](../03-build/architecture.md) | [ ] Public, README, licence, synthetic-data notice |
| **Language** | Everything in English | Code, docs, deck, video voice-over | [ ] Hindi lines subtitled |

## Placeholders to fill in the deck

- [ ] Team name and members (slides 1 and 10)
- [ ] Deployed link, GitHub link and video link (slides 1, 7 and 10)
- [ ] Evaluation numbers from `eval/results.json` (slide 8): extraction accuracy and N, the leak test, language ratings
- [ ] Re-export to PDF. Open it in Chrome and run: `--headless=new --print-to-pdf=pitch-deck.pdf pitch-deck.html`

## Quality gates before submitting

- [ ] The first 60 seconds of the video show Gemini doing real work: reading, explaining, the doctor approving, booking.
- [ ] The live link opens to "Play Arjun's journey" with no login. Console logins for judges are listed in the README.
- [ ] Every number in the deck and video appears in [pitch-narrative.md](../02-pitch/pitch-narrative.md) under "Numbers to keep consistent".
- [ ] The README states the data is synthetic and the prototype isn't for medical use.
- [ ] No real lab's branding appears in the synthetic reports.
- [ ] The architecture diagram is exported as PNG and included in the repo and the deck.

## Special prizes to target

- **Most Impactful Solution:** the national findings-to-care gap, routed to free public care.
- **Best Use of Google Cloud AI Tools:** Gemini (multimodal, long context, Live), ADK tool confirmation, Cloud Healthcare API FHIR, Firebase, BigQuery, Maps.
- **Best UI/UX:** one WhatsApp journey, and a doctor approval that takes 15 seconds.
