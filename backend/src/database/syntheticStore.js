/**
 * In-memory store backed by the synthetic FHIR data in data/synthetic/.
 *
 * Loads the generated JSON once at startup and maps FHIR resources to the
 * shapes the frontend expects (see frontend/src/types/index.ts). This lets the
 * app run locally without a Firestore instance.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../../data');

const LOINC_BP = '85354-9';
const LOINC_HB = '718-7';
const LOINC_RBC = '789-8';

const LANGUAGE_CODES = {
  English: 'en',
  Hindi: 'hi',
  Tamil: 'ta',
  Telugu: 'te',
  Kannada: 'kn',
  Malayalam: 'ml',
};

const URGENCY_LEVELS = {
  'Same day': 'critical',
  'Within 1 week': 'urgent',
  'Within 2-4 weeks': 'soon',
  Routine: 'routine',
};

// Generator protocol codes -> ontology protocol ids (data/ontology/protocols.json)
const PROTOCOL_IDS = {
  'BP-G1': 'BP-G1',
  'BP-G2': 'BP-G2',
  'RF-BP-2': 'BP-URGENCY',
  'HB-DEF': 'HB-DEF',
};

// Findings that mean the donor cannot donate until followed up
const DEFERRING_CATEGORIES = new Set(['BP_GRADE1', 'BP_GRADE2', 'BP_URGENCY', 'HB_BELOW_DONOR']);

// TTI results are confidential and go to the counsellor queue, never to the donor app
const CONFIDENTIAL_CATEGORIES = new Set(['COUNSELLING_REQUIRED']);

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, relativePath), 'utf8'));
}

function subjectId(resource) {
  return resource.subject.reference.replace('Patient/', '');
}

function ageFrom(birthDate) {
  const born = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  if (now < new Date(now.getFullYear(), born.getMonth(), born.getDate())) age -= 1;
  return age;
}

function addDays(isoDate, days) {
  const date = new Date(isoDate);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function toObservation(obs) {
  const code = obs.code.coding[0].code;
  const recordedAt = obs.effectiveDateTime;
  const base = {
    id: obs.id,
    donorId: subjectId(obs),
    recordedAt,
    source: 'donation_centre',
    donationId: obs.id.replace(/^OBS-[A-Z]+-/, ''),
    createdAt: recordedAt,
  };

  if (code === LOINC_BP) {
    const [systolic, diastolic] = obs.component.map((c) => Math.round(c.valueQuantity.value));
    return { ...base, type: 'BP', value: `${systolic}/${diastolic}`, unit: 'mmHg' };
  }
  if (code === LOINC_HB) {
    return { ...base, type: 'Hb', value: String(obs.valueQuantity.value), unit: 'g/dL' };
  }
  if (code === LOINC_RBC) {
    return { ...base, type: 'RBC', value: String(obs.valueQuantity.value), unit: '10^6/uL' };
  }
  return null;
}

function toDonation(proc) {
  return {
    id: proc.id,
    donorId: subjectId(proc),
    status: proc.status === 'completed' ? 'completed' : 'deferred',
    performedAt: proc.performedDateTime,
    bloodCentreId: proc.location.display,
    deferralReason: proc.status === 'completed' ? undefined : proc.reasonCode[0].coding[0].display,
    recordedBy: 'donation_centre',
    createdAt: proc.performedDateTime,
  };
}

function load() {
  const protocols = new Map(readJson('ontology/protocols.json').map((p) => [p.id, p]));

  const observationsByDonor = new Map();
  for (const raw of readJson('synthetic/observations.json')) {
    const obs = toObservation(raw);
    if (!obs) continue;
    if (!observationsByDonor.has(obs.donorId)) observationsByDonor.set(obs.donorId, []);
    observationsByDonor.get(obs.donorId).push(obs);
  }
  for (const list of observationsByDonor.values()) {
    list.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)); // newest first
  }

  const donationsByDonor = new Map();
  for (const raw of readJson('synthetic/donations.json')) {
    const donation = toDonation(raw);
    if (!donationsByDonor.has(donation.donorId)) donationsByDonor.set(donation.donorId, []);
    donationsByDonor.get(donation.donorId).push(donation);
  }
  for (const list of donationsByDonor.values()) {
    list.sort((a, b) => b.performedAt.localeCompare(a.performedAt));
  }

  const findingsByDonor = new Map();
  for (const raw of readJson('synthetic/findings.json')) {
    if (CONFIDENTIAL_CATEGORIES.has(raw.type)) continue;

    const donorId = raw.donor_id;
    const bpReadings = (observationsByDonor.get(donorId) || []).filter((o) => o.type === 'BP');
    const latest = bpReadings[0];
    const oldest = bpReadings[bpReadings.length - 1];
    const systolic = (o) => parseInt(o.value.split('/')[0], 10);
    const rising = latest && oldest && systolic(latest) - systolic(oldest) >= 5;
    const isBp = raw.type.startsWith('BP_');

    const createdAt = (donationsByDonor.get(donorId) || [])[0]?.performedAt || new Date().toISOString();
    const protocol = protocols.get(PROTOCOL_IDS[raw.protocol_rule]);

    const finding = {
      id: raw.id,
      donorId,
      category: raw.type,
      sourceObservationId: isBp && latest ? latest.id : '',
      trend: isBp ? (rising ? 'declining' : 'stable') : 'stable',
      status: 'active',
      description: raw.description,
      recommendedAction: protocol ? protocol.recommendedAction : 'Continue routine monitoring at your next donation',
      urgency: URGENCY_LEVELS[raw.urgency] || 'routine',
      needsEscalation: raw.urgency === 'Same day',
      protocolId: protocol ? protocol.id : raw.protocol_rule,
      followUpDays: protocol ? protocol.followUpDays : 90,
      createdAt,
      updatedAt: createdAt,
    };

    if (!findingsByDonor.has(donorId)) findingsByDonor.set(donorId, []);
    findingsByDonor.get(donorId).push(finding);
  }

  const donors = new Map();
  for (const patient of readJson('synthetic/donors.json')) {
    const id = patient.id;
    const findings = findingsByDonor.get(id) || [];
    const languageName = patient.language?.coding?.[0]?.code;

    let healthStatus = 'healthy';
    if (findings.some((f) => DEFERRING_CATEGORIES.has(f.category))) healthStatus = 'deferred';
    else if (findings.length > 0) healthStatus = 'monitored';

    donors.set(id, {
      id,
      name: patient.name[0].text,
      phone: patient.telecom?.find((t) => t.system === 'phone')?.value || '',
      email: '',
      language: LANGUAGE_CODES[languageName] || 'en',
      gender: (patient.gender || 'o').charAt(0).toUpperCase(),
      age: ageFrom(patient.birthDate),
      healthStatus,
      associatedBloodCentreId: donationsByDonor.get(id)?.[0]?.bloodCentreId,
      createdAt: donationsByDonor.get(id)?.slice(-1)[0]?.performedAt || patient.birthDate,
      updatedAt: donationsByDonor.get(id)?.[0]?.performedAt || patient.birthDate,
    });
  }

  return { donors, observationsByDonor, donationsByDonor, findingsByDonor, protocols };
}

const store = load();

function getDonor(id) {
  return store.donors.get(id) || null;
}

function getObservations(donorId, { days, type } = {}) {
  let list = store.observationsByDonor.get(donorId) || [];
  if (days) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    list = list.filter((o) => new Date(o.recordedAt).getTime() >= cutoff);
  }
  if (type) list = list.filter((o) => o.type === type);
  return list;
}

function getDonations(donorId) {
  return store.donationsByDonor.get(donorId) || [];
}

function getFindings(donorId) {
  return store.findingsByDonor.get(donorId) || [];
}

/** Care plans proposed from each finding's protocol, pending clinician approval. */
function getCarePlans(donorId) {
  return getFindings(donorId).map((finding) => {
    const protocol = store.protocols.get(finding.protocolId);
    const lifestyle = protocol?.lifestyle || [];
    return {
      id: `CP-${finding.id}`,
      donorId,
      findingId: finding.id,
      status: 'pending',
      proposedAction: finding.recommendedAction,
      notes: lifestyle.length
        ? `Lifestyle: ${lifestyle.map((l) => l.replace(/_/g, ' ')).join(', ')}`
        : 'Recheck at your next donation visit',
      createdBy: 'protocol_engine',
      expectedCompletionDate: protocol ? addDays(finding.createdAt, protocol.followUpDays) : undefined,
      createdAt: finding.createdAt,
      updatedAt: finding.createdAt,
    };
  });
}

module.exports = {
  DATA_DIR,
  getDonor,
  getObservations,
  getDonations,
  getFindings,
  getCarePlans,
  donorCount: () => store.donors.size,
};
