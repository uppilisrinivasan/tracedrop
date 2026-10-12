/**
 * Care-plan agent.
 *
 * A donor rarely has one clean problem: Arjun's BP is creeping up, his
 * triglycerides are borderline and his family has hypertension; Meera's
 * haemoglobin and ferritin are falling across four visits. Rules flag each
 * marker separately; this agent investigates the whole picture with tools
 * (trends, protocols, evidence-based guidance, cover headroom, care slots)
 * and writes one prioritised, personal plan. Output is schema-constrained so
 * the UI can render it, and every action cites the evidence it is based on.
 *
 * Without Vertex AI access, a deterministic plan is built from the protocols.
 */

const store = require('../data/store');
const health = require('../domain/health');
const cover = require('../domain/cover');
const llm = require('./llm');
const tools = require('./tools');
const { runAgent } = require('./agent');

const PLAN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'urgency', 'actions', 'doctorNote', 'coverGoal', 'nextCheck'],
  properties: {
    summary: { type: 'string', description: '2-3 sentence plain-language overview for the donor' },
    urgency: { type: 'string', enum: ['routine', 'soon', 'urgent'] },
    actions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'why', 'how', 'category', 'timeframe', 'evidence', 'expectedEffect'],
        properties: {
          title: { type: 'string' },
          why: { type: 'string', description: 'Which result this addresses and why it matters for this donor' },
          how: { type: 'array', items: { type: 'string' }, description: '2-4 concrete steps that fit Indian daily life' },
          category: { type: 'string', enum: ['see_doctor', 'diet', 'activity', 'monitoring', 'lifestyle', 'donation'] },
          timeframe: { type: 'string' },
          evidence: { type: 'array', items: { type: 'string' }, description: 'Exact results/protocol ids the action is based on' },
          expectedEffect: { type: 'string', description: 'Expected effect from guidance data, or empty' },
        },
      },
    },
    doctorNote: { type: 'string', description: 'Short note the donor can show a doctor: findings, trends, protocol ids' },
    coverGoal: { type: 'string', description: 'How following the plan moves the health score and insurance cover, using tool numbers only' },
    nextCheck: { type: 'string', description: 'When to recheck and what (next donation date if eligible)' },
  },
};

const SYSTEM = `You are TraceDrop's care-plan agent. You write a personal, prioritised health plan for a blood donor from the lab panel and screening done on their donation samples.

Process:
1. Call get_profile, get_health_findings and get_health_score.
2. For each finding, call get_trend on the relevant marker(s) and get_protocol for its protocol id (if any).
3. Call get_lifestyle_guidance for the relevant topic(s) to ground advice in evidence and effect sizes.
4. Call get_insurance_cover, and simulate_cover with a realistic improved score (+5 to +10) to show what's achievable.
5. If any finding is urgent or high, or a protocol recommends a clinic visit, call find_care_slots.
Then write the plan.

Rules:
- Look across findings: combine related ones (e.g. rising BP + borderline lipids + family history = cardiovascular risk) instead of listing them separately. Order actions by clinical priority.
- At most 4 actions. Every action must cite exact evidence (values with dates, protocol ids).
- Advice must be practical for an Indian adult: local foods, walking, salt in home cooking, etc.
- Never diagnose, never suggest starting or stopping medicines. Urgent findings: first action is "see a doctor today".
- If the donor has no findings, write a short maintenance plan and celebrate it.
- Use only numbers that tools returned. Write for the donor in clear English (second person).`;

async function generate(donorId) {
  const donor = store.getDonor(donorId);
  const result = await runAgent({
    feature: 'care_plan',
    system: SYSTEM,
    messages: [{ role: 'user', content: `Write the care plan for donor ${donor.name} (${donorId}). Today is ${store.today()}.` }],
    donorId,
    toolNames: ['get_profile', 'get_health_findings', 'get_health_score', 'get_trend', 'get_protocol', 'get_lifestyle_guidance', 'get_insurance_cover', 'simulate_cover', 'find_care_slots'],
    maxTokens: 6000,
    effort: 'medium',
    outputSchema: PLAN_SCHEMA,
  });
  const plan = result.result;
  return { plan, steps: result.steps, generatedBy: 'agent', model: llm.MODEL };
}

const FALLBACK_ACTIONS = {
  hypertension: { title: 'Bring your blood pressure down', category: 'lifestyle', topic: 'hypertension_grade1' },
  anemia: { title: 'Rebuild your iron and haemoglobin', category: 'diet', topic: 'anemia_management' },
  prediabetes: { title: 'Bring your blood sugar back to normal', category: 'diet', topic: 'prediabetes_reversal' },
  diabetes: { title: 'Get your blood sugar checked by a doctor', category: 'see_doctor', topic: 'diabetes_management' },
  heart_disease: { title: 'Improve your cholesterol', category: 'diet', topic: 'general_cardiovascular_health' },
  weight_management: { title: 'Reach a healthier weight', category: 'activity', topic: 'general_cardiovascular_health' },
};

/** Deterministic plan from protocols, used when the AI is unavailable. */
function fallback(donorId) {
  const findings = health.findings(donorId);
  const c = cover.evaluate(donorId);
  const seen = new Set();
  const actions = [];
  for (const f of findings) {
    if (f.severity === 'urgent') {
      actions.unshift({ title: 'See a doctor today', why: `${f.title}: ${f.detail}`, how: ['Visit the nearest hospital or primary care centre today', 'Show them this result'],
        category: 'see_doctor', timeframe: 'Today', evidence: f.evidence, expectedEffect: '' });
      continue;
    }
    const template = FALLBACK_ACTIONS[f.concept];
    if (!template || seen.has(f.concept)) continue;
    seen.add(f.concept);
    const guide = tools.run('get_lifestyle_guidance', { topic: template.topic }, donorId);
    const recs = guide.recommendations || [];
    actions.push({ title: template.title, why: `${f.title}: ${f.detail}`, how: recs.slice(0, 3).map((r) => `${r.intervention}: ${r.target}`),
      category: template.category, timeframe: f.protocolId ? `Recheck in ${store.protocols.get(f.protocolId)?.followUpDays || 90} days` : 'Next donation',
      evidence: [...f.evidence, ...(f.protocolId ? [`Protocol ${f.protocolId}`] : [])], expectedEffect: recs[0]?.expectedEffect || '' });
  }
  const eligibility = health.eligibility(donorId);
  return {
    plan: {
      summary: findings.length ? `You have ${findings.length} result(s) worth acting on. The actions below follow the clinical protocols for each.` : 'Your results are all in healthy ranges. Keep doing what you are doing.',
      urgency: findings.some((f) => f.severity === 'urgent') ? 'urgent' : findings.some((f) => ['high', 'moderate'].includes(f.severity)) ? 'soon' : 'routine',
      actions: actions.slice(0, 4),
      doctorNote: findings.map((f) => `${f.title} — ${f.detail}${f.protocolId ? ` (${f.protocolId})` : ''}`).join('; ') || 'No abnormal findings.',
      coverGoal: c.blockedBy === 'monitoring'
        ? `Your score already qualifies for ₹${c.eligibleCover / 1e5} lakh; one more monitored visit this year unlocks it.`
        : c.pointsToNextStep != null
          ? `${c.pointsToNextStep} more health-score point${c.pointsToNextStep === 1 ? '' : 's'} would move your cover to ₹${c.nextStep / 1e5} lakh.`
          : `Your cover is ₹${c.currentCover / 1e5} lakh — the top step.`,
      nextCheck: eligibility.nextEligibleDate ? `Next donation and free check-up from ${eligibility.nextEligibleDate}` : 'After your doctor clears you',
    },
    steps: [],
    generatedBy: 'rules',
  };
}

module.exports = { generate, fallback, PLAN_SCHEMA };
