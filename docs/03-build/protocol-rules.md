# Protocol rules for the prototype (deterministic)

**Status: DRAFT for the clinical advisor to approve.** These rules come from public Indian and WHO guidance, cited below. They run as ordinary code, not as model judgement. Gemini explains them and acts on what they return; it never changes a threshold. Nothing here is medical advice to a real person. The prototype runs on synthetic donors only.

## Sources

- **Donor selection** (CDSCO FAQ): BP must be "Systolic=100-140, diastolic=60-90 mm Hg"; Hb "≥12.5g/dL". Every donor is checked before every donation. [CDSCO](https://www.cdsco.gov.in/opencms/resources/UploadCDSCOWeb/2018/UploadBloodBank/Blood%20Centre%20Division_FAQs.pdf)
- **ICMR Standard Treatment Workflow, Hypertension in Adults (May 2026).** [ICMR STW](https://www.icmr.gov.in/icmrobject/uploads/STWs/1778941063_hypertensioninadults_final.pdf)
  - **Classification:**
    - Normal: <120/<80
    - Elevated: 120–139 and/or 80–89
    - Grade 1: 140–159 and/or 90–99
    - Grade 2: 160–179 and/or 100–109
    - Grade 3: ≥180 and/or ≥110
  - **Diagnosis:** "Systolic BP ≥140 AND/OR Diastolic BP ≥90 mmHg on two different clinic visits". A "Population screening BP reading may count as the first reading". If ≥160 and/or ≥100, "one clinic visit is sufficient".
  - **Hypertensive urgency:** "Systolic BP ≥180 AND/OR Diastolic ≥120 mmHg" with "No signs of acute target-organ damage". Follow up within 1 week.
  - **Red flags:** "Systolic BP ≥180 AND/OR Diastolic BP ≥120 with Symptoms of target organ damage", such as visual disturbance, dizziness, confusion, headache, chest pain, breathlessness, or sudden weakness or speech difficulty. The workflow says to "refer to emergency care".
  - **Monitoring:** "Evaluate for diabetes (fasting plasma glucose or HbA1c)".
- **ICMR Standard Treatment Workflow, Diabetes Mellitus Type 2.** [ICMR STW](https://www.icmr.gov.in/icmrobject/uploads/STWs/1726567245_diabetes_mellitus_type_2.pdf)
  - Diabetes: "FPG ≥126 mg/dl", "2-h plasma glucose ≥200", or "HbA1C ≥ 6.5%".
  - Prediabetes: "HbA1c 5.7-6.4%" or FPG 100–125. "PREDIABETES: should be tested yearly".
- **Haemoglobin.** The donor threshold is 12.5 g/dL. Anaemia grading uses the WHO 2024 Hb cut-off guideline ([WHO/NCBI](https://www.ncbi.nlm.nih.gov/books/NBK602183/)). **The advisor must confirm the exact cut-offs.** The values below are placeholders to verify. Anaemia Mukt Bharat covers testing and iron for women aged 15–49, adolescents and children, but not adult men ([RS 2025](https://sansad.in/getFile/annex/269/AU1857_LUqME1.pdf?source=pqars)).

## Rules (as code)

| Rule ID | Input | Condition | Finding | Urgency | Next step (proposed; doctor approves) | AI used? |
|---|---|---|---|---|---|---|
| **RF-BP-1** | BP plus symptom text | SBP ≥180 or DBP ≥120, **with** red-flag symptoms | BP_EMERGENCY | Immediate | Fixed template: "Call 112 / go to the nearest emergency department now." Alert the centre's doctor. | **No.** Template plus keyword match. The symptom list comes from the ICMR workflow. |
| **RF-BP-2** | BP | SBP ≥180 or DBP ≥120, no symptoms | BP_URGENCY | Same day | Fixed template asking the donor to see a doctor today. Same-day eSanjeevani or AAM visit. The doctor is alerted. Follow up within 1 week. | **No** for the first message. The navigator follows up afterwards. |
| **BP-G2** | BP | SBP 160–179 or DBP 100–109 | BP_GRADE2 | Within 1 week | Doctor review. AAM or eSanjeevani visit to confirm and assess. Diabetes screen. | Yes: explanation, booking, follow-up |
| **BP-G1** | BP | SBP 140–159 or DBP 90–99 (the donor was deferred) | BP_GRADE1 | Within 2–4 weeks | Second reading on another visit (ICMR: two visits). Free BP and sugar check at an AAM. Lifestyle steps. | Yes |
| **BP-TREND** | BP history | ≥3 rising readings, latest 130–139 and/or 85–89 (donor passed) | BP_RISING | Routine | Information plus a recheck at the next donation or an AAM. Lifestyle steps. | Yes |
| **HB-DEF** | Hb | Hb <12.5 g/dL (deferred) | HB_BELOW_DONOR | Within 2–4 weeks | Explain the deferral. Anaemia check (CBC, ferritin if available). Iron-rich diet. Anaemia Mukt Bharat if eligible, otherwise AAM or a doctor. Hb recheck in 8 weeks. | Yes |
| **HB-SEV** | Hb | Hb below the advisor's "severe" cut-off (placeholder **<8.0 g/dL**, verify with WHO 2024) | HB_SEVERE | Within 48 h | Doctor alerted. Fixed template asking the donor to see a doctor soon. | **No** for the first message |
| **DM-PRE** | Shared report | HbA1c 5.7–6.4% or FPG 100–125 | DM_PREDIABETES | Routine | Explain the result. Lifestyle steps. Retest yearly (ICMR). Combine with any BP finding. | Yes |
| **DM-DIAB** | Shared report | HbA1c ≥6.5% or FPG ≥126 | DM_POSSIBLE | Within 2 weeks | Doctor review. AAM or doctor to confirm (ICMR criteria). | Yes |
| **TTI-FLAG** | Counsellor-only flag | Any reactive screen (synthetic) | COUNSELLING_REQUIRED | Within 1 week | `request_counselling`: "a confidential conversation about your donation". The counsellor discloses the result and refers to NVHCP or ICTC. | **Restricted.** The agent sees only "counselling required" and never the reason. |
| **ELIG-RET** | Doctor clearance plus interval | Doctor marks the donor "cleared" and the interval has passed (90 days for men, 120 for women, whole blood) | ELIGIBLE_AGAIN | Routine | Welcome-back invitation with the next eligible date | Yes |

## What Gemini is allowed and not allowed to say

**Allowed:**
- The donor's own readings and trend.
- What the reading category means, in plain words. For example: "A reading of 140 or above is in the high range. A doctor confirms high BP with a second reading on another day."
- Why it matters for them: no symptoms, family history.
- The next step and how to get there.
- Lifestyle steps from the ICMR workflow: salt under 5 g a day, 30 minutes of activity daily, no tobacco or alcohol, healthy weight.

**Never:**
- "You have hypertension / diabetes / anaemia." Diagnosis belongs to the doctor.
- Medicine names or doses. The ICMR workflow lists drugs, but the navigator must never pass them on.
- Infection results, or any hint of them.
- Telling someone whether they can donate, unless the doctor has cleared them.
- Promising outcomes.
- Offering anything for donating.

**Style:**
- The donor's language and a warm tone.
- Short messages: no more than 5 lines.
- One next step at a time.
- Always offer "talk to a person".
