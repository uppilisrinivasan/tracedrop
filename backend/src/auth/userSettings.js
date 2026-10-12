/** Booking preferences saved against the signed-in Google account. */
const { authDisabled } = require('./policy');

const memory = new Map();
let db;

function firestore() {
  if (!db) {
    const { Firestore } = require('@google-cloud/firestore');
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT;
    db = new Firestore(projectId ? { projectId } : {});
  }
  return db;
}

function local(user) {
  return authDisabled() || !user || user.local || user.sub === 'local';
}

async function getPreferences(user) {
  if (local(user)) return memory.get('local') || null;
  const snap = await firestore().collection('users').doc(user.sub).get();
  return snap.exists && snap.data().booking ? snap.data().booking : null;
}

async function savePreferences(user, preferences) {
  if (local(user)) {
    memory.set('local', preferences);
    return preferences;
  }
  await firestore().collection('users').doc(user.sub).set({ booking: preferences }, { merge: true });
  return preferences;
}

async function listAppointments(user, donorId) {
  const { session } = require('../data/store');
  if (local(user)) return (session.appointments.get(donorId) || []).filter((item) => item.sub === 'local' || !item.sub);
  const snap = await firestore().collection('appointments').where('sub', '==', user.sub).get();
  return snap.docs.map((doc) => doc.data()).filter((item) => item.donorId === donorId);
}

async function saveAppointment(user, appointment) {
  const store = require('../data/store');
  const list = (store.session.appointments.get(appointment.donorId) || []).filter((item) => item.id !== appointment.id);
  list.push(appointment);
  store.session.appointments.set(appointment.donorId, list);
  if (!local(user)) await firestore().collection('appointments').doc(appointment.id).set(appointment);
  return appointment;
}

module.exports = { getPreferences, savePreferences, listAppointments, saveAppointment };
