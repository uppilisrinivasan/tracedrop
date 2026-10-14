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
const intro = require('../domain/intro');
const screenLines = require('../domain/screenLines');
const llm = require('./llm');
const { runAgent } = require('./agent');
const tools = require('./tools');

// Slots are offered as a Card (offer_care_slots), never listed as text
const CHAT_TOOLS = tools.definitions().map((d) => d.name).filter((n) => n !== 'find_care_slots');

const LANGUAGE_NAMES = { en: 'English', hi: 'Hindi', kn: 'Kannada', ta: 'Tamil', te: 'Telugu', ml: 'Malayalam' };
const LANGUAGE_WORDS = {
  en: /\benglish\b/, hi: /\bhindi\b|हिंदी|हिन्दी/, kn: /\bkannada\b|ಕನ್ನಡ/, ta: /\btamil\b|தமிழ்/, te: /\btelugu\b|తెలుగు/, ml: /\bmalayalam\b|മലയാളം/,
};

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

/** Who Drop is talking to. The New donor is the signed-in person themself, a new user with no records yet. */
function who(donor, userName) {
  if (!donor.newUser) return `${donor.name} (${donor.id})`;
  const first = userName ? String(userName).split(' ')[0] : null;
  return `a new user (${donor.id}) who has just joined: no donations, results, Circles or insurer yet. ${first ? `Their first name is ${first}.` : "You don't know their name, so don't use one."}`;
}

const HABITS = ['movement', 'food', 'mind'];

function context(donorId, userName, chat = 'general') {
  const donor = store.getDonor(donorId);
  const c = drop.chatContext(donorId);
  return `Today: ${store.today()}. Donor: ${who(donor, userName)}. Write in ${LANGUAGE_NAMES[c.language] || 'English'}.
What you remember about them: ${c.memory.join('; ') || 'nothing yet'}.
Their Plan: ${c.plan.join('; ') || 'none yet'}. Reminders: ${c.reminders.join('; ') || 'none'}. Latest reading they gave you: ${c.latestReading || 'none'}.
Cards waiting for them on Home: ${c.openCards.join(', ') || 'none'}.${goalLines(c.goals)}${chatLine(chat, c.goals)}${introLine(donorId)}`;
}

/** Each Goal's write-up: what Drop suggests stays within its steps. */
function goalLines(goals) {
  if (!goals.length) return '';
  return `\nTheir Goals, with the steps their results call for (suggest only these, in your own words). These steps come from TraceDrop's rules, not from their doctor: never say a doctor advised them. ${goals.map((g) =>
    `${g.name}${g.state === 'active' ? '' : ` (${g.state === 'upnext' ? 'Up next' : g.state})`}: target ${g.target}; why: ${g.why} Steps: ${g.steps.join('; ')}.${g.urgent ? ' This Goal is urgent: suggest no exercise, Movement plan or walks (not even gentle ones) until they say a doctor has seen them; say so kindly, and still help with the other steps.' : ''}`).join(' | ')}`;
}

/** Which Chat this is (CONTEXT.md: Chat). Week plans aren't built yet, so nothing can be saved or put in a calendar from here. */
function chatLine(chat, goals) {
  const goal = String(chat).startsWith('goal:') ? goals.find((g) => `goal:${g.id}` === chat) : null;
  const habit = String(chat).startsWith('habit:') && HABITS.includes(chat.slice(6)) ? chat.slice(6) : null;
  const where = goal ? `the Chat about their Goal "${goal.name}"` : habit ? `the Chat about their ${habit.charAt(0).toUpperCase()}${habit.slice(1)} Habit` : 'their General Chat';
  return `\nThis conversation is ${where}. If they ask for a plan for the week, suggest one or two concrete things from their Goals' steps${habit ? ` that fit ${habit}` : ''} (or, with no Goal, a simple everyday ${habit || 'habit'} idea with no health reason), then say that saving a Week plan and adding it to their calendar is coming soon in TraceDrop. Never claim you saved or scheduled anything.`;
}

/** While the Intro runs, Drop knows which step the person is on, so "what's this?" gets a sensible answer. */
function introLine(donorId) {
  const i = intro.status(donorId);
  if (i.status !== 'new' && i.status !== 'running') return '';
  return `\nThey are in the Intro, Drop's scripted first conversation, on step ${i.step} of ${i.total}: "${i.title}". If they ask about it, answer in one or two sentences about that step; the Intro's buttons let them carry on.`;
}

// A reply that opens with the model's own planning ("The user wants…") or leaked tool code ("tool_code", "default_api.…") is not for the donor
const NOTE_TO_SELF = /^(the user\b|okay, the user\b|i should\b|plan:|tool_code|```|print\(|default_api\.)|\bdefault_api\./i;
// Drop never calls the Donor "the user", and never narrates what it will do ("Given this, I should advise…")
const isNote = (text) => NOTE_TO_SELF.test(text) || /\bthe user('s)?\b/i.test(text) || /^(given|therefore|so|based on)\b[^.]*\bI (should|will|need to)\b/i.test(text) || /^I will (inform|tell|advise|explain)\b/i.test(text);

async function chat({ donorId, history, message, userName, chat: chatId }) {
  const prior = Array.isArray(history) ? history.filter((turn) => turn && ['user', 'assistant'].includes(turn.role) &&
    (typeof turn.content === 'string' || Array.isArray(turn.content))).slice(-20) : [];
  const messages = [...prior, { role: 'user', content: message }];
  const system = `${SYSTEM}\n\n${context(donorId, userName, chatId)}`;
  const run = (sys, toolNames) => runAgent({ feature: 'copilot', system: sys, messages, donorId, toolNames, maxTokens: 2500, effort: 'low' });
  let result = await run(system, CHAT_TOOLS);
  // A reply that is the model's own notes ("The user wants…", "Plan: …") or tool code written as text gets one more try:
  // no tools this time, told to answer the donor directly
  if ((!result.text && !result.actions.length) || isNote(result.text || '')) {
    const first = result;
    result = await run(`${system}\n\nAnswer the donor directly in your own words, in plain sentences. Don't start with a heading or a note about what they want, and don't write code.`, []);
    result = { ...result, steps: [...first.steps, ...result.steps], actions: [...first.actions, ...result.actions] };
  }
  if (result.text && isNote(result.text)) {
    const rules = fallback(donorId, message);
    const reply = rules.generic ? 'Sorry, I lost my words there. Could you ask me that again?' : rules.reply;
    return { reply, steps: result.steps, actions: [...result.actions, ...rules.actions.filter((a) => !result.actions.some((b) => b.type === a.type && b.text === a.text))], history: null, answeredByRules: true };
  }
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
  // "Talk to me in Hindi", "English please": switch Drop's language (the Intro follows)
  const asked = Object.entries(LANGUAGE_WORDS).find(([, re]) => re.test(m));
  if (asked && /\b(speak|talk|switch|change|use|in|please|language)\b|^\S+$/.test(m)) {
    const r = tools.switchLanguage(donorId, asked[0]);
    return out(`Okay, I'll use ${LANGUAGE_NAMES[asked[0]]}${llm.status().live ? '' : " where I can. Without the AI connection some things stay in English"}.`, [r._ui]);
  }
  if (/remember/.test(m)) {
    const memory = drop.view(donorId).memory.map((x) => x.text);
    return out(memory.length ? `Here's what I remember: ${memory.join('; ')}. You can delete any of it from "What do you remember about me?".` : "I don't remember anything about you yet.");
  }
  // No donations yet: no results, readings or patients to talk about
  if (!store.getDonations(donorId).length && /\b(bp|blood pressure|trend|results?|explain|mean)\b/.test(m)) {
    return out(screenLines.line(donorId, 'health').text);
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
    return out(f.length ? `Your latest results: ${f.slice(0, 3).map((x) => `${x.title} (${x.detail})`).join('; ')}. A doctor confirms all findings.` : 'All your latest results are in the healthy range.');
  }
  if (/what happens|at a donation|how long does/.test(m)) {
    return out('You answer a few health questions, then the centre checks your haemoglobin, blood pressure and pulse. Giving blood takes about 10 minutes and the whole visit about 45, and your sample gets a free health check.');
  }
  if (/blood go|helped|impact|platelet|red cell/.test(m)) return out(screenLines.line(donorId, 'impact').text);
  if (/donate|eligible|hold/.test(m)) return out(screenLines.line(donorId, 'donate').text);
  if (/check-?up|doctor|book/.test(m)) {
    const card = drop.offerCard(donorId, 'care_slots');
    return out('These are simulated check-up times for the demo, not clinic-confirmed appointments. Please contact a real care provider to arrange a visit.', [{ type: 'card', cardId: card.id }]);
  }
  const step = intro.explain(donorId);
  if (step) return out(step);
  return { ...out("I need the AI connection for free-form questions, and it isn't available right now. Try asking about your results, your BP, where your blood went, or when you can donate."), generic: true };
}

module.exports = { chat, fallback, SYSTEM };
