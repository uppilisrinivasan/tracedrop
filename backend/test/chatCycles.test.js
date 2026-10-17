const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const store = require('../src/data/store');
const chatCycles = require('../src/domain/chatCycles');

describe('chatCycles', () => {
  beforeEach(() => {
    chatCycles.resetState();
    store.resetDemo();
  });

  it('archives turns on demo reset', () => {
    chatCycles.recordTurn('D-001', 'general', { userText: 'Hi', assistantText: 'Hello', history: null });
    chatCycles.archiveCurrentCycle();
    store.resetDemo();
    const past = chatCycles.listPast('D-001');
    assert.ok(past.length >= 1);
    const full = chatCycles.getPast('D-001', past[0].id);
    assert.ok(full.chats.general.turns.length >= 1);
  });

  it('seeds a sample past cycle for demo personas', () => {
    const past = chatCycles.listPast('D-001');
    assert.ok(past.some((c) => c.label.includes('Earlier demo cycle')));
  });

  it('does not seed past cycles for the New donor persona', () => {
    const nu = store.allDonors().find((d) => d.newUser);
    if (!nu) return;
    assert.equal(chatCycles.listPast(nu.id).length, 0);
  });
});
