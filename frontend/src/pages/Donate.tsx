import { useState } from 'react';
import { api, fmtDate, type Appointment } from '../api';
import type { PageProps } from '../App';
import BookingChat from '../BookingChat';
import { requestCalendarAccess } from '../calendarAuth';
import { ErrorNote, Icon, Loading, Section, useLoad } from '../ui';
import DropLine from '../components/drop/DropLine';

export default function Donate({ donorId, go, version, refresh, clientId }: PageProps) {
  const { data, error, loading, reload } = useLoad(() => api.slots(donorId), [donorId, version]);
  const appts = useLoad(() => api.appointments(donorId), [donorId, version]);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<{ status: string; reasons: string[]; components: string[] } | null>(null);
  const [vitals, setVitals] = useState({ systolic: '', diastolic: '', haemoglobin: '' });
  const [showAll, setShowAll] = useState(false);

  if (loading && !data) return <Loading />;
  if (error || !data) return <ErrorNote error={error || 'Could not load'} />;
  const booked = (appts.data || []).filter((a) => a.status === 'booked');
  const el = data.eligibility;

  async function cancel(a: Appointment) {
    setBusy(a.id);
    setErr(null);
    try {
      const accessToken = a.eventId ? await requestCalendarAccess(clientId) : undefined;
      await api.cancelAppointment(donorId, a.id, accessToken);
      appts.reload();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function checkIn(a: Appointment) {
    setBusy(a.id);
    setErr(null);
    try {
      const v: Record<string, number> = {};
      for (const [k, val] of Object.entries(vitals)) if (val) v[k] = Number(val);
      setResult(await api.checkIn(donorId, a.id, v));
      appts.reload();
      reload();
      refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="stack fade-in">
      <div className="page-head">
        <div>
          <div className="page-title">Donate</div>
          <div className="page-sub">Every donation includes free screening and a lab panel from the same sample.</div>
        </div>
      </div>
      <DropLine donorId={donorId} screen="donate" version={version} />

      {result && (
        <div className={`callout ${result.status === 'completed' ? '' : 'callout-warn'}`} style={result.status === 'completed' ? { background: 'var(--good-soft)' } : undefined}>
          <Icon name={result.status === 'completed' ? 'check' : 'info'} />
          <div>
            {result.status === 'completed' ? (
              <><b>Thank you! Your donation is in.</b> It has been separated into {result.components.length} components ({result.components.join(', ')}) — follow them on your impact page. Your new results are in your health record.</>
            ) : (
              <><b>Not today — and that's OK.</b> {result.reasons.join('; ')}. Your screening results were still recorded; your care plan will help you get back.</>
            )}
            <div className="row mt-8">
              <button className="btn btn-sm btn-primary" onClick={() => go(result.status === 'completed' ? 'impact' : 'plan')}>{result.status === 'completed' ? 'Track my components' : 'Open care plan'}</button>
              <button className="btn btn-sm" onClick={() => go('health')}>See my results</button>
            </div>
          </div>
        </div>
      )}
      {err && <ErrorNote error={err} />}

      {booked.map((a) => (
        <Section key={a.id} title={<><Icon name="calendar" size={18} /> Booked: {fmtDate(a.date)} at {a.time}</>} sub={`${a.centre}, ${a.district}`}>
          <p className="small muted">Demo: on the day, staff record your screening and you donate. Leave blank to use typical values for you, or enter values to try a deferral (e.g. haemoglobin 11.9).</p>
          <div className="grid grid-3 mt-12" style={{ gap: 10 }}>
            <label className="small">Systolic BP<input className="input" inputMode="numeric" value={vitals.systolic} onChange={(e) => setVitals({ ...vitals, systolic: e.target.value })} placeholder="e.g. 128" /></label>
            <label className="small">Diastolic BP<input className="input" inputMode="numeric" value={vitals.diastolic} onChange={(e) => setVitals({ ...vitals, diastolic: e.target.value })} placeholder="e.g. 82" /></label>
            <label className="small">Haemoglobin (g/dL)<input className="input" inputMode="decimal" value={vitals.haemoglobin} onChange={(e) => setVitals({ ...vitals, haemoglobin: e.target.value })} placeholder="e.g. 14.2" /></label>
          </div>
          <div className="row mt-12 wrap">
            <button className="btn btn-primary" onClick={() => checkIn(a)} disabled={busy === a.id}><Icon name="drop" size={16} /> Check in and donate</button>
            <button className="btn" disabled={busy === a.id} onClick={() => cancel(a)}>Cancel booking</button>
          </div>
        </Section>
      ))}

      <Section title="Book a donation" sub={el.eligibleNow ? 'Answer a few questions and TraceDrop will match an open slot.' : el.nextEligibleDate ? `You can donate from ${fmtDate(el.nextEligibleDate)}.` : 'Donation is paused for now.'}>
        {el.blockers.length > 0 && (
          <div className="callout callout-warn small">
            <Icon name="info" size={16} />
            <span>Paused because: {el.blockers.join('; ')}. <button className="btn btn-sm" onClick={() => go('plan')}>Care plan</button></span>
          </div>
        )}
        {!el.blockers.length && <BookingChat mode="book" donorId={donorId} clientId={clientId} onBooked={() => appts.reload()} />}
        <button className="btn btn-ghost btn-sm mt-12" onClick={() => setShowAll((open) => !open)}>{showAll ? 'Hide other slots' : 'Browse every open slot'}</button>
        {showAll && (
          <div className="grid grid-3 mt-12" style={{ gap: 10 }}>
            {data.slots.map((s) => (
              <div key={s.id} style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
                <div className="bold">{fmtDate(s.date)} · {s.time}</div>
                <div className="small muted">{s.centre}</div>
                <div className="tiny faint">{s.district}</div>
              </div>
            ))}
            {!data.slots.length && <p className="small muted">No open slots.</p>}
          </div>
        )}
      </Section>
    </div>
  );
}
