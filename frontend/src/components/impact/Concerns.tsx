/**
 * Raise a concern about a unit (wasted, tracked wrongly, privacy, treatment) and follow it:
 * who owns it, the deadline, and escalation to the next authority when it is missed.
 */
import { useState } from 'react';
import { api, fmtDate, type Concern, type Journey } from '../../api';
import { ErrorNote, Icon, Section } from '../../ui';

const CATEGORIES = [
  { id: 'wasted', label: 'My donation was wasted or expired' },
  { id: 'tracking', label: 'The tracking looks wrong' },
  { id: 'privacy', label: 'Privacy worry' },
  { id: 'conduct', label: 'How I was treated at the centre' },
];

export function ConcernForm({ donorId, unit, onDone, onCancel }: { donorId: string; unit: Journey | null; onDone: (c: Concern) => void; onCancel: () => void }) {
  const [category, setCategory] = useState(unit?.status === 'expired' ? 'wasted' : 'tracking');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setBusy(true);
    setError('');
    try {
      onDone(await api.raiseConcern(donorId, { category, details, unitId: unit?.id }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="concern-form">
      <div className="bold small">Raise a concern{unit ? ` about ${unit.name.toLowerCase()} from ${fmtDate(unit.donationDate)}` : ''}</div>
      <div className="chip-row mt-8">
        {CATEGORIES.map((c) => <button key={c.id} className="chip" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>{c.label}</button>)}
      </div>
      <textarea className="input mt-8" rows={3} maxLength={1000} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="What happened? (optional)" aria-label="Details" />
      <div className="tiny muted mt-8">It goes to the blood centre's Medical Officer, who must answer within 7 days. If they don't, you can take it to the State Blood Transfusion Council, then the State Drugs Control Department.</div>
      {error && <ErrorNote error={error} />}
      <div className="row mt-8">
        <button className="btn btn-primary btn-sm" disabled={busy} onClick={submit}><Icon name="flag" size={14} /> Send</button>
        <button className="btn btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

export function ConcernList({ donorId, concerns, onChange }: { donorId: string; concerns: Concern[]; onChange: () => void }) {
  const [error, setError] = useState('');
  if (!concerns.length) return null;

  async function act(c: Concern, action: 'escalate' | 'resolve') {
    setError('');
    try { await api.concernAction(donorId, c.id, action); onChange(); } catch (e) { setError((e as Error).message); }
  }

  return (
    <Section title={<><Icon name="flag" size={18} /> Your concerns</>} sub="Every concern has a named owner and a deadline. Miss it, and you can take it higher." collapsible>
      <div className="stack" style={{ gap: 12 }}>
        {concerns.map((c) => (
          <div key={c.id} className="concern">
            <div className="row between wrap">
              <div><b>{c.categoryLabel}</b> <span className="tiny muted">· {c.id}{c.unitName ? ` · ${c.unitName}` : ''}</span></div>
              <span className={`pill ${c.status === 'resolved' ? 'pill-good' : c.overdue ? 'pill-bad' : c.answered ? 'pill-info' : 'pill-warn'}`}>
                {c.status === 'resolved' ? 'Resolved' : c.overdue ? 'Overdue' : c.answered ? 'Answered' : 'Waiting for answer'}
              </span>
            </div>
            {c.status === 'open' && (
              <div className="small mt-8">
                With <b>{c.owner}</b> (level {c.level} of {c.levels}) · {c.answered ? 'answer received' : `answer due by ${fmtDate(c.dueOn)}`}
              </div>
            )}
            <ol className="concern-steps">
              {c.steps.map((s, i) => <li key={i}><span className="tiny muted">{fmtDate(s.on)}</span> {s.text}</li>)}
            </ol>
            {c.status === 'open' && (
              <div className="row wrap mt-8">
                {c.canEscalate && <button className="btn btn-sm btn-primary" onClick={() => act(c, 'escalate')}>{c.answered ? 'Not resolved: ' : ''}Escalate to {c.nextOwner}</button>}
                {!c.canEscalate && c.nextOwner && <span className="tiny muted">You can escalate after {fmtDate(c.dueOn)} if there is no answer.</span>}
                <button className="btn btn-sm" onClick={() => act(c, 'resolve')}>Mark resolved</button>
              </div>
            )}
          </div>
        ))}
        {error && <ErrorNote error={error} />}
      </div>
    </Section>
  );
}
