/**
 * In-memory data store backed by the synthetic data in data/synthetic/.
 *
 * Loads once at startup, indexes by donor, and keeps demo-session writes
 * (new donations, uploaded lab reports, care plans) in memory. "Today" is the
 * simulation date from institutions.json so every view is consistent.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../../data');

function read(name) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'synthetic', name), 'utf8'));
}

function readOntology(name) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'ontology', name), 'utf8'));
}

function groupBy(items, key) {
  const map = new Map();
  for (const item of items) {
    if (!map.has(item[key])) map.set(item[key], []);
    map.get(item[key]).push(item);
  }
  return map;
}

const institutions = read('institutions.json');
const donors = new Map(read('donors.json').map((d) => [d.id, d]));
const donationsByDonor = groupBy(read('donations.json'), 'donorId');
const observationsByDonor = groupBy(read('observations.json'), 'donorId');
const componentsByDonor = groupBy(read('components.json'), 'donorId');
const communities = new Map(read('communities.json').map((c) => [c.id, c]));
const policies = new Map(read('policies.json').map((p) => [p.id, p]));
const protocols = new Map(readOntology('protocols.json').map((p) => [p.id, p]));
const lifestyle = readOntology('lifestyle-recommendations.json');

for (const list of donationsByDonor.values()) list.sort((a, b) => a.date.localeCompare(b.date));

const TODAY = institutions.asOf;

// Demo-session state (resets on restart)
const session = {
  appointments: new Map(), // donorId -> [appointment]
  carePlans: new Map(), // donorId -> plan
  stories: new Map(), // componentId -> story
};

module.exports = {
  DATA_DIR,
  TODAY,
  institutions,
  protocols,
  lifestyle,
  policies,
  session,

  getDonor: (id) => donors.get(id) || null,
  allDonors: () => [...donors.values()],
  getDonations: (donorId) => donationsByDonor.get(donorId) || [],
  getObservations: (donorId) => observationsByDonor.get(donorId) || [],
  getComponents: (donorId) => componentsByDonor.get(donorId) || [],
  allComponents: () => [...componentsByDonor.values()].flat(),
  allDonations: () => [...donationsByDonor.values()].flat(),
  getCommunity: (id) => communities.get(id) || null,
  allCommunities: () => [...communities.values()],
  getPolicy: (id) => policies.get(id) || null,
  hospital: (id) => institutions.hospitals.find((h) => h.id === id),
  centre: (id) => institutions.bloodCentres.find((c) => c.id === id),

  addDonation(donation) {
    if (!donationsByDonor.has(donation.donorId)) donationsByDonor.set(donation.donorId, []);
    donationsByDonor.get(donation.donorId).push(donation);
  },
  addObservations(donorId, observations) {
    if (!observationsByDonor.has(donorId)) observationsByDonor.set(donorId, []);
    observationsByDonor.get(donorId).push(...observations);
  },
  addComponents(donorId, components) {
    if (!componentsByDonor.has(donorId)) componentsByDonor.set(donorId, []);
    componentsByDonor.get(donorId).push(...components);
  },
};
