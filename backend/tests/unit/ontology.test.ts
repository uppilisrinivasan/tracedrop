/**
 * Unit Tests: Medical Ontology & Knowledge Graph
 * Tests knowledge graph queries, protocol matching, and concept relationships
 */

describe('Medical Ontology - Knowledge Graph', () => {
  describe('Protocol Matching', () => {
    test('BP 148/98 matches BP Grade 1 protocol', () => {
      const obs = { systolic: 148, diastolic: 98 };
      const expected = {
        protocolCode: 'BP-G1',
        label: 'Grade 1 Hypertension',
        action: 'defer',
        followUpDays: 14,
      };
      // Protocol engine applies rule and returns finding
      expect(matchProtocol(obs)).toEqual(expected);
    });

    test('BP 184/118 matches BP Grade 2 protocol (urgent)', () => {
      const obs = { systolic: 184, diastolic: 118 };
      const expected = {
        protocolCode: 'BP-G2',
        label: 'Grade 2 Hypertension (Urgent)',
        action: 'urgent_referral',
        followUpDays: 1,
      };
      expect(matchProtocol(obs)).toEqual(expected);
    });

    test('Hb 11.8 matches Anemia protocol (female)', () => {
      const obs = { hemoglobin: 11.8, gender: 'F' };
      const expected = {
        protocolCode: 'HB-F-LOW',
        label: 'Low Hemoglobin (Female)',
        action: 'defer',
        followUpDays: 28,
      };
      expect(matchProtocol(obs)).toEqual(expected);
    });

    test('TTI Reactive matches Counselling protocol', () => {
      const obs = { ttiReactive: true };
      const expected = {
        protocolCode: 'TTI-REACT',
        label: 'TTI Reactive Finding',
        action: 'counselling_queue',
        followUpDays: 0,
        confidential: true,
      };
      expect(matchProtocol(obs)).toEqual(expected);
    });

    test('Normal values do not match any protocol', () => {
      const obs = { systolic: 120, diastolic: 80, hemoglobin: 13.5 };
      expect(matchProtocol(obs)).toBeNull();
    });
  });

  describe('Concept Relationships', () => {
    test('Hypertension concept links to cardiovascular diseases', () => {
      const concept = getConceptById('HTN');
      expect(concept.relatedConcepts).toContain('CVD');
      expect(concept.riskFactors).toContain('stroke');
    });

    test('Anemia concept has gender-specific thresholds', () => {
      const concept = getConceptById('ANEMIA');
      expect(concept.thresholds.female).toBe(12.0);
      expect(concept.thresholds.male).toBe(13.0);
    });

    test('Counselling Queue concept has confidentiality flag', () => {
      const concept = getConceptById('COUNSEL');
      expect(concept.confidential).toBe(true);
      expect(concept.accessControl).toBe('counsellor_only');
    });
  });

  describe('Graph Queries', () => {
    test('Find all risk factors for hypertension', () => {
      const risks = queryGraph('HTN', 'causes_risk_for');
      expect(risks).toContain('stroke');
      expect(risks).toContain('heart_disease');
      expect(risks).toContain('kidney_disease');
    });

    test('Find intervention pathways for elevated BP', () => {
      const interventions = queryGraph('BP-G1', 'managed_by');
      expect(interventions).toContain('AAM_clinic');
      expect(interventions).toContain('home_monitoring');
    });

    test('Traverse concept hierarchy from finding to action', () => {
      const path = traverseGraph('BP-G1', 'outcome');
      expect(path).toEqual(['BP-G1', 'deferred_donation', 'follow_up_visit']);
    });
  });

  describe('Dynamic Rule Engine', () => {
    test('Age-adjusted hypertension thresholds', () => {
      // Age 35: Stage 1 threshold
      const young = evaluateThreshold('HTN', { age: 35 });
      expect(young).toBe(140); // systolic threshold

      // Age 65: Different threshold
      const elderly = evaluateThreshold('HTN', { age: 65 });
      expect(elderly).toBe(130); // more conservative
    });

    test('Gender-specific hemoglobin rules', () => {
      const maleThreshold = evaluateThreshold('HB', { gender: 'M' });
      const femaleThreshold = evaluateThreshold('HB', { gender: 'F' });
      
      expect(maleThreshold).toBeGreaterThan(femaleThreshold);
    });

    test('Combined comorbidity rules', () => {
      const obs = {
        systolic: 140,
        hbA1c: 8.5, // diabetic
        gender: 'M'
      };
      const rule = evaluateComorbidities(obs);
      expect(rule.action).toBe('urgent_referral'); // BP + diabetes = urgent
      expect(rule.severity).toBe('high');
    });
  });

  describe('Message Template Matching', () => {
    test('BP finding maps to correct message template', () => {
      const finding = { protocolCode: 'BP-G1', gender: 'M' };
      const template = getMessageTemplate(finding);
      expect(template.language).toHaveProperty('hi');
      expect(template.language).toHaveProperty('en');
      expect(template.actionCTA).toBe('Book AAM Visit');
    });

    test('Counselling finding uses confidential template', () => {
      const finding = { protocolCode: 'TTI-REACT', confidential: true };
      const template = getMessageTemplate(finding);
      expect(template.audience).toBe('counsellor');
      expect(template.accessControl).toBe('confidential');
    });
  });
});

// Helper functions for testing
function matchProtocol(obs: any) {
  // Implement protocol matching logic
  return null;
}

function getConceptById(id: string) {
  return {};
}

function queryGraph(concept: string, relationship: string) {
  return [];
}

function traverseGraph(start: string, target: string) {
  return [];
}

function evaluateThreshold(concept: string, context: any) {
  return 0;
}

function evaluateComorbidities(obs: any) {
  return {};
}

function getMessageTemplate(finding: any) {
  return {};
}
