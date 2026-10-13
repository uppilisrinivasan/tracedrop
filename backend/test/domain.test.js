/**
 * Tests for the deterministic layer: the parts that decide safety, money and
 * privacy must be correct regardless of the AI. Run: npm test
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const store = require('../src/data/store');
const health = require('../src/domain/health');
const cover = require('../src/domain/cover');
const impact = require('../src/domain/impact');
const community = require('../src/domain/community');

test('urgent blood pressure blocks donation and is flagged urgent', () => {
  const findings = health.findings('D-017');
  assert.equal(findings[0].id, 'BP_URGENCY');
  assert.equal(findings[0].severity, 'urgent');
  const e = health.eligibility('D-017');
  assert.equal(e.eligibleNow, false);
  assert.equal(e.nextEligibleDate, null);
});

test('low haemoglobin with falling ferritin is detected as iron deficiency', () => {
  const ids = health.findings('D-002').map((f) => f.id);
  assert.ok(ids.includes('HB_LOW'));
  assert.ok(ids.includes('IRON_LOW'));
  assert.equal(health.eligibility('D-002').eligibleNow, false);
});

test('healthy donor has no findings, a top score and top cover', () => {
  assert.deepEqual(health.findings('D-003'), []);
  const c = cover.evaluate('D-003');
  assert.equal(c.healthScore, 100);
  assert.equal(c.currentCover, 800000);
});

test('rising blood pressure trend is caught before it becomes hypertension', () => {
  const ids = health.findings('D-050').map((f) => f.id); // Karthik: 126 -> 132 -> 138
  assert.ok(ids.includes('BP_RISING'));
  assert.ok(!ids.includes('BP_GRADE1'));
});

test("Arjun's 3 Oct donation (demo overlay) shows stage 1 BP on top of the rising trend", () => {
  const ids = health.findings('D-001').map((f) => f.id);
  assert.ok(ids.includes('BP_RISING'));
  assert.ok(ids.includes('BP_GRADE1'));
});

test('cover never goes below base and never above the cap', () => {
  for (const d of store.allDonors().filter((x) => x.policyId)) {
    const c = cover.evaluate(d.id);
    assert.ok(c.currentCover >= c.baseCover, d.id);
    assert.ok(c.currentCover <= 800000, d.id);
  }
});

test('cover is monotonic in health score', () => {
  let last = 0;
  for (let s = 0; s <= 100; s += 1) {
    const { cover: value } = cover.simulate('D-001', s);
    assert.ok(value >= last, `score ${s}`);
    last = value;
  }
});

test('cover increase requires consent and consistent monitoring', () => {
  const donor = store.getDonor('D-033');
  const c = cover.evaluate('D-033');
  assert.ok(c.eligibleCover > c.baseCover);
  assert.equal(c.currentCover, c.baseCover);
  assert.equal(c.blockedBy, 'monitoring');
  const consent = donor.consent.shareHealthWithInsurer;
  donor.consent.shareHealthWithInsurer = false;
  assert.equal(cover.evaluate('D-003').currentCover, 800000);
  donor.consent.shareHealthWithInsurer = consent;
});

test('recipients are anonymised: no names, ids, exact ages or hospital names', () => {
  const allowed = new Set(['patient', 'context', 'contextKey', 'place', 'outcome', 'generalised']);
  for (const d of store.allDonors().slice(0, 80)) {
    for (const j of impact.donorJourneys(d.id)) {
      if (!j.recipient) continue;
      for (const key of Object.keys(j.recipient)) assert.ok(allowed.has(key), `unexpected field ${key}`);
      assert.doesNotMatch(JSON.stringify(j.recipient), /H-\d\d|"age"/);
      for (const e of j.events) {
        if (['transfused', 'issued', 'outcome'].includes(e.type)) assert.doesNotMatch(e.when, /^\d{4}-\d{2}-\d{2}$/);
      }
    }
  }
});

test('units from a donation with a confidential follow-up are withheld with no reason', () => {
  const journeys = impact.donorJourneys('D-033');
  const withheld = journeys.filter((j) => j.withheld);
  assert.ok(withheld.length > 0);
  for (const j of withheld) {
    assert.equal(j.recipient, null);
    assert.equal(j.status, 'withheld');
  }
});

test('community views expose only aggregates and opted-in names', () => {
  for (const c of community.forDonor('D-001')) {
    for (const row of c.leaderboard) {
      assert.deepEqual(Object.keys(row).sort(), ['donations', 'isYou', 'lastDonation', 'name', 'onlyYou', 'patientsHelped'].sort());
    }
    assert.doesNotMatch(JSON.stringify(c), /haemoglobin|systolic|hba1c|ferritin/i);
  }
});
