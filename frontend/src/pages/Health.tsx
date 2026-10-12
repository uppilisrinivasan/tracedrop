import { useEffect, useRef, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, fmtDate, type CarePlan, type Extraction, type HealthData } from '../api';
import type { PageProps, Screen } from '../App';
import { AgentTrace, AIBadge, ErrorNote, Icon, Loading, OfflineNote, Section, Thinking, severityPill, useLoad } from '../ui';

const MARKERS: { key: string; label: string; unit: string; good?: [number, number] }[] = [
  { key: 'bp', label: 'Blood pressure', unit: 'mmHg', good: [90, 120] },
  { key: 'hb', label: 'Haemoglobin', unit: 'g/dL' },
  { key: 'hba1c', label: 'HbA1c (sugar)', unit: '%', good: [4, 5.7] },
  { key: 'ldl', label: 'LDL cholesterol', unit: 'mg/dL', good: [0, 130] },
  { key: 'tg', label: 'Triglycerides', unit: 'mg/dL', good: [0, 150] },
  { key: 'ferritin', label: 'Ferritin (iron)', unit: 'ng/mL' },
  { key: 'weight', label: 'Weight', unit: 'kg' },
];

export default function Health({ donorId, go, version, refresh, focus }: PageProps & { focus: Screen }) {
  const { data, error, loading } = useLoad(() => api.health(donorId), [donorId, version]);
  const planRef = useRef<HTMLDivElement>(null);
  const labsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = focus === 'plan' ? planRef.current : focus === 'labs' ? labsRef.current : null;
    if (target && data) setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  }, [focus, data]);

  if (loading && !data) return <Loading />;
  if (error || !data) return <ErrorNote error={error || 'Could not load'} />;
  const latest = data.scores[data.scores.length - 1];

  return (
    <div className="stack fade-in">
      <div className="page-head">
        <div>
          <div className="page-title">Your health</div>
          <div className="page-sub">From the free lab panel on every donation sample, plus any reports you add.</div>
        </div>
        <button className="btn" onClick={() => go('labs')}><Icon name="upload" size={16} /> Add a lab report</button>
      </div>

      <div className="grid split">
        <div className="card">
          <div className="stat-label">Health score</div>
          <div className="row" style={{ alignItems: 'baseline' }}><span className="stat-value" style={{ fontSize: 44 }}>{latest?.score ?? '—'}</span><span className="muted">/100</span></div>
          <div className="stack mt-12" style={{ gap: 8 }}>
            {latest?.parts.map((p) => (
              <div key={p.name}>
                <div className="row between small"><span>{p.name} <span className="faint tiny">· {p.value}</span></span><span className="bold">{p.points}</span></div>
                <div className="progress" style={{ height: 6 }}><span style={{ width: `${p.points}%`, background: p.points >= 80 ? 'var(--good)' : p.points >= 55 ? 'var(--warn)' : 'var(--bad)' }} /></div>
              </div>
            ))}
          </div>
          <div className="tiny faint mt-12">Computed by fixed clinical rules (not AI) from your latest results. Drives your insurance cover.</div>
        </div>

        <Section title="What your results say" sub={`${data.findings.length} finding${data.findings.length === 1 ? '' : 's'} · BMI ${data.bmi}`}>
          {data.findings.length === 0 && <div className="callout" style={{ background: 'var(--good-soft)' }}><Icon name="check" /> Everything is in the healthy range. Keep it up!</div>}
          <div className="stack" style={{ gap: 10 }}>
            {data.findings.map((f) => (
              <div key={f.id} className="row" style={{ alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 12, background: 'var(--surface-2)' }}>
                <span className={`pill ${severityPill[f.severity]}`}>{f.severity}</span>
                <div style={{ flex: 1 }}>
                  <div className="bold small">{f.title}</div>
                  <div className="small muted">{f.detail}</div>
                  {f.protocolId && <div className="tiny faint mt-8">Protocol {f.protocolId}</div>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Trends data={data} />

      <div ref={planRef}><CarePlanCard donorId={donorId} version={version} /></div>
      <div ref={labsRef}><LabReader donorId={donorId} onSaved={refresh} /></div>
    </div>
  );
}

function Trends({ data }: { data: HealthData }) {
  const [marker, setMarker] = useState('bp');
  const def = MARKERS.find((m) => m.key === marker)!;
  let points: { date: string; value: number; value2?: number; source?: string }[] = [];
  if (marker === 'bp') points = data.vitals.map((v) => ({ date: v.date, value: v.systolic, value2: v.diastolic }));
  else if (marker === 'weight') points = data.vitals.map((v) => ({ date: v.date, value: v.weightKg }));
  else points = (data.labs[marker] || []).map((o) => ({ date: o.date, value: o.value, source: o.source }));
  const available = MARKERS.filter((m) => m.key === 'bp' || m.key === 'weight' || (data.labs[m.key] || []).length);

  return (
    <Section title={<><Icon name="trend" size={18} /> Trends across your donations</>} sub="Each point is one donation visit (or an uploaded report)"
      right={<div className="tabs">{available.map((m) => <button key={m.key} className={`tab ${marker === m.key ? 'active' : ''}`} onClick={() => setMarker(m.key)}>{m.label}</button>)}</div>}>
      <div style={{ height: 260 }}>
        <ResponsiveContainer>
          <LineChart data={points.map((p) => ({ ...p, label: fmtDate(p.date) }))} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--muted)' }} />
            <YAxis tick={{ fontSize: 12, fill: 'var(--muted)' }} domain={['auto', 'auto']} unit={marker === 'hba1c' ? '%' : ''} />
            {def.good && <ReferenceArea y1={def.good[0]} y2={def.good[1]} fill="var(--good)" fillOpacity={0.08} />}
            <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }} formatter={(v, n) => [`${v} ${def.unit}`, n === 'value2' ? 'Diastolic' : marker === 'bp' ? 'Systolic' : def.label]} />
            <Line type="monotone" dataKey="value" stroke="#c8102e" strokeWidth={2.5} dot={{ r: 5 }} />
            {marker === 'bp' && <Line type="monotone" dataKey="value2" stroke="#1d4ed8" strokeWidth={2} dot={{ r: 4 }} />}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {def.good && <div className="tiny faint">Shaded band: healthy range.</div>}
    </Section>
  );
}

const CATEGORY_ICON: Record<string, string> = { see_doctor: 'hospital', diet: 'heart', activity: 'activity', monitoring: 'trend', lifestyle: 'sparkles', donation: 'drop' };

function CarePlanCard({ donorId, version }: { donorId: string; version: number }) {
  const [plan, setPlan] = useState<CarePlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { setPlan(null); setErr(null); }, [donorId, version]);

  async function run(refresh = false) {
    setBusy(true);
    setErr(null);
    try {
      setPlan(await api.carePlan(donorId, refresh));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const urgencyPill = { routine: 'pill-good', soon: 'pill-warn', urgent: 'pill-bad' };
  return (
    <Section title={<><Icon name="sparkles" size={18} /> Your care plan <AIBadge label="Agent" /></>}
      sub="An AI agent studies your results, trends and clinical protocols together, then writes a plan with evidence for every step."
      right={plan ? <button className="btn btn-sm" onClick={() => run(true)} disabled={busy}><Icon name="refresh" size={14} /> Regenerate</button> : null}>
      {!plan && !busy && <button className="btn btn-ai" onClick={() => run()}><Icon name="sparkles" size={16} /> Analyse my results and build a plan</button>}
      {busy && <Thinking label="Agent is reviewing trends, protocols, guidance and your cover…" />}
      {err && <ErrorNote error={err} />}
      {plan && (
        <div className="stack fade-in">
          <div className="row wrap"><span className={`pill ${urgencyPill[plan.plan.urgency]}`}>{plan.plan.urgency}</span><span className="tiny muted">{plan.generatedBy === 'agent' ? `Written by ${plan.model}` : 'Built from protocols'}</span></div>
          <p>{plan.plan.summary}</p>
          <div className="stack" style={{ gap: 12 }}>
            {plan.plan.actions.map((a, i) => (
              <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
                <div className="row between wrap">
                  <div className="row"><span className="unit-icon" style={{ width: 34, height: 34, background: 'var(--brand-soft)', color: 'var(--brand-ink)' }}><Icon name={CATEGORY_ICON[a.category] || 'info'} size={16} /></span><b>{a.title}</b></div>
                  <span className="pill pill-neutral">{a.timeframe}</span>
                </div>
                <p className="small muted mt-8">{a.why}</p>
                <ul className="small" style={{ margin: '8px 0 0', paddingLeft: 18 }}>{a.how.map((h) => <li key={h}>{h}</li>)}</ul>
                {a.expectedEffect && <div className="tiny mt-8" style={{ color: 'var(--good)' }}>Expected: {a.expectedEffect}</div>}
                <div className="row wrap mt-8" style={{ gap: 6 }}>{a.evidence.map((e) => <span key={e} className="pill pill-neutral tiny">{e}</span>)}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-2">
            <div className="callout callout-info small"><Icon name="shield" size={16} /><span><b>Cover goal:</b> {plan.plan.coverGoal}</span></div>
            <div className="callout small" style={{ background: 'var(--surface-2)' }}><Icon name="calendar" size={16} /><span><b>Next check:</b> {plan.plan.nextCheck}</span></div>
          </div>
          <details>
            <summary className="small bold" style={{ cursor: 'pointer' }}>Note for your doctor</summary>
            <p className="small muted mt-8">{plan.plan.doctorNote}</p>
          </details>
          <AgentTrace steps={plan.steps} />
          <OfflineNote reason={plan.aiUnavailable} />
          <div className="tiny faint">Not a diagnosis. A doctor confirms every finding and decides on any treatment.</div>
        </div>
      )}
    </Section>
  );
}

const SAMPLE_REPORT = `SRI SAI DIAGNOSTICS, JAYANAGAR · NABL Accredited
Patient: (name withheld)   Age/Sex: 34/M   Collected: 02-Oct-2026
-------------------------------------------------------------
LIPID PROFILE
Cholesterol, Total            5.4    mmol/L   (<5.2)
Triglycerides                 2.31   mmol/L   (<1.7)
HDL Cholesterol               1.04   mmol/L   (>1.0)
LDL Cholesterol (calc)        3.58   mmol/L   (<3.4)
GLYCATED HAEMOGLOBIN
HbA1c                         38     mmol/mol
LIVER FUNCTION
SGPT (ALT)                    41     U/L      (<45)
THYROID
Thyroid Stimulating Hormone   2.9    µIU/mL   (0.4-4.5)
Vitamin D (25-OH)             17.2   ng/mL    (30-100)
Urine routine: NAD`;

function LabReader({ donorId, onSaved }: { donorId: string; onSaved: () => void }) {
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<(Extraction & { aiUnavailable?: string }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setErr('Please use an image under 5 MB');
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function extract() {
    setBusy(true);
    setErr(null);
    setSaved(null);
    try {
      setResult(await api.extractLabs(donorId, image ? { image, text: text || undefined } : { text }));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!result) return;
    const r = await api.saveLabs(donorId, result);
    setSaved(`${r.saved} results added to your record (${fmtDate(r.date)}). Your score, cover and care plan now include them.`);
    setResult(null);
    setText('');
    setImage(null);
    onSaved();
  }

  return (
    <Section title={<><Icon name="doc" size={18} /> Add an outside lab report <AIBadge label="GenAI" /></>}
      sub="Every lab prints differently — names, units, layouts. AI reads any format (text or photo), maps each test to a standard code and converts units, so it joins your timeline.">
      <div className="grid grid-2">
        <div className="stack" style={{ gap: 10 }}>
          <textarea className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste the text of a lab report…" aria-label="Lab report text" />
          <div className="row wrap">
            <button className="btn btn-sm" onClick={() => setText(SAMPLE_REPORT)}>Use a sample report</button>
            <label className="btn btn-sm"><Icon name="upload" size={14} /> Photo<input type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} /></label>
            {image && <span className="pill pill-info">Image attached <button className="btn-ghost" style={{ border: 0, background: 'none', padding: 0 }} onClick={() => setImage(null)} aria-label="Remove image">×</button></span>}
          </div>
          <button className="btn btn-ai" onClick={extract} disabled={busy || (!text.trim() && !image)}><Icon name="sparkles" size={16} /> Read report</button>
          {busy && <Thinking label="Reading the report, matching tests, converting units…" />}
          {err && <ErrorNote error={err} />}
          {saved && <div className="callout small" style={{ background: 'var(--good-soft)' }}><Icon name="check" size={16} /> {saved}</div>}
        </div>
        <div>
          {!result && <div className="empty small">Extracted results appear here for you to check before they are saved.</div>}
          {result && (
            <div className="stack fade-in" style={{ gap: 10 }}>
              <div className="small"><b>{result.labName || 'Lab'}</b> · {result.reportDate ? fmtDate(result.reportDate) : 'date not printed'}</div>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Printed as</th><th>Mapped to</th><th>Value</th><th>Before</th></tr></thead>
                  <tbody>
                    {result.results.map((r) => (
                      <tr key={r.marker + r.printedName} style={{ opacity: r.plausible ? 1 : 0.5 }}>
                        <td>{r.printedName}<br /><span className="tiny faint">{r.printedValue} {r.printedUnit}</span></td>
                        <td>{r.name}<br /><span className="tiny faint">LOINC {r.loinc}</span></td>
                        <td className="bold">{r.value} <span className="tiny muted">{r.unit}</span>{!r.plausible && <div className="tiny" style={{ color: 'var(--bad)' }}>implausible — skipped</div>}{r.confidence !== 'high' && <div className="tiny" style={{ color: 'var(--warn)' }}>{r.confidence} confidence</div>}</td>
                        <td className="small muted">{r.previous ? `${r.previous.value} (${fmtDate(r.previous.date)})` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {result.notes && <div className="tiny muted"><b>Conversions:</b> {result.notes}</div>}
              {result.unmapped.length > 0 && <div className="tiny faint">Not tracked: {result.unmapped.join(', ')}</div>}
              <div className="row"><button className="btn btn-primary" onClick={save}>Confirm and add to my record</button><button className="btn" onClick={() => setResult(null)}>Discard</button></div>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
