/**
 * Human-readable labels for finding categories produced by the protocol engine.
 */

const FINDING_LABELS: Record<string, string> = {
  BP_GRADE1: 'High Blood Pressure (Stage 1)',
  BP_GRADE2: 'High Blood Pressure (Stage 2)',
  BP_URGENCY: 'Very High Blood Pressure',
  BP_RISING: 'Rising Blood Pressure',
  HB_BELOW_DONOR: 'Low Hemoglobin',
  Hb_LOW: 'Low Hemoglobin',
  Hb_CRITICAL: 'Critical Hemoglobin Level',
  HR_ELEVATED: 'Elevated Heart Rate',
  DEFERRED: 'Deferral from Donation',
  OTHER: 'Health Alert',
};

export function getFindingLabel(category: string): string {
  return FINDING_LABELS[category] || category.replace(/_/g, ' ');
}
