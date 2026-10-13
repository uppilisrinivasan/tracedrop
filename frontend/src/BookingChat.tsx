/** Onboarding: a few questions about when and where donating suits you, saved for later bookings. */
import { useEffect, useState } from 'react';
import { api, type BookingPreferences, type BookingTurn } from './api';
import { ErrorNote } from './ui';

export default function BookingChat({ onFinished }: { onFinished?: () => void }) {
  const [turn, setTurn] = useState<BookingTurn | null>(null);
  const [prefs, setPrefs] = useState<BookingPreferences | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    api.preferences().then(async (saved) => {
      if (!live) return;
      const next = await api.bookingTurn(saved || undefined);
      if (!live) return;
      setPrefs(next.preferences);
      setTurn(next);
      if (next.ready) {
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
      if (next.ready) {
        await api.savePreferences({ ...next.preferences, onboardingComplete: true });
        onFinished?.();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function useLocation() {
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
      <button className="btn btn-ghost btn-sm" disabled={busy} onClick={skipSetup}>Skip for now</button>
    </div>
  );
}
