# TraceDrop Data Schema: FHIR-Aligned Design

**Document Purpose**: Define the data schema that powers TraceDrop as a consumer-centric health platform, aligned with FHIR standards to enable future RAG/integration with real systems.

**Date**: 2026-10-08  
**Status**: Reference Architecture for Build

---

## Overview

TraceDrop uses **FHIR (Fast Healthcare Interoperability Resources)** as its primary data model because:

1. **FHIR Alignment** - Enables future integration with ABHA, eSanjeevani, hospital records
2. **Consumer-Centric** - Supports donor ownership and portability
3. **Ontology-Ready** - FHIR resources map to medical/health concepts for knowledge graphs
4. **Synthetic-Realistic** - Same schema works with real and synthetic data
5. **Git-Pushable** - FHIR can be serialized as compact JSON bundles

---

## Key Entities

### Patient (Donor)
- `id`: D-001
- `name`, `phone`, `email`, `language`
- `extension`: donation preferences, health goals

### Donation Event  
- `subject`: reference to Patient
- `status`: completed, deferred
- `performedDateTime`: donation date
- `measurements`: BP, Hb recorded

### Observations (Vital/Lab Data)
- Blood pressure (LOINC 55284-4, 8480-6)
- Hemoglobin (LOINC 718-7)
- Lab results (CBC, HbA1c, glucose)
- Trend stored via multiple observations over time

### Findings (Synthesized)
- `category`: BP_GRADE1, HB_DEF, DM_PREDIABETES, etc.
- `protocolApplied`: BP-G1, HB-DEF (rule reference)
- `trend`: readings array with direction/slope
- `riskFactors`: family history, comorbidities
- `nextAction`: care pathway from protocol

### CarePlan
- `subject`: Patient reference
- `activity`: specific actions (AAM visit, monitoring, lifestyle)
- `author`: approving doctor
- Links to protocol rules

### Appointment (Booking)
- `start`: scheduled time
- `location`: AAM or eSanjeevani facility
- `status`: booked, completed, cancelled
- Links to CarePlan

### Communication (Message Log)
- `payload`: message text (WhatsApp, web, SMS)
- `channel`: whatsapp, web, sms
- `sent`, `received`: timestamps
- `extension`: template used, generation method

### Outcome
- Care completed, attended, result (BP reading)
- Donor returned to donate (yes/no, date)
- Metric for funnel calculation

---

## Storage Strategy

### Firestore Collections (Primary Data)
```
/donors/{donor_id}
/donations/{donation_id}
/observations/{obs_id}
/findings/{finding_id}
/care_plans/{plan_id}
/appointments/{apt_id}
/communications/{comm_id}
/outcomes/{outcome_id}
/counsellor_queue/{item_id}  # Confidential, counsellor-only
/templates/{template_id}      # Message templates by language
/protocols/{protocol_id}      # Finding rules
```

### Healthcare API FHIR Store (Production Ready)
- Google Cloud Healthcare API
- Prototype: Firestore as FHIR-compliant JSON
- Supports ABHA/eSanjeevani integration

### BigQuery (Analytics)
- Real-time fanout from Firestore
- Powers dashboard, funnel metrics, evaluation

---

## Data Relationships (Ontology)

```
Patient (Donor)
  ├─ has_donation → Donation Event
  │   └─ generates_findings → Finding
  │       ├─ based_on → Observation (BP/Hb/Lab)
  │       ├─ follows_protocol → Protocol Rule
  │       └─ maps_to_care → CarePlan
  │           ├─ creates → Appointment
  │           └─ results_in → Outcome
  ├─ has_observation → Vital/Lab Data
  │   └─ classified_by → LOINC/SNOMED Codes
  ├─ has_communication → Message Log
  │   ├─ generated_by → AI Agent
  │   └─ uses_template → Message Template
  └─ has_consent → Data Sharing Preferences
```

**Coding Systems**:
- LOINC: Lab values (BP, Hb, glucose, etc.)
- SNOMED CT: Procedures, conditions
- ISO 639-1: Languages (hi, kn, en, ta, te)
- TraceDrop Custom: Finding categories, protocols

---

## Synthetic Data Size (Git-Pushable)

| Entity | Count | ~Size | Total |
|--------|-------|-------|-------|
| Donors | 300 | 1.5 KB | 450 KB |
| Donations | 900 | 0.8 KB | 720 KB |
| Observations | 2700 | 0.6 KB | 1.6 MB |
| Lab Reports | 20 | 3 KB | 60 KB |
| Findings | 500 | 1.2 KB | 600 KB |
| CarePlans | 450 | 1.5 KB | 675 KB |
| Appointments | 400 | 1 KB | 400 KB |
| Communications | 1000 | 1.2 KB | 1.2 MB |

**Total Compressed**: ~5-6 MB (gzip)  
**Storage**: `/data/synthetic/fhir-bundles.jsonl.gz`

---

## Extensibility: From Synthetic to RAG

### Message Generation for RAG
Each communication stores:
- `generation_method`: "gemini-3-8-flash-with-knowledge-graph"
- `knowledge_used`: ["family_history", "trend_analysis", "protocol_bp_g1"]
- `template_id`: Reference to message template
- `confidence`: LLM confidence score

### Fallback to RAG when LLM unavailable
1. Retrieve similar past messages by finding similarity
2. Use template + embeddings to find closest prior message
3. Serve templated response instead

### Structured Reasoning Storage
- Protocol version tracking (BP-G1-v2.1-ICMR-2026)
- Reasoning steps stored alongside messages
- Enables audit, learning, A/B testing

---

## Key Design for Competition Scoring

✅ **Consumer-Centric Data Model**: Donor owns and accesses their data  
✅ **Measurable Funnel**: Complete journey from finding to returned donation  
✅ **Safety-First Rules**: Deterministic protocol implementation  
✅ **Language Diversity**: Multi-language message support built-in  
✅ **Privacy by Design**: Confidential findings in separate collection  
✅ **Extensible**: FHIR schema + ontology supports RAG and integration  

---

## Implementation Checklist

- [ ] Validate FHIR mapping with clinical advisor
- [ ] Generate synthetic data (`data/generate.py`)
- [ ] Build message templates with language variations
- [ ] Set up knowledge graph schema
- [ ] Create evaluation harness
- [ ] Measure extraction accuracy on real reports
- [ ] Test privacy (0 leaks on 50 adversarial prompts)
- [ ] Generate funnel metrics from synthetic run
