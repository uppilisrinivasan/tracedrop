# TraceDrop Medical Ontology

This directory contains the seed data for TraceDrop's medical knowledge graph used in Phase 1. The ontology powers the AI layer's contextual message generation and provides structured medical knowledge for reducing hallucinations.

## Files Overview

### Core Ontology Files

- **concepts.json** - 16+ medical concepts including:
  - Conditions: Hypertension, Anemia, Diabetes, Prediabetes, Heart Disease, Stroke, Kidney Disease, Retinopathy
  - Interventions: Monitoring, Medication Adherence
  - Lifestyle Modifications: Exercise, Diet, Stress Management, Weight Management, Smoking Cessation, Alcohol Reduction
  
  Each concept includes:
  - SNOMED-CT and ICD-10 codes
  - Definitions aligned with medical standards
  - Reference ranges for measurements
  - Related symptoms, risk factors, complications
  - Associated protocols

- **relationships.json** - 40+ relationship edges linking concepts
  - Relationship types: `increases_risk_of`, `improved_by`, `requires_action`, `supports`, `synergistic_with`, `reduces_risk_of`, `controls`
  - Strength values (0-1) indicate confidence/likelihood
  - Evidence summaries for each relationship

- **protocols.json** - 10 clinical management protocols
  - Blood Pressure Grade 1 & 2 (BP-G1, BP-G2)
  - Hypertensive Urgency (BP-URGENCY)
  - Anemia Mild/Moderate and Severe (HB-DEF, HB-SEV)
  - Prediabetes and Diabetes Management (DM-PREDIAB, DM-DIAB)
  - Cardiac and Renal Monitoring (CARDIAC-MON, RENAL-MON)
  - Eye Screening and Stroke Emergency (EYE-SCREEN, STROKE-EMERG)

- **embeddings.json** - 384-dimensional vectors for each concept
  - Used for similarity search and RAG fallback
  - Enables semantic concept matching

### Supporting Data Files

- **lifestyle-recommendations.json** - ICMR-compliant intervention guidelines
  - Hypertension, Diabetes, Prediabetes, Anemia management
  - Expected outcomes and duration
  - Difficulty levels and implementation tips

- **medical-coding.json** - Medical code system mappings
  - ICD-10, LOINC, SNOMED-CT
  - Medication ATC codes
  - Lab test codes and reference ranges

- **test-values-ranges.json** - Comprehensive reference ranges for:
  - Cardiovascular tests (BP, cholesterol, lipids, troponin)
  - Metabolic tests (glucose, HbA1c, insulin)
  - Hematologic tests (hemoglobin, hematocrit, iron studies)
  - Renal tests (creatinine, BUN, GFR, albumin)
  - Liver tests
  - Inflammatory markers
  - Thyroid tests

### Database Initialization

- **neo4j-init.cypher** - Neo4j Cypher script for graph database setup
  - Creates 16 concept nodes
  - Creates 10 protocol nodes
  - Establishes all relationship edges
  - Creates indices for performance
  - Validation queries

## Usage

### Python/JavaScript Access

```typescript
import { KnowledgeGraph } from '../backend/src/database/knowledge-graph';

const kg = new KnowledgeGraph();
await kg.initialize();

// Get a concept
const hypertension = kg.getConcept('hypertension');

// Find related concepts
const related = kg.getRelated('hypertension');

// Get protocols for a concept
const protocols = kg.getProtocols('diabetes');

// Search by keyword
const results = kg.searchConcepts('blood pressure');

// Get context for AI message generation
const context = await kg.getContextForMessage(['hypertension', 'diabetes']);

// Find similar concepts using embeddings
const embedding = kg.getEmbedding('hypertension');
const similar = kg.findSimilar(embedding, 5);

// Validate ontology
const validation = kg.validateOntology();
```

### Neo4j Graph Database

```bash
# Load the ontology into Neo4j
cypher-shell -u neo4j -p password < neo4j-init.cypher

# Query examples
MATCH (c:Concept)-[r:INCREASES_RISK_OF]->(target:Concept)
WHERE c.id = 'diabetes'
RETURN c.name, r.relationshipType, target.name, r.strength

MATCH (concept:Concept)-[r:MAPPED_TO]->(protocol:Protocol)
WHERE concept.id = 'hypertension'
RETURN protocol.name, protocol.applicableCondition, protocol.followUpDays
```

## Ontology Structure

```
Concepts (16 nodes)
├── Conditions (8)
│   ├── Hypertension
│   ├── Anemia
│   ├── Diabetes
│   ├── Prediabetes
│   ├── Heart Disease
│   ├── Stroke
│   ├── Kidney Disease
│   └── Retinopathy
├── Interventions (2)
│   ├── Monitoring
│   └── Medication Adherence
└── Lifestyle (6)
    ├── Exercise
    ├── Diet
    ├── Stress Management
    ├── Weight Management
    ├── Smoking Cessation
    └── Alcohol Reduction

Protocols (10 nodes)
├── BP-G1, BP-G2, BP-URGENCY (Hypertension)
├── HB-DEF, HB-SEV (Anemia)
├── DM-PREDIAB, DM-DIAB (Diabetes)
├── CARDIAC-MON (Heart Disease)
├── RENAL-MON (Kidney Disease)
├── EYE-SCREEN (Retinopathy)
└── STROKE-EMERG (Stroke)

Relationships (40+)
├── INCREASES_RISK_OF (risk progression)
├── IMPROVED_BY (intervention effectiveness)
├── REQUIRES_ACTION (mandatory monitoring)
├── MAPPED_TO (protocol linkage)
└── Other types (synergies, reductions, etc.)
```

## Key Features

### 1. Concept Relationships
- **increases_risk_of**: Indicates causal or risk relationships (0-1 strength)
- **improved_by**: Shows intervention effectiveness
- **requires_action**: Mandatory monitoring or intervention
- **strength values**: 0.0-1.0 confidence for RAG grounding

### 2. Reference Data
- Blood pressure ranges: Normal, Elevated, Grade 1-3
- Glucose/HbA1c ranges: Normal, Prediabetic, Diabetic
- Hemoglobin ranges: Normal, Mild, Moderate, Severe Anemia
- GFR stages: CKD Stage 1-5

### 3. Protocol Coverage
- Escalation thresholds for each condition
- Follow-up intervals and monitoring frequency
- Lifestyle intervention recommendations
- Medication considerations

### 4. Embeddings for RAG
- 384-dimensional vectors for similarity search
- Used for fallback when exact concept match not available
- Enables semantic reasoning about related conditions

## Validation

### Consistency Checks
```typescript
const validation = kg.validateOntology();
if (!validation.valid) {
  console.log('Issues found:', validation.issues);
}
```

### Statistics
```typescript
const stats = kg.getStatistics();
console.log(`Total concepts: ${stats.totalConcepts}`);
console.log(`Total relationships: ${stats.totalRelationships}`);
console.log(`Concepts by category:`, stats.conceptsByCategory);
```

## Integration with AI Layer

### Phase 3: Message Generation Context

The knowledge graph provides grounded context to prevent AI hallucinations:

```typescript
// AI layer uses this to generate context-aware messages
const userContext = ['hypertension', 'diabetes'];
const ontologyContext = await kg.getContextForMessage(userContext);
const systemPrompt = `You are a health assistant. Use this medical context: ${ontologyContext}`;
```

### RAG Fallback

When user query doesn't exactly match concepts:

```typescript
// Get embedding of extracted concept
const conceptEmbedding = kg.getEmbedding('hypertension');

// Find similar concepts
const similar = kg.findSimilar(conceptEmbedding, 5);

// Use similar concepts for grounded response
for (const match of similar) {
  const concept = kg.getConcept(match.conceptId);
  // Use concept information in response
}
```

## Medical Standards Compliance

- **ICD-10**: International Classification of Diseases
- **SNOMED-CT**: Systematized Nomenclature of Medicine
- **LOINC**: Logical Observation Identifiers Names and Codes
- **ICMR**: Indian Council of Medical Research guidelines
- **ACC/AHA**: American College of Cardiology/American Heart Association
- **ADA**: American Diabetes Association

## Data Quality

All medical definitions and reference ranges are sourced from:
- WHO guidelines
- ICMR recommendations
- ACC/AHA 2019 standards
- ADA Standards of Care
- Peer-reviewed medical literature

## Maintenance

### Adding New Concepts
1. Add concept definition to concepts.json
2. Add relationships to relationships.json
3. Generate 384-D embedding
4. Link to applicable protocols
5. Run validation: `kg.validateOntology()`

### Updating Protocols
1. Modify protocol in protocols.json
2. Ensure MAPPED_TO relationships exist
3. Update follow-up intervals as needed
4. Test Neo4j queries

### Validation Checklist
- All concepts have at least one relationship
- Protocol references are valid
- Embeddings have 384 dimensions
- Medical codes are accurate
- Reference ranges are evidence-based

## Performance Optimization

- Concepts indexed by ID and category
- Relationships pre-computed for query speed
- Embeddings cached in memory
- Search index built on initialization
- Neo4j indices on frequently queried fields

## Future Enhancements

- Additional concepts for mental health, nutrition, fitness
- Lab panel recommendations linked to protocols
- Drug interaction checking
- Genetic risk factor integration
- Natural language explanation generation
