# TraceDrop Medical Ontology - Master Index

## Document Navigation

### Quick Start (Start Here)
- [QUICK_START.md](data/ontology/QUICK_START.md) - 5-minute setup and common use cases
- [README.md](data/ontology/README.md) - Comprehensive documentation
- [ONTOLOGY_CREATION_SUMMARY.md](ONTOLOGY_CREATION_SUMMARY.md) - What was created and why

### Detailed References
- **Concepts**: [data/ontology/concepts.json](data/ontology/concepts.json) - 16 medical concepts
- **Relationships**: [data/ontology/relationships.json](data/ontology/relationships.json) - 42 concept edges
- **Protocols**: [data/ontology/protocols.json](data/ontology/protocols.json) - 11 management protocols
- **Embeddings**: [data/ontology/embeddings.json](data/ontology/embeddings.json) - 384-D vectors for RAG

### Support Data
- **Lifestyle Guidelines**: [data/ontology/lifestyle-recommendations.json](data/ontology/lifestyle-recommendations.json) - ICMR recommendations
- **Medical Codes**: [data/ontology/medical-coding.json](data/ontology/medical-coding.json) - ICD-10, SNOMED, LOINC mappings
- **Test Ranges**: [data/ontology/test-values-ranges.json](data/ontology/test-values-ranges.json) - Reference values

### Database & Code
- **Neo4j Script**: [data/ontology/neo4j-init.cypher](data/ontology/neo4j-init.cypher) - Graph database setup
- **TypeScript Client**: [backend/src/database/knowledge-graph.ts](backend/src/database/knowledge-graph.ts) - KnowledgeGraph class

---

## Quick Reference

### 16 Concepts Included

#### Conditions (8)
1. **Hypertension** - Blood pressure >= 140/90 mmHg
2. **Anemia** - Hemoglobin below reference range
3. **Diabetes** - Fasting glucose >= 126 mg/dL or HbA1c >= 6.5%
4. **Prediabetes** - Fasting glucose 100-125 mg/dL
5. **Heart Disease** - Coronary artery disease
6. **Stroke** - Cerebrovascular accident
7. **Kidney Disease** - Chronic kidney disease (CKD)
8. **Retinopathy** - Diabetic eye complications

#### Interventions (2)
9. **Monitoring** - Regular health assessment
10. **Medication Adherence** - Systematic medication compliance

#### Lifestyle (6)
11. **Exercise** - Physical activity 150+ min/week
12. **Diet** - Dietary modifications (DASH, Mediterranean, etc.)
13. **Stress Management** - Relaxation and psychological support
14. **Weight Management** - BMI optimization
15. **Smoking Cessation** - Tobacco cessation support
16. **Alcohol Reduction** - Limit to safe levels

### 11 Protocols Included

| ID | Name | Condition | Action |
|----|------|-----------|--------|
| BP-G1 | Blood Pressure Grade 1 | 140-159 / 90-99 mmHg | Lifestyle + AAM visit in 2-4 weeks |
| BP-G2 | Blood Pressure Grade 2 | 160-179 / 100-109 mmHg | Medication + lifestyle, urgent AAM |
| BP-URGENCY | Hypertensive Crisis | >= 180/>=120 mmHg | IMMEDIATE emergency evaluation |
| HB-DEF | Mild/Moderate Anemia | Hb 7-12 g/dL | Investigate, dietary mod, AAM 2 weeks |
| HB-SEV | Severe Anemia | Hb < 7 g/dL | URGENT specialist/hospital referral |
| DM-PREDIAB | Prediabetes | Glucose 100-125 or HbA1c 5.7-6.4% | Intensive lifestyle, AAM 3 months |
| DM-DIAB | Diabetes | Glucose >=126 or HbA1c >=6.5% | Pharmacotherapy + lifestyle, AAM 3 months |
| CARDIAC-MON | Cardiac Monitoring | Known/suspected heart disease | ECG, troponin, continuous monitoring |
| RENAL-MON | Kidney Monitoring | GFR <60 or proteinuria | GFR tracking, nephrology referral if Stage 4-5 |
| EYE-SCREEN | Diabetic Eye Screening | Diabetes diagnosis | Annual comprehensive dilated exam |
| STROKE-EMERG | Acute Stroke | Neurological deficit <4.5 hrs | IMMEDIATE ED, possible thrombolytic/thrombectomy |

### Relationship Types (42 total)

| Type | Count | Meaning |
|------|-------|---------|
| increases_risk_of | 14 | Condition A increases likelihood of B |
| requires_action | 8 | Monitoring/intervention mandatory |
| improved_by | 12 | Intervention effectiveness |
| reduces_risk_of | 3 | Risk reduction |
| improves | 1 | Condition improvement |
| controls | 2 | Medication control |
| supports | 1 | Intervention support |
| synergistic_with | 1 | Combined effectiveness |

### Reference Ranges Summary

```
Blood Pressure:
  Normal: < 120/80 mmHg
  Elevated: 120-139/80-89
  Grade 1: 140-159/90-99
  Grade 2: >= 160/100 mmHg

Glucose:
  Normal fasting: < 100 mg/dL
  Prediabetic: 100-125 mg/dL
  Diabetic: >= 126 mg/dL

HbA1c:
  Normal: < 5.7%
  Prediabetic: 5.7-6.4%
  Diabetic: >= 6.5%

Hemoglobin:
  Normal male: > 13.5 g/dL
  Normal female: > 12 g/dL
  Mild anemia: 10-12 g/dL
  Severe: < 7 g/dL

GFR (Kidney Function):
  Stage 1: >= 90 mL/min/1.73m2
  Stage 2: 60-89 (mild decrease)
  Stage 3a: 45-59 (mild-moderate decrease)
  Stage 3b: 30-44 (moderate-severe decrease)
  Stage 4: 15-29 (severe decrease)
  Stage 5: < 15 (kidney failure)
```

---

## Usage Paths

### Path 1: Get Started (5 minutes)
1. Read [QUICK_START.md](data/ontology/QUICK_START.md)
2. Initialize KnowledgeGraph
3. Call `kg.getConcept('hypertension')`

### Path 2: Understand the Data (15 minutes)
1. Read [README.md](data/ontology/README.md) - Structure & features
2. Skim [concepts.json](data/ontology/concepts.json) - One concept example
3. Skim [relationships.json](data/ontology/relationships.json) - Relationship examples
4. Review Protocol section in [README.md](data/ontology/README.md)

### Path 3: Full Integration (1 hour)
1. Read all of [ONTOLOGY_CREATION_SUMMARY.md](ONTOLOGY_CREATION_SUMMARY.md)
2. Study [knowledge-graph.ts](backend/src/database/knowledge-graph.ts) - All methods
3. Review [neo4j-init.cypher](data/ontology/neo4j-init.cypher) - DB schema
4. Check [test-values-ranges.json](data/ontology/test-values-ranges.json) - Reference data
5. Implement RAG context retrieval

### Path 4: Deploy (varies)
1. Ensure [data/ontology/](data/ontology/) directory is deployed
2. Initialize KnowledgeGraph in app startup
3. For Neo4j: Run [neo4j-init.cypher](data/ontology/neo4j-init.cypher)
4. Validate with `kg.validateOntology()`
5. Monitor with `kg.getStatistics()`

---

## File Descriptions

### Core Ontology (Required)

**concepts.json** (13 KB)
- 16 medical concepts with SNOMED codes
- Each concept has definitions, reference ranges, related symptoms
- Linked to protocols and other concepts

**relationships.json** (8.1 KB)
- 42 edges linking concepts
- Each relationship has type and 0-1 strength value
- Includes evidence summary

**protocols.json** (10 KB)
- 11 clinical protocols
- Each has applicable criteria, actions, follow-up timing
- Mapped to concepts

**embeddings.json** (148 KB)
- 384-dimensional vectors for 16 concepts
- For semantic similarity search
- Used in RAG fallback

### Supporting Data (Required for features)

**lifestyle-recommendations.json** (9.4 KB)
- ICMR-compliant guidelines
- Intervention targets and expected outcomes
- Difficulty levels and implementation tips

**medical-coding.json** (6.4 KB)
- ICD-10, SNOMED-CT, LOINC code mappings
- Medication ATC codes
- Standard medical terminology

**test-values-ranges.json** (6.8 KB)
- Reference ranges for all test types
- Categories: cardiovascular, metabolic, hematologic, renal, liver, thyroid
- Interpretation guidelines

### Database Layer

**neo4j-init.cypher** (12 KB)
- Cypher commands for Neo4j setup
- Creates all nodes and relationships
- Adds performance indices

### Application Layer

**knowledge-graph.ts** (14 KB)
- TypeScript client class
- 15+ methods for querying
- Cosine similarity for embeddings
- Full-text search indexing
- Validation and statistics

---

## Statistics

```
Medical Content:
  - 16 concepts
  - 42 relationships
  - 11 protocols
  - 8 concept categories
  - 8 relationship types

Data Sizes:
  - concepts.json: 13 KB
  - relationships.json: 8.1 KB
  - protocols.json: 10 KB
  - embeddings.json: 148 KB
  - Total: ~250 KB

Coverage:
  - Cardiovascular: 3 conditions + 3 protocols
  - Metabolic: 2 conditions + 2 protocols
  - Hematologic: 1 condition + 2 protocols
  - Renal: 1 condition + 1 protocol
  - Ophthalmologic: 1 condition + 1 protocol
  - Lifestyle: 6 interventions
  - Total: 16 concepts + 11 protocols
```

---

## Medical Standards

- **ICD-10**: WHO disease coding
- **SNOMED-CT**: WHO medical terminology
- **LOINC**: Regenstrief lab test codes
- **ICMR**: Indian Council of Medical Research guidelines
- **ACC/AHA**: American College of Cardiology standards (2019)
- **ADA**: American Diabetes Association standards

All reference values based on peer-reviewed medical literature and official guidelines.

---

## Integration Points

### Phase 2: Data Layer
- Use concept IDs for patient data normalization
- Map protocols to clinical workflows
- Validate test values against reference ranges

### Phase 3: AI Layer
- Pass ontology context to LLM system prompt
- Use embeddings for RAG similarity search
- Generate protocol-based messages
- Prevent hallucinations with grounded knowledge

### Consumer Platform
- Display simplified concept explanations
- Recommend protocols based on patient data
- Suggest lifestyle interventions
- Show risk visualization from relationships

---

## Development Checklist

- [x] 16 medical concepts with codes
- [x] 42 relationship edges with strength
- [x] 11 clinical protocols
- [x] 384-D embeddings for all concepts
- [x] ICMR lifestyle guidelines
- [x] Medical code mappings (ICD/SNOMED/LOINC)
- [x] Reference ranges for tests
- [x] Neo4j database initialization script
- [x] TypeScript client class
- [x] Full documentation
- [x] Validation testing
- [x] Quick start guide

---

## Next Steps

1. **Setup**: Follow [QUICK_START.md](data/ontology/QUICK_START.md)
2. **Learn**: Read [README.md](data/ontology/README.md) for comprehensive guide
3. **Build**: Integrate KnowledgeGraph into application
4. **Deploy**: Copy ontology files to production
5. **Monitor**: Check `kg.getStatistics()` and `kg.validateOntology()`

---

## Support Resources

- **Quick Reference**: [QUICK_START.md](data/ontology/QUICK_START.md)
- **Full Documentation**: [README.md](data/ontology/README.md)
- **Creation Details**: [ONTOLOGY_CREATION_SUMMARY.md](ONTOLOGY_CREATION_SUMMARY.md)
- **Code Reference**: [knowledge-graph.ts](backend/src/database/knowledge-graph.ts)

---

**Version**: 1.0.0
**Status**: Production Ready
**Last Updated**: October 8, 2026
**Maintainer**: Claude AI
