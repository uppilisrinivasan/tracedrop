# TraceDrop Ontology - Quick Start Guide

## Overview

The TraceDrop medical ontology provides a structured knowledge graph of medical concepts, relationships, and protocols. It powers message generation and prevents AI hallucinations in Phase 3.

## File Locations

```
data/ontology/              # All ontology data
└── *.json                  # Medical concept and relationship data

backend/src/database/
└── knowledge-graph.ts      # TypeScript client
```

## 5-Minute Setup

### 1. Load the Ontology in Your App

```typescript
import { KnowledgeGraph } from '../backend/src/database/knowledge-graph';

// Create and initialize
const kg = new KnowledgeGraph();
await kg.initialize(); // Loads all JSON files
```

### 2. Basic Queries

```typescript
// Get a concept
const hypertension = kg.getConcept('hypertension');
console.log(hypertension.name);       // "Hypertension"
console.log(hypertension.definition); // Full definition

// Search for concepts
const results = kg.searchConcepts('blood pressure');

// Get related concepts (conditions that are complications, etc.)
const related = kg.getRelated('hypertension');
// Returns Map with: heart_disease, stroke, kidney_disease

// Get protocols for managing a condition
const protocols = kg.getProtocols('diabetes');
// Returns: [DM-PREDIAB, DM-DIAB] Protocol objects
```

### 3. For AI/Message Generation

```typescript
// Get context to pass to LLM
const context = await kg.getContextForMessage(['hypertension', 'diabetes']);
// Returns formatted string with definitions, protocols, related concepts

// Use in system prompt
const systemPrompt = `
You are a health assistant.
Medical context:
${context}
`;
```

### 4. For RAG/Similarity

```typescript
// Get embedding for a concept
const embedding = kg.getEmbedding('hypertension');

// Find similar concepts
const similar = kg.findSimilar(embedding, 5);
// Returns: [{conceptId: 'heart_disease', similarity: 0.87}, ...]
```

## Common Use Cases

### Find All Interventions for a Condition

```typescript
const diabetesConcept = kg.getConcept('diabetes');
const interventions = kg.getRelated('diabetes', 'improved_by');

interventions.forEach(entry => {
  console.log(`${entry.concept.name} (effectiveness: ${entry.relationship.strength})`);
});
// Output:
// Physical Activity (effectiveness: 0.8)
// Dietary Modifications (effectiveness: 0.88)
// Weight Management (effectiveness: 0.85)
```

### Check Protocol for a Condition

```typescript
const protocols = kg.getProtocols('hypertension');

protocols.forEach(protocol => {
  console.log(`Protocol: ${protocol.id}`);
  console.log(`  When: ${protocol.applicableCondition}`);
  console.log(`  Action: ${protocol.recommendedAction}`);
  console.log(`  Follow-up: ${protocol.followUpDays} days`);
});
```

### Validate Data Quality

```typescript
const validation = kg.validateOntology();
if (!validation.valid) {
  console.error('Ontology issues:', validation.issues);
} else {
  console.log('Ontology is valid!');
}
```

### Get Statistics

```typescript
const stats = kg.getStatistics();
console.log(`Total concepts: ${stats.totalConcepts}`);
console.log(`Total relationships: ${stats.totalRelationships}`);
console.log(`Total protocols: ${stats.totalProtocols}`);
console.log('Categories:', stats.conceptsByCategory);
console.log('Relationship types:', stats.relationshipTypes);
```

## Data Structure Reference

### Concept

```typescript
interface Concept {
  id: string;                    // "hypertension"
  name: string;                  // "Hypertension"
  snomedCode: string;            // "38341003"
  definition: string;            // Medical definition
  category: string;              // "cardiovascular", "metabolic", etc.
  symptoms?: string[];           // ["headache", "dizziness"]
  measurements?: string[];       // ["systolic_bp", "diastolic_bp"]
  referenceRanges?: {
    normal: string,
    elevated: string,
    // ...
  };
  riskFactors?: string[];        // ["obesity", "smoking"]
  complications?: string[];      // ["heart_disease", "stroke"]
  relatedProtocols?: string[];   // ["BP-G1", "BP-G2"]
}
```

### Relationship

```typescript
interface Relationship {
  sourceId: string;              // "hypertension"
  targetId: string;              // "stroke"
  relationshipType: string;      // "increases_risk_of"
  strength: number;              // 0.92 (confidence 0-1)
  evidence?: string;             // "Leading modifiable risk factor..."
}
```

### Protocol

```typescript
interface Protocol {
  id: string;                    // "BP-G1"
  name: string;                  // "Blood Pressure Grade 1"
  applicableCondition: string;   // "140-159 / 90-99 mmHg"
  severity: string;              // "mild_to_moderate"
  recommendedAction: string;     // Clinical recommendation
  lifestyle?: string[];          // Lifestyle interventions
  followUpDays: number;          // 21
  escalationThreshold: string;   // "160/100 mmHg"
}
```

## Relationship Types Explained

| Type | Meaning | Strength Use |
|------|---------|--------------|
| `increases_risk_of` | Condition A raises likelihood of Condition B | 0.85 = high risk |
| `improved_by` | Condition A responds to Intervention B | 0.88 = highly effective |
| `requires_action` | Monitoring/management needed | 1.0 = mandatory |
| `reduces_risk_of` | Intervention A lowers Condition B risk | 0.90 = very effective |
| `supports` | Intervention A helps achieve Intervention B | - |
| `synergistic_with` | Combined effect better than individual | - |
| `mapped_to` | Concept linked to protocol | 1.0 = exact match |

## Categories

- `cardiovascular`: Heart and blood vessel diseases
- `metabolic`: Glucose and metabolic disorders
- `hematologic`: Blood-related conditions
- `renal`: Kidney diseases
- `ophthalmologic`: Eye complications
- `neurological`: Brain/stroke disorders
- `intervention`: Clinical actions
- `lifestyle`: Behavioral modifications

## Medical Code Systems

### SNOMED-CT Examples
```
"38341003"     → Hypertension
"73211009"     → Diabetes
"271737000"    → Anemia
```

### ICD-10 Examples
```
"I10"          → Hypertension
"E11"          → Type 2 Diabetes
"D50"          → Iron deficiency anemia
```

### LOINC Examples
```
"8480-6"       → Systolic blood pressure
"2345-7"       → Fasting glucose
"4548-4"       → HbA1c
```

## Performance Tips

1. **Cache the KnowledgeGraph instance** - Initialize once, reuse globally
2. **Use relationship type filters** - Narrow queries with `getRelated(id, 'improved_by')`
3. **Limit relationship depth** - Use `maxDepth: 1` for faster queries
4. **Leverage search index** - Full-text search is fast for keyword discovery

## Troubleshooting

### "File not found" error
```
Ensure data/ontology/*.json files exist
Check file paths are absolute (not relative)
```

### "Invalid relationship reference"
```
Run kg.validateOntology() to check for broken links
Review relationships.json for valid sourceId/targetId
```

### "Embedding dimension mismatch"
```
All embeddings must be exactly 384 dimensions
Regenerate embeddings if modified
```

## Testing Your Setup

```typescript
// Quick validation test
async function testOntology() {
  const kg = new KnowledgeGraph();
  await kg.initialize();
  
  // Test 1: Load concept
  const concept = kg.getConcept('hypertension');
  console.assert(concept !== undefined, 'Concept not found');
  
  // Test 2: Get relationships
  const related = kg.getRelated('hypertension');
  console.assert(related.size > 0, 'No relationships found');
  
  // Test 3: Get protocols
  const protocols = kg.getProtocols('hypertension');
  console.assert(protocols.length > 0, 'No protocols found');
  
  // Test 4: Validate
  const validation = kg.validateOntology();
  console.assert(validation.valid, `Validation failed: ${validation.issues}`);
  
  console.log('All tests passed!');
}
```

## Next Steps

1. Read `data/ontology/README.md` for detailed documentation
2. Check `backend/src/database/knowledge-graph.ts` for all available methods
3. Review `ONTOLOGY_CREATION_SUMMARY.md` for statistics and coverage
4. Integrate into Phase 3 AI layer for message generation

## Concepts at a Glance

**Conditions**: Hypertension, Anemia, Diabetes, Prediabetes, Heart Disease, Stroke, Kidney Disease, Retinopathy

**Interventions**: Monitoring, Medication Adherence

**Lifestyle**: Exercise, Diet, Stress Management, Weight Management, Smoking Cessation, Alcohol Reduction

**Protocols**: 11 clinical management protocols covering all conditions

---
**Reference**: See `/data/ontology/README.md` for complete documentation
