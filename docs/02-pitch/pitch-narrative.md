# TraceDrop pitch narrative

**For the deck, the live pitch and the finale Q&A.** It runs in about 3 minutes. Each block maps to a slide in [pitch-deck.html](pitch-deck.html).

## Speaker script

**1. Hook (15 s, slide 1).**
"Every blood donation is a health check. India runs 1.5 crore of them a year, and then throws the results away."

**2. Arjun (25 s, slide 2).**
- "Arjun is 34. At his office blood camp he's turned away: BP 148/94, 'come back later'."
- "The blood centre had measured his BP at his last three donations: 128, 134, 138. It went up every time, and nobody joined the dots."
- "He has no symptoms, so he forgets. His father had a stroke at 58."

**3. It's not one donor, it's the system (30 s, slide 3).**
- "India's blood centres measure every donor's BP and haemoglobin, and screen every unit for infections. They find a lot. Then they lose most of the people they find."
- "At one Kolkata centre, only 15% of donors with hepatitis C were even contacted. Hepatitis C is curable, and the treatment is free."
- "Across 16 studies, two in three reactive donors never reached counselling. In Delhi, 235 letters got zero replies."
- "And only 29% of Indian adults with high BP know they have it."

**4. Why nobody has fixed it (20 s, slide 4).**
- "Japan has sent donors their results since 1982. Taiwan screens older donors. Results alone don't work: Taiwan found 'limited benefits without additional interventions'."
- "What works is a person who follows you up. They know your history, explain in your language, book the next step and keep checking until it's done."
- "India can't staff that for 1.5 crore donations."

**5. TraceDrop (30 s, slides 5–6).**
- "TraceDrop is that navigator, built with Gemini. It reads any register or lab report into one record and reasons over the donor's history using ICMR protocols. Then it explains in their language, books free care at an Ayushman Arogya Mandir or on eSanjeevani, and follows up until the step is done."
- "Humans stay in charge. The centre's doctor approves every plan, the counsellor delivers every sensitive result, and red flags skip the AI entirely."

**6. Demo (30 s, slide 7; live or video).**
- "Arjun gets a Hindi message the same evening with his trend."
- "He sends last year's check-up photo, and Gemini reads HbA1c 6.1."
- "The doctor approves in 15 seconds, and Saturday's free BP and sugar check is booked."
- "Three months later he's under care, cleared, and donating again."

**7. 10x and impact (20 s, slide 8).**
- "From a third of findings followed up to every finding followed through."
- "For the counsellor, from 14 calls to 3."
- "Every next step goes to care the state already pays for. No new tests, no new budget."

**8. Why it scales (15 s, slide 9).**
- "It runs on Google Cloud: ADK agents on Cloud Run, a FHIR store ready for ABHA, Firebase, BigQuery and Maps."
- "Blood centres, employers under the new OSH Code check-ups, and insurers' wellness programmes can all fund it. Donors never pay."

**9. Close (10 s, slide 10).**
"Every donation is a health check. TraceDrop makes sure it counts."

## Message house

| Layer | Message |
|---|---|
| **Headline** | Blood donation finds disease in healthy adults, then loses them. TraceDrop follows every finding through to care. |
| **Pillar 1: the problem is real and national** | 1.57 crore donations a year; 15–28% of hepatitis-positive donors reach care; 29% of adults with high BP know they have it. |
| **Pillar 2: Gen AI does the navigator's work** | Records from any source, reasoning over each donor's history, multilingual, and an agent that books and follows up. Letters and results-only approaches have failed. |
| **Pillar 3: safe by design** | Doctor approval, counsellor disclosure, red flags handled by fixed rules, and protocols cited. |
| **Pillar 4: scales with existing systems** | Free public care, ABHA, eSanjeevani, the OSH Code, insurers. No new budget. |
| **Proof** | A live prototype, extraction accuracy on real reports, 0 leaks in 50 adversarial tests, and a funnel dashboard. |

## Likely judge questions and answers

| Question | Answer |
|---|---|
| **Isn't this just an AI lab-report explainer?** | No. Explainers are commodities (Aarogya Setu 2.0, Eka Care). TraceDrop is a navigator: it acts on what the blood centre already measured, books care, follows up until the step is done, and brings the donor back. The evidence says results alone don't change outcomes. |
| **Is AI giving medical advice?** | No. India's telemedicine guidelines say AI must not counsel or prescribe. The doctor approves every plan and the counsellor delivers every infection result. The agent explains readings against cited protocols, books and follows up. Red flags skip the AI. |
| **Why would a blood centre adopt it?** | Centres already have to counsel and refer reactive donors, and they reach about a third of them. TraceDrop gives each counsellor the reach of a team, and cleared donors come back to give. |
| **Doesn't offering health checks attract risky donors?** | We don't offer new tests or infection testing as a perk. We follow up on what's already measured. Care never depends on donating: deferred donors get the same help. A pilot would track discard rates. |
| **Is this a regulated medical device?** | A deployment would register with CDSCO as medical device software, likely Class A or B under the July 2026 guidance. The prototype is a demonstration using synthetic data. |
| **Where's the data from?** | Synthetic donors, plus our own lab reports (with consent) for the accuracy test. Thresholds come from ICMR's 2026 hypertension workflow, ICMR's diabetes workflow and WHO haemoglobin guidance. |
| **What about privacy?** | Infection results never appear in any agent message. Employers see only aggregates. Records sit in the donor's ABHA under its consent manager. We follow the DPDP Act and ICMR's 2023 AI ethics guidelines. |
| **What's the business model?** | Blood centres and SBTCs (for counselling and NVHCP linkage), employers (OSH Code check-ups), insurers (wellness, with consent). Donors pay nothing. |
| **How does this help blood supply?** | Deferred donors usually drift away. Deferred first-time donors come back at about half the normal rate. TraceDrop gets them to care, cleared and back. On the roadmap, a request engine asks the right donors when their blood group is needed. |
| **Why India, and why JAPAC?** | India is the biggest case: 1.57 crore donations and very low hypertension awareness. Japan returns results, Taiwan screens and Singapore rewards donors, but none of them navigates donors to care, and every blood system has the same gap between finding and care. |

## Numbers to keep consistent

| Number | Use | Source |
|---|---|---|
| 1.57 crore (15.7 million) donations, 2025 | Scale | [Rajya Sabha Q1882, Aug 2026](https://sansad.in/getFile/annex/271/AU1882_86ur4G.pdf?source=pqars) (our sum of the state rows) |
| 3.9 lakh units discarded as reactive, 2025 | Findings | Same annex (our sum) |
| 15% of HCV and 27.7% of HBV donors contacted or linked (Kolkata) | Loss | [Kolkata 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11664039/) |
| 33.3% counselled (16 studies) | Loss | [Vox Sang 2024](https://pubmed.ncbi.nlm.nih.gov/38157224/) |
| 0 replies to 235 letters (Delhi) | Why letters fail | [AJTS 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4339925/) |
| 29.2% of adults aged 30–69 with raised BP know it | Silent disease | [ICMR-NCDIR NNMS](https://www.ncdirindia.org/nnms/resources/Chapter_4_4_2.pdf) |
| 35.5% of adults with hypertension | Burden | [ICMR-INDIAB 2023](https://pubmed.ncbi.nlm.nih.gov/37301218/) |
| 57% of women anaemic | Persona 2 | [NFHS-5 via LS](https://sansad.in/getFile/loksabhaquestions/annex/184/AU787_fRoZaf.pdf?source=pqals) |
| "limited benefits… without additional interventions" | Results alone fail | [Taiwan, Vox Sang 2025](https://pubmed.ncbi.nlm.nih.gov/39414251/) |
| 50 crore eSanjeevani consultations | Care exists | [News on AIR, 6 Oct 2026](https://newsonair.gov.in/esanjeevani-achieves-milestone-of-50-cr-teleconsultations-from-across-the-country/) |
| About 2,000 staff vs about 160 | Why only Gen AI scales | **Estimate**; assumptions in the [brief](../01-problem-brief.md) §9 |
