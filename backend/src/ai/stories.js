/**
 * Impact stories.
 *
 * Turns a component's anonymised journey into a short, moving, shareable
 * story in the donor's language — the emotional payoff that makes donors come
 * back. The model only sees the already-anonymised journey (age band,
 * clinical context, hospital type), and a second check rejects any story
 * that adds details beyond it, so privacy holds even if the model embellishes.
 */

const store = require('../data/store');
const impact = require('../domain/impact');
const llm = require('./llm');

const LANGUAGE_NAMES = { en: 'English', hi: 'Hindi', kn: 'Kannada', ta: 'Tamil', te: 'Telugu', ml: 'Malayalam' };

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['headline', 'story', 'shareText', 'addedDetails'],
  properties: {
    headline: { type: 'string', description: 'Max 8 words' },
    story: { type: 'string', description: '3-4 sentences, first person (I, my). Never you, your, or the donor\'s name.' },
    shareText: { type: 'string', description: 'One sentence the donor can post, first person, ends with #DonateBlood' },
    addedDetails: { type: 'array', items: { type: 'string' }, description: 'Any fact in the story that is NOT in the journey data. Should be empty.' },
  },
};

const SYSTEM = `You write short impact stories for blood donors about where one unit of their donated blood went.
Hard privacy rules: use ONLY the facts in the journey data. No names, no exact ages, no hospital names, no dates more precise than given, no invented medical details, family members, or outcomes. If the outcome is "ongoing" or "not_reported", don't claim recovery.
Tone: warm, specific, not saccharine. Write as the donor, in the first person (I, my). Never "you" or "your", and never the donor's name. Explain in one clause what the component does medically.
List anything you added beyond the data in addedDetails (should be empty).`;

async function write(donorId, componentId, { refresh = false } = {}) {
  const donor = store.getDonor(donorId);
  const journey = impact.donorJourneys(donorId).find((j) => j.id === componentId);
  if (!journey) throw new Error('Component not found');
  if (!journey.recipient) throw new Error('This unit has not reached a patient yet');
  const cached = store.session.stories.get(`${componentId}:${donor.language}`);
  if (cached && !refresh) return cached;

  const facts = {
    component: journey.name, whatItDoes: journey.role, donatedOn: journey.donationDate, collectedAt: journey.centre,
    patient: journey.recipient.patient, use: journey.recipient.context, place: journey.recipient.place, outcome: journey.recipient.outcome,
    timeline: journey.events.map((e) => `${e.label}: ${e.when}`),
  };
  const story = await llm.json({
    feature: 'impact_story', system: SYSTEM, maxTokens: 1500, effort: 'low', outputSchema: SCHEMA,
    messages: [{ role: 'user', content: `Donor first name: ${donor.name.split(' ')[0]}. Write in ${LANGUAGE_NAMES[donor.language] || 'English'}.\nJourney data:\n${JSON.stringify(facts, null, 1)}` }],
  });
  if (story.addedDetails.length) {
    // Model self-reported embellishment: fall back to the template rather than risk a privacy leak
    return template(journey, donor);
  }
  const result = { ...story, generatedBy: 'ai', language: donor.language };
  store.session.stories.set(`${componentId}:${donor.language}`, result);
  return result;
}

function template(journey, donor) {
  const r = journey.recipient;
  const recovered = r.outcome === 'recovered';
  return {
    headline: `My ${journey.name.toLowerCase()} reached a patient`,
    story: `My ${journey.name.toLowerCase()} from my ${new Date(`${journey.donationDate}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })} donation went to a patient (${r.patient.toLowerCase()}) at a ${r.place}, for ${r.context.toLowerCase()}. ${journey.role}.${recovered ? ' The hospital recorded a good recovery.' : ''}`,
    shareText: `My blood donation helped a patient with ${r.context.toLowerCase()}. One donation, up to three lives. #DonateBlood`,
    addedDetails: [],
    generatedBy: 'template',
    language: 'en',
  };
}

module.exports = { write, template };
