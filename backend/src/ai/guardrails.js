/**
 * Donor-facing safety: static pre-checks on user text, shared prompt rules for every
 * LLM call, and post-checks on assistant wording.
 */

const OFF_TOPIC = /\b(stock|crypto|bitcoin|weather forecast|recipe|movie|cricket score|ipl|politics|election|write (me )?a (poem|essay|code|script)|homework|assignment)\b/i;
const DIAGNOSE = /\b(diagnos(e|is)|prescri(be|ption)|what (medicine|tablet|drug|dose|dosage)|should i take|am i (having|getting)|do i have (cancer|diabetes|covid)|cure for|treat(ment)? for)\b/i;
const EMERGENCY = /\b(chest pain|can't breathe|cannot breathe|suicid|kill myself|stroke|heart attack|bleeding heavily|unconscious)\b/i;
const PRESCRIBE_OUT = /\b(you should take|take \d|start taking|stop taking|try (this|these) (tablet|medicine|pill)|recommended dose)\b/i;
const MEDICINE_OUT = /\b(take|start|stop)\s+(this|that|the)?\s*(tablet|medicine|pill|dose)\b/i;

const PROMPT_SCOPE = `Scope and safety (always follow):
- Stay on blood donation, the donor's results, impact, cover, bookings and Pratidaan. Decline homework, finance, politics and other off-topic asks politely.
- Never diagnose, prescribe or recommend medicines or doses. Explain recorded results and the Plan; direct treatment decisions to a clinician.
- Emergency symptoms (chest pain, can't breathe, suicide, stroke, severe bleeding, etc.): tell them to call emergency services or go to hospital now; do not handle emergencies in chat.`;

const PROMPT_BY_KIND = {
  chat: `${PROMPT_SCOPE}
- Use tools for facts; never invent labs, dates or recipients.
- For treatment questions, explain facts and offer check-up times (offer_care_slots), not medical advice.`,
  donor_copy: `${PROMPT_SCOPE}
- Use only the facts given; add no new clinical claims or medicines.`,
  translation: `Translate only. Do not add health advice, diagnoses or wording not in the source strings.`,
  extraction: `Extract printed values only. Do not interpret results as healthy or unhealthy or suggest treatment.`,
};

function augmentSystem(system, kind = 'donor_copy') {
  const tail = PROMPT_BY_KIND[kind];
  if (!tail) return String(system || '');
  return `${String(system || '').trim()}\n\n${tail}`;
}

function check(message) {
  const m = String(message || '').trim();
  if (!m) return { block: true, reply: 'Ask me in a short sentence — for example about your results, your blood\'s journey, or booking a check-up.' };

  if (EMERGENCY.test(m)) {
    return {
      block: true,
      reply: 'That sounds urgent. Please call emergency services or go to the nearest hospital now. Pratidaan cannot help with emergencies.',
      urgent: true,
    };
  }

  if (DIAGNOSE.test(m)) {
    return {
      block: true,
      reply: 'I cannot diagnose or prescribe. I can explain what your recorded results mean and what your Plan suggests — and I can offer check-up times to discuss with a clinician.',
      suggestCheckup: true,
    };
  }

  if (OFF_TOPIC.test(m) && !/\b(donat|blood|health|result|bp|insur|cover|platelet|goal|plan|drop|pratidaan)\b/i.test(m)) {
    return {
      block: true,
      reply: 'I stay focused on blood donation, your health results, impact, cover and bookings in Pratidaan. Try a question about those, or tap Book a doctor check-up.',
      offTopic: true,
    };
  }

  return { block: false };
}

/** Post-LLM: rewrite unsafe assistant text (copilot and similar). */
function sanitizeReply(text) {
  const t = String(text || '').trim();
  if (!t) return { reply: t, suggestCheckup: false };
  if (PRESCRIBE_OUT.test(t) || MEDICINE_OUT.test(t)) {
    return {
      reply: 'I cannot recommend medicines. I can explain your recorded results and offer check-up times to speak with a clinician.',
      suggestCheckup: true,
    };
  }
  return { reply: t, suggestCheckup: false };
}

module.exports = {
  check,
  sanitizeReply,
  augmentSystem,
  PROMPT_BY_KIND,
};
