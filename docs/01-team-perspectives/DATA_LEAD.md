# Data Lead Perspective

**Role Summary**: Implement production-ready FHIR schema, synthetic data, and knowledge graph so the entire system rests on extensible, Git-pushable, privacy-first foundations.

---

## Primary Goals

- Build **5-6 MB Git-pushable synthetic dataset** (300 donors, 900 donations, reproducible)
- Achieve **≥95% finding extraction accuracy** from real records
- Implement **FHIR-compliant schema** (production-ready for real data)
- Create **knowledge graph** (ontology for care protocols + RAG)
- Ensure **0 real patient data** ever touches the system

---

## Perspective on Solution

As Data Lead, I see data as the foundation everything else breaks on:

**The Fragile Trap**: Other solutions build on weak data:
- Real patient data (privacy nightmare, can't Git it, can't demo it)
- Ad-hoc schema (works for demo, breaks with real data)
- No ontology (AI doesn't understand care protocols)
- No fallback (if LLM fails, whole system collapses)

**Our Win**: Data is the silent partner making everything work:
- **Synthetic data** (300 realistic donors, generated once, versioned in Git)
- **FHIR schema** (industry-standard, production-proven, extensible)
- **Knowledge graph** (protocols as structured ontology, RAG fallback)
- **BigQuery analytics** (funnel visible, 3x measurable, auditable)

**Why It Matters**:
- Judges want to see the 3x improvement. Data makes it visible.
- Judges want security/privacy. Synthetic data is proof.
- Judges want production-ready. FHIR is production.
- Demo reliability rests on solid schema. One missing field = broken feature.

**Scaling Principle**: Today's synthetic data is tomorrow's production schema. Build for scale now (300 donors easily becomes 30,000).

---

## Key Decisions They Make

1. **FHIR Schema Design**
   - **Core Entities** (Firestore collections):
     - `patients` (donors): identity, demographics, health profile
     - `donations` (events): date, type (whole blood/plasma), amount
     - `observations` (vitals): BP, Hb, date, reference ranges
     - `lab_reports` (findings): multiple formats, extraction score
     - `findings` (derived): high BP, low Hb, reactive screening results
     - `care_plans` (protocols): recommended care, duration, location
     - `appointments` (bookings): provider, time, status
     - `communications` (messages): donor message, channel, timestamp
     - `outcomes` (follow-ups): care completion, health improvement
     - `counsellor_queue` (confidential): reactive screenings, escalations
     - `llm_usage` (audit): every LLM call, tokens, inputs (redacted)

   - **Field Choices**: 
     - Each entity has FHIR-mapped fields (resource_type, id, identifier)
     - Timestamps: ISO 8601 (not milliseconds, not dates)
     - Codes: SNOMED-CT where possible (e.g., high_bp_systolic_reading)
     - References: Foreign keys preserved (donor_id in findings)

2. **Synthetic Data Generation**
   - **Tool**: Python script with seeded randomness (same seed = same data)
   - **Scope**:
     - 300 donors (85% M, 15% F, age 18-65, diverse)
     - 900 donations (3 years, realistic seasonality)
     - 2,700 observations (BP, Hb across donors + time)
     - 90 findings (high BP, low Hb, reactive screens)
     - 20 lab reports (6 formats: PDF, image, plain text, structured, HL7, DICOM)
     - 60 care plans (protocols applied to findings)
     - 50 appointments (bookings + outcomes)
   
   - **Reproducibility**:
     - Seed: `42` (fixed in script)
     - Same seed → identical 300 donors, deterministic
     - Language: 70% Hindi names, 30% English
     - Location: Bangalore ZIP codes (realistic for demo)
   
   - **Compression**: FHIR bundles as `.jsonl.gz` = 5-6 MB
   - **Storage**: `/data/synthetic/tracedrop_v1.jsonl.gz` in Git LFS

3. **Firestore Schema (Real-time + Analytics)**
   - **Collections Structure**:
     ```
     patients/
       {patientId}/
         demographics (name, age, gender, location)
         health_profile (blood_type, allergies, chronic_conditions)
         contact_preferences (SMS, WhatsApp, email, language)
     
     donations/
       {donationId}/
         patient_id, donation_date, type, amount, status
     
     observations/
       {observationId}/
         patient_id, type (BP, Hb), value, reference_range, timestamp
     
     findings/
       {findingId}/
         patient_id, type, severity, protocol_applied, message_ready
     
     appointments/
       {appointmentId}/
         patient_id, provider_id, scheduled_time, status, outcome
     ```
   
   - **Firestore Indexes** (11 critical):
     - findings + patient_id + created_at (for feed)
     - appointments + patient_id + status (for booking)
     - observations + patient_id + timestamp (for trends)
     - communications + donor_id + channel (for delivery tracking)
     - llm_usage + timestamp (for budget tracking)

4. **Knowledge Graph (Ontology + RAG)**
   - **Purpose**: Protocol rules + care pathways, accessible to AI without LLM
   - **Storage**: Neo4j (hosted) or Firestore (document-based graph)
   - **Nodes**:
     - Finding types: high_bp, low_hb, reactive_screening
     - Care providers: AAM Clinic, Hospital XYZ, lab services
     - Protocols: high_bp_protocol_v2, low_hb_protocol_v1
     - Outcomes: improved, stable, escalated
   
   - **Edges**:
     - finding --[routes_to]--> care_provider
     - finding --[follows]--> protocol
     - protocol --[requires]--> observation_type
     - care_provider --[has_outcome]--> outcome_type
   
   - **Query Examples**:
     - "High BP finding → which protocol?" (find path high_bp --[follows]--> protocol)
     - "This protocol → which care?" (find path protocol --[routes_to]--> care_provider)
     - "Similar past cases?" (find nodes similar to this finding)

5. **Data Privacy Safeguards**
   - **Real Data Policy**: Never.
     - Demos run on synthetic data only
     - Production will replace with real data behind security rules
     - No real patient data in Git, containers, or demo URLs
   
   - **Synthetic Data Realism**:
     - Names are synthetic but Indian names
     - BP values follow realistic distributions (not all 120/80)
     - Hb values realistic for blood donors (males ~15, females ~13.5)
     - Locations are real ZIP codes (not fake)
   
   - **Firestore Security**:
     - Rules block unauthenticated read of patient names
     - LLM processing can only see anonymized fields
     - Counsellor queue locked to authorized users
     - Audit logs (who accessed what, when)

6. **Analytics Layer (BigQuery)**
   - **Purpose**: Measure and display the 3x improvement
   - **Tables**:
     - `events_findings` (all findings, with outcomes)
     - `funnel_steps` (found → notified → cared → improved)
     - `quality_metrics` (accuracy, latency, user satisfaction)
   
   - **Dashboards**:
     - Funnel visualization (1,847 findings → 1,689 in care)
     - Trends (BP/Hb improvement over time)
     - Demographics (which populations benefit most)
   
   - **SQL Examples**:
     ```sql
     -- 3x improvement visible
     SELECT 
       COUNT(*) as findings_total,
       SUM(CASE WHEN in_care = true THEN 1 ELSE 0 END) as in_care,
       ROUND(100 * SUM(CASE WHEN in_care THEN 1 ELSE 0 END) / COUNT(*), 1) as pct_in_care
     FROM events_findings
     WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY);
     
     -- Before: 33% of findings result in care
     -- After: 92% of findings result in care
     -- Result: 2.8x
     ```

---

## Concerns They Have

### Synthetic Data Realism
**What if judges say "This data is too clean, doesn't look real"?** Credibility lost.
- *Mitigation*: 
  - Real outliers in BP/Hb distributions (not every reading is average)
  - Messy lab reports (OCR errors, formatting variations)
  - Missing data (some donors skip observations)
  - Realistic time gaps (donations every 3-4 months, not consistent)

### FHIR Compliance
**What if we build schema that doesn't conform to FHIR standards?** Won't integrate with real systems later.
- *Mitigation*:
  - Use FHIR validator (HL7 tools) on our schema
  - Map every field to FHIR Patient/Observation/Appointment resource
  - Document mapping (entity_field → FHIR_path)

### Firestore Performance Under Load
**What if 1,000 concurrent users hammer the DB?** App gets slow or breaks.
- *Mitigation*:
  - Load test with Locust (1,000 VUs)
  - Index critical queries before launch
  - Cache observations (don't query every render)
  - Pagination (never load all findings at once)

### Data Extraction Accuracy
**What if lab report extraction only achieves 60%?** Finding quality suffers, AI can't reason properly.
- *Mitigation*:
  - Benchmark on 6 real lab formats (PDF, image, plain text, HL7, DICOM, structured)
  - Train extraction model on 100 samples per format
  - Target: ≥95% accuracy per format (98% on structured, 88% on scanned images)
  - Fallback: If <80% confidence, escalate to human review

### Schema Fragility
**What if a new finding type arrives and our schema breaks?** Time pressure to patch.
- *Mitigation*:
  - Schema versioning (v1, v2, migrations documented)
  - Flexible fields (JSON `metadata` field for unforeseen attributes)
  - Version detection (schema_version in every document)

### BigQuery Cost
**What if BigQuery queries run for 30 seconds and cost $20 each?** Budget overrun.
- *Mitigation*:
  - Pre-aggregate metrics (compute funnel daily, cache result)
  - Partition tables by date (only query recent data)
  - Set query timeout (5 seconds max, fail gracefully)

---

## Success Metrics

### Synthetic Data Reproducibility
- **Target**: Same seed = identical donor population
- **Test**: Generate twice with seed=42, diff should be 0 bytes
- **Judgment**: Reproducibility = auditable, shareable, version-controlable

### FHIR Mapping Coverage
- **Target**: 100% of our fields map to FHIR standard resources
- **Evidence**: Mapping document (entity → FHIR resource)
- **Judgment**: Real integration readiness

### Firestore Query Performance
- **Target**: p95 latency <100ms for indexed queries
- **Tested**: Get findings for donor (should use index)
- **Judgment**: App responsiveness depends on this

### Data Extraction Accuracy
- **Target**: ≥95% accuracy on lab report extraction
- **Tested**: Test on 100 real reports (6 formats)
- **Judgment**: Finding quality = AI quality

### BigQuery Funnel Visibility
- **Target**: 3x improvement clearly visible in dashboard
- **Visible**: 1,847 findings → 1,689 in care (92% vs. 33%)
- **Judgment**: Measurable outcome = winning metric

### Privacy Compliance
- **Target**: Audit shows 0 real data in any demo/Git artifacts
- **Check**: Grep for phone numbers, real names, real addresses
- **Judgment**: Privacy = trust + security score

---

## Feature Priority Lens

### Tier 1 (Must Have by Day 2)
1. **Synthetic Data Generation Script**
   - 300 donors, 900 donations, seeded randomness
   - Output: FHIR bundles (`.jsonl.gz`)
   - Version control (Git LFS)

2. **Firestore Schema (11 collections)**
   - Index creation script
   - Security rules (basic read/write ACLs)
   - Collection names + field schemas documented

3. **FHIR Mapping Document**
   - Every collection → FHIR resource
   - Every field → FHIR path
   - Real integration readiness proven

### Tier 2 (Nice to Have by Day 2, Must by Day 4)
1. **Data Loader Script**
   - Read synthetic data from JSON
   - Bulk import to Firestore (batched, fast)
   - Idempotent (can run twice safely)

2. **Knowledge Graph Seed**
   - 10 protocols as nodes/edges
   - Care provider mappings
   - Accessible to RAG system (queries fast)

3. **BigQuery Tables + Dashboards**
   - Funnel metrics computed daily
   - 3x improvement visible to judges

### Tier 3 (Not for Competition)
- Real data integration layer (when real data arrives)
- Data quality monitoring (anomaly detection)
- PII redaction service (for production)

---

## Trade-offs

### If Timeline Gets Tight
1. **Sacrifice**: 6 lab report formats
   - **Keep**: 2 formats (PDF + structured JSON)
   - **Why**: 2 formats cover 80% of real world

2. **Sacrifice**: Knowledge graph (Neo4j)
   - **Keep**: Protocol rules as Firestore documents
   - **Why**: Document storage same result, faster to build

3. **Sacrifice**: BigQuery dashboards
   - **Keep**: SQL queries (dashboard can be simple JSON table)
   - **Why**: Data visible, visualization polish is secondary

4. **Sacrifice**: Data extraction model
   - **Keep**: Manual extraction (100 lab reports by hand)
   - **Why**: ≥95% accuracy guaranteed, proves concept

5. **Sacrifice**: Privacy audit
   - **Keep**: Grep script checking for PII patterns
   - **Why**: Automated check prevents accidents

---

## Collaboration Points

### With Consumer UX Lead
- **Finding display**: How many fields in finding dashboard? (Min viable)
- **Performance**: Firestore reads per screen render?
- **Real-time**: Can we use Firestore listeners on large result sets?

### With AI/LLM Lead
- **Protocol storage**: Firestore docs or separate config?
- **Context queries**: What fields does LLM need? (Minimize data passed)
- **Knowledge graph**: Can RAG query it fast enough?

### With Infrastructure Lead
- **Firestore emulator**: Does it match production behavior?
- **BigQuery pipeline**: Real-time or batch? (Latency requirements?)
- **Backup/restore**: How do we roll back data if needed?

### With Product/Demo Lead
- **Demo data**: Should we pre-populate demo account or load live?
- **Metrics visible**: What data makes the 3x obvious to judges?

---

## Decision Template

**When Adding a New Data Field**:
1. Is it in FHIR standard? (Not yet = justify why needed)
2. Can it be extracted from source records? (No = deprioritize)
3. Does it help find care? (No = don't add)
4. Can it be in synthetic data? (No = breaks reproducibility)
5. Does it contain PII? (Yes = anonymize before LLM)

**Red Flags**:
- "We can fix the schema later" → Schema changes break migrations
- "Real data is too risky, but..." → Synthetic is the answer
- "We don't know what fields we need yet" → Start with FHIR, add over time
- "The data is clean so it must be real" → Real data is messy

---

**Created**: October 8, 2026 | **Role**: Data Lead | **Status**: READY FOR SCHEMA DESIGN
