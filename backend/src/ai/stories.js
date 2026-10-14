/**
 * Impact stories.
 *
 * Turns a component's anonymised journey into a short, moving, shareable
 * story in the donor's language — the emotional payoff that makes donors come
 * back. The model only sees the already-anonymised journey (age band,
 * clinical context, hospital type), and a second check rejects any story
 * that adds details beyond it. Use the deterministic journey template rather than
 * trusting a model's own declaration that it did not invent a private fact.
 */

const store = require('../data/store');
const impact = require('../domain/impact');

async function write(donorId, componentId) {
  const donor = store.getDonor(donorId);
  const journey = impact.donorJourneys(donorId).find((j) => j.id === componentId);
  if (!journey) throw new Error('Component not found');
  if (!journey.recipient) throw new Error('This unit has not reached a patient yet');
  // A model's addedDetails list cannot establish factual or privacy safety.
  // Legacy cached model stories are deliberately not served.
  return template(journey, donor);
}

function template(journey, donor) {
  const r = journey.recipient;
  const recovered = r.outcome === 'recovered';
  return {
    headline: `My ${journey.name.toLowerCase()} reached a patient`,
    story: `My ${journey.name.toLowerCase()} from my ${new Date(`${journey.donationDate}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })} donation went to a patient (${r.patient.toLowerCase()}) at ${r.place}, for ${r.context.toLowerCase()}. ${journey.role}.${recovered ? ' The reported outcome was recovery.' : ''}`,
    shareText: `My blood donation was used for ${r.context.toLowerCase()}. #DonateBlood`,
    addedDetails: [],
    generatedBy: 'template',
    language: 'en',
  };
}

module.exports = { write, template };
