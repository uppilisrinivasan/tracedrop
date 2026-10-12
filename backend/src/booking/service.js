/** Confirm a slot, write the calendar event, and email the donor. */
const store = require('../data/store');
const { findSlot, recommend } = require('../domain/bookingRank');
const { normalise, missing } = require('../domain/bookingChat');
const calendar = require('../calendar/googleCalendar');
const settings = require('../auth/userSettings');

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function rangeFor(slots) {
  if (!slots.length) return null;
  const dates = slots.map((slot) => slot.date).sort();
  return {
    timeMin: `${dates[0]}T00:00:00+05:30`,
    timeMax: `${dates[dates.length - 1]}T23:59:59+05:30`,
  };
}

async function availability(user, donorId, preferences, accessToken) {
  const prefs = normalise(preferences);
  let busy = [];
  let calendarConnected = false;
  if (accessToken) {
    await calendar.assertCalendarOwner(accessToken, user);
    const generated = require('../domain/bookingRank').candidates(donorId, prefs);
    const range = rangeFor(generated.slots);
    if (range) busy = await calendar.freeBusy(accessToken, range.timeMin, range.timeMax);
    calendarConnected = true;
  }
  const result = recommend(donorId, prefs, busy, 3);
  return { ...result, calendarConnected, searchedBusy: busy.length };
}

async function confirm(user, donor, body) {
  const prefs = normalise(body.preferences || {});
  if (missing(prefs)) throw httpError(400, 'Finish the booking questions first');
  const slot = findSlot(donor.id, prefs, body.slotId);
  if (!slot) throw httpError(400, 'That slot is not available');
  const ranked = recommend(donor.id, prefs, [], 50).slots.find((item) => item.id === slot.id);
  if (!ranked) throw httpError(400, 'That slot does not fit the chosen days, distance or centre hours');

  const appointment = {
    id: `APT-${Date.now()}`,
    sub: user.sub,
    donorId: donor.id,
    ...slot,
    status: 'booked',
    reminderMinutes: prefs.reminderMinutes,
    eventId: null,
    emailSent: false,
  };

  if (body.accessToken) {
    const email = await calendar.assertCalendarOwner(body.accessToken, user);
    const busy = await calendar.freeBusy(body.accessToken, `${slot.date}T00:00:00+05:30`, `${slot.date}T23:59:59+05:30`);
    if (calendarBusy(slot, busy)) throw httpError(409, 'That time is busy on your calendar. Choose another slot.');
    const event = calendar.buildEvent({ slot, email, reminderMinutes: prefs.reminderMinutes });
    const created = await calendar.createEvent(body.accessToken, event);
    appointment.eventId = created.id;
    try {
      await calendar.sendConfirmation(body.accessToken, calendar.confirmationMail({ to: email, slot, reminderMinutes: prefs.reminderMinutes }));
      appointment.emailSent = true;
    } catch (error) {
      appointment.emailError = error.message;
    }
  }

  return settings.saveAppointment(user, appointment);
}

function calendarBusy(slot, busy) {
  const { overlaps } = require('../domain/bookingRank');
  return overlaps(slot, busy);
}

async function cancel(user, donorId, appointmentId, accessToken) {
  const list = await settings.listAppointments(user, donorId);
  const appointment = list.find((item) => item.id === appointmentId && item.status === 'booked');
  if (!appointment) throw httpError(404, 'Appointment not found');
  if (appointment.eventId) {
    if (!accessToken) throw httpError(400, 'Connect Google Calendar again to remove the event');
    await calendar.assertCalendarOwner(accessToken, user);
    await calendar.deleteEvent(accessToken, appointment.eventId);
  }
  appointment.status = 'cancelled';
  return settings.saveAppointment(user, appointment);
}

module.exports = { availability, confirm, cancel };
