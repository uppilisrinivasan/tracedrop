/**
 * Intro API: read Drop's Intro for a demo donor, answer a step, skip, replay and
 * finish. The rules live in domain/intro.js. Every response is the Intro's status,
 * its eight steps and what was chosen before (to fill in a replay).
 */

const express = require('express');
const store = require('../data/store');
const intro = require('../domain/intro');

const router = express.Router({ mergeParams: true });

router.use((req, res, next) => {
  if (!store.getDonor(req.params.donorId)) return res.status(404).json({ success: false, error: `Donor ${req.params.donorId} not found` });
  return next();
});

/** The signed-in person's first name for "You're all set, {first}" (none with sign-in off). */
function firstName(req) {
  return req.user && !req.user.local && req.user.name ? String(req.user.name).split(' ')[0] : '';
}

function personal(text, first) {
  return first ? text.replace(/\{first\}/g, first) : text.replace(/, \{first\}/g, '').replace(/\{first\}/g, '');
}

async function payload(req) {
  const donorId = req.params.donorId;
  const first = firstName(req);
  const steps = intro.steps().map((s) => ({ ...s, text: s.text.map((t) => personal(t, first)), after: s.after.map((t) => personal(t, first)) }));
  return { ...intro.status(donorId), steps, prefill: await intro.prefill(donorId, req.user) };
}

/** Run an Intro action; a rule it breaks (e.g. answering the wrong step) comes back as 400 with the reason. */
const act = (fn) => async (req, res) => {
  try {
    const result = await fn(req.params.donorId, req);
    res.json({ success: true, data: { ...(await payload(req)), ...(result && result.saved ? { saved: result.saved } : {}) } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.get('/', act(() => null));
router.post('/answer', act((donorId, req) => intro.answer(donorId, req.body.step, req.body.value, { user: req.user })));
router.post('/skip', act((donorId) => intro.skip(donorId)));
router.post('/replay', act((donorId) => intro.replay(donorId)));
router.post('/finish', act((donorId) => intro.finishIntro(donorId)));

module.exports = router;
