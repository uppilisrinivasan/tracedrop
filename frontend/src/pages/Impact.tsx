import { useMemo, useRef, useState } from 'react';
import { api, fmtDate, type Journey, type Stakeholder, type Story } from '../api';
import type { PageProps } from '../App';
import { AIBadge, ErrorNote, Icon, Loading, OfflineNote, Section, Thinking, useLoad } from '../ui';
import DropLine from '../components/drop/DropLine';
import ShareBar from '../components/impact/ShareBar';
import { ConcernForm, ConcernList } from '../components/impact/Concerns';
import DonationCalendar from '../components/impact/DonationCalendar';

const KIND_STYLE: Record<string, { bg: string; fg: string; short: string }> = {
  PRBC: { bg: '#fde2e5', fg: '#9b0c23', short: 'RBC' },
  PLT: { bg: '#fdf0d5', fg: '#92400e', short: 'PLT' },
  FFP: { bg: '#fef6c7', fg: '#854d0e', short: 'FFP' },
  CRYO: { bg: '#e0ecfd', fg: '#1e40af', short: 'CRY' },
  PLASMA: { bg: '#ede4fd', fg: '#5b21b6', short: 'PLS' },
};

const STAGES = ['collected', 'separated', 'tested', 'stored', 'issued', 'transfused', 'outcome'];
const PLASMA_STAGES = ['collected', 'separated', 'tested', 'stored', 'fractionation', 'products_released'];

export default function Impact({ donorId, version }: PageProps) {
  const { data, error, loading } = useLoad(() => api.impact(donorId), [donorId, version]);
  const stake = useLoad(() => api.stakeholders(donorId), [donorId, version]);
  const concerns = useLoad(() => api.concerns(donorId), [donorId, version]);
  const [tab, setTab] = useState<'units' | 'institutions'>('units');
  const [date, setDate] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  const byDonation = useMemo(() => {
    const groups: Record<string, Journey[]> = {};
    for (const j of data?.journeys || []) (groups[j.donationDate] ||= []).push(j);
    return groups;
  }, [data]);

  if (loading && !data) return <Loading />;
  if (error || !data) return <ErrorNote error={error || 'Could not load'} />;
  const dates = Object.keys(byDonation).sort();
  const latest = dates[dates.length - 1];
  const day = date && byDonation[date] ? date : latest;
  const units = (day && byDonation[day]) || [];
  const current = units.find((j) => j.id === selected) || units.find((j) => j.recipient) || units[0];
  const s = data.summary;
  const pick = (d: string) => {
    setDate(d);
    setSelected(null);
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="stack fade-in">
      <div className="page-head">
        <div>
          <div className="page-title">Where your blood went</div>
          <div className="page-sub">Every donation is separated into components. Follow each one to the patient it helped — privately.</div>
        </div>
        <div className="row wrap">
          <button className="btn btn-primary btn-sm" onClick={() => setSharing(!sharing)}><Icon name="share" size={15} /> Share my impact</button>
          <div className="tabs">
            <button className={`tab ${tab === 'units' ? 'active' : ''}`} onClick={() => setTab('units')}>My donations</button>
            <button className={`tab ${tab === 'institutions' ? 'active' : ''}`} onClick={() => setTab('institutions')}>Who benefited</button>
          </div>
        </div>
      </div>
      <DropLine donorId={donorId} screen="impact" version={version} />

      {sharing && (
        <div className="card fade-in">
          <ShareBar item={{
            headline: `My blood has helped ${s.patientsHelped} patient${s.patientsHelped === 1 ? '' : 's'}`,
            story: `${s.components} components from my donations went to hospitals${s.children ? `, including ${s.children} for children` : ''}. ${s.medicineDosesShare ? `My plasma also helped make about ${s.medicineDosesShare} medicine doses.` : ''} TraceDrop let me follow each one, privately.`,
            shareText: `My blood donations have helped ${s.patientsHelped} patients so far. One donation can help up to three people. #DonateBlood`,
          }} />
        </div>
      )}

      <div className="grid grid-4">
        <Stat value={s.patientsHelped} label="patients treated" />
        <Stat value={s.components} label="components from your donations" />
        <Stat value={s.children} label="children helped" />
        <Stat value={s.medicineDosesShare} label="medicine doses (your plasma share)" />
      </div>

      {tab === 'units' && !day && <div className="empty">No donations yet. Your first one will appear here.</div>}
      {tab === 'units' && day && (
        <>
          <div ref={top} className="card donation-card">
            <div className="row between wrap">
              <div>
                <div className="row" style={{ gap: 8 }}>
                  <span className="bold">Donation · {fmtDate(day)}</span>
                  {day === latest && <span className="pill pill-info">Latest</span>}
                </div>
                <div className="tiny muted">{units[0].centre} · {units.length} component{units.length === 1 ? '' : 's'}</div>
              </div>
            </div>
            <div className="unit-tabs mt-12" role="tablist" aria-label="Components from this donation">
              {units.map((u) => <UnitRow key={u.id} unit={u} selected={current?.id === u.id} onClick={() => setSelected(u.id)} />)}
            </div>
            {current && <UnitDetail key={current.id} donorId={donorId} unit={current} onConcern={concerns.reload} />}
          </div>

          <div className="impact-lower">
            <div className="card cal-card">
              <div className="card-title"><Icon name="calendar" size={17} /> Your donations</div>
              <div className="card-sub">Pick a marked day to see that donation above.</div>
              <div className="mt-12"><DonationCalendar dates={dates} selected={day} onPick={pick} /></div>
            </div>
            <ConcernList donorId={donorId} concerns={concerns.data || []} onChange={concerns.reload} />
          </div>
        </>
      )}
      {tab === 'institutions' && <Institutions stake={stake.data} loading={stake.loading} />}
      {tab === 'institutions' && <ConcernList donorId={donorId} concerns={concerns.data || []} onChange={concerns.reload} />}

      <div className="callout callout-info small">
        <Icon name="lock" size={16} />
        <span>Recipients are never identified. You see only an age band, the type of treatment and the type of hospital; dates of use are rounded to the month, and any combination shared by fewer than {data.k} patients is generalised further.</span>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return <div className="card"><div className="stat-value">{value}</div><div className="stat-label">{label}</div></div>;
}

function UnitRow({ unit, selected, onClick }: { unit: Journey; selected: boolean; onClick: () => void }) {
  const style = KIND_STYLE[unit.kind];
  const statusPill = unit.withheld ? 'pill-neutral' : unit.helped ? 'pill-good' : unit.status === 'expired' ? 'pill-neutral' : 'pill-info';
  return (
    <button className={`unit-card ${selected ? 'selected' : ''}`} onClick={onClick}>
      <span className="unit-icon" style={{ background: style.bg, color: style.fg }}>{style.short}</span>
      <span>
        <span className="bold small">{unit.name}</span><br />
        <span className="tiny muted">{unit.recipient ? unit.recipient.context : unit.statusLabel}</span>
      </span>
      <span className={`pill ${statusPill}`}>{unit.withheld ? 'Withheld' : unit.helped ? 'Helped' : unit.status === 'expired' ? 'Expired' : 'In progress'}</span>
    </button>
  );
}

function UnitDetail({ donorId, unit, onConcern }: { donorId: string; unit: Journey; onConcern: () => void }) {
  const [story, setStory] = useState<Story | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [concernOpen, setConcernOpen] = useState(false);
  const [concernSent, setConcernSent] = useState<string | null>(null);
  const stages = unit.kind === 'PLASMA' || unit.events.some((e) => e.type === 'fractionation') ? PLASMA_STAGES : STAGES;
  const reached = new Set(unit.events.map((e) => e.type));
  const style = KIND_STYLE[unit.kind];

  async function makeStory(refresh = false) {
    setBusy(true);
    setErr(null);
    try {
      setStory(await api.story(donorId, unit.id, refresh));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="unit-detail fade-in">
      <div className="row between">
        <div className="row">
          <span className="unit-icon" style={{ background: style.bg, color: style.fg }}>{style.short}</span>
          <div>
            <div className="bold">{unit.name}</div>
            <div className="tiny muted">Donated {fmtDate(unit.donationDate)} · shelf life {unit.shelf}</div>
          </div>
        </div>
      </div>
      <p className="small muted mt-12">{unit.role}.</p>

      <div className="journey mt-16">
        {stages.map((st, i) => {
          const ev = unit.events.find((e) => e.type === st);
          const done = reached.has(st);
          const isLast = done && !stages.slice(i + 1).some((x) => reached.has(x));
          return (
            <div key={st} className={`j-step ${done ? 'done' : ''} ${isLast ? 'current' : ''}`}>
              <span className="j-dot">{done && <Icon name="check" size={14} stroke={3} />}</span>
              <span className="j-label">{ev?.label || labelFor(st)}</span>
              {ev && <span className="j-when">{ev.when.length === 10 ? fmtDate(ev.when) : ev.when}</span>}
            </div>
          );
        })}
      </div>

      {unit.withheld && (
        <div className="callout callout-info small mt-16"><Icon name="info" size={16} /> This unit was kept out of the supply as a safety precaution. The blood centre's counsellor will contact you privately.</div>
      )}
      {unit.status === 'expired' && (
        <div className="expiry mt-16">
          <div className="bold small">Why it wasn't used</div>
          <ul>{(unit.expiry?.cause || ['This unit reached its shelf-life limit before it was needed.']).map((c) => <li key={c}>{c}</li>)}</ul>
          {unit.expiry && (
            <>
              <div className="bold small mt-8">What happens because of it</div>
              <ul>{unit.expiry.effect.map((c) => <li key={c}>{c}</li>)}</ul>
            </>
          )}
        </div>
      )}

      {unit.recipient && (
        <div className="mt-16" style={{ background: 'var(--brand-soft)', borderRadius: 14, padding: 16 }}>
          <div className="tiny bold" style={{ color: 'var(--brand-ink)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Who it helped</div>
          <div className="bold mt-8" style={{ fontSize: 17 }}>{unit.recipient.context}</div>
          <div className="small mt-8">{unit.recipient.patient} · {unit.recipient.place}</div>
          <div className="small mt-8">{unit.recipient.outcome === 'recovered' ? '✓ The hospital recorded a good recovery' : unit.recipient.outcome === 'ongoing' ? 'Treatment ongoing' : 'Outcome not reported by the hospital'}</div>
          {unit.recipient.generalised && <div className="tiny muted mt-8">Details generalised to protect privacy.</div>}
        </div>
      )}

      {unit.fractionation && unit.status === 'products_released' && (
        <div className="mt-16 small" style={{ background: 'var(--ai-soft)', borderRadius: 14, padding: 16 }}>
          Your plasma joined a pool of {unit.fractionation.poolSize.toLocaleString()} donations to make life-saving medicines — your share is about {unit.fractionation.albuminVials} vial of albumin, {unit.fractionation.ivigVials} dose of immunoglobulin (IVIG) and {unit.fractionation.factorViiiIu} IU of clotting factor VIII.
        </div>
      )}

      {unit.recipient && (
        <div className="mt-16">
          {!story && !busy && <button className="btn btn-ai" onClick={() => makeStory()}><Icon name="sparkles" size={16} /> Write my impact story</button>}
          {busy && <Thinking label="Writing your story in your language…" />}
          {err && <ErrorNote error={err} />}
          {story && !busy && (
            <div className="stack fade-in" style={{ gap: 10 }}>
              <div className="share-card">
                <div className="row between"><span className="tiny" style={{ opacity: 0.8 }}>TraceDrop · My donation story</span>{story.generatedBy === 'ai' && <span className="ai-badge" style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }}>AI</span>}</div>
                <div className="bold mt-12" style={{ fontSize: 20 }}>{story.headline}</div>
                <p className="mt-8" style={{ opacity: 0.95 }}>{story.story}</p>
              </div>
              <ShareBar item={story} />
              <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => makeStory(true)}><Icon name="refresh" size={14} /> Write it again</button>
              <OfflineNote reason={story.aiUnavailable} />
            </div>
          )}
        </div>
      )}

      <div className="mt-16">
        {concernSent && <div className="callout small" style={{ background: 'var(--good-soft)' }}><Icon name="check" size={16} /> {concernSent}</div>}
        {!concernOpen && !concernSent && (
          <button className="btn btn-ghost btn-sm" onClick={() => setConcernOpen(true)}><Icon name="flag" size={14} /> Something wrong? Raise a concern</button>
        )}
        {concernOpen && (
          <ConcernForm donorId={donorId} unit={unit} onCancel={() => setConcernOpen(false)}
            onDone={(c) => { setConcernOpen(false); setConcernSent(`Sent as ${c.id} to ${c.owner}. Answer due by ${fmtDate(c.dueOn)}. Follow it under "Your concerns" below.`); onConcern(); }} />
        )}
      </div>
    </div>
  );
}

function labelFor(stage: string) {
  return ({ collected: 'Collected', separated: 'Separated', tested: 'Safety tested', stored: 'Stored', issued: 'Issued to hospital', transfused: 'Transfused',
    outcome: 'Outcome recorded', fractionation: 'Fractionation', products_released: 'Medicines made' } as Record<string, string>)[stage] || stage;
}

function Institutions({ stake, loading }: { stake: Stakeholder[] | null; loading: boolean }) {
  const [open, setOpen] = useState<string>('blood_bank');
  if (loading || !stake) return <Loading lines={2} />;
  const icon: Record<string, string> = { droplet: 'drop', hospital: 'hospital', flask: 'flask', landmark: 'landmark', users: 'users' };
  return (
    <div className="stack">
      {stake.map((s) => {
        const max = Math.max(...s.drilldown.map((d) => d.value), 1);
        const isOpen = open === s.id;
        return (
          <Section key={s.id}
            title={<><Icon name={icon[s.icon] || 'info'} size={18} /> {s.name}</>}
            sub={s.headline}
            right={<button className="btn btn-sm" onClick={() => setOpen(isOpen ? '' : s.id)}>{isOpen ? 'Hide detail' : 'Drill down'}</button>}>
            <div className="grid grid-4" style={{ gap: 10 }}>
              {s.metrics.map((m) => (
                <div key={m.label} style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 12 }}>
                  <div className="bold" style={{ fontSize: 20 }}>{m.value}</div>
                  <div className="tiny muted">{m.label}</div>
                </div>
              ))}
            </div>
            {isOpen && (
              <div className="mt-16 fade-in">
                <p className="small muted">{s.story}</p>
                <div className="stack mt-12" style={{ gap: 8 }}>
                  {s.drilldown.map((d) => (
                    <div key={d.label} className="bar-row">
                      <span className="small">{d.label}</span>
                      <div className="bar"><span style={{ width: `${(d.value / max) * 100}%` }} /></div>
                      <span className="small bold" style={{ textAlign: 'right' }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>
        );
      })}
      <div className="tiny faint">Monetary values are estimates for illustration.</div>
    </div>
  );
}

export { AIBadge };
