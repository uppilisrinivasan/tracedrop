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
- Only when they explicitly tell you a schedule or language preference, call remember with its canonical category and value. Never remember health statements, life details, religion, caste, income, family members' health or anything about recipients. When they tell you a BP reading, call log_reading.
- Health: explain plainly what a result means and what the Plan says next. You don't diagnose or prescribe medicine. For anything urgent, tell them to see a doctor today and offer_care_slots.
- Recipients are anonymous: only age band, clinical use and hospital type.
- Insurance: explain the illustrative score -> risk -> cover model; these are not issued benefits and no insurer receives the score. Never claim a modeled amount is approved cover.
- Booking: all clinic and blood-centre slots shown by TraceDrop are demo examples, not partner-confirmed reservations. A Google Calendar event/email can be real, but neither confirms a centre reservation.
- When they ask where something is, call navigate.
- Write in the language given below unless they write in another language; then use theirs. Keep numbers as digits.
- Speak straight to the donor. Never call them "the user", and never include a plan, a draft or a critique.`;

function context(donorId) {
  const donor = store.getDonor(donorId);
  const c = drop.chatContext(donorId);
  return `Today: ${store.today()}. Donor: ${donor.name} (${donorId}). Write in ${LANGUAGE_NAMES[c.language] || 'English'}.
What you remember about them: ${c.memory.join('; ') || 'nothing yet'}.
Their Plan: ${c.plan.join('; ') || 'none yet'}. Reminders: ${c.reminders.join('; ') || 'none'}. Latest reading they gave you: ${c.latestReading || 'none'}.
Cards waiting for them on Home: ${c.openCards.join(', ') || 'none'}.`;
}

async function chat({ donorId, history, message }) {
  const prior = Array.isArray(history) ? history.filter((turn) => turn && ['user', 'assistant'].includes(turn.role) &&
    (typeof turn.content === 'string' || Array.isArray(turn.content))).slice(-20) : [];
  const messages = [...prior, { role: 'user', content: message }];
  const result = await runAgent({ feature: 'copilot', system: `${SYSTEM}\n\n${context(donorId)}`, messages, donorId, toolNames: CHAT_TOOLS, maxTokens: 2500, effort: 'low' });
  if (!result.text) {
    const rules = fallback(donorId, message);
    const existing = result.actions;
    const actions = [...existing, ...rules.actions.filter((a) => !existing.some((b) => b.type === a.type && b.marker === a.marker && b.cardId === a.cardId))];
    return { reply: existing.some((a) => ['memory', 'receipt', 'card'].includes(a.type)) ? defaultReply(existing) : rules.reply,
      steps: result.steps, actions, history: null, answeredByRules: true, offline: true, reason: 'AI response incomplete' };
  }
  return { reply: result.text, steps: result.steps, actions: result.actions, history: result.messages };
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
  const urgentBp = /\b(bp|blood pressure)\b/.test(m) && health.findings(donorId).find((f) => f.id === 'BP_URGENCY');
  if (urgentBp) {
    const card = drop.view(donorId).open.find((c) => c.type === 'urgent');
    return out(`${urgentBp.title}: ${urgentBp.detail}. Please see a doctor today; if you feel unwell, seek urgent care.`, card ? [{ type: 'card', cardId: card.id }] : []);
  }
  if (/\b(cover|insurance|premium|insured)\b/.test(m)) return out(screenLines.line(donorId, 'cover').text);
  if (/\b(ferritin|iron|haemoglobin|hemoglobin|hb|hba1c|cholesterol|ldl|triglycerides)\b/.test(m)) {
    const marker = /ferritin|iron/.test(m) ? 'ferritin' : /haemoglobin|hemoglobin|\bhb\b/.test(m) ? 'hb' : /hba1c/.test(m) ? 'hba1c' : /ldl|cholesterol/.test(m) ? 'ldl' : 'tg';
    const points = drop.chartPoints(donorId, marker);
    const latest = points[points.length - 1];
    const finding = health.findings(donorId).find((f) => marker === 'ferritin' ? f.id === 'IRON_LOW' : marker === 'hb' ? f.id === 'HB_LOW' || f.id === 'HB_SEVERE' : f.detail.toLowerCase().includes(marker));
    return out(latest ? `${marker === 'hb' ? 'Haemoglobin' : marker === 'hba1c' ? 'HbA1c' : marker === 'ldl' ? 'LDL' : marker === 'tg' ? 'Triglycerides' : 'Ferritin'} was ${latest.value} at the latest recorded result.${finding ? ` ${finding.title}: ${finding.detail}. Check your Plan or speak with a doctor about next steps.` : ''}` : 'I do not have a recorded result for that marker.',
      /trend|chart|over time/.test(m) && points.length ? [{ type: 'chart', marker, points }] : []);
  }
  if (/\b(bp|blood pressure)\b/.test(m)) {
    return out(screenLines.line(donorId, 'health').text, [{ type: 'chart', marker: 'bp', points: drop.chartPoints(donorId, 'bp') }]);
  }
  if (/\btrend\b/.test(m)) return out('Which result would you like to see over time: BP, ferritin, haemoglobin or another marker?');
  if (/result|explain|mean/.test(m)) {
    const f = health.findings(donorId);
    return out(f.length ? `Your latest results: ${f.slice(0, 3).map((x) => `${x.title} (${x.detail})`).join('; ')}. Your Plan on the Health screen has the next steps; a doctor confirms all findings.` : 'All your latest results are in the healthy range.');
  }
  if (/blood go|helped|impact|platelet|red cell/.test(m)) return out(screenLines.line(donorId, 'impact').text);
  if (/donate|eligible|hold/.test(m)) return out(screenLines.line(donorId, 'donate').text);
  if (/check-?up|doctor|book/.test(m)) {
    const card = drop.offerCard(donorId, 'care_slots');
    return out('These are simulated check-up times for the demo, not clinic-confirmed appointments. Please contact a real care provider to arrange a visit.', [{ type: 'card', cardId: card.id }]);
  }
  return out("I need the AI connection for free-form questions, and it isn't available right now. Try asking about your results, your BP, where your blood went, or when you can donate.");
}

module.exports = { chat, fallback, SYSTEM };
