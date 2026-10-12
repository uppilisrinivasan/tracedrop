/**
 * Drop API: the signed-in donor's Cards, answers, snoozes, memory and the
 * readings they added. Every route is scoped to one donor; the rules live in
 * domain/drop.js.
 */

const express = require('express');
const store = require('../data/store');
const drop = require('../domain/drop');
const dropWriter = require('../ai/dropWriter');
const screenLines = require('../domain/screenLines');

const router = express.Router({ mergeParams: true });

const ok = (res, data) => res.json({ success: true, data });

router.use((req, res, next) => {
  if (!store.getDonor(req.params.donorId)) return res.status(404).json({ success: false, error: `Donor ${req.params.donorId} not found` });
  return next();
});

/** Run a Drop action; rule violations (e.g. hiding an urgent Card) come back as 400 with the reason. */
const act = (fn) => (req, res) => {
  try {
    ok(res, fn(req.params.donorId, req));
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/** Reading the conversation lets the AI phrase any new open Cards first (rule wording if it can't). */
router.get('/', async (req, res) => {
  await dropWriter.tryWrite(req.params.donorId);
  act((donorId) => drop.view(donorId))(req, res);
});
router.post('/reopen', async (req, res) => {
  drop.reopen(req.params.donorId);
  await dropWriter.tryWrite(req.params.donorId);
  act((donorId) => drop.view(donorId))(req, res);
});
router.post('/language', act((donorId, req) => drop.setLanguage(donorId, req.body.language)));
router.get('/line/:screen', act((donorId, req) => screenLines.line(donorId, req.params.screen)));
router.post('/cards/:cardId/answer', act((donorId, req) => drop.answer(donorId, req.params.cardId, req.body.value)));
router.post('/cards/:cardId/snooze', act((donorId, req) => drop.snooze(donorId, req.params.cardId, req.body.option)));
router.post('/cards/:cardId/hide', act((donorId, req) => drop.hide(donorId, req.params.cardId)));
router.post('/undo', act((donorId) => drop.undo(donorId)));
router.post('/bookings/:bookingId/cancel', act((donorId, req) => drop.cancelBooking(donorId, req.params.bookingId, { reschedule: Boolean(req.body.reschedule) })));
router.post('/memory/undo', act((donorId) => drop.undoMemory(donorId)));
router.delete('/memory/:memoryId', act((donorId, req) => drop.forget(donorId, req.params.memoryId)));
router.delete('/memory', act((donorId) => drop.forget(donorId, null)));
router.delete('/readings/:readingId', act((donorId, req) => drop.deleteReading(donorId, req.params.readingId)));
router.post('/results/:observationId/hide', act((donorId, req) => drop.hideResult(donorId, req.params.observationId)));

module.exports = router;
