/**
 * Donor API. Every route is scoped to one donor; responses use
 * { success, data } and never include recipient identities or other donors'
 * health data.
 */

const express = require('express');
const store = require('../data/store');
const health = require('../domain/health');
const cover = require('../domain/cover');
const impact = require('../domain/impact');
const community = require('../domain/community');
const donation = require('../domain/donation');
const booking = require('../booking/service');
const settings = require('../auth/userSettings');
const llm = require('../ai/llm');
const copilot = require('../ai/copilot');
const carePlan = require('../ai/carePlan');
const labReader = require('../ai/labReader');
const stories = require('../ai/stories');
const concerns = require('../domain/concerns');
const insights = require('../ai/insights');

const router = express.Router();

const ok = (res, data) => res.json({ success: true, data });
const fail = (res, status, error) => res.status(status).json({ success: false, error });

/** Run an AI feature; if AI is unavailable, use the deterministic fallback. */
async function withFallback(res, aiFn, fallbackFn) {
  try {
    return ok(res, await aiFn());
  } catch (error) {
    if (error instanceof llm.LLMUnavailable && fallbackFn) {
      return ok(res, { ...(await fallbackFn()), aiUnavailable: error.message });
    }
    console.error(error);
    return fail(res, error instanceof llm.LLMUnavailable ? 503 : 400, error.message);
  }
}

router.get('/', (req, res) => {
  const personas = ['D-001', 'D-002', 'D-003', 'D-017', 'D-050', 'D-033'];
  ok(res, personas.map((id) => {
    const d = store.getDonor(id);
    return { id, name: d.name, bloodGroup: d.bloodGroup, language: d.language };
  }));
});

router.param('donorId', (req, res, next, donorId) => {
  req.donor = store.getDonor(donorId);
  if (!req.donor) return fail(res, 404, `Donor ${donorId} not found`);
  return next();
});

/** Everything the home screen needs in one call. */
router.get('/:donorId/overview', (req, res) => {
  const id = req.donor.id;
  const visits = store.getDonations(id);
  const journeys = impact.donorJourneys(id);
  const scores = health.scoreHistory(id);
  const c = cover.evaluate(id);
  ok(res, {
    donor: { ...req.donor, policyId: undefined },
    today: store.today(),
    donations: { completed: visits.filter((v) => v.status === 'completed').length, deferred: visits.filter((v) => v.status === 'deferred').length,
      firstDate: visits.length ? visits[0].date : null, litres: Number((visits.filter((v) => v.status === 'completed').reduce((s, v) => s + v.volumeMl, 0) / 1000).toFixed(2)) },
    impact: impact.summarise(journeys),
    latestJourney: journeys.filter((j) => j.recipient).slice(-1)[0] || null,
    health: { score: scores.length ? scores[scores.length - 1].score : null, previousScore: scores.length > 1 ? scores[scores.length - 2].score : null,
      findings: health.findings(id).map(({ id: fid, title, severity, detail }) => ({ id: fid, title, severity, detail })) },
    eligibility: health.eligibility(id),
    cover: { base: c.baseCover, current: c.currentCover, eligible: c.eligibleCover, next: c.nextStep, pointsToNext: c.pointsToNextStep, blockedBy: c.blockedBy },
    communities: community.forDonor(id).map(({ id: cid, name, kind, memberCount, totals }) => ({ id: cid, name, kind, memberCount, totals })),
    ai: llm.status(),
  });
});

router.get('/:donorId/donations', (req, res) => ok(res, store.getDonations(req.donor.id).map((v) => ({
  ...v, centre: store.centre(v.centreId).name, confidentialFollowUp: undefined,
}))));

router.get('/:donorId/impact', (req, res) => {
  const journeys = impact.donorJourneys(req.donor.id);
  ok(res, { summary: impact.summarise(journeys), journeys, components: impact.COMPONENTS, k: impact.K_ANON });
});

router.get('/:donorId/stakeholders', (req, res) => ok(res, impact.stakeholders(req.donor.id)));

router.get('/:donorId/health', (req, res) => {
  const id = req.donor.id;
  const labs = health.labSeries(id);
  ok(res, {
    findings: health.findings(id),
    scores: health.scoreHistory(id),
    vitals: health.vitalsSeries(id),
    labs: Object.fromEntries(Object.entries(labs).map(([k, list]) => [k, list.map(({ id, date, value, unit, low, high, name, source }) => ({ id, date, value, unit, low, high, name, source }))])),
    eligibility: health.eligibility(id),
    bmi: Number(health.bmi(req.donor, health.vitalsSeries(id).slice(-1)[0]?.weightKg || 60).toFixed(1)),
  });
});

router.get('/:donorId/cover', (req, res) => ok(res, cover.evaluate(req.donor.id)));
router.get('/:donorId/cover/simulate', (req, res) => ok(res, cover.simulate(req.donor.id, Number(req.query.score))));

router.get('/:donorId/communities', (req, res) => ok(res, community.forDonor(req.donor.id)));

router.patch('/:donorId/consent', (req, res) => {
  const allowed = ['shareHealthWithInsurer', 'showOnLeaderboard', 'includeInCommunityStats'];
  for (const key of allowed) if (typeof req.body[key] === 'boolean') req.donor.consent[key] = req.body[key];
  ok(res, req.donor.consent);
});

// ---- Donation flow
router.get('/:donorId/slots', (req, res) => ok(res, donation.slots(req.donor.id)));
router.post('/:donorId/booking/recommend', async (req, res) => {
  try {
    const body = req.body || {};
    ok(res, await booking.availability(req.user, req.donor.id, body.preferences, body.accessToken));
  } catch (error) {
    fail(res, error.status || 400, error.message);
  }
});
router.post('/:donorId/appointments', async (req, res) => {
  try {
    ok(res, await booking.confirm(req.user, req.donor, req.body || {}));
  } catch (error) {
    fail(res, error.status || 400, error.message);
  }
});
router.post('/:donorId/appointments/:appointmentId/cancel', async (req, res) => {
  try {
    ok(res, await booking.cancel(req.user, req.donor.id, req.params.appointmentId, req.body && req.body.accessToken));
  } catch (error) {
    fail(res, error.status || 400, error.message);
  }
});
router.get('/:donorId/appointments', async (req, res) => {
  try {
    const rows = await settings.listAppointments(req.user, req.donor.id);
    store.session.appointments.set(req.donor.id, rows);
    ok(res, rows.map(booking.withCheckIn));
  } catch (error) {
    fail(res, error.status || 400, error.message);
  }
});
router.post('/:donorId/appointments/:appointmentId/checkin', (req, res) => {
  try {
    ok(res, donation.checkIn(req.donor.id, req.params.appointmentId, req.body));
  } catch (error) {
    fail(res, 400, error.message);
  }
});

// ---- GenAI / agentic features
router.post('/:donorId/copilot', (req, res) => {
  const { message, history } = req.body;
  if (!message || typeof message !== 'string') return fail(res, 400, 'message is required');
  return withFallback(res, () => copilot.chat({ donorId: req.donor.id, history, message: message.slice(0, 2000) }), () => copilot.fallback(req.donor.id, message));
});

router.post('/:donorId/care-plan', (req, res) => withFallback(res, async () => {
  const cached = store.session.carePlans.get(req.donor.id);
  if (cached && !req.query.refresh) return cached;
  const plan = { ...(await carePlan.generate(req.donor.id)), generatedAt: new Date().toISOString() };
  store.session.carePlans.set(req.donor.id, plan);
  return plan;
}, () => carePlan.fallback(req.donor.id)));

router.post('/:donorId/labs/extract', (req, res) => {
  const { text, image } = req.body;
  if (!text && !image) return fail(res, 400, 'Provide report text or an image');
  return withFallback(res, () => labReader.extract({ donorId: req.donor.id, text, image }), null);
});

router.post('/:donorId/labs/save', (req, res) => {
  const result = labReader.save(req.donor.id, req.body);
  store.session.carePlans.delete(req.donor.id); // plan must reflect new results
  ok(res, result);
});

router.post('/:donorId/impact/:componentId/story', (req, res) => {
  const journey = impact.donorJourneys(req.donor.id).find((j) => j.id === req.params.componentId);
  if (!journey || !journey.recipient) return fail(res, 404, 'No patient story for this unit yet');
  return withFallback(res, () => stories.write(req.donor.id, req.params.componentId, { refresh: Boolean(req.query.refresh) }), () => stories.template(journey, req.donor));
});

router.get('/:donorId/concerns', (req, res) => ok(res, concerns.list(req.donor.id)));
router.post('/:donorId/concerns', (req, res) => {
  try {
    ok(res, concerns.raise(req.donor.id, req.body || {}));
  } catch (error) {
    fail(res, 400, error.message);
  }
});
router.post('/:donorId/concerns/:concernId/:action(escalate|resolve)', (req, res) => {
  try {
    ok(res, concerns[req.params.action](req.donor.id, req.params.concernId));
  } catch (error) {
    fail(res, 400, error.message);
  }
});

router.get('/:donorId/insights', (req, res) => withFallback(res, () => insights.forDonor(req.donor.id), () => insights.fallback(req.donor.id)));

module.exports = router;
