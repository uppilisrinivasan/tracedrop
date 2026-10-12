/**
 * Drop engine rules: the six walkthroughs from the Drop-first Home prototype,
 * run against the real engine and the demo clock (starts Sat 10 Oct 2026, morning).
 */

const test = require('node:test');
const assert = require('node:assert');
const store = require('../src/data/store');
const health = require('../src/domain/health');
const drop = require('../src/domain/drop');

const DAY = 4; // parts of a day on the demo clock
const advance = (parts) => { for (let i = 0; i < parts; i += 1) store.stepClock(); };
const open = (donorId) => drop.view(donorId).open;
const card = (donorId, type, variant) => open(donorId).find((c) => c.type === type && (!variant || c.variant === variant));

test.beforeEach(() => store.resetDemo());

test('results to booking: one new card a day, and the slots Arjun asked for skip the budget', () => {
  assert.deepEqual(open('D-001').map((c) => c.type), ['impact']);
  advance(DAY); // Sun 11 Oct morning: results arrive
  const results = card('D-001', 'results', 'results');
  assert.ok(results, 'results card sent');
  assert.match(results.text, /148\/94/);
  assert.equal(drop.view('D-001').budget.today, 1);
  drop.answer('D-001', results.id, 'book');
  const slots = card('D-001', 'slots', 'care');
  assert.ok(slots, 'slots card opened');
  assert.equal(drop.view('D-001').budget.today, 1, 'asked-for cards do not count');
  const view = drop.answer('D-001', slots.id, slots.chips[0].value);
  assert.ok(view.receipts.some((r) => /^Booked Sat 17 Oct/.test(r.receipt)));
});

test('budget: at most one new card a day; the rest wait', () => {
  drop.view('D-001');
  drop._addEvent('D-001', { key: 't1', kind: 'checkin', at: '2026-10-10', data: { marker: 'bp' } });
  drop._addEvent('D-001', { key: 't2', kind: 'donate', at: '2026-10-10', data: { from: '2027-01-01' } });
  drop._deliver('D-001');
  // The seeded impact card already used today's one new card
  assert.equal(open('D-001').length, 1);
  assert.equal(drop.view('D-001').waiting.length, 2);
  advance(DAY); // Sunday: results (priority 2) beats both
  assert.ok(card('D-001', 'results'));
  assert.ok(!card('D-001', 'slots', 'donate'));
});

test('quiet hours: nothing new at 9 pm; it waits until morning', () => {
  drop.view('D-001');
  advance(3); // Sat 9 pm
  drop._addEvent('D-001', { key: 't-night', kind: 'checkin', at: '2026-10-10', data: { marker: 'bp' } });
  drop._deliver('D-001');
  assert.ok(!card('D-001', 'checkin'));
  assert.ok(drop.view('D-001').budget.quiet);
});

test('urgent cards come first, cannot be hidden and can only wait an hour', () => {
  const urgent = card('D-017', 'urgent');
  assert.ok(urgent);
  assert.throws(() => drop.hide('D-017', urgent.id), /can't be hidden/);
  assert.throws(() => drop.snooze('D-017', urgent.id, 'tomorrow'), /an hour/);
  drop.snooze('D-017', urgent.id, 'hour');
  assert.ok(!card('D-017', 'urgent'));
  advance(1);
  assert.ok(card('D-017', 'urgent'), 'back after an hour');
});

test('snoozed three times, a card folds into the next weekly report', () => {
  advance(DAY);
  let results = card('D-001', 'results', 'results');
  drop.snooze('D-001', results.id, 'tonight'); // 7 pm, not in quiet hours
  advance(2);
  results = card('D-001', 'results', 'results');
  assert.ok(results, 'back at 7 pm');
  drop.snooze('D-001', results.id, 'tomorrow');
  advance(2);
  results = card('D-001', 'results', 'results');
  drop.snooze('D-001', results.id, 'week');
  assert.ok(drop.view('D-001').later.some((l) => l.label === 'Results' && l.status === 'folded'));
});

test('Sunday afternoon report folds in what is waiting, with a button to answer it', () => {
  advance(DAY); // Sun morning
  drop.answer('D-001', card('D-001', 'results').id, 'book');
  drop._addEvent('D-001', { key: 't-wait', kind: 'checkin', at: '2026-10-11', data: { marker: 'bp' } });
  advance(1); // Sun afternoon: report
  const report = card('D-001', 'report');
  assert.ok(report);
  assert.ok(report.chips.some((c) => /Check-in/.test(c.label)), 'waiting check-in offered from the report');
  drop.answer('D-001', report.id, report.chips.find((c) => /Check-in/.test(c.label)).value);
  assert.ok(card('D-001', 'checkin', 'bp'));
});

test('a week unanswered, a card folds into the report', () => {
  drop.view('D-001');
  advance(DAY * 7);
  assert.ok(!card('D-001', 'impact'));
  assert.ok(drop.view('D-001').later.some((l) => l.reason === 'unanswered for a week'));
});

test('memory: weekday evenings replace Saturdays, with an undo line', () => {
  advance(DAY);
  drop.answer('D-001', card('D-001', 'results').id, 'book');
  const view = drop.answer('D-001', card('D-001', 'slots', 'care').id, 'evenings');
  assert.ok(view.memory.some((m) => /evenings/.test(m.text)));
  assert.ok(!view.memory.some((m) => /Saturdays/.test(m.text)));
  assert.match(view.memReceipt, /replaces "Saturdays suit you"/);
  assert.match(card('D-001', 'slots', 'care').text, /Weekday evenings/);
  assert.ok(drop.undoMemory('D-001').memory.some((m) => /Saturdays/.test(m.text)));
});

test('reminders: outside the budget, and unanswered ones become "no answer"', () => {
  advance(DAY);
  const st = drop._state('D-001');
  st.reminders.push({ id: 'r-test', label: 'BP tablet', time: '21:00' });
  advance(3); // Sun 9 pm
  const r = card('D-001', 'reminder', 'due');
  assert.ok(r, 'reminder shows at night');
  advance(1); // Mon morning
  assert.ok(!card('D-001', 'reminder', 'due'));
  assert.equal(st.reminderLog[0].answer, 'no answer');
});

test("Meera's report with Hb 12.6 clears her deferral and brings the goal card at once", () => {
  assert.equal(health.eligibility('D-002').eligibleNow, false);
  const checkin = card('D-002', 'checkin', 'hb');
  drop.answer('D-002', checkin.id, { value: 12.6, date: '2026-10-08', source: 'sample report' });
  assert.equal(health.eligibility('D-002').eligibleNow, true);
  assert.match(card('D-002', 'results', 'goal').text, /12\.6/);
  drop.undo('D-002');
  assert.equal(health.eligibility('D-002').eligibleNow, false, 'undo removes the uploaded result');
});

const tools = require('../src/ai/tools');
const screenLines = require('../src/domain/screenLines');
const { keepsFacts } = require('../src/ai/dropWriter');

test('chat memory: preferences are kept, health facts are refused', () => {
  assert.ok(tools.run('remember', { fact: 'I take my BP tablet at night' }, 'D-001').error);
  const out = tools.run('remember', { fact: 'Weekday evenings suit you', replaces: 'Saturday' }, 'D-001');
  assert.match(out._ui.text, /replaces "Saturdays suit you"/);
});

test('a reading told in chat lands in Health and moves the BP goal line', () => {
  drop.answer('D-001', (advance(DAY), card('D-001', 'results', 'results')).id, 'ok');
  drop._state('D-001').plan = { goals: [{ marker: 'bp', label: 'BP under 135/85' }], activity: null, notes: [] };
  tools.run('log_reading', { systolic: 141, diastolic: 90 }, 'D-001');
  assert.match(screenLines.line('D-001', 'health').text, /^BP 141\/90 on .*, down from 148/);
  assert.throws(() => tools.run('log_reading', { systolic: 60, diastolic: 90 }, 'D-001'), /out of range/);
});

test('every screen has a true line for every demo Persona', () => {
  for (const id of ['D-001', 'D-002', 'D-003', 'D-017', 'D-050', 'D-033']) {
    for (const screen of Object.keys(screenLines.SCREENS)) assert.ok(screenLines.line(id, screen).text.length > 10, `${id} ${screen}`);
  }
});

test('switching language clears AI wording so open Cards are rewritten', () => {
  const [{ sig }] = drop.openForWriting('D-001');
  const c = card('D-001', 'impact');
  drop.setAi('D-001', c.id, { text: 'AI text with 3 Oct', labels: null, sig });
  assert.equal(card('D-001', 'impact').text, 'AI text with 3 Oct');
  drop.setLanguage('D-001', 'kn');
  assert.notEqual(card('D-001', 'impact').text, 'AI text with 3 Oct');
  assert.throws(() => drop.setLanguage('D-001', 'xx'), /Unsupported/);
});

test('AI wording must keep every number from the rule wording', () => {
  assert.ok(keepsFacts('BP 148/94, up (132, 136, 148).', 'Your BP was 148/94: 132, 136 then 148.'));
  assert.ok(!keepsFacts('BP 148/94, up (132, 136, 148).', 'Your BP went up to 148.'));
});

test("AI wording stops applying when the Card's content changes (no stale slot labels)", () => {
  advance(DAY);
  drop.answer('D-001', card('D-001', 'results', 'results').id, 'book');
  const slots = drop.openForWriting('D-001').find((p) => p.card.variant === 'care');
  drop.setAi('D-001', slots.card.id, { text: 'Saturdays: pick one', labels: { chips: ['Sat A', 'Sat B', 'Sat C', 'Evenings'] }, sig: slots.sig });
  assert.equal(card('D-001', 'slots', 'care').chips[0].label, 'Sat A');
  drop.answer('D-001', slots.card.id, 'evenings');
  const after = card('D-001', 'slots', 'care');
  assert.equal(after.byAi, false);
  assert.match(after.chips[0].label, /18:30/);
});

test('Next event follows the Donor being viewed and skips their routine reminders', () => {
  drop.view('D-002'); // Meera has a daily 2 pm reminder
  drop.nextEvent('D-001');
  assert.equal(store.clock().date, '2026-10-11', "Arjun's results, not Meera's reminder");
});
