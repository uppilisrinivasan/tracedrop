/**
 * Donor API — serves a donor's profile, vitals, findings, donations and care
 * plans from the synthetic data store. All responses use
 * { success, data, timestamp } to match ApiResponse<T> on the frontend.
 */

const express = require('express');
const store = require('../database/syntheticStore');

const router = express.Router();

function ok(res, data) {
  res.json({ success: true, data, timestamp: new Date().toISOString() });
}

function notFound(res, message) {
  res.status(404).json({ success: false, error: message, timestamp: new Date().toISOString() });
}

// Every route below needs a known donor
router.param('donorId', (req, res, next, donorId) => {
  const donor = store.getDonor(donorId);
  if (!donor) return notFound(res, `Donor ${donorId} not found`);
  req.donor = donor;
  next();
});

router.get('/:donorId', (req, res) => ok(res, req.donor));

router.get('/:donorId/observations', (req, res) => {
  const days = parseInt(req.query.days, 10) || undefined;
  ok(res, store.getObservations(req.donor.id, { days, type: req.query.type }));
});

router.get('/:donorId/findings', (req, res) => {
  const findings = store.getFindings(req.donor.id);
  const limit = parseInt(req.query.limit, 10) || findings.length;
  const items = findings.slice(0, limit);
  ok(res, { items, total: findings.length, page: 1, pageSize: limit, hasMore: findings.length > limit });
});

router.get('/:donorId/findings/:findingId', (req, res) => {
  const finding = store.getFindings(req.donor.id).find((f) => f.id === req.params.findingId);
  if (!finding) return notFound(res, `Finding ${req.params.findingId} not found`);
  ok(res, finding);
});

router.get('/:donorId/donations', (req, res) => ok(res, store.getDonations(req.donor.id)));

router.get('/:donorId/donations/last', (req, res) => {
  const last = store.getDonations(req.donor.id).find((d) => d.status === 'completed');
  if (!last) return notFound(res, 'No completed donations');
  ok(res, last);
});

router.get('/:donorId/care-plans', (req, res) => ok(res, store.getCarePlans(req.donor.id)));

// No appointments are booked in the synthetic dataset yet
router.get('/:donorId/appointments', (req, res) => ok(res, []));

module.exports = router;
