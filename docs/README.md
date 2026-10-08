# TraceDrop: build and pitch package

**Every blood donation is a health check. TraceDrop makes sure it counts.**

TraceDrop is a navigator built on Gemini. It follows every finding from a blood donation through to care: high blood pressure, low haemoglobin, rising trends and, through the counsellor, infection screens. The blood centre's doctor and counsellor stay in charge. Donors are sent to care that already exists and is free: Ayushman Arogya Mandir health centres, eSanjeevani teleconsultations, NVHCP hepatitis treatment and ABHA health records. Once cleared, they come back to donate.

- **Competition:** H2S × Google Cloud AI Builder Cup 2026 (JAPAC). Theme: **Sustainability & Social Impact**.
- **Deadlines:** team lock **11 Oct**, prototype **18 Oct**, shortlist 7 Nov, finale in Singapore 4 Dec.
- **Verdict:** Pursue. Scores **32 / 35** on our framing rubric and **about 88 / 100** on the judges' weights (realistic range 82–90).

## The idea in four lines

- **Problem:** India's 1.57 crore blood donations a year find disease in healthy adults, then lose them. Only a third of donors with a reactive infection screen reach counselling. Only 15% of hepatitis C donors were contacted in one Kolkata study. Donors deferred for high BP or low haemoglobin hear "come back later".
- **Limit:** following a finding through to care is a person's work. It means knowing the donor's history, explaining in their language, booking the next step and chasing it. Blood centres can't staff that, and letters fail: 0 replies from 235 in Delhi.
- **10x:** from a third of findings followed up to every finding followed through. The agent does the legwork. The doctor approves plans and the counsellor discloses results.
- **Why Gen AI:** the navigator *is* the Gen AI. It reads any record, reasons under ICMR protocols, explains in many languages and acts with tools. Results-only approaches have failed (Japan, Taiwan).

## What's in this folder

| Path | What it is | Use it for |
|---|---|---|
| [01-problem-brief.md](01-problem-brief.md) | The full 10x problem brief (frame-10x-problem skill): problem statement, landscape, the 10x, trust, scorecard | Source of truth for every claim and number |
| **02-pitch/** | | |
| [pitch-deck.html](02-pitch/pitch-deck.html) / [pitch-deck.pdf](02-pitch/pitch-deck.pdf) | 10-slide proposal deck | The submission's proposal PDF. Fill in the placeholders first. |
| [pitch-narrative.md](02-pitch/pitch-narrative.md) | Speaker script, message house, judge Q&A, numbers to keep consistent | Live pitch and finale |
| **03-build/** | | |
| [prototype-spec.md](03-build/prototype-spec.md) | What the demo must prove, scope (must/should/could/won't), user stories with acceptance tests, evaluation harness | Building and testing |
| [architecture.md](03-build/architecture.md) | System design, components, models, ADK approval code, data model, deploy commands, repo layout | Agent and apps leads |
| [protocol-rules.md](03-build/protocol-rules.md) | Fixed clinical rules (ICMR hypertension 2026, ICMR diabetes, CDSCO donor criteria), plus what Gemini may and may not say | Rules lead and the clinical advisor |
| [synthetic-data.md](03-build/synthetic-data.md) | 300 synthetic donors, scripted personas, reports, generator plan | Data lead |
| [build-plan.md](03-build/build-plan.md) | Day-by-day plan (8–18 Oct), roles, risks and fallbacks | Whole team |
| **04-submission/** | | |
| [demo-video-script.md](04-submission/demo-video-script.md) | Shot-by-shot 3-minute script | Recording on 16 Oct |
| [submission-checklist.md](04-submission/submission-checklist.md) | Eligibility, required items, placeholders, quality gates | Submitting on 18 Oct |

## Earlier versions (kept for reference)

[Concept note](../TraceDrop-Concept.md) → [request engine](../tracedrop.md) (fallback build) → [regular donor](../tracedrop-regular-donor.md) → [donor-health framing](../tracedrop-donor-health.md) → this package. All five versions are scored in the [Builder Cup review](../tracedrop-builder-cup-review.md).

## Go / no-go (9–10 Oct)

1. A clinical advisor agrees to review the [protocol rules](03-build/protocol-rules.md) and message templates.
2. Gemini reads the team's own real lab reports at about 85% field accuracy or better, and Hindi and Kannada output rates at least 4 out of 5 with native speakers.

If either fails, build the [request engine](../tracedrop.md) instead. It reuses the same agent skills, has no clinical content, and scores about 82 / 100.

## Data notice

The prototype uses **synthetic data only**. The one exception is the accuracy test, which uses the team's own lab reports with consent and redaction; these are deleted afterwards. It is a demonstration, not a medical device, and it never diagnoses or prescribes.
