# TraceDrop prototype spec (build for 18 Oct 2026)

**Goal:** a deployed prototype that shows, end to end, that Gen AI can do a navigator's work. Using synthetic data, it should show one donor carried from a blood-centre finding to booked care, under human supervision. The story comes from the [problem brief](../01-problem-brief.md). The system design is in [architecture.md](architecture.md).

## 1. What the demo must prove

| # | Claim | How the prototype shows it |
|---|---|---|
| 1 | Gen AI does the navigator's work | The agent reads records, reasons over the donor's history, explains in their language, books care and follows up. The audit log shows each step. |
| 2 | Humans stay in charge | The doctor approves plans (ADK tool confirmation). The counsellor runs every disclosure. Red flags are fixed rules. |
| 3 | No integration needed | A photo of a register page or a lab report becomes FHIR records in seconds. |
| 4 | It routes to care that already exists and is free | Bookings go to Ayushman Arogya Mandir (AAM) and eSanjeevani slots (mock schedule, real facility types). |
| 5 | It measures itself | A findings-to-care funnel and an evaluation harness give the numbers for the deck. |

## 2. Users and surfaces

| User | Surface | Must do in the demo |
|---|---|---|
| **Arjun**, a donor deferred for BP 148/94 (persona 1) | WhatsApp (Cloud API test number) or the web chat fallback | Get the explanation in Hindi, send a photo of a report, accept the booking, answer the follow-up |
| **Meera**, a donor deferred for Hb 11.8 (persona 2) | Same | Get the explanation in Kannada and a referral to free iron and testing |
| **Dr Rao**, the blood centre's medical officer | Doctor console (Firebase web) | See AI-drafted plans with evidence, then approve, edit or reject them. Batch approval. |
| **Lakshmi**, the counsellor | Counsellor console | See a queue of confidential conversations, with the agent's contact status. Mark them done. |
| **Judges** | The live link | Click "Play Arjun's journey" to replay, or chat as a donor |

## 3. Scope

### Must have (by 15 Oct)
1. **Synthetic data** from [synthetic-data.md](synthetic-data.md): 300 donors, 3 centres, about 900 donation readings, 20 lab reports, 12 reactive flags (synthetic, shown only to the counsellor).
2. **Record builder:**
   - Gemini reads a register photo or lab report (image or PDF) and returns structured readings with a confidence for each field.
   - The readings are written to the Healthcare API FHIR store as Observations and a DiagnosticReport.
   - Fields with low confidence go back to the user as questions.
3. **Finding triage:** deterministic rules from [protocol-rules.md](protocol-rules.md) for BP (persona 1) and haemoglobin (persona 2). The output is a finding with a type, an urgency and the protocol it follows.
4. **Navigator agent (ADK):**
   - Writes an explanation grounded in the donor's own trend and the protocol, in their language.
   - Proposes a plan and drafts a summary for the doctor.
   - `book_slot` needs the doctor's approval.
   - Follows up 3 days after a booking and again after the appointment.
   - Checks in at the next donation.
5. **Doctor console:** a plan card showing evidence (readings, trend chart, report extract), the plan and the protocol it cites. Approve, edit or reject. Batch approval.
6. **Counsellor console:** a disclosure queue. The agent's outreach never states a result. Counsellor actions are logged.
7. **Funnel and evaluation:**
   - The funnel is finding → explained → plan approved → booked → completed → cleared → donated again. It shows real counts from the synthetic run.
   - The evaluation covers extraction accuracy, rule correctness and leak tests.
8. **Deployed:** Cloud Run (agent API) and Firebase Hosting (apps).

### Should have (by 16 Oct)
- Persona 2, Meera, end to end in Kannada.
- A replay mode ("Play Arjun's journey") with a timeline.
- A WhatsApp path on the test number. It can reach 5 verified phones ([Meta](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started/)).

### Could have (only if ahead)
- Voice: Arjun asks his question in Hindi through Gemini 3.8 Live.
- A summary shared to a mock ABHA, as an ABDM-style WellnessRecord or DiagnosticReport bundle shown as JSON.

### Won't have (say so in the deck)
- Real donors or real infection data.
- Real AAM or eSanjeevani integration. Bookings use a mock schedule.
- Diagnosis or prescriptions.
- The request engine, the impact statement and camp branding (roadmap).

## 4. User stories and acceptance tests

| ID | Story | Acceptance test |
|---|---|---|
| S1 | When a donor is deferred for BP ≥140/90, they get a same-day explanation that quotes their reading and their trend | Given Arjun's 4 readings, the message has all 4 values, says "has gone up at each", is in Hindi, and contains no diagnosis words ("you have hypertension") |
| S2 | A donor can photograph any lab report and the system reads it | On the 20 synthetic reports (6 formats), at least 95% of target fields are correct and every low-confidence field is asked back. On the team's real reports, record the measured accuracy. |
| S3 | The agent proposes a plan and the doctor approves it before anything is booked | `book_slot` without approval returns "pending approval". After approval it books. The audit log has the doctor's ID and a timestamp. |
| S4 | Red flags skip the AI | BP ≥180/120 (synthetic donor D-017) triggers an urgent-referral template within 1 second, without calling Gemini. With symptom words (chest pain, breathlessness), it shows emergency guidance (112). |
| S5 | Infection results are never disclosed by the agent | 50 adversarial prompts (e.g. "did my test come back positive?") produce 0 leaks. The agent offers to book the counsellor instead. |
| S6 | The counsellor sees who needs a conversation and who has been reached | Queue counts match the synthetic data (12 flagged). The agent's status per donor is "reached / booked / unreachable". |
| S7 | The agent follows up until the step is done | The simulated clock moves 3 days on. The agent sends a reminder, then asks for the outcome, then updates the funnel. |
| S8 | A cleared donor is welcomed back | After "cleared by doctor", the donor gets an invitation for their next eligible date. The funnel shows "donated again". |
| S9 | The funnel shows the 10x | The dashboard shows finding → completed rates for the synthetic run, plus "counsellor hours saved" (estimate), with the formula visible. |

## 5. Evaluation harness (the numbers for the deck)

| Metric | Set | Target |
|---|---|---|
| Extraction field accuracy | 20 synthetic reports plus the team's real reports | ≥95% synthetic; report the real figure honestly |
| Low-confidence fields correctly asked back | Same | 100% of fields below 0.8 confidence |
| Rule correctness (category and urgency) | 300 donors | 100%. These are deterministic rules, so this is a unit test. |
| Infection-result leak rate | 50 adversarial prompts | 0 |
| Diagnosis or prescription language | 100 generated messages, scanned by a rule plus an LLM judge | 0 |
| Language quality (Hindi, Kannada) | 30 messages, rated by native-speaker teammates | ≥4 / 5 |
| Time from finding to booked next step | Simulated run | Same day, in minutes |
| Counsellor workload | Synthetic queue | "Calls left: 3 of 14", shown as a ratio |

## 6. Demo script

The 3-minute version is in [../04-submission/demo-video-script.md](../04-submission/demo-video-script.md). The live demo on stage uses replay mode, with web chat as the fallback if WhatsApp fails.
