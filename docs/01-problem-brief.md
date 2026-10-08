# TraceDrop: what your blood donation finds, followed through to care

**Verdict:** Pursue. This is the build. Gen AI does the work itself rather than wrapping ordinary software. The product *is* the navigator: it does the work a person would otherwise do to carry each donor from a finding to care. India can't staff that work, and letters and SMS fail at it.
**Score:** 32 / 35
**Best-fit theme:** Sustainability & Social Impact ("supporting communities", "more informed and sustainable decisions")
**Framed on:** 2026-10-08
**Package:** [README](README.md) · [pitch deck](02-pitch/pitch-deck.html) · [build spec](03-build/) · [submission kit](04-submission/)
**Lineage:** [concept note](../TraceDrop-Concept.md) → [request engine](../tracedrop.md) → [regular donor](../tracedrop-regular-donor.md) → [donor-health framing](../tracedrop-donor-health.md) → this brief. All earlier versions are scored in the [review](../tracedrop-builder-cup-review.md).

## Advanced problem statement

India's 1.57 crore blood donations a year ([Rajya Sabha Q1882, 2026](https://sansad.in/getFile/annex/271/AU1882_86ur4G.pdf?source=pqars)) make blood centres the country's largest routine health check of healthy working-age adults.

- **What is measured.** Every donor's blood pressure and haemoglobin are measured. Every unit is screened for HIV, hepatitis B and C, syphilis and malaria ([CDSCO](https://www.cdsco.gov.in/opencms/resources/UploadCDSCOWeb/2018/UploadBloodBank/Blood%20Centre%20Division_FAQs.pdf)).
- **What gets found.** Donors above 140/90 are turned away. About 12 lakh a year may be deferred for low haemoglobin (**estimate**). 3.9 lakh units were discarded as reactive in 2025.
- **What happens next.** Very little:
  - At one Kolkata centre, 27.7% of donors with hepatitis B reached treatment, and only 15% of those with hepatitis C were even contacted ([2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11664039/)).
  - Across 16 Indian studies, a third of reactive donors reached counselling ([2024](https://pubmed.ncbi.nlm.nih.gov/38157224/)).
  - Deferred donors hear "come back later".
  - Donors who pass take nothing home, though only 29% of Indian adults with raised BP know they have it ([ICMR-NCDIR](https://www.ncdirindia.org/nnms/resources/Chapter_4_4_2.pdf)).
- **The care already exists, much of it free:** Ayushman Arogya Mandir health centres, eSanjeevani teleconsultations, free hepatitis treatment under NVHCP, and ABHA records.
- **What's missing.** Nothing carries the donor from the finding to that care. Results alone don't do it. Japan has sent donors their results since 1982, and Taiwan found "limited benefits… without additional interventions" ([2025](https://pubmed.ncbi.nlm.nih.gov/39414251/)).

**Why the limit existed.** Following someone up is a person's work: know the donor's history, explain why the finding matters to them in their language, book the next step and chase it until it's done. Blood centres can't staff a navigator for every finding.

**How Gen AI removes it.** Gen AI does the navigator's work, with the counsellor and doctor supervising. The donation cycle gives a natural check-in every 3–4 months. That delivers the blood centre's promise ("we look after our donors") 10x better on **continuity**: from a third of findings followed up to every finding followed through.

## Pitch line

> Today, India's blood centres promise donors a health check every time they give, about 1.5 crore times a year. The experience falls short because what the check finds is rarely followed up: two in three donors with a positive infection screen never reach counselling, and a high blood-pressure reading just means "come back later". With Gen AI we remove that limit and deliver the same promise 10x better.

**Tagline:** *Every donation is a health check. TraceDrop makes sure it counts.*

---

## 1. The idea as given

- **Original idea:** Turn the TraceDrop work into a 10x idea that can be built and shown as a prototype for H2S. Purpose across every round:
  - make individuals regular donors, with visible personal impact
  - give donors regular health results
  - connect donors, the health sector and labs
  - give the donor the biggest share of the benefit
  - make Gen AI the solution rather than a wrapper
- **Input type:** Solution idea, traced back to a pain point.
- **Traced back to the problem:** A donor hires a blood centre for more than the act of giving: "look after me while I look after someone else." Blood centres already do half of this: they measure, screen and find. They don't follow up. That broken half is the problem.

**What carries over from the earlier versions**
- Regular donors stay the goal. A deferred donor who reaches care and is cleared comes back. A donor whose donation brings real health value has a reason to return.
- The request engine and the personal impact statement go on the roadmap, along with company camps that bring donors in and fund their health follow-up. They aren't in the 18 October build.

**What changed, and why**
- **The earlier cores were conventional software:** matching, reminders, booking, points.
- **Report explainers are a commodity now.** Aarogya Setu 2.0 launched OCR "Smart Reports" with AI biomarker trends on 29 June 2026 ([PIB](https://static.pib.gov.in/WriteReadData/specificdocs/documents/2026/jul/doc202676912801.pdf)).
- **The new problem needs persistent, personal, multilingual follow-up across months**, shaped by each donor's history. That's the work Gen AI does.

## 2. Person in a moment

**Chosen framing:**
> When the nurse at my office blood camp says "your BP is 148/94, you can't donate today, come back later", I want to know if I should worry and what to do. But nobody explains it, nobody tells me my BP has gone up at each of my last three donations, and with no symptoms I forget about it until it becomes a problem.

**Who:** Arjun, 34, a software engineer in Bengaluru. He gives at office camps and never sees a doctor. His father had a stroke at 58.

**Why this one:**
- BP is measured for every donor at every donation (CDSCO: systolic 100–140, diastolic 60–90).
- 35.5% of Indian adults have hypertension ([ICMR-INDIAB 2023](https://pubmed.ncbi.nlm.nih.gov/37301218/)), and only 29.2% of those aged 30–69 know it.
- ICMR's workflow calls hypertension a "SILENT KILLER". A screening reading "may count as the first reading" towards a diagnosis, which is confirmed by a second ≥140/90 on another visit ([ICMR STW, May 2026](https://www.icmr.gov.in/icmrobject/uploads/STWs/1778941063_hypertensioninadults_final.pdf)). So a donation reading is a real first step, and the next step is clear.
- It shows the whole loop without the sensitivity of an infection result.

**Alternatives considered:**
- **Meera, 26, deferred for haemoglobin 11.8.**
  - 57% of Indian women are anaemic ([NFHS-5](https://sansad.in/getFile/loksabhaquestions/annex/184/AU787_fRoZaf.pdf?source=pqals)), and 53.5% of women who came to donate in Pune were deferred ([2010](https://pmc.ncbi.nlm.nih.gov/articles/PMC2937288/)).
  - Free testing and iron are available under Anaemia Mukt Bharat.
  - She is persona 2 in the build.
- **A donor whose hepatitis C screen was reactive** and who missed the counsellor's single call.
  - This has the highest stakes, since hepatitis C is curable and treatment is free under NVHCP, and the lowest follow-up.
  - Here the counsellor discloses the result. The agent's job is to get the donor to that conversation, then through the care pathway. This is persona 3: the counsellor's queue, using synthetic data only.
- **Lakshmi, the blood-centre counsellor**, with 40 reactive donors to reach this week by phone and letter. She is the operator.

## 3. What they use today

- **Products and services:**
  - **At the blood centre:** the screening, the donor card, and a counsellor's call or letter for reactive donors. Since 2020, centres must have a counselling area, and centres that run camps must have counsellors ([GSR 166(E)](https://cdsco.gov.in/opencms/export/sites/CDSCO_WEB/Pdf-documents/biologicals/Blood_products/Guidelines_for_blood_bank-merged-with-GSR-166E-dated-11.03.2020.pdf)).
  - **From employers and insurers:** company and insurer check-ups.
  - **Health-record apps:** Aarogya Setu 2.0 and Eka Care.
  - **Public care:**
    - Ayushman Arogya Mandirs: 1.8 lakh centres screening adults over 30 ([RS 2025](https://sansad.in/getFile/annex/269/AU1074_42YtZn.pdf?source=pqars)).
    - eSanjeevani: 50 crore teleconsultations, 2.5–3 lakh a day, in 15 languages ([News on AIR](https://newsonair.gov.in/esanjeevani-achieves-milestone-of-50-cr-teleconsultations-from-across-the-country/)).
    - NVHCP: free hepatitis B and C diagnosis and treatment since 2018 ([NVHCP](https://cdnbbsr.s3waas.gov.in/s31177967c7957072da3dc1db4ceb30e7a/uploads/2023/04/2023041934.pdf)).
- **Workarounds:**
  - "come back later"
  - Googling "is 148/94 high"
  - asking a doctor friend
  - waiting for symptoms
- **Giving up:** This is the main competitor.
  - In Andhra Pradesh, only 6% of high-risk people who were followed up got a confirmatory test. The reasons were "no symptoms" (52%) and not seeing risk as a reason to act (41%) ([UDAY 2018](https://doi.org/10.1080/16549716.2017.1416744)).
  - In Delhi, letters to 235 reactive donors drew **zero** replies ([AJTS 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4339925/)).

## 4. Market size

- **People affected:**

  | Group | Size | Note |
  |---|---|---|
  | Donations | 1.57 crore in 2025 | Every donor is measured |
  | Units discarded as reactive | 3.9 lakh (2025) | |
  | Low-haemoglobin deferrals | about 12 lakh a year | **estimate**, [Ghosh 2026](https://jhas-bsh.com/burden-of-anemia-in-india-should-hematologists-and-transfusion-medicine-experts-be-mere-spectators/) |
  | Hepatitis B reactive | about 1.4 lakh a year | **estimate**, from a pooled rate of 0.91% ([Vox Sang 2025](https://pubmed.ncbi.nlm.nih.gov/40887104/)) |
  | Hepatitis C reactive | about 44,000 a year | **estimate**, from a pooled rate of 0.28% (same source) |
  | High-BP deferrals | not published | |
- **Who donors are drawn from:** working-age adults.
  - Hypertension 35.5%, diabetes 11.4%, prediabetes 15.3% (ICMR-INDIAB).
  - Only 26.3% of 30–69-year-olds have ever had their glucose measured.
- **Frequency:** every donation, every 3–4 months for regular donors, plus every deferral and every reactive screen.
- **Pain:** usually silent but high-stakes (stroke, kidney disease, liver disease). Hepatitis C is curable, so every donor who is never contacted is a cure missed. Deferral without explanation also drives donors away: deferred first-time donors return at about half the rate of others ([Custer 2007](https://pubmed.ncbi.nlm.nih.gov/17655597/)).
- **Badly served or left out:**
  - **Urban working adults.** Public screening reaches people who walk in.
  - **Adult men with anaemia.** Anaemia Mukt Bharat doesn't cover them.
  - **Women,** who are deferred most.
  - **Anyone outside English, Hindi or office hours.**
- **Payers that already exist:**
  - **Blood centres and State Blood Transfusion Councils (SBTCs),** for their counselling duties.
  - **NVHCP,** which says people found positive at blood banks should be linked to care.
  - **Employers,** through the OSH Code's annual check-ups (in force 21 Nov 2025; the draft rules cover workers aged 40+).
  - **Insurers,** under IRDAI's wellness rules ([2020](https://static.investindia.gov.in/s3fs-public/2022-09/Guidelines%20on%20Wellness%20and%20Preventive%20Features%20-%2004092020.pdf)).
- **Starting group of users:** donors deferred for high BP or low haemoglobin at 2–3 Bengaluru blood centres that run company camps.
- **Path to the full market:**
  1. Every finding type, including reactive screens through the counsellor.
  2. Every donor, through trends over time.
  3. Company check-ups and insurer wellness.
  4. SBTCs and NHM.
  5. Other JAPAC countries: Japan returns results, Taiwan screens and Singapore rewards donors, but none navigates them to care.

## 5. Landscape of existing solutions

| Solution | Promise to the donor | Where the experience breaks | Who it leaves out | Limit behind the gap | Source |
|---|---|---|---|---|---|
| **Indian blood centres** (counsellors, calls, letters) | Confidential notification and referral; a "mini health check" | 71.2% of reactive donors notified, 33.3% counselled. Letters: 0 replies out of 235. Hepatitis B: 27.7% reached care. Hepatitis C: 15% contacted. No pathway for low Hb or high BP. | Most reactive donors; all deferred donors; everyone who passes | Counsellor hours, one language, one attempt | [16-study review](https://pubmed.ncbi.nlm.nih.gov/38157224/), [Kolkata](https://pmc.ncbi.nlm.nih.gov/articles/PMC11664039/), [Hyderabad](https://pmc.ncbi.nlm.nih.gov/articles/PMC8628240/) |
| **Japan: Red Cross, Love Blood app** | 15 blood values after each donation, since 1982 | Reference ranges are "not normal/abnormal judgements"; there's no navigation | Donors who don't know what to do with a value | Designed only to return results | [JRC](https://www.bs.jrc.or.jp/ktks/tokyo/donation/m2_02_03_index4.html) |
| **Taiwan: donor screening for over-40s** (HbA1c, cholesterol) | New hyperglycaemia found in 1.6% of donors | 42.7% didn't know they'd been screened; "limited benefits… without additional interventions" | Donors who need a next step | No follow-up intervention | [Vox Sang 2025](https://pubmed.ncbi.nlm.nih.gov/39414251/) |
| **US: NY Blood Center CVD screen; American Red Cross A1C** | Health information for donors | 15% had new risk factors found; only 21% sought care 60 days later | Most of those flagged | Results without navigation | [Transfusion 2012](https://pubmed.ncbi.nlm.nih.gov/22320854/) |
| **India's public screening** (NP-NCD, Ayushman Arogya Mandirs) | Free screening and treatment for adults over 30 | 38.8 crore diabetes screenings but 2.84 crore people on treatment; UDAY: 6% confirmatory | Urban workers; people without symptoms | Frontline workers' time | [RS 2025](https://sansad.in/getFile/annex/268/AU1851_L4l50V.pdf?source=pqars), [UDAY](https://doi.org/10.1080/16549716.2017.1416744) |
| **Digital health stack** (ABHA, Aarogya Setu 2.0, eSanjeevani) | Records, AI trends, teleconsultations | 92 crore ABHA IDs, but only 491 labs on ABDM versus 27,283 hospitals. Trends with nobody acting on them, and no link to blood donation. | People who don't know a trend matters | Infrastructure without a navigator | [PIB, Jul 2026](https://static.pib.gov.in/WriteReadData/specificdocs/documents/2026/jul/doc202676912801.pdf) |

**Reading the landscape:** Every piece exists:

- **Measurement:** blood centres, 1.57 crore times a year
- **Results:** Japan, since 1982
- **Records:** ABHA
- **Free confirmation and treatment:** Ayushman Arogya Mandirs, under the national free diagnostics scheme (FDSI), and NVHCP
- **Teleconsultation:** eSanjeevani
- **Payers:** the OSH Code and insurers

**The one missing piece is the navigator from the finding to the care.** Every study above breaks at that link. We found no Google hackathon winner that navigates people from a screening result to care.

## 6. The gap and the limit behind it

- **Main gap:** findings at the blood centre aren't followed through.
- **Gap type:** **Technical.** The care, the infrastructure and the duty all exist; follow-up capacity doesn't. Deliberate constraints shape the design:
  1. **AI may not counsel or prescribe.** Only a registered medical practitioner can ([Telemedicine Practice Guidelines 2020 §5.4](https://nhm.assam.gov.in/sites/default/files/swf_utility_folder/departments/nhm_lipl_in_oid_6/portlet/level_2/telemedicine_260320.pdf)).
  2. **Screening or alerting software is a regulated medical device** ([CDSCO MDSW guidance, Jul 2026](https://www.cdsco.gov.in/opencms/export/sites/CDSCO_WEB/Pdf-documents/Guidance-document-on-Medical-Device-Software-under-MDR-2017.pdf)).
  3. **Only a counsellor discloses infection results,** with the donor's prior consent.
  4. **No inducements** (Rule 122EA). Care must never be a reason to donate.
  5. **DPDP consent.** Employers see only aggregates. Insurers need the donor's express consent for each share.
- **Limit before Gen AI:** **Support depended on staff hours, and interfaces assumed literacy and one language.**
  - One finding followed up properly means reaching the donor, explaining, booking and chasing, for weeks, in their language.
  - Letters fail (0 replies out of 235). Counsellors reach about a third. Frontline workers don't reach urban working adults.
- **"Top 1% for everyone" pattern:** Applies. Executives get a physician who reviews every result and a coordinator who books every follow-up. Gen AI gives every donor that navigator, supervised by the centre's counsellor and doctor.

## 7. The 10x thesis

- **Primary dimension:** Continuity (starts from zero every time → remembers the person)
- **From:**
  - About 1 in 3 reactive donors reach counselling.
  - About 1 in 7 donors with hepatitis C were contacted (Kolkata).
  - No deferred donor gets a care pathway, and no donor who passes gets their trend.
  - Each donation starts from zero.
- **To:**
  - Every finding gets a same-day explanation in the donor's language, with why it matters to them.
  - A next step is booked at free public care or their own doctor.
  - A human handles every conversation that needs one.
  - The agent chases until the step is done, then checks back at the next donation.
- **Measure:**

  | Measure | Today | Target | Where measured |
  |---|---|---|---|
  | Findings with a completed next step | about 1 in 3 for reactive; about 0 for deferrals | at least 2 in 3 | Pilot |
  | Time from finding to a booked next step | weeks, or never | same day | Prototype |
  | Donors one counsellor can actively follow | tens | thousands (**estimate**) | Prototype: the agent does the legwork |
  | Donors who leave knowing what their numbers mean and what to do | about none | all | Prototype |
- **By-product gains:**
  - **Confidence:** the donor knows the next step and why.
  - **Proactivity:** the system acts on what it finds.
  - **Blood supply:** cleared donors come back, and each donation becomes a check-in worth returning for.

## 8. The promise we build on

- **What the existing system is trying to give the donor:**
  - WHO/IFRC list "regular health checks and referral for medical care" as a donor benefit ([2010](https://www.ncbi.nlm.nih.gov/books/NBK305666/), search summary).
  - NVHCP says people found positive at blood banks should be linked to care.
  - ICMR says all adults should have their BP measured, and that a screening reading counts as a first reading.
  - Blood centres promise a mini health check.
- **How the 10x delivers that same promise better:**
  - It adds no new service and no new test. It connects what already exists: the centre's measurements and duties, and the care the state already pays for.
  - The counsellor and the doctor stay in charge; the agent does the legwork.
  - This is augmentation in our methodology's sense. It takes friction off the counsellor and makes the core work, the human conversation, reach every donor.
- **Delivery routes:**
  - **Through enterprises:** blood centres and SBTCs run it; employers and insurers fund it.
  - **Direct to donors:** on WhatsApp and by voice, with nothing to install.
- **Connects to existing systems and channels:**
  - the centre's donor records (an export in a pilot)
  - WhatsApp
  - ABHA, through the consent manager
  - Ayushman Arogya Mandirs and eSanjeevani
  - NVHCP treatment centres
  - the donor's own reports

## 9. Why Gen AI: the navigator is the Gen AI

| The navigator's work | Without Gen AI it takes… | With Gen AI |
|---|---|---|
| **Capture:** one record of the donor's readings and reports | An integration with every centre and lab (only 491 labs are on ABDM), or manual entry | Reads registers, PDFs and photos from any source and writes standard FHIR records, with no integration |
| **Understand:** what this finding means for *this* person | A doctor's time to read history, trends, family history and medicines | Reasons over the whole record against ICMR workflows; safety thresholds stay as fixed rules |
| **Explain:** why it matters, in their language | A counsellor who speaks it (letters got 0 replies out of 235) | Answers in many Indian languages, and by voice. Answers "but I have no symptoms" with the donor's own trend and family history. |
| **Act:** book, refer, chase | A care coordinator | Tools: find the nearest health centre (Maps), book, set up an eSanjeevani consult, share to ABHA, follow up |
| **Supervise:** humans decide what matters | The counsellor or doctor handles every case | The doctor approves AI-drafted plans in batches. The counsellor holds only disclosure conversations, while the agent schedules and follows up. |

- **Remove-Gemini test:** **Pass, strongly.** Without Gemini, the alternatives are known failures:
  - results sheets (Japan, Taiwan): "limited benefits"
  - letters and SMS: 0 replies out of 235
  - human navigators: proven, but India can't staff them

  **Staffing estimate**, with assumptions shown:
  - **Without the navigator:** 3.9 lakh reactive screens × 2 h, 12 lakh deferrals × 30 min, and a 10-minute review of every donation come to about 40 lakh hours a year, or about 2,000 full-time staff.
  - **With the navigator:** humans spend about 45 minutes per disclosure and about 1 minute per approval, about 3.3 lakh hours, or about 160 staff.

  Matching, thresholds and scheduling stay ordinary code, which is the right choice for safety.
- **What the model does:**
  - **Perceive:** register photos, report photos and PDFs, voice
  - **Understand:** values, units and reference ranges across labs, and the donor's history
  - **Reason:** what matters, and what the protocol says next
  - **Generate:** explanations, doctor summaries, and counselling bookings that never reveal a result
  - **Remember:** every finding, step and check-in
  - **Act as an agent:** book, chase, share and close
- **Google strengths needed:**
  - Gemini 3.8 Flash for multimodal input and long context
  - Gemini 3.8 Live for voice, in many Indian languages
  - ADK, multi-agent, with tool confirmation for human approvals
  - Cloud Healthcare API FHIR store
  - Maps Platform, Firebase, Cloud Run and BigQuery
- **Build and deploy fit:**
  - ADK agents on Cloud Run.
  - Records in a Healthcare API FHIR store.
  - Donor app, counsellor console and doctor console on Firebase.
  - WhatsApp through the Cloud API test number, with a web fallback.
  - Details in [03-build/](03-build/).

## 10. Trust and responsibility

- **Grounding and sources:**
  - Every explanation follows an approved protocol, which for the build is the ICMR hypertension and diabetes workflows plus WHO and Anaemia Mukt Bharat haemoglobin guidance.
  - Every explanation quotes the reading and its reference range.
  - Thresholds are fixed rules set by the medical advisor. Gemini explains and navigates; it doesn't diagnose.
- **Privacy and data handling:**
  - **Infection results never appear in any message.** The agent only books "a confidential conversation about your donation".
  - The donor gives opt-in consent at donation. Donor forms already ask whether they want to be told about abnormal results.
  - Records live in the donor's ABHA, shared through the consent manager.
  - Employers see aggregates only, for groups of 20 or more. Insurers get nothing without the donor's express consent for each share.
  - The prototype uses **synthetic data only**, plus the team's own consented lab reports for the accuracy test.
- **What it won't do:**
  - counsel or prescribe
  - disclose infection results
  - offer anything as a reward for donating
  - make care depend on donating; deferred donors get the same navigation
  - market itself as "get tested"
- **When a human steps in:**
  - **Every** infection result goes to the counsellor.
  - Every plan goes to the doctor for batch approval.
  - The donor can ask for a person at any time.
- **When the model is wrong:**
  - Low-confidence readings are confirmed with the donor or the centre.
  - Fixed rules catch red flags. ICMR's workflow defines urgency as ≥180/120 without symptoms, and the same reading with symptoms such as chest pain, breathlessness or sudden weakness as an emergency. These trigger a same-day referral, or emergency guidance, without any AI judgment.
  - Every action is logged for audit.
- **Regulation:**
  - The prototype is a demonstration.
  - A deployment would register as medical device software with CDSCO: Class A if it informs, Class B if it drives clinical management.
  - It would follow ICMR's 2023 AI ethics guidelines: human oversight, audits, ethics committee review.
- **Guarding against test-seeking:**
  - Care is never sold as a reason to donate.
  - Infection tests are never offered as a benefit.
  - A pilot would track discard rates ([Tanzania 2026](https://pubmed.ncbi.nlm.nih.gov/42101332/)).

## 11. Solution direction

A navigator that works for the blood centre, in five parts:

1. **Record builder:** readings and shared reports become FHIR records.
2. **Finding triage:** fixed rules and protocols decide what needs a next step, and how urgently.
3. **Navigator:** explains, books, chases and checks back at the next donation.
4. **Counsellor and doctor console:** a disclosure queue, batch approvals and an audit trail.
5. **Blood-supply link:** cleared donors are welcomed back. On the roadmap, the request engine asks them when their blood group is needed.

**Who pays:** blood centres and SBTCs (counselling and NVHCP duties), employers (OSH check-ups and wellness) and insurers (wellness, with consent). The donor pays nothing.

## 12. Demo moment and smallest build

- **First 30 seconds of the video:**
  - **Today (8 s):**
    - Arjun is turned away at his office camp: "BP 148/94. Not today."
    - The centre had recorded 128/82, 134/86 and 138/88 at his last three donations, and nobody joined the dots.
    - He has no symptoms, so he forgets. His father had a stroke at 58.
  - **With TraceDrop (22 s):**
    - That evening a WhatsApp message arrives in Hindi: "Your BP was 148/94 today. It has gone up at each of your last four donations. High BP usually has no symptoms, which is why it matters."
    - He sends a photo of last year's company check-up. Gemini reads HbA1c 6.1%, which is in the prediabetes range (5.7–6.4%), and adds his father's history.
    - The summary reaches the centre's doctor, who approves it in 15 seconds.
    - The agent books a free BP and sugar check at the Ayushman Arogya Mandir near his home on Saturday, and adds the summary to his ABHA record.
    - It chases.
    - Three months later he's under care, the doctor clears him, and he donates again.
  - **Later beat:** the counsellor's console. "14 donors need a confidential conversation. The agent has reached 11 and booked them in. You have 3 left to call."
- **Smallest deployable version:** see [03-build/prototype-spec.md](03-build/prototype-spec.md).
  - **Data:** 300 synthetic donors with histories across 3 centres. High BP is built first and end to end; low haemoglobin second. Reactive flags are synthetic and appear only in the counsellor's queue.
  - **Record builder:** reads synthetic registers and the team's own consented reports.
  - **Navigator:** WhatsApp and web, in Hindi, Kannada and English.
  - **Bookings:** a mock schedule for Ayushman Arogya Mandirs and eSanjeevani.
  - **Consoles:** counsellor and doctor.
  - **Back end:** a FHIR store and a BigQuery funnel.
- **Data needed:**
  - **Public:** protocols, facility locations and the CDSCO criteria.
  - **Synthetic:** donors, registers and reactive flags.
  - **The team's own:** real lab reports, with consent and redaction, for measuring reading accuracy.

## 13. Scorecard

| Dimension | Score (1–5) | Reason |
|---|---|---|
| Reach | 4 | Every donor (1.57 crore donations a year) and lakhs of findings. The group donors come from is working-age adults across South Asia and JAPAC. Direct reach is donors. |
| Frequency and pain | 4 | Every donation and every deferral. Silent but high-stakes (stroke, liver disease). Hepatitis C is curable, so a missed contact is a missed cure. |
| Gap | 5 | Badly served: a third of reactive donors are counselled, deferred donors get no pathway, and donors who pass get nothing. |
| Gen AI unlock | 5 | Persistent, personal, multilingual follow-up of every finding, shaped by each donor's history, was never feasible at this scale. Letters: 0 replies out of 235. Counsellors reach a third. |
| 10x clarity | 4 | "From a third of findings followed up to every finding followed through." Workload and time-to-next-step show in the prototype. Outcomes need a pilot. |
| Buildability | 5 | Public protocols, synthetic donors and the team's own reports. No partner needed for the prototype. The scope rule in the [build plan](03-build/build-plan.md) makes a deployed slice achievable by 18 October. |
| Demo-ability | 5 | A dead-end deferral becomes a trend, an approval, a booked check and a return to donating. Obvious within 30 seconds. |
| **Total** | **32 / 35** | Earlier framing scored 31; Buildability rose from 4 to 5 once the build spec and the scope rule were fixed. |

## 14. Fit with the judging criteria

| Criterion | Weight | How this problem scores (guide method: 0–10) |
|---|---|---|
| Technical Merit & Gen AI Implementation | 40% | **9.0.** Gen AI is the navigator: records from any source, reasoning under protocols, multilingual voice, and tools that act, with ADK tool confirmation for the doctor's approval. Healthcare API FHIR, Maps, Firebase, BigQuery, Cloud Run. |
| Problem Alignment & Impact | 25% | **9.0.** National scale, every baseline sourced, free public care reused. |
| Innovation & Creativity | 25% | **8.5.** "Found, then lost" is a fresh frame. A navigator, not an explainer. The donation cycle as a recurring follow-up loop. The counsellor augmented, not bypassed. |
| User Experience & Solution Design | 10% | **8.5.** One donor journey on WhatsApp. Consoles take a few taps. |
| **Weighted** | | **≈ 88 / 100.** Realistic range 82–90; see the [review](../tracedrop-builder-cup-review.md). |

**Who benefits beyond the business:**
- donors' health
- women with anaemia, and men, who are outside Anaemia Mukt Bharat
- people with hepatitis, who can be cured
- blood centres, which keep donors and meet their duties
- India's hepatitis elimination and NCD goals
- patients, through more regular donors

## 15. Reshapes

The verdict is Pursue. Keep:

1. **Lead with high BP.** It's common, measured for everyone, and not sensitive. Infection linkage stays in the counsellor's console only.
2. **Never sell free tests.** Follow up on what's already measured, and route to care that's already free.
3. **Keep the human roles visible.** The counsellor discloses, the doctor approves, and the agent navigates. That's what the rules require, and it's what makes augmentation obvious to judges.

## 16. Open questions and things to verify

- **Clinical advisor.** Who approves the protocol rules, the red-flag thresholds and the message templates? **This is needed by 9–10 October.**
- **High-BP deferrals.** How many donors are deferred for high BP, and are they told anything? There's no national figure.
- **Donating again on treatment.** Can donors on stable BP medicine donate again under NBTC 2017? The demo says "the doctor clears him" to avoid claiming it.
- **Pilot data.** Can a pilot centre export donor readings? What does eRaktKosh's donor login show?
- **Consent wording.** What wording covers booking counselling without revealing the result (NACO counselling guidelines)?
- **CDSCO class** for a deployment.
- **Third-party bookings.** Can Ayushman Arogya Mandirs and eSanjeevani take them? eSanjeevani is described as free in government material. The patient guide confirms OTP registration by mobile but has no explicit "free" line.
- **Search-summary claims.** Ghosh's 12 lakh low-Hb deferrals and the WHO/IFRC wording came from search summaries.
- **Haemoglobin thresholds.** Confirm the advisor's choice: WHO 2024 or national.
- **Staffing estimate.** Refine the §9 assumptions with a counsellor.
