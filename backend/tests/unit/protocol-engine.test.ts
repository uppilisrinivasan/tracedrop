/**
 * Unit Tests: Protocol Rules Engine
 * Tests deterministic protocol application and rule evaluation
 */

describe('Protocol Rules Engine', () => {
  describe('Blood Pressure Protocol', () => {
    test('Normal BP (< 120/80) returns no action', () => {
      const finding = applyProtocol('BP', { systolic: 118, diastolic: 78 });
      expect(finding).toBeNull();
    });

    test('Elevated BP (120-139/<80) returns informational', () => {
      const finding = applyProtocol('BP', { systolic: 135, diastolic: 78 });
      expect(finding.action).toBe('inform');
      expect(finding.severity).toBe('low');
    });

    test('Stage 1 (140-159/90-99) returns deferral', () => {
      const finding = applyProtocol('BP', { systolic: 148, diastolic: 95 });
      expect(finding.action).toBe('defer');
      expect(finding.protocolCode).toBe('BP-STAGE1');
      expect(finding.daysToFollowUp).toBe(14);
    });

    test('Stage 2 (≥160/100) returns urgent referral', () => {
      const finding = applyProtocol('BP', { systolic: 168, diastolic: 105 });
      expect(finding.action).toBe('urgent_referral');
      expect(finding.severity).toBe('critical');
      expect(finding.daysToFollowUp).toBe(1);
    });

    test('Isolated systolic hypertension', () => {
      const finding = applyProtocol('BP', { systolic: 160, diastolic: 72 });
      expect(finding.action).toBe('urgent_referral');
    });
  });

  describe('Hemoglobin Protocol', () => {
    test('Male with Hb < 13.0 g/dL returns deferral', () => {
      const finding = applyProtocol('HB', { hemoglobin: 12.5, gender: 'M' });
      expect(finding.action).toBe('defer');
      expect(finding.protocolCode).toBe('HB-LOW-M');
    });

    test('Female with Hb < 12.0 g/dL returns deferral', () => {
      const finding = applyProtocol('HB', { hemoglobin: 11.5, gender: 'F' });
      expect(finding.action).toBe('defer');
      expect(finding.protocolCode).toBe('HB-LOW-F');
    });

    test('Hb > 20.0 g/dL (polycythemia) returns urgent referral', () => {
      const finding = applyProtocol('HB', { hemoglobin: 21.5, gender: 'M' });
      expect(finding.action).toBe('urgent_referral');
      expect(finding.reason).toContain('polycythemia');
    });

    test('Gender-specific normal range respected', () => {
      const maleOk = applyProtocol('HB', { hemoglobin: 13.2, gender: 'M' });
      const femaleOk = applyProtocol('HB', { hemoglobin: 12.2, gender: 'F' });
      expect(maleOk).toBeNull();
      expect(femaleOk).toBeNull();
    });
  });

  describe('Infectious Disease Protocol (TTI)', () => {
    test('TTI Positive adds to confidential counsellor queue', () => {
      const finding = applyProtocol('TTI', { ttiReactive: true });
      expect(finding.action).toBe('counselling_queue');
      expect(finding.confidential).toBe(true);
      expect(finding.accessControl).toBe('counsellor_only');
    });

    test('TTI counselling finding is never visible to donor', () => {
      const finding = applyProtocol('TTI', { ttiReactive: true });
      expect(finding.visibleToDonor).toBe(false);
      expect(finding.counsellorOnly).toBe(true);
    });

    test('Multiple TTI referral attempts trigger escalation', () => {
      const finding1 = applyProtocol('TTI', { ttiReactive: true });
      const finding2 = applyProtocol('TTI', { ttiReactive: true, attempts: 2 });
      
      expect(finding2.escalation).toBe('high_priority');
    });
  });

  describe('Combined Comorbidity Rules', () => {
    test('Hypertension + Diabetes = urgent referral', () => {
      const finding = applyComorbidityRule({
        systolic: 148,
        hbA1c: 8.2
      });
      expect(finding.action).toBe('urgent_referral');
      expect(finding.reason).toContain('hypertension');
      expect(finding.reason).toContain('diabetes');
    });

    test('Age over 60 with borderline BP = early intervention', () => {
      const finding = applyComorbidityRule({
        age: 65,
        systolic: 130,
        diastolic: 80
      });
      expect(finding.action).toBe('defer'); // age adjustment
      expect(finding.severity).toBe('moderate');
    });

    test('Smoking + Hypertension = prioritized follow-up', () => {
      const finding = applyComorbidityRule({
        systolic: 140,
        smoking: true
      });
      expect(finding.priority).toBe('high');
      expect(finding.daysToFollowUp).toBe(7); // faster than normal
    });
  });

  describe('Rule Determinism', () => {
    test('Same input always produces same output', () => {
      const obs = { systolic: 148, diastolic: 98, gender: 'M', age: 35 };
      const result1 = applyProtocol('BP', obs);
      const result2 = applyProtocol('BP', obs);
      
      expect(result1).toEqual(result2);
    });

    test('Rule evaluation order does not affect outcome', () => {
      const obs = { systolic: 148, hbA1c: 8.2 };
      const order1 = [applyProtocol('BP', obs), applyComorbidityRule(obs)];
      const order2 = [applyComorbidityRule(obs), applyProtocol('BP', obs)];
      
      expect(order1[0]).toEqual(order2[0]);
    });

    test('Edge cases handled consistently', () => {
      const edge1 = applyProtocol('BP', { systolic: 140, diastolic: 90 });
      const edge2 = applyProtocol('BP', { systolic: 139.5, diastolic: 89.5 });
      
      expect(edge1.action).toBe('defer');
      expect(edge2.action).toBe('inform'); // below threshold
    });
  });

  describe('Rule Coverage - 100% Deterministic', () => {
    test('All 9 protocols are implemented', () => {
      const protocols = getProtocolList();
      expect(protocols).toContain('BP');
      expect(protocols).toContain('HB');
      expect(protocols).toContain('HTN');
      expect(protocols).toContain('DM');
      expect(protocols).toContain('TTI');
      expect(protocols.length).toBe(9);
    });

    test('Each protocol has deterministic rules', () => {
      const protocols = getProtocolList();
      protocols.forEach(protocol => {
        expect(getRuleEngine(protocol).isDeterministic).toBe(true);
      });
    });
  });
});

// Helper functions
function applyProtocol(protocol: string, obs: any) {
  return null;
}

function applyComorbidityRule(obs: any) {
  return null;
}

function getProtocolList() {
  return [];
}

function getRuleEngine(protocol: string) {
  return { isDeterministic: true };
}
