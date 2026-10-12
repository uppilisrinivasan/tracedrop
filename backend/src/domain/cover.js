/**
 * Health-linked insurance cover ("HealthLimit").
 *
 * Works like a credit-limit increase: the premium stays fixed and the sum
 * insured steps up as the donor shows sustained good health and engagement.
 *
 * Actuarial basis (illustrative, transparent):
 *   - The base premium P is priced for a population with expected annual
 *     claims C0 = P x targetLossRatio.
 *   - Expected claims for a donor scale with a relative risk RR derived from
 *     their screening markers (RR = 1 at score 70, lower when healthier).
 *   - Expected claims grow sub-linearly with sum insured (most claims are well
 *     below the limit), modelled as C(SI) = C0 x RR x (SI / SI0)^0.6.
 *   - The largest SI that keeps C(SI) <= C0 is SI0 x (1/RR)^(1/0.6).
 *   - The result is capped at +60% of base and rounded down to the cover
 *     ladder (Rs 5L -> 6L -> 7L -> 8L). Increases need consistent evidence
 *     (2+ monitored visits in 12 months) and the donor's consent to share
 *     their score (never raw results) with the insurer.
 * Partner insurers would replace these parameters with their filed rating
 * factors; the mechanism (score -> RR -> cover headroom) stays the same.
 */

const store = require('../data/store');
const health = require('./health');

const LADDER = [500000, 600000, 700000, 800000];
const ELASTICITY = 0.6;
const MAX_MULTIPLE = 1.6;
const BASE_PREMIUM = 9800; // illustrative annual premium for Rs 5L, age 25-35 band

function relativeRisk(score) {
  // Each 10 points above 70 lowers expected claims ~11%; below 70 raises them
  return Math.exp(-0.0115 * (score - 70));
}

function headroom(score, base) {
  const rr = relativeRisk(score);
  return Math.min(base * MAX_MULTIPLE, base * (1 / rr) ** (1 / ELASTICITY));
}

function ladderStep(amount, base) {
  return LADDER.filter((step) => step >= base && step <= amount).pop() || base;
}

function evaluate(donorId) {
  const donor = store.getDonor(donorId);
  const policy = store.getPolicy(donor.policyId);
  const base = policy.baseCover;
  const history = health.scoreHistory(donorId);
  const current = history.length ? history[history.length - 1].score : 60;
  const yearAgo = health.addDays(store.today(), -365);
  const recentVisits = store.getDonations(donorId).filter((v) => v.date >= yearAgo);

  const consistent = recentVisits.length >= 2;
  const consented = donor.consent.shareHealthWithInsurer;
  const target = ladderStep(headroom(current, base), base);
  const cover = consistent && consented ? target : base;

  const nextStep = LADDER.find((step) => step > cover);
  let pointsToNext = null;
  // When a condition (not the score) is holding cover back, points don't help
  if (nextStep && target <= cover) {
    for (let s = current; s <= 100; s += 1) {
      if (ladderStep(headroom(s, base), base) >= nextStep) {
        pointsToNext = s - current;
        break;
      }
    }
  }

  const missing = [];
  if (!consistent) missing.push(`one more monitored visit in the next ${Math.max(1, 365 - health.daysBetween(recentVisits[0]?.date || yearAgo, store.today()))} days (needs 2 in 12 months)`);
  if (!consented) missing.push('consent to share your health score with the insurer');
  const toReachNext = !nextStep ? 'You are at the top step.'
    : [pointsToNext ? `raise your health score by ${pointsToNext} point(s) to ${current + pointsToNext}` : null, ...missing].filter(Boolean).join(' AND ');

  return {
    policy: { ...policy, premium: BASE_PREMIUM },
    baseCover: base,
    currentCover: cover,
    eligibleCover: target,
    nextStep: nextStep || null,
    pointsToNextStep: pointsToNext,
    healthScore: current,
    relativeRisk: Number(relativeRisk(current).toFixed(2)),
    conditions: {
      consistentMonitoring: { met: consistent, detail: `${recentVisits.length} monitored visit(s) in the last 12 months (needs 2)` },
      consentToShare: { met: consented, detail: consented ? 'You share your health score (not raw results) with your insurer' : 'Sharing is off' },
    },
    // Cover each past score would have qualified for (before the monitoring/consent conditions)
    history: history.map((h) => ({ date: h.date, score: h.score, cover: ladderStep(headroom(h.score, base), base) })),
    // Why the donor isn't getting the cover their score qualifies for
    blockedBy: target > cover ? (consented ? 'monitoring' : 'consent') : null,
    toReachNextStep: toReachNext,
    method: 'Cover = largest ladder step where expected claims at your risk level stay within the premium priced for Rs 5L. '
      + `Relative risk from score: e^(-0.0115 x (score - 70)); claims grow with cover^${ELASTICITY}; capped at ${MAX_MULTIPLE}x base.`,
  };
}

/** What-if: cover if the score changed by `delta` points. */
function simulate(donorId, newScore) {
  const donor = store.getDonor(donorId);
  const base = store.getPolicy(donor.policyId).baseCover;
  return { score: newScore, cover: ladderStep(headroom(newScore, base), base), relativeRisk: Number(relativeRisk(newScore).toFixed(2)) };
}

module.exports = { evaluate, simulate, LADDER };
