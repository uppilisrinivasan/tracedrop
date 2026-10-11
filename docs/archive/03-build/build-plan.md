# Build plan: 8 Oct to 18 Oct 2026

Today is 8 October, so we have 10 days. Teams lock on **11 Oct**. The prototype, video, deck and repo are due **18 Oct**.

## Scope rule (non-negotiable)

1. **High BP (persona Arjun) end to end before anything else.**
2. Then low Hb (persona Meera).
3. Voice and ABHA sharing only if ahead of schedule.
4. No real infection data, ever.
5. If WhatsApp setup slips by 13 Oct, demo on the web chat only.

## Roles (team of 2–4)

| Role | Owns |
|---|---|
| **Agent lead** | ADK agents, prompts, tools, tool confirmation, deploy to Cloud Run |
| **Data and rules lead** | Synthetic generator, report rendering, protocol rules and their tests, FHIR store, evaluation harness |
| **Apps lead** | Firebase donor chat, doctor console, counsellor console, funnel dashboard |
| **Story lead** (can be shared) | Clinical advisor contact, deck, video, README, submission |

## Day by day

| Date | Goal | Done when |
|---|---|---|
| **Thu 8 Oct** | Setup and day-1 tests | GCP project, Gemini API key, Healthcare API FHIR store, Firebase project, repo created. **Gemini reads 3 real report photos and 1 register photo. Hindi and Kannada output quality checked.** Clinical advisor approached. |
| **Fri 9 Oct** | Data and rules | 300 synthetic donors generated and loaded. Protocol rules coded with 100% unit-test pass. 20 reports rendered with ground truth. **Go/no-go:** advisor agreed to review; extraction quality is acceptable. |
| **Sat 10 Oct** | Record builder | Image or PDF → structured JSON with confidence → FHIR Observations. Low-confidence fields questioned back. Evaluation v1 on synthetic reports. |
| **Sun 11 Oct** | Navigator v1 (Arjun) | Deferral event → explanation in Hindi grounded in the trend → plan draft → `book_slot` waits for approval. **Team locked on the H2S portal.** |
| **Mon 12 Oct** | Doctor console and approval loop | Doctor approves in the console → ADK confirmation → booking → follow-up scheduled. Audit log written. **Deploy v1** to Cloud Run and Firebase. |
| **Tue 13 Oct** | Counsellor console, red flags, leak tests | D-017 urgent template with no AI. D-033 in the counsellor queue only. 50-prompt leak test passes with 0 leaks. **WhatsApp on the test number, or decide web-only.** |
| **Wed 14 Oct** | Meera and the funnel | Kannada journey end to end. Firestore → BigQuery funnel. Dashboard shows finding → completed → donated again. Replay mode. |
| **Thu 15 Oct** | Evaluation run and hardening | All metrics in [prototype-spec.md](prototype-spec.md) §5 produced and saved to `eval/results.json`. Error paths covered: low confidence, missing data, API timeout. Voice if ahead. |
| **Fri 16 Oct** | Video and deck | 3-minute video recorded from the [script](../04-submission/demo-video-script.md). Deck exported to PDF with the real numbers filled in. Architecture diagram exported. |
| **Sat 17 Oct** | Buffer | Fix whatever broke. Rehearse the live demo. README and repo cleaned up, with a synthetic-data notice. |
| **Sun 18 Oct** | Submit | Deployed link, video link (public), GitHub repo (public), deck PDF, theme stated. Everything in English. Submit before the cutoff. Confirm the cutoff time on the portal. |

## Risks and fallbacks

| Risk | Early sign | Fallback |
|---|---|---|
| No clinical advisor by 10 Oct | No reply | Use the published ICMR and WHO thresholds as-is, cite them on screen, and label the deck "advisor review pending". If confidence is low, switch to the [request engine](../../tracedrop.md) build (no clinical content). |
| Extraction is weak on real reports | <85% field accuracy on day 1 | Narrow to 3 report formats. Show the low-confidence "ask back" as a feature. Report the honest number. |
| ADK tool confirmation is unstable (experimental) | Lost sessions or no resume | Model approval as plan state in Firestore. The tool checks `plan.status == "approved"`. |
| WhatsApp setup or template approval delays | Not working by 13 Oct | Demo on web chat. Show one WhatsApp screenshot from the test number if available. |
| Indian-language quality | Native speaker rates below 4/5 | Use English plus Hindi for the demo. Keep Kannada for Meera only if it rates well. |
| Live demo on stage fails (finale) | — | Replay mode with recorded data, plus the recorded video |
