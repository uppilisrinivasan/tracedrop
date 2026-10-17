/**
 * Demo-cycle chat history: one "cycle" runs from timeline start until Reset.
 * Current-cycle turns are kept for Drop chat; past cycles are read-only archives.
 * Synced to Vertex Agent Engine Sessions when configured (see agentPlatform.js).
 */

const store = require('../data/store');
const drop = require('./drop');

/** @type {Map<string, { id: string, label: string, startedOn: string, endedOn: string, chats: Record<string, { turns: object[], history: object[] | null }>, dropEarlier: object[] }[]>} */
const pastByDonor = new Map();

/** @type {Map<string, Record<string, { turns: object[], history: object[] | null }>>} */
const currentByDonor = new Map();

/** One seeded archive per demo persona so judges see Past Cycles before the first Reset. */
const demoPastSeeded = new Set();

function cycleId() {
  return store.clock().start || store.today();
}

function cycleLabel(id) {
  const d = new Date(`${id}T00:00:00Z`);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function chatKey(chat) {
  return typeof chat === 'string' && chat ? chat.slice(0, 40) : 'general';
}

function ensureCurrent(donorId) {
  if (!currentByDonor.has(donorId)) currentByDonor.set(donorId, {});
  return currentByDonor.get(donorId);
}

function recordTurn(donorId, chat, { userText, assistantText, history }) {
  const key = chatKey(chat);
  const bucket = ensureCurrent(donorId);
  if (!bucket[key]) bucket[key] = { turns: [], history: null };
  const entry = bucket[key];
  entry.turns.push({ at: store.today(), user: userText, assistant: assistantText });
  if (history) entry.history = history;
  entry.turns = entry.turns.slice(-40);
  return entry;
}

function activeChat(donorId, chat) {
  const key = chatKey(chat);
  const bucket = currentByDonor.get(donorId);
  if (!bucket || !bucket[key]) return { cycleId: cycleId(), turns: [], history: null };
  return { cycleId: cycleId(), turns: bucket[key].turns, history: bucket[key].history };
}

function seedDemoPastIfEmpty(donorId) {
  if (demoPastSeeded.has(donorId) || (pastByDonor.get(donorId) || []).length) return;
  const donor = store.getDonor(donorId);
  if (!donor || donor.newUser) return;
  demoPastSeeded.add(donorId);
  const start = store.clock().start || store.today();
  const endedOn = addDaysUtc(start, -14);
  const first = String(donor.name || '').split(' ')[0] || 'there';
  const list = [{
    id: `seed-${donorId}-${start}`,
    label: 'Earlier demo cycle (sample)',
    startedOn: addDaysUtc(start, -28),
    endedOn,
    chats: {
      general: {
        turns: [
          { at: endedOn, user: 'Where did my blood go?', assistant: `${first}, your components reached patients in cancer care and trauma settings — open My impact for the journey.` },
          { at: endedOn, user: 'When can I donate again?', assistant: 'I can check your eligibility from your last visit — ask anytime in this cycle.' },
        ],
        history: null,
      },
    },
    dropEarlier: [],
  }];
  pastByDonor.set(donorId, list);
}

function addDaysUtc(isoDate, days) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function currentCycle(donorId) {
  seedDemoPastIfEmpty(donorId);
  const bucket = currentByDonor.get(donorId) || {};
  const chats = {};
  for (const [key, entry] of Object.entries(bucket)) {
    if (entry.turns.length) chats[key] = { turns: entry.turns, history: entry.history };
  }
  return { cycleId: cycleId(), label: 'This cycle', startedOn: cycleId(), chats };
}

function listPast(donorId) {
  seedDemoPastIfEmpty(donorId);
  return (pastByDonor.get(donorId) || []).map((c) => ({
    id: c.id,
    label: c.label,
    startedOn: c.startedOn,
    endedOn: c.endedOn,
    chatCount: Object.keys(c.chats).length,
    dropCount: c.dropEarlier.length,
  }));
}

function getPast(donorId, id) {
  const c = (pastByDonor.get(donorId) || []).find((x) => x.id === id);
  if (!c) return null;
  return c;
}

/** Call before store.resetDemo() clears Drop state. */
function archiveCurrentCycle() {
  const endedOn = store.today();
  const id = cycleId();
  const label = `Cycle from ${cycleLabel(id)}`;
  for (const donor of store.allDonors()) {
    const donorId = donor.id;
    const chats = currentByDonor.get(donorId) || {};
    const hasChat = Object.values(chats).some((c) => c.turns.length);
    let dropEarlier = [];
    try {
      dropEarlier = drop.view(donorId).earlier;
    } catch {
      dropEarlier = [];
    }
    if (!hasChat && !dropEarlier.length) continue;
    const list = pastByDonor.get(donorId) || [];
    list.unshift({
      id: `${id}-${endedOn}`,
      label,
      startedOn: id,
      endedOn,
      chats: JSON.parse(JSON.stringify(chats)),
      dropEarlier: JSON.parse(JSON.stringify(dropEarlier)),
    });
    pastByDonor.set(donorId, list.slice(0, 12));
  }
  currentByDonor.clear();
}

/** @internal test isolation */
function resetState() {
  pastByDonor.clear();
  currentByDonor.clear();
  demoPastSeeded.clear();
}

module.exports = {
  recordTurn,
  activeChat,
  currentCycle,
  listPast,
  getPast,
  archiveCurrentCycle,
  cycleId,
  seedDemoPastIfEmpty,
  resetState,
};
