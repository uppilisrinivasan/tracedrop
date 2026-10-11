/**
 * Donation flow: book a slot at a blood centre, then check in on the day.
 * Check-in records screening vitals, runs the eligibility rules, and on a
 * completed donation creates the components (red cells, platelets, plasma)
 * and the free lab panel from the sample — so the donor sees new units start
 * their journey and new results land in their health record immediately.
 */

const store = require('../data/store');
const health = require('./health');

function slots(donorId) {
  const eligibility = health.eligibility(donorId);
  const from = eligibility.nextEligibleDate || null;
  if (!from) return { eligibility, slots: [] };
  const list = [];
  const start = new Date(from);
  for (let day = 0; list.length < 9 && day < 14; day += 1) {
    const d = new Date(start.getTime() + day * 864e5);
    if (d.getDay() === 0) continue;
    const date = d.toISOString().slice(0, 10);
    store.institutions.bloodCentres.forEach((c, i) => {
      if ((day + i) % 2 === 0 && list.length < 9) {
        list.push({ id: `${c.id}-${date}-${i}`, centreId: c.id, centre: c.name, district: c.district, date, time: ['09:30', '11:00', '16:30'][i] });
      }
    });
  }
  return { eligibility, slots: list };
}

function book(donorId, { slotId }) {
  const slot = slots(donorId).slots.find((s) => s.id === slotId);
  if (!slot) throw new Error('That slot is not available');
  const appointment = { id: `APT-${Date.now()}`, donorId, ...slot, status: 'booked' };
  const list = store.session.appointments.get(donorId) || [];
  list.push(appointment);
  store.session.appointments.set(donorId, list);
  return appointment;
}

/**
 * Check in and donate. Vitals default to the donor's recent pattern so the
 * demo can be run with one click; a real centre would enter measured values.
 */
function checkIn(donorId, appointmentId, vitalsInput = {}) {
  const appointment = (store.session.appointments.get(donorId) || []).find((a) => a.id === appointmentId);
  if (!appointment || appointment.status !== 'booked') throw new Error('Appointment not found');
  const donor = store.getDonor(donorId);
  const previous = store.getDonations(donorId).slice(-1)[0]?.vitals || { systolic: 120, diastolic: 78, haemoglobin: 14, weightKg: 65, pulse: 76 };
  const vitals = {
    systolic: Number(vitalsInput.systolic || previous.systolic),
    diastolic: Number(vitalsInput.diastolic || previous.diastolic),
    pulse: Number(vitalsInput.pulse || previous.pulse || 76),
    haemoglobin: Number(vitalsInput.haemoglobin || previous.haemoglobin),
    weightKg: Number(vitalsInput.weightKg || previous.weightKg),
  };
  const hbMin = donor.sex === 'F' ? 12.5 : 13.0;
  const reasons = [];
  if (vitals.haemoglobin < hbMin) reasons.push(`Haemoglobin ${vitals.haemoglobin} below ${hbMin}`);
  if (vitals.systolic > 140 || vitals.diastolic > 90) reasons.push(`Blood pressure ${vitals.systolic}/${vitals.diastolic} above 140/90`);
  if (vitals.weightKg < 45) reasons.push('Weight below 45 kg');
  const status = reasons.length ? 'deferred' : 'completed';

  const visitNo = store.getDonations(donorId).length + 1;
  const visitId = `${donorId}-V${visitNo}`;
  const date = store.TODAY;
  store.addDonation({ id: visitId, donorId, date, status, deferralReason: reasons.join('; ') || null, centreId: appointment.centreId,
    volumeMl: vitals.weightKg >= 55 ? 450 : 350, bagId: `BAG-${date.replace(/-/g, '').slice(2)}-${Math.floor(1000 + Math.random() * 9000)}`, vitals, confidentialFollowUp: false });

  // The free lab panel from the sample: carry forward the latest value per marker
  const labs = health.labSeries(donorId);
  const panel = Object.values(labs).map((list) => list[list.length - 1]).filter((o) => o.key !== 'hb' && o.source !== 'uploaded_report');
  store.addObservations(donorId, [
    { id: `OBS-${visitId}-hb`, donorId, visitId, code: '718-7', key: 'hb', name: 'Haemoglobin', value: vitals.haemoglobin, unit: 'g/dL', low: hbMin, high: null, date, source: 'donation_sample', labId: 'LAB-01' },
    ...panel.map((o) => ({ ...o, id: `OBS-${visitId}-${o.key}`, visitId, date })),
  ]);

  let components = [];
  if (status === 'completed') {
    const base = [{ type: 'collected', date }, { type: 'separated', date }];
    components = ['PRBC', 'PLT', 'FFP'].map((kind) => ({ id: `${visitId}-${kind}`, donationId: visitId, donorId, kind, bloodGroup: donor.bloodGroup, events: [...base], recipient: null, fractionation: null }));
    store.addComponents(donorId, components);
  }
  appointment.status = status;
  store.session.carePlans.delete(donorId);
  return { status, reasons, visitId, components: components.map((c) => c.kind), vitals };
}

module.exports = { slots, book, checkIn };
