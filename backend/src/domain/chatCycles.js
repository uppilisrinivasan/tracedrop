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

function listPast(donorId) {
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

module.exports = {
  recordTurn,
  activeChat,
  listPast,
  getPast,
  archiveCurrentCycle,
  cycleId,
};
