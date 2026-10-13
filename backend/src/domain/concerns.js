/**
 * Donor concerns about what happened to their blood (wasted unit, wrong tracking,
 * privacy, treatment at the centre). Each concern has a named owner and a deadline;
 * when the deadline passes the donor can escalate to the next authority, so someone
 * is always answerable. Dates follow the demo clock.
 */

const store = require('../data/store');
const impact = require('./impact');

const CATEGORIES = {
  wasted: 'My donation was wasted or expired',
  tracking: 'The tracking of my blood looks wrong',
  privacy: 'I am worried about my privacy',
  conduct: 'How I was treated at the centre',
};

// Who answers at each level, and how many days they have
const LADDER = [
  { owner: 'Medical Officer in charge, blood centre', ackDays: 1, dueDays: 7 },
  { owner: 'State Blood Transfusion Council', ackDays: 2, dueDays: 15 },
  { owner: 'State Drugs Control Department (licensing authority)', ackDays: 3, dueDays: 30 },
];

const concerns = new Map(); // donorId -> [concern]
let seq = 1;
store.onReset(() => { concerns.clear(); seq = 1; });

const addDays = (iso, days) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * 864e5).toISOString().slice(0, 10);

function centreAnswer(c) {
  const unit = c.unit;
  if (c.category === 'wasted' && unit?.expiry) {
    return `We checked unit ${unit.id}. ${unit.expiry.cause.join(' ')} We are reviewing how we time donation drives for ${unit.kind === 'PLT' ? 'platelets' : 'this blood group'}.`;
  }
  if (c.category === 'tracking' && unit) {
    return `We checked unit ${unit.id} against our register. The steps shown in TraceDrop match our records up to "${unit.statusLabel}". If something still looks wrong, tell us which step.`;
  }
  if (c.category === 'privacy') return 'Recipients and hospitals are never named, and dates of use are rounded to the month. Your results are shared with your insurer only as a score, and only if you allowed it.';
  return 'We have spoken to the staff on duty and noted your feedback. The centre\'s donor care lead will call you within two days.';
}

/** Steps that have happened by the demo date, plus who owns it now and by when. */
function view(c) {
  const today = store.today();
  const level = LADDER[c.level];
  const steps = [...c.log];
  const add = (step) => { if (!steps.some((s) => s.text === step.text)) steps.push(step); };
  const ackOn = addDays(c.levelSince, level.ackDays);
  if (today >= ackOn) add({ on: ackOn, text: `Acknowledged by ${level.owner}` });
  // The blood centre answers on day 3; higher levels answer on their own record (not simulated)
  const answerOn = c.level === 0 ? addDays(c.levelSince, 3) : null;
  const answered = Boolean(c.status === 'open' && answerOn && today >= answerOn);
  if (answered) add({ on: answerOn, text: `Answer from ${level.owner}: ${centreAnswer(c)}` });
  const dueOn = addDays(c.levelSince, level.dueDays);
  const overdue = c.status === 'open' && !answered && today > dueOn;
  return {
    id: c.id,
    category: c.category,
    categoryLabel: CATEGORIES[c.category],
    details: c.details,
    unitId: c.unit?.id || null,
    unitName: c.unit ? `${c.unit.name} · donated ${new Date(`${c.unit.donationDate}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}` : null,
    createdOn: c.createdOn,
    status: c.status,
    owner: level.owner,
    level: c.level + 1,
    levels: LADDER.length,
    dueOn,
    overdue,
    answered,
    canEscalate: c.status === 'open' && c.level < LADDER.length - 1 && (overdue || answered),
    nextOwner: LADDER[c.level + 1]?.owner || null,
    steps: steps.sort((a, b) => a.on.localeCompare(b.on)),
  };
}

function list(donorId) {
  return (concerns.get(donorId) || []).map(view).sort((a, b) => b.createdOn.localeCompare(a.createdOn));
}

function find(donorId, id) {
  const c = (concerns.get(donorId) || []).find((x) => x.id === id);
  if (!c) throw new Error('Concern not found');
  return c;
}

function raise(donorId, { category, details, unitId }) {
  if (!CATEGORIES[category]) throw new Error('Choose what the concern is about');
  const text = String(details || '').trim().slice(0, 1000);
  const unit = unitId ? impact.donorJourneys(donorId).find((j) => j.id === unitId) || null : null;
  if (unitId && !unit) throw new Error('That unit is not in your donations');
  const today = store.today();
  const c = {
    id: `CN-${String(seq++).padStart(4, '0')}`,
    donorId, category, details: text, unit, createdOn: today, level: 0, levelSince: today, status: 'open',
    log: [{ on: today, text: `You raised this. Sent to ${LADDER[0].owner}.` }],
  };
  concerns.set(donorId, [...(concerns.get(donorId) || []), c]);
  return view(c);
}

function escalate(donorId, id) {
  const c = find(donorId, id);
  const v = view(c);
  if (!v.canEscalate) throw new Error(c.level >= LADDER.length - 1 ? 'This is already with the highest authority' : `You can escalate after ${v.dueOn} if there is no answer, or once an answer arrives`);
  const today = store.today();
  c.log = v.steps;
  c.level += 1;
  c.levelSince = today;
  c.log.push({ on: today, text: `You escalated this to ${LADDER[c.level].owner}${v.overdue ? ' because the deadline passed' : ' because the answer did not resolve it'}.` });
  return view(c);
}

function resolve(donorId, id) {
  const c = find(donorId, id);
  const v = view(c);
  c.log = [...v.steps, { on: store.today(), text: 'You marked this as resolved.' }];
  c.status = 'resolved';
  return view(c);
}

module.exports = { CATEGORIES, LADDER, list, raise, escalate, resolve };
