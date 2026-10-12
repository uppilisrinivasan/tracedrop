import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, fmtDate, rupees } from '../api';
import type { PageProps } from '../App';
import { ErrorNote, Icon, Loading, Section, useLoad } from '../ui';
import DropLine from '../components/drop/DropLine';

const LADDER = [500000, 600000, 700000, 800000];

export default function Cover({ donorId, go, version, refresh }: PageProps) {
  const { data, error, loading, reload } = useLoad(() => api.cover(donorId), [donorId, version]);
  const [what, setWhat] = useState<number | null>(null);
  const [sim, setSim] = useState<{ cover: number; relativeRisk: number } | null>(null);

  useEffect(() => { setWhat(null); setSim(null); }, [donorId]);
  useEffect(() => {
    if (what == null) return;
    const t = setTimeout(() => api.simulateCover(donorId, what).then(setSim).catch(() => setSim(null)), 150);
    return () => clearTimeout(t);
  }, [what, donorId]);

  if (loading && !data) return <Loading />;
  if (error || !data) return <ErrorNote error={error || 'Could not load'} />;

  const score = what ?? data.healthScore;
  const simCover = what != null && sim ? sim.cover : data.currentCover;
  const consent = data.conditions.consentToShare.met;

  async function toggleConsent() {
    await api.setConsent(donorId, { shareHealthWithInsurer: !consent });
    reload();
    refresh();
  }

  return (
    <div className="stack fade-in">
      <div className="page-head">
        <div>
          <div className="page-title">Health cover that grows with you</div>
          <div className="page-sub">Like a credit limit that rises with good behaviour: stay healthy and your sum insured steps up — for the same premium.</div>
        </div>
      </div>
      <DropLine donorId={donorId} screen="cover" version={version} />

      <div className="grid grid-2">
        <div className="card">
          <div className="stat-label">{data.policy.kind} · {data.policy.sponsor}</div>
          <div className="row mt-8" style={{ alignItems: 'baseline', gap: 12 }}>
            <span className="stat-value" style={{ fontSize: 42 }}>{rupees(data.currentCover)}</span>
            {data.currentCover > data.baseCover && <span className="pill pill-good">+{rupees(data.currentCover - data.baseCover)} earned</span>}
          </div>
          <div className="small muted">Premium stays {rupees(data.policy.premium)}/year · base cover {rupees(data.baseCover)}</div>

          <div className="ladder mt-16" style={{ height: 150 }}>
            {LADDER.map((step, i) => {
              const cls = step <= data.currentCover ? (step === data.currentCover ? 'current' : 'reached') : step <= data.eligibleCover ? 'qualified' : '';
              return (
                <div key={step} className={`ladder-step ${cls}`} style={{ height: `${45 + i * 18}%` }}>
                  {step === simCover && what != null && <span className="tiny" style={{ marginBottom: 'auto' }}>◆ what-if</span>}
                  {rupees(step).replace(' lakh', 'L')}
                </div>
              );
            })}
          </div>
          <div className="small mt-12">
            {data.blockedBy === 'monitoring' && <span>Your score already qualifies for <b>{rupees(data.eligibleCover)}</b>. One more monitored visit this year unlocks it. <button className="btn btn-sm btn-primary" onClick={() => go('donate')}>Book a check-up</button></span>}
            {data.blockedBy === 'consent' && <span>Your score qualifies for <b>{rupees(data.eligibleCover)}</b>, but sharing with your insurer is off.</span>}
            {!data.blockedBy && data.nextStep && data.pointsToNextStep != null && <span><b>{data.pointsToNextStep} more points</b> on your health score moves you to <b>{rupees(data.nextStep)}</b>.</span>}
            {!data.blockedBy && !data.nextStep && <span>You're at the top step. Keep it up to hold it at renewal.</span>}
          </div>
        </div>

        <div className="card">
          <div className="card-title">What if my health score changed?</div>
          <div className="card-sub">Drag to see the cover you'd qualify for. The engine is deterministic and auditable.</div>
          <div className="row between mt-16"><span className="muted">Health score</span><span className="stat-value" style={{ fontSize: 28 }}>{score}</span></div>
          <input type="range" min={30} max={100} value={score} onChange={(e) => setWhat(Number(e.target.value))} aria-label="Health score" />
          <div className="grid grid-2 mt-16">
            <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 12 }}>
              <div className="tiny muted">Cover you'd qualify for</div>
              <div className="bold" style={{ fontSize: 22 }}>{rupees(simCover)}</div>
            </div>
            <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 12 }}>
              <div className="tiny muted">Expected claims vs average</div>
              <div className="bold" style={{ fontSize: 22 }}>{Math.round(((what != null && sim ? sim.relativeRisk : data.relativeRisk)) * 100)}%</div>
            </div>
          </div>
          {what != null && <button className="btn btn-sm mt-12" onClick={() => { setWhat(null); setSim(null); }}>Reset to my score ({data.healthScore})</button>}
          <button className="btn btn-sm btn-ai mt-12" style={{ marginLeft: 8 }} onClick={() => go('plan')}><Icon name="sparkles" size={14} /> How do I get there?</button>
        </div>
      </div>

      <Section title="What your health qualified for over time" sub="Cover each visit's score qualified for · re-evaluated after every monitored visit">
        <div style={{ height: 220 }}>
          <ResponsiveContainer>
            <AreaChart data={data.history.map((h) => ({ ...h, label: fmtDate(h.date), coverL: h.cover / 100000 }))} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--muted)' }} />
              <YAxis domain={[4, 8.5]} tick={{ fontSize: 12, fill: 'var(--muted)' }} unit="L" />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }} formatter={(v, _n, p) => [`₹${v} lakh (score ${(p.payload as { score: number }).score})`, 'Eligible cover']} />
              <Area type="stepAfter" dataKey="coverL" stroke="#15803d" fill="#15803d" fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <div className="grid grid-2">
        <Section title={<><Icon name="info" size={17} /> How it's calculated</>}>
          <ol className="small" style={{ paddingLeft: 18, margin: 0, display: 'grid', gap: 6 }}>
            <li>Your <b>health score</b> comes from fixed clinical rules on your screening results (BP, haemoglobin, HbA1c, cholesterol, BMI, smoking).</li>
            <li>The score maps to a <b>relative risk</b> — expected claims compared with an average member ({Math.round(data.relativeRisk * 100)}% for you).</li>
            <li>Claims grow slower than cover (most claims are well below the limit), so lower risk creates <b>headroom</b>: more cover for the same expected cost.</li>
            <li>Cover steps up the ladder (₹5L → 6L → 7L → 8L) when you have <b>2+ monitored visits in 12 months</b> and have <b>consented</b> to share your score.</li>
          </ol>
          <p className="tiny faint mt-12">{data.method} Illustrative parameters; a partner insurer applies its filed rating factors.</p>
        </Section>
        <Section title={<><Icon name="lock" size={17} /> Your data, your choice</>}>
          <div className="row between">
            <div><div className="bold small">Share my health score with my insurer</div><div className="tiny muted">Only the score is shared — never your raw results or findings.</div></div>
            <button className={`toggle ${consent ? 'on' : ''}`} onClick={toggleConsent} aria-pressed={consent} aria-label="Share health score with insurer" />
          </div>
          <div className="stack mt-16" style={{ gap: 8 }}>
            {Object.entries(data.conditions).map(([k, c]) => (
              <div key={k} className="row small"><span className={`pill ${c.met ? 'pill-good' : 'pill-warn'}`}>{c.met ? 'Met' : 'Not yet'}</span>{c.detail}</div>
            ))}
          </div>
          <div className="tiny faint mt-12">Your cover never drops mid-year. Good health only ever adds.</div>
        </Section>
      </div>
    </div>
  );
}
