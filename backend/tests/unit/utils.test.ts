/**
 * Unit Tests: Utility Functions & Message Formatting
 * Tests helpers for message generation, data transformation, localization
 */

describe('Utility Functions', () => {
  describe('Message Formatting', () => {
    test('Formats BP finding to localized message (Hindi)', () => {
      const finding = {
        protocolCode: 'BP-STAGE1',
        systolic: 148,
        diastolic: 98,
        label: 'Grade 1 Hypertension'
      };
      
      const msg = formatFindingMessage(finding, 'hi');
      expect(msg).toContain('आपके रक्तचाप'); // "Your blood pressure"
      expect(msg).toContain('148/98');
    });

    test('Formats BP finding to English', () => {
      const finding = {
        protocolCode: 'BP-STAGE1',
        systolic: 148,
        diastolic: 98,
        label: 'Grade 1 Hypertension'
      };
      
      const msg = formatFindingMessage(finding, 'en');
      expect(msg).toContain('Your blood pressure');
      expect(msg).toContain('148/98');
    });

    test('Includes action instructions', () => {
      const finding = {
        action: 'defer',
        protocolCode: 'BP-STAGE1',
        followUpDays: 14
      };
      
      const msg = formatFindingMessage(finding, 'en');
      expect(msg).toContain('14 days');
      expect(msg).toContain('visit');
    });

    test('Handles emergency findings differently', () => {
      const finding = {
        action: 'urgent_referral',
        protocolCode: 'BP-STAGE2',
        severity: 'critical'
      };
      
      const msg = formatFindingMessage(finding, 'en');
      expect(msg).toContain('urgent');
      expect(msg).toContain('immediately');
    });
  });

  describe('Date & Time Utilities', () => {
    test('Calculates follow-up date from today', () => {
      const today = new Date('2026-10-08');
      const followUp = calculateFollowUpDate(today, 14);
      
      expect(followUp).toEqual(new Date('2026-10-22'));
    });

    test('Accounts for weekends in follow-up calculation', () => {
      // If 14-day follow-up lands on Sunday, push to Monday
      const today = new Date('2026-10-08');
      const followUp = calculateFollowUpDateSkipWeekends(today, 14);
      
      expect(followUp.getDay()).not.toBe(0); // Not Sunday
      expect(followUp.getDay()).not.toBe(6); // Not Saturday
    });

    test('Formats date for display (localized)', () => {
      const date = new Date('2026-10-22');
      
      const hi = formatDateForDisplay(date, 'hi');
      expect(hi).toMatch(/\d{1,2}\s*अक्टूबर/); // DD Month format (Hindi)
      
      const en = formatDateForDisplay(date, 'en');
      expect(en).toMatch(/October\s*\d{1,2}/); // Month DD format (English)
    });
  });

  describe('Data Transformation', () => {
    test('Converts observation object to FHIR format', () => {
      const obs = {
        donor_id: 'D-001',
        systolic: 148,
        diastolic: 98,
        timestamp: '2026-10-08T14:30:00Z'
      };
      
      const fhir = toFHIRObservation(obs);
      expect(fhir.resourceType).toBe('Observation');
      expect(fhir.subject.reference).toBe('Patient/D-001');
      expect(fhir.value.quantity.value).toBe(148);
    });

    test('Handles missing optional fields', () => {
      const partial = { systolic: 120 };
      const fhir = toFHIRObservation(partial);
      
      expect(fhir.value.quantity.value).toBe(120);
      expect(fhir.id).toBeDefined(); // Generated UUID
    });

    test('Maps protocol code to SNOMED CT', () => {
      const snomedCode = mapProtocolToSNOMED('BP-STAGE1');
      expect(snomedCode).toBe('72313002'); // Systolic hypertension
    });
  });

  describe('Localization', () => {
    test('Supports Hindi language strings', () => {
      const key = 'follow_up_visit';
      const hi = getLocalizedString(key, 'hi');
      expect(hi).toBe('फॉलो-अप विजिट');
    });

    test('Falls back to English when translation missing', () => {
      const key = 'follow_up_visit';
      const fallback = getLocalizedString(key, 'es');
      expect(fallback).toBe('Follow-up Visit'); // English fallback
    });

    test('Supports string interpolation', () => {
      const key = 'days_to_visit';
      const msg = getLocalizedString(key, 'hi', { days: 14 });
      expect(msg).toContain('14');
      expect(msg).toContain('दिन'); // "days" in Hindi
    });
  });

  describe('Validation Helpers', () => {
    test('Validates BP values within physiological range', () => {
      expect(isValidBP({ systolic: 148, diastolic: 98 })).toBe(true);
      expect(isValidBP({ systolic: 250, diastolic: 150 })).toBe(false); // Too high
      expect(isValidBP({ systolic: 50, diastolic: 30 })).toBe(false); // Too low
    });

    test('Validates hemoglobin values by gender', () => {
      expect(isValidHemoglobin(13.5, 'M')).toBe(true);
      expect(isValidHemoglobin(12.5, 'F')).toBe(true);
      expect(isValidHemoglobin(11.0, 'M')).toBe(false); // Too low for male
    });

    test('Validates donation status transitions', () => {
      expect(isValidStatusTransition('pending', 'completed')).toBe(true);
      expect(isValidStatusTransition('completed', 'pending')).toBe(false); // Invalid
      expect(isValidStatusTransition('deferred', 'completed')).toBe(false); // Invalid
    });
  });

  describe('UUID & ID Generation', () => {
    test('Generates valid UUIDs', () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    test('Generates deterministic IDs with seed', () => {
      const id1 = generateDeterministicID('D-001', '2026-10-08');
      const id2 = generateDeterministicID('D-001', '2026-10-08');
      
      expect(id1).toEqual(id2);
    });

    test('Generates unique IDs for different seeds', () => {
      const id1 = generateDeterministicID('D-001', '2026-10-08');
      const id2 = generateDeterministicID('D-001', '2026-10-09');
      
      expect(id1).not.toEqual(id2);
    });
  });

  describe('Error Handling', () => {
    test('Formats error for user display', () => {
      const err = new Error('Database connection failed');
      const userMsg = formatErrorForDisplay(err, 'en');
      
      expect(userMsg).not.toContain('Database');
      expect(userMsg).toContain('try again');
    });

    test('Preserves error details for logging', () => {
      const err = new Error('Database connection failed');
      const logMsg = formatErrorForLogging(err);
      
      expect(logMsg).toContain('Database');
      expect(logMsg).toContain('connection');
    });
  });
});

// Helper functions
function formatFindingMessage(finding: any, lang: string) {
  return '';
}

function calculateFollowUpDate(date: Date, days: number) {
  return new Date();
}

function calculateFollowUpDateSkipWeekends(date: Date, days: number) {
  return new Date();
}

function formatDateForDisplay(date: Date, lang: string) {
  return '';
}

function toFHIRObservation(obs: any) {
  return {};
}

function mapProtocolToSNOMED(code: string) {
  return '';
}

function getLocalizedString(key: string, lang: string, vars?: any) {
  return '';
}

function isValidBP(bp: any) {
  return false;
}

function isValidHemoglobin(hb: number, gender: string) {
  return false;
}

function isValidStatusTransition(from: string, to: string) {
  return false;
}

function generateUUID() {
  return '';
}

function generateDeterministicID(seed: string, timestamp: string) {
  return '';
}

function formatErrorForDisplay(err: Error, lang: string) {
  return '';
}

function formatErrorForLogging(err: Error) {
  return '';
}
