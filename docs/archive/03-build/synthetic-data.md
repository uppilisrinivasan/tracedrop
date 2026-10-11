# Synthetic data plan

The prototype uses **synthetic data only**, plus the team's own lab reports, shared with consent and redacted, for the accuracy test. No real donor, patient or infection data is used at any point. The repo README and the deck must both say so.

## Population: 300 donors across 3 Bengaluru blood centres

| Field | Distribution | Basis |
|---|---|---|
| Age | 18–60, mostly 22–40 | Typical working-age donors (**assumption**) |
| Sex | 85% men, 15% women | Women give about 6% of India's donations (2008 national figure; 6.52% in Maharashtra in 2024). We oversample women for the Hb persona. |
| Language | Kannada 35%, Hindi 30%, English 25%, Tamil 5%, Telugu 5% | Bengaluru mix (**assumption**) |
| Donations per donor | 1–6 over 3 years | So trends exist |
| BP | Draw from bands that loosely track ICMR-INDIAB adult hypertension prevalence (35.5%), shifted lower for healthy donors | Every reading inside or outside the 100–140 / 60–90 donor limits is labelled |
| Hb | Men N(14.5, 1.2); women N(12.8, 1.1) g/dL | About 10–15% of women fall below 12.5 (**assumption**; Pune deferred 53.5% of women overall, so the advisor may want this higher) |
| Shared reports | 20 donors share 1–2 company or insurer check-up reports | 6 lab formats (see below) |
| Reactive flags | 12 donors (4%), counsellor-only, reason synthetic | The rate is deliberately inflated so the counsellor queue has something to show. Real pooled rates are HBV 0.91%, HCV 0.28%, HIV 0.12%. |

## Scripted personas (deterministic)

| ID | Persona | History | What the demo shows |
|---|---|---|---|
| **D-001 Arjun** | 34, M, Hindi, software engineer; father had a stroke at 58 | BP 128/82 → 134/86 → 138/88 → **148/94** (deferred). His company check-up a year ago shows **HbA1c 6.1%**. | BP-G1 plus DM-PRE → explanation in Hindi → report photo → doctor approves → AAM booking → follow-up → cleared → donates again |
| **D-002 Meera** | 26, F, Kannada, teacher | Hb 12.9 → 12.6 → **11.8** (deferred) | HB-DEF → explanation in Kannada → anaemia check and iron guidance (Anaemia Mukt Bharat eligible) → Hb recheck in 8 weeks → donates |
| **D-017** | 52, M, English | **BP 184/118**, no symptoms | RF-BP-2 urgent template, with no AI, plus a doctor alert |
| **D-033** | 41, M, Kannada | Reactive flag (synthetic) | Counsellor queue only. The agent books "a confidential conversation". Leak tests run against this donor. |
| **D-050** | 29, M, Tamil | BP 132/86 → 136/88 → 139/89 (passed) | BP-TREND: an informational message plus a recheck |

## Registers and reports

- **Blood-centre register pages:** 3 synthetic register templates, each rendered as an image with handwriting-style fonts and some printed pages. Columns: date, donor ID, name (fake), group, Hb, BP, pulse, weight, accepted or deferred, reason.
- **Lab reports:** 6 synthetic formats.
  - Layouts in the style of a large chain, a local lab, a hospital lab and an insurer check-up, plus a phone photo taken at an angle and a 2-page PDF.
  - **Do not copy any real lab's logo or branding.** Use invented lab names, such as "Sunrise Diagnostics".
  - Fields: CBC (Hb, WBC, platelets), HbA1c, FPG, lipid profile, ferritin (some), with reference ranges.
- **Ground truth:** a JSON file per report listing the expected fields and values, used by the evaluation.

## Generator

- `data/generate.py` creates donors and readings with a fixed seed, plus FHIR bundles.
- `data/render_reports.py` builds report images and PDFs from HTML templates, using a headless browser to print them.
- `data/load.py` writes to the FHIR store and Firestore.
- Re-running with the same seed gives identical data, so the demo can be repeated.

## Team's real reports (accuracy test)

- Each teammate who wants to contributes 1–3 of their own past lab reports.
- Before upload, redact name, ID, phone number and address.
- Run the reports through the record builder, record field accuracy, then delete the files. Keep only the metrics and the anonymised ground truth.
- Report in the deck: "Accuracy on N real Indian lab reports (team members', with consent): X%."
