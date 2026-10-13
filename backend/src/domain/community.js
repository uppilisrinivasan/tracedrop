/**
 * Circles (family, friends, workplace): shared impact without exposing
 * anyone's health. Members only ever see aggregates; individual names appear
 * on leaderboards only for members who opted in, and health data never does.
 * A member whose "count me in totals" Choice is off is left out of every total
 * (donations, patients helped, causes, blood groups, participation).
 */

const store = require('../data/store');
const impact = require('./impact');

function memberStats(donorId) {
  const journeys = impact.donorJourneys(donorId);
  const donations = store.getDonations(donorId).filter((d) => d.status === 'completed');
  return {
    donations: donations.length,
    patientsHelped: journeys.filter((j) => j.recipient).length,
    lastDonation: donations.length ? donations[donations.length - 1].date : null,
  };
}

function summary(communityId, viewerId) {
  const c = store.getCommunity(communityId);
  if (!c) return null;
  const members = c.memberIds.map((id) => ({ donor: store.getDonor(id), stats: memberStats(id) }));
  const counted = members.filter((m) => m.donor.consent.includeInCommunityStats);
  const yearAgo = new Date(new Date(store.today()).getTime() - 365 * 864e5).toISOString().slice(0, 10);
  const totals = counted.reduce((t, m) => ({
    donations: t.donations + m.stats.donations,
    patientsHelped: t.patientsHelped + m.stats.patientsHelped,
    activeThisYear: t.activeThisYear + (m.stats.lastDonation && m.stats.lastDonation >= yearAgo ? 1 : 0),
  }), { donations: 0, patientsHelped: 0, activeThisYear: 0 });

  const contexts = {};
  for (const { donor } of counted) {
    for (const j of impact.donorJourneys(donor.id)) {
      if (j.recipient) contexts[j.recipient.context] = (contexts[j.recipient.context] || 0) + 1;
    }
  }

  // The viewer always sees themself; with their leaderboard Choice off, only they do
  const leaderboard = members
    .filter((m) => m.donor.consent.showOnLeaderboard || m.donor.id === viewerId)
    .sort((a, b) => b.stats.patientsHelped - a.stats.patientsHelped)
    .slice(0, 10)
    .map((m) => ({
      name: m.donor.id === viewerId ? `${m.donor.name} (you)` : m.donor.name.split(' ')[0],
      isYou: m.donor.id === viewerId,
      onlyYou: m.donor.id === viewerId && !m.donor.consent.showOnLeaderboard,
      ...m.stats,
    }));

  const groups = {};
  for (const m of counted) groups[m.donor.bloodGroup] = (groups[m.donor.bloodGroup] || 0) + 1;

  return {
    id: c.id, name: c.name, kind: c.kind, description: c.description,
    memberCount: members.length,
    notCounted: members.length - counted.length,
    totals,
    participation: counted.length ? Math.round((totals.activeThisYear / counted.length) * 100) : 0,
    contexts: Object.entries(contexts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([context, count]) => ({ context, count })),
    bloodGroups: Object.entries(groups).map(([group, count]) => ({ group, count })),
    leaderboard,
    hiddenMembers: members.filter((m) => !m.donor.consent.showOnLeaderboard && m.donor.id !== viewerId).length,
    privacyNote: 'Only totals are shared with the group. Health results are never shared; names appear only for members who opted in.',
  };
}

function forDonor(donorId) {
  const donor = store.getDonor(donorId);
  return donor.communityIds.map((id) => summary(id, donorId));
}

module.exports = { summary, forDonor };
