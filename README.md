# TraceDrop

**Give blood. See every life it touches. Get healthier, and get better cover for it.**

TraceDrop puts the blood donor at the centre. Every donation becomes three things the donor can see:

1. **Impact they can feel.** Each donation is separated into components (red cells, platelets, plasma, cryo, plasma for medicines). TraceDrop follows every component to the patient it helped. The donor sees an age band, the type of treatment and the type of hospital, never who the patient is. They can turn any unit into a shareable story in their own language.
2. **A free, recurring health check.** The donation sample runs a full lab panel. TraceDrop tracks it over time, flags trends early (rising BP, falling iron, creeping HbA1c), and an AI agent writes a personal care plan.
3. **Money back for good health.** Like a credit limit that rises with good credit behaviour, the donor's health-insurance cover steps up (₹5L → 6L → 7L → 8L) for the same premium as their health score stays strong. The rules are transparent and the donor gives consent.

Around the donor, TraceDrop shows what their contribution meant for blood centres, hospitals, labs, government programmes and their own circles (family, friends, workplace). Users can drill down into every number, and privacy is preserved throughout.

> All data is synthetic: 300 donors, 657 donation visits, 1,600+ blood components, 8,500+ lab results. Institutions and companies are fictional.

---

## Run it

**With Docker**

```bash
cp .env.example .env        # add ANTHROPIC_API_KEY to enable AI features
docker compose up --build
# open http://localhost:8080
```

**Without Docker** (Node 20+)

```bash
./run.sh                    # installs deps on first run, starts API + web app
# open http://localhost:5173
```

Without an API key everything still works. Each AI feature falls back to a rule-based version and labels it as such.

Use the **"Signed in as"** switcher to move between demo donors:

| Donor | Story |
|---|---|
| **Arjun Rao** (B+) | Regular donor; BP creeping up 126 → 136, still eligible. Score qualifies for ₹6L but needs one more monitored visit. Donate in the app and watch the cover step up. |
| **Meera Iyer** (O+) | Haemoglobin and ferritin falling over 4 visits; deferred. The care-plan agent connects the trend and routes her to a free clinic. |
| **Ananya Sharma** (O−) | Healthy, rare group, eligible today; top cover (₹8L). |
| **Vikram Gowda** (A+) | 184/118 at last visit: urgent same-day escalation. |
| **Karthik Menon** (B+) | Prediabetic HbA1c and rising BP, otherwise well. |
| **Rohan Verma** (AB+) | Shows the confidential path: one unit withheld for safety, no reason shown in-app. |

---

## Where AI is used, and why it has to be AI

| Feature | Type | Why rules can't do it |
|---|---|---|
| **Drop copilot** (chat button everywhere) | Agent with 13 tools | Donors ask open questions that cut across impact, health and cover ("why didn't my cover go up?"). The agent decides what to look up, combines it, answers in Kannada/Hindi/Tamil/Telugu/English, and can navigate the app. |
| **Care-plan agent** (Health → Care plan) | Agent | Rules flag markers one at a time; people have several borderline results that interact. The agent pulls trends, protocols, evidence-based guidance, cover headroom and care slots, then writes one prioritised plan that cites evidence for every action. |
| **Lab-report reader** (Health → Add a lab report) | Multimodal GenAI | Indian labs print in endless layouts, names and units, often as photos. The model reads any format, maps tests to LOINC and converts units (mmol/L → mg/dL, mmol/mol → %). Schema-constrained output plus range checks; the donor confirms before saving. |
| **Impact stories** (Impact → a unit) | GenAI | Turns anonymised journey data into a moving, shareable story in the donor's language. The model must declare any detail it added; if it does, the template is used instead. |
| **Insight of the day** (Home) | GenAI | Picks the one thing that matters most for this donor today from rule-computed candidates, so it can only choose real facts. |

**Kept deterministic on purpose:** donation eligibility (NBTC), clinical findings (ICMR / ACC-AHA thresholds), the health score, the insurance cover ladder, and privacy (k-anonymity). Anything that affects safety or money never depends on a model.

The **AI console** (sidebar) shows live calls, latency, token use against the daily budget, prompt-cache hits and a tool trace for every agent answer.

---

## Architecture

```
frontend/   React 19 + Vite + Recharts — mobile-first donor app
backend/
  src/data/      in-memory store over data/synthetic (FHIR-aligned)
  src/domain/    deterministic engines: health, cover, impact, community, donation
  src/ai/        llm gateway (rate limit, token budget, caching, traces),
                 agent loop, tools, copilot, care plan, lab reader, stories, insights
  src/routes/    REST API
  test/          tests for the deterministic layer (npm test)
data/
  generate.py    reproducible synthetic world (seed 42)
  synthetic/     donors, donations, lab results, components, communities, FHIR bundles
  ontology/      clinical protocols and lifestyle guidance used by the agents
```

- **Model:** Claude Opus 5.5 via the Anthropic SDK, with a 10 req/s rate limit and a 100k tokens/day budget (configurable in `.env`).
- **Privacy:**
  - Recipients appear only as age band + clinical use + hospital type; dates of use are rounded to the month.
  - Any combination shared by fewer than 5 patients is generalised further.
  - Communities see aggregates only, and names appear only for members who opt in.
  - Insurers see the score, never raw results, and only with consent.
- **Insurance maths (illustrative):**
  - Relative risk = e^(−0.0115 × (score − 70)).
  - Expected claims scale as cover^0.6, so lower risk creates headroom for more cover at the same expected cost.
  - Capped at 1.6× base, and needs 2 monitored visits in 12 months plus consent.
  - A partner insurer would substitute its filed rating factors.

## Tests

```bash
cd backend && npm test      # eligibility, findings, cover rules, privacy guarantees
```

## Docs

Strategy, perspectives and pitch material are in [docs/](docs/). Earlier planning documents are in [docs/archive/](docs/archive/). They describe an earlier design, and their metrics are not results from this build.
