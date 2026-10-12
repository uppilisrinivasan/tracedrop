/**
 * Drop's chat: answers open questions across the platform ("how's my BP?",
 * "where did my platelets go?", "book me a check-up") by calling tools, and
 * replies in one or two sentences plus at most one Card (a chart, slots or a
 * reminder). Every turn it reads what it remembers about the Donor and their
 * Plan. Conversation history is kept client-side and sent back each turn.
 */

const store = require('../data/store');
const health = require('../domain/health');
const drop = require('../domain/drop');
const screenLines = require('../domain/screenLines');
const llm = require('./llm');
const { runAgent } = require('./agent');
const tools = require('./tools');

// Slots are offered as a Card (offer_care_slots), never listed as text
const CHAT_TOOLS = tools.definitions().map((d) => d.name).filter((n) => n !== 'find_care_slots');

const LANGUAGE_NAMES = { en: 'English', hi: 'Hindi', kn: 'Kannada', ta: 'Tamil', te: 'Telugu', ml: 'Malayalam' };

const SYSTEM = `You are Drop, the assistant inside TraceDrop, an app for voluntary blood donors in India.
TraceDrop shows donors (1) where every component of their donated blood went and who it helped, without revealing recipients, (2) their health from the free lab panel run on each donation sample, with trends and a Plan, (3) how sustained good health raises their health-insurance cover for the same premium, and (4) the impact on their communities.

How you answer:
- Hard limit: two short, warm sentences (about 40 words), even when explaining results: say the one or two things that matter most and offer to say more. Longer only if they ask for detail. Never a list unless asked. Use the donor's first name now and then.
- Get facts from tools. Never invent numbers, dates, results or recipients; if a tool doesn't have it, say so.
- When something visual helps, show at most ONE card per reply and refer to it: show_chart for a trend ("Here's your BP since 2024."), offer_care_slots to book a free check-up, offer_reminder when they ask to be reminded of something.
- When they tell you a lasting preference or life detail (days or times that suit, work pattern, area, language, food habits), call remember. Never remember health facts, religion, caste, income, family members' health or anything about recipients. When they tell you a BP reading, call log_reading.
- Health: explain plainly what a result means and what the Plan says next. You don't diagnose or prescribe medicine. For anything urgent, tell them to see a doctor today and offer_care_slots.
- Recipients are anonymous: only age band, clinical use and hospital type.
- Insurance: explain the rule (score -> risk -> cover step) from tool data; never promise cover the tool doesn't show.
- When they ask where something is, call navigate.
- Write in the language given below unless they write in another language; then use theirs. Keep numbers as digits.`;

function context(donorId) {
  const donor = store.getDonor(donorId);
  const c = drop.chatContext(donorId);
  return `Today: ${store.today()}. Donor: ${donor.name} (${donorId}). Write in ${LANGUAGE_NAMES[c.language] || 'English'}.
What you remember about them: ${c.memory.join('; ') || 'nothing yet'}.
Their Plan: ${c.plan.join('; ') || 'none yet'}. Reminders: ${c.reminders.join('; ') || 'none'}. Latest reading they gave you: ${c.latestReading || 'none'}.
Cards waiting for them on Home: ${c.openCards.join(', ') || 'none'}.`;
}

async function chat({ donorId, history, message }) {
  const messages = [...(history || []), { role: 'user', content: message }];
  const result = await runAgent({ feature: 'copilot', system: `${SYSTEM}\n\n${context(donorId)}`, messages, donorId, toolNames: CHAT_TOOLS, maxTokens: 2500, effort: 'low' });
  if (!result.text && !result.actions.some((x) => x.type !== 'navigate')) {
    // The model looked things up but gave no words: answer the question from the rules instead
    const rules = fallback(donorId, message);
    return { reply: rules.reply, steps: result.steps, actions: rules.actions, history: result.messages, answeredByRules: true };
  }
  return { reply: result.text || defaultReply(result.actions), steps: result.steps, actions: result.actions, history: result.messages };
}

/** When the model ends after a tool call without words, say what happened. */
function defaultReply(actions) {
  const kinds = actions.map((a) => a.type);
  if (kinds.includes('memory')) return "Got it, I'll remember that.";
  if (kinds.includes('receipt')) return 'Saved.';
  if (kinds.includes('card') || kinds.includes('chart')) return 'Here you go.';
  return 'Done.';
}

/** Rule-based answers for common questions when Vertex AI is unavailable. */
function fallback(donorId, message) {
  const m = String(message || '').toLowerCase();
  const out = (reply, actions = []) => ({ reply, steps: [], actions, history: null, offline: true, reason: llm.status().reason });
  if (/remember/.test(m)) {
    const memory = drop.view(donorId).memory.map((x) => x.text);
    return out(memory.length ? `Here's what I remember: ${memory.join('; ')}. You can delete any of it from "What do you remember about me?".` : "I don't remember anything about you yet.");
  }
  if (/\b(bp|blood pressure|trend)\b/.test(m)) {
    return out(screenLines.line(donorId, 'health').text, [{ type: 'chart', marker: 'bp', points: drop.chartPoints(donorId, 'bp') }]);
  }
  if (/result|explain|mean/.test(m)) {
    const f = health.findings(donorId);
    return out(f.length ? `Your latest results: ${f.slice(0, 3).map((x) => `${x.title} (${x.detail})`).join('; ')}. Your Plan on the Health screen has the next steps; a doctor confirms all findings.` : 'All your latest results are in the healthy range.');
  }
  if (/blood go|helped|impact|platelet|red cell/.test(m)) return out(screenLines.line(donorId, 'impact').text);
  if (/donate|eligible|hold/.test(m)) return out(screenLines.line(donorId, 'donate').text);
  if (/cover|insurance/.test(m)) return out(screenLines.line(donorId, 'cover').text);
  if (/check-?up|doctor|book/.test(m)) {
    const card = drop.offerCard(donorId, 'care_slots');
    return out('Here are free check-up slots near you.', [{ type: 'card', cardId: card.id }]);
  }
  return out("I need the AI connection for free-form questions, and it isn't available right now. Try asking about your results, your BP, where your blood went, or when you can donate.");
}

module.exports = { chat, fallback, SYSTEM };
