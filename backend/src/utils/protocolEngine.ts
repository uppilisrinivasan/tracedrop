/**
 * Protocol Engine - Deterministic Protocol Application
 * Applies fixed, deterministic rules based on observations.
 * NO randomness, NO LLM involvement. Same input always gives same output.
 */

import { Observation, ProtocolAnalysisResult } from '../types/agents';

interface ProtocolRule {
  id: string;
  name: string;
  category: string;
  check: (observation: Observation) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'wait' | 'defer' | 'refer' | 'urgent' | 'emergency';
  timeline: string;
  details: string;
  followUpDays: number;
}

// Blood Pressure Protocols
const BPProtocols: ProtocolRule[] = [
  {
    id: 'BP-EMERGENCY',
    name: 'Hypertensive Emergency',
    category: 'hypertension_emergency',
    check: (obs) => {
      if (obs.type !== 'BP') return false;
      const [sys, dia] = obs.value.split('/').map(Number);
      return sys >= 180 || dia >= 120;
    },
    severity: 'critical',
    action: 'emergency',
    timeline: 'Immediate',
    details: 'Blood pressure ≥180/120 mmHg indicates hypertensive emergency. IMMEDIATE referral to emergency department required.',
    followUpDays: 0,
  },
  {
    id: 'BP-GRADE2',
    name: 'Blood Pressure Grade 2 Hypertension',
    category: 'hypertension_management',
    check: (obs) => {
      if (obs.type !== 'BP') return false;
      const [sys, dia] = obs.value.split('/').map(Number);
      return (sys >= 160 && sys < 180) || (dia >= 100 && dia < 120);
    },
    severity: 'high',
    action: 'urgent',
    timeline: 'Within 7 days',
    details: 'Blood pressure Grade 2 (160-179/100-109 mmHg). Urgent AAM visit and lifestyle modification required.',
    followUpDays: 7,
  },
  {
    id: 'BP-GRADE1',
    name: 'Blood Pressure Grade 1 Hypertension',
    category: 'hypertension_management',
    check: (obs) => {
      if (obs.type !== 'BP') return false;
      const [sys, dia] = obs.value.split('/').map(Number);
      return (sys >= 140 && sys < 160) || (dia >= 90 && dia < 100);
    },
    severity: 'medium',
    action: 'refer',
    timeline: 'Within 2-4 weeks',
    details: 'Blood pressure Grade 1 (140-159/90-99 mmHg). Schedule AAM visit for lifestyle counseling.',
    followUpDays: 21,
  },
  {
    id: 'BP-ELEVATED',
    name: 'Elevated Blood Pressure',
    category: 'hypertension_monitoring',
    check: (obs) => {
      if (obs.type !== 'BP') return false;
      const [sys, dia] = obs.value.split('/').map(Number);
      return (sys >= 130 && sys < 140) || (dia >= 80 && dia < 90);
    },
    severity: 'low',
    action: 'defer',
    timeline: 'Monitor and recheck',
    details: 'Blood pressure elevated (130-139/80-89 mmHg). Monitor regularly.',
    followUpDays: 90,
  },
];

// Hemoglobin Protocols
const HbProtocols: ProtocolRule[] = [
  {
    id: 'HB-SEVERE',
    name: 'Severe Anemia',
    category: 'anemia_emergency',
    check: (obs) => {
      if (obs.type !== 'Hb') return false;
      const value = Number(obs.value);
      return value < 7;
    },
    severity: 'critical',
    action: 'emergency',
    timeline: 'Immediate',
    details: 'Hemoglobin <7 g/dL indicates severe anemia. URGENT specialist referral and possible transfusion.',
    followUpDays: 1,
  },
  {
    id: 'HB-MODERATE',
    name: 'Moderate Anemia',
    category: 'anemia_management',
    check: (obs) => {
      if (obs.type !== 'Hb') return false;
      const value = Number(obs.value);
      return value >= 7 && value < 10;
    },
    severity: 'high',
    action: 'defer',
    timeline: 'Within 2 weeks',
    details: 'Hemoglobin 7-10 g/dL indicates moderate anemia. Defer donation. Schedule clinical evaluation.',
    followUpDays: 14,
  },
  {
    id: 'HB-MILD',
    name: 'Mild Anemia',
    category: 'anemia_management',
    check: (obs) => {
      if (obs.type !== 'Hb') return false;
      const value = Number(obs.value);
      return value >= 10 && value < 13.5;
    },
    severity: 'medium',
    action: 'defer',
    timeline: 'Within 4 weeks',
    details: 'Hemoglobin below normal range. Defer donation. Recommend dietary iron.',
    followUpDays: 28,
  },
];

// Fasting Blood Sugar Protocols
const FBSProtocols: ProtocolRule[] = [
  {
    id: 'FBS-DIABETIC',
    name: 'Diabetic Range Fasting Glucose',
    category: 'diabetes_detection',
    check: (obs) => {
      if (obs.type !== 'FBS') return false;
      const value = Number(obs.value);
      return value >= 126;
    },
    severity: 'high',
    action: 'refer',
    timeline: 'Within 1 week',
    details: 'Fasting glucose ≥126 mg/dL suggests diabetes. URGENT referral for further evaluation.',
    followUpDays: 7,
  },
  {
    id: 'FBS-PREDIABETIC',
    name: 'Prediabetic Range Fasting Glucose',
    category: 'diabetes_prevention',
    check: (obs) => {
      if (obs.type !== 'FBS') return false;
      const value = Number(obs.value);
      return value >= 100 && value < 126;
    },
    severity: 'medium',
    action: 'defer',
    timeline: 'Within 2-4 weeks',
    details: 'Fasting glucose 100-125 mg/dL (prediabetic range). Schedule lifestyle counseling.',
    followUpDays: 21,
  },
];

// TTI Protocols
const TTIProtocols: ProtocolRule[] = [
  {
    id: 'TTI-REACTIVE',
    name: 'Reactive Transfusion Transmissible Infection',
    category: 'tti_detection',
    check: (obs) => {
      if (obs.type !== 'TTI') return false;
      return obs.value.toLowerCase() === 'reactive';
    },
    severity: 'critical',
    action: 'emergency',
    timeline: 'Immediate',
    details: 'TTI test reactive. URGENT referral to infectious disease specialist. Counseling required.',
    followUpDays: 1,
  },
];

const AllProtocols: ProtocolRule[] = [
  ...TTIProtocols,
  ...BPProtocols,
  ...HbProtocols,
  ...FBSProtocols,
];

export class ProtocolEngine {
  static analyze(observation: Observation): ProtocolAnalysisResult {
    const applicableProtocol = AllProtocols.find((rule) =>
      rule.check(observation)
    );

    if (!applicableProtocol) {
      return {
        protocolCode: 'UNKNOWN',
        severity: 'low',
        action: 'wait',
        timeline: 'No protocol match',
        details: `No protocol rule matched for observation type ${observation.type}.`,
        requiresFollowUp: false,
      };
    }

    return {
      protocolCode: applicableProtocol.id,
      severity: applicableProtocol.severity,
      action: applicableProtocol.action,
      timeline: applicableProtocol.timeline,
      details: applicableProtocol.details,
      requiresFollowUp: applicableProtocol.followUpDays > 0,
      followUpIntervalDays: applicableProtocol.followUpDays,
    };
  }

  static requiresImmediateAttention(observation: Observation): boolean {
    const result = this.analyze(observation);
    return result.action === 'emergency' || (result.action === 'urgent' && result.severity === 'critical');
  }

  static shouldDeferDonor(observations: Observation[]): {
    shouldDefer: boolean;
    reason: string;
    severityLevel: 'low' | 'medium' | 'high' | 'critical';
  } {
    for (const obs of observations) {
      const result = this.analyze(obs);
      if (result.action === 'defer' || result.action === 'urgent' || result.action === 'emergency') {
        return {
          shouldDefer: true,
          reason: result.details,
          severityLevel: result.severity,
        };
      }
    }
    return {
      shouldDefer: false,
      reason: 'All observations within acceptable range',
      severityLevel: 'low',
    };
  }
}

export { ProtocolRule };
