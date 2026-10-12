/** Guided booking questions, then the best matching slots. */
import { useEffect, useState } from 'react';
import { api, fmtDate, type Appointment, type BookingPreferences, type BookingTurn, type RankedSlot } from './api';
import { requestCalendarAccess } from './calendarAuth';
import { ErrorNote, Icon } from './ui';

type Mode = 'setup' | 'book';

export default function BookingChat({ mode, donorId, clientId, onFinished, onBooked }: {
  mode: Mode;
  donorId?: string;
  clientId: string;
  onFinished?: () => void;
  onBooked?: (appointment: Appointment) => void;
}) {
  const [turn, setTurn] = useState<BookingTurn | null>(null);
  const [prefs, setPrefs] = useState<BookingPreferences | null>(null);
  const [slots, setSlots] = useState<RankedSlot[]>([]);
  const [token, setToken] = useState('');
  const [calendarNote, setCalendarNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [booked, setBooked] = useState<Appointment | null>(null);

  useEffect(() => {
    let live = true;
    api.preferences().then(async (saved) => {
      if (!live) return;
      const next = await api.bookingTurn(saved || undefined);
      if (!live) return;
      setPrefs(next.preferences);
      setTurn(next);
      if (mode === 'setup' && next.ready) {
        await api.savePreferences({ ...next.preferences, onboardingComplete: true });
        if (live) onFinished?.();
      }
    }).catch((e: Error) => { if (live) setError(e.message); });
    return () => { live = false; };
  }, []);

  async function choose(answer: { step: string; value: string | BookingPreferences['location'] }) {
    setBusy(true);
    setError('');
    try {
      const next = await api.bookingTurn(prefs || undefined, answer);
      setPrefs(next.preferences);
      setTurn(next);
      if (next.ready && mode === 'setup') {
        await api.savePreferences({ ...next.preferences, onboardingComplete: true });
        onFinished?.();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function useLocation() {
    if (!navigator.geolocation) {
      setError('This browser has no location service. Choose a district instead.');
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      await choose({
        step: 'place',
        value: {
          label: 'Near your current location',
          lat: Math.round(position.coords.latitude * 100) / 100,
          lng: Math.round(position.coords.longitude * 100) / 100,
          source: 'gps',
        },
      });
    }, () => {
      setBusy(false);
      setError('Location permission was denied. Choose a district instead.');
    });
  }

  async function connectCalendar() {
    setBusy(true);
    setError('');
    try {
      const accessToken = await requestCalendarAccess(clientId);
      setToken(accessToken);
      if (!donorId) return;
      const result = await api.recommend(donorId, prefs!, accessToken);
      setSlots(result.slots);
      setCalendarNote(result.calendarConnected ? 'Your calendar was checked. Busy times are hidden.' : '');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function skipCalendar() {
    if (!donorId) return;
    setBusy(true);
    setError('');
    try {
      const result = await api.recommend(donorId, prefs!);
      setSlots(result.slots);
      setCalendarNote('Calendar was skipped, so only centre hours, holidays and distance were used.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function book(slotId: string) {
    if (!donorId) return;
    setBusy(true);
    setError('');
    try {
      const appointment = await api.book(donorId, { slotId, preferences: prefs!, accessToken: token || undefined });
      setBooked(appointment);
      onBooked?.(appointment);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function skipSetup() {
    setBusy(true);
    try {
      await api.savePreferences({ ...(prefs || {}), onboardingSkipped: true, onboardingComplete: false });
      onFinished?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="book-chat">
      {error && <ErrorNote error={error} />}
      {turn && !turn.ready && (
        <div>
          <p className="bold">{turn.prompt}</p>
          <div className="chip-row">
            {turn.chips.map((chip) => (
              <button key={chip.id} className="chip" disabled={busy} onClick={() => (chip.id === 'gps' ? useLocation() : choose({ step: turn.step!, value: chip.id }))}>
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {turn?.ready && mode === 'book' && !booked && (
        <div className="stack" style={{ gap: 12 }}>
          <p className="bold">Connect Google Calendar so busy times are removed. Booking sends a confirmation email, and Calendar sends the reminder email you chose.</p>
          <div className="chip-row">
            <button className="btn btn-primary" disabled={busy} onClick={connectCalendar}><Icon name="calendar" size={16} /> Connect Google Calendar</button>
            <button className="btn" disabled={busy} onClick={skipCalendar}>Continue without calendar</button>
          </div>
          {calendarNote && <p className="small muted">{calendarNote}</p>}
          <div className="stack" style={{ gap: 10 }}>
            {slots.map((slot) => (
              <div key={slot.id} className="slot-choice">
                <div>
                  <div className="bold">{fmtDate(slot.date)} · {slot.time}</div>
                  <div className="small">{slot.centre}</div>
                  <div className="tiny muted">{slot.reasons.join(' · ')}</div>
                </div>
                <button className="btn btn-sm btn-primary" disabled={busy} onClick={() => book(slot.id)}>Book</button>
              </div>
            ))}
            {calendarNote && !slots.length && <p className="small muted">No slot fits those answers. Change a preference or browse every open slot below.</p>}
          </div>
        </div>
      )}
      {booked && (
        <div className="callout" style={{ background: 'var(--good-soft)' }}>
          <Icon name="check" />
          <div>
            <b>Booked for {fmtDate(booked.date)} at {booked.time}.</b>
            <div className="small">{booked.centre}. {booked.emailSent ? 'A confirmation email is on its way, and reminder emails are on the calendar event.' : booked.eventId ? 'The calendar event is saved. The confirmation email could not be sent.' : 'Saved in TraceDrop. Connect Google Calendar next time for the email and reminders.'}</div>
          </div>
        </div>
      )}
      {mode === 'setup' && <button className="btn btn-ghost btn-sm" disabled={busy} onClick={skipSetup}>Skip for now</button>}
    </div>
  );
}
