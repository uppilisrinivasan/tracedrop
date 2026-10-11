/**
 * Drop — the donor's AI copilot.
 *
 * Answers open questions across the whole platform ("why did my cover go
 * up?", "where did my platelets go?", "what should I eat for my iron?") by
 * calling tools, and navigates the app on request. Replies in the donor's
 * language. Conversation history is kept client-side and sent back each turn
 * (append-only, so cached prefixes and thinking blocks stay valid).
 */

const store = require('../data/store');
const llm = require('./llm');
const { runAgent } = require('./agent');

const LANGUAGE_NAMES = { en: 'English', hi: 'Hindi', kn: 'Kannada', ta: 'Tamil', te: 'Telugu', ml: 'Malayalam' };

const SYSTEM = `You are Drop, the in-app assistant of TraceDrop, a platform for voluntary blood donors in India.
TraceDrop shows donors (1) where every component of their donated blood went and who it helped, without revealing recipients, (2) their health from the free lab panel run on each donation sample, with trends and a care plan, (3) how sustained good health raises their health-insurance cover for the same premium, and (4) the impact on blood banks, hospitals, labs, government programmes and their communities.

How to work:
- Always call tools to get facts. Never invent numbers, dates, results or recipients. If a tool doesn't return something, say you don't have it.
- Keep answers short and warm: 2-5 sentences or a few bullets. Use the donor's first name occasionally. Use ₹ and Indian number style (₹6 lakh).
- Health: explain findings plainly, say what the protocol recommends, and suggest one or two concrete next steps. You do not diagnose or prescribe medicine. For anything marked urgent, tell them to see a doctor today and offer care slots. Mention that a doctor confirms all findings.
- Recipients are anonymous: only age band, clinical use and hospital type. Never speculate about who a recipient is.
- Insurance: explain the rule (score -> relative risk -> cover step) using the tool data; never promise cover the tool doesn't show.
- When the donor asks where something is, or wants to see something, call navigate.
- Reply in the donor's preferred language given below, unless they write in another language - then use theirs. Keep medical terms and numbers readable.`;

async function chat({ donorId, history, message }) {
  const donor = store.getDonor(donorId);
  const language = LANGUAGE_NAMES[donor.language] || 'English';
  const context = `Signed-in donor: ${donor.name} (${donorId}). Preferred language: ${language}. Today: ${store.TODAY}.`;

  // History arrives from the client as prior API-format messages; first user turn carries the context line
  const messages = history && history.length
    ? [...history, { role: 'user', content: message }]
    : [{ role: 'user', content: `${context}\n\n${message}` }];

  const result = await runAgent({ feature: 'copilot', system: SYSTEM, messages, donorId, maxTokens: 2500, effort: 'low' });
  return { reply: result.text, steps: result.steps, actions: result.actions, history: result.messages };
}

/** Offline answers for the demo when Vertex AI is unavailable. */
function fallback(message) {
  return {
    reply: 'I need an AI connection to answer free-form questions, and none is configured right now. '
      + 'You can still explore everything from the menu: Impact shows where your blood went, Health shows your results, and Cover shows your insurance.',
    steps: [],
    actions: [],
    history: null,
    offline: true,
    reason: llm.status().reason,
    echo: message,
  };
}

module.exports = { chat, fallback, SYSTEM };
