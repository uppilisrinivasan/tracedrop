import { useState } from 'react';
import { api } from '../api';
import type { PageProps } from '../App';
import { ErrorNote, Icon, Loading, Section, useLoad } from '../ui';
import DropLine from '../components/drop/DropLine';

const KIND_ICON: Record<string, string> = { family: 'home', friends: 'users', workplace: 'landmark' };

export default function Community({ donorId, version }: PageProps) {
  const { data, error, loading } = useLoad(() => api.communities(donorId), [donorId, version]);
  const [active, setActive] = useState(0);

  if (loading && !data) return <Loading />;
  if (error || !data) return <ErrorNote error={error || 'Could not load'} />;
  const head = (
    <div className="page-head">
      <div>
        <div className="page-title">Your circles</div>
        <div className="page-sub">See what your family, friends and colleagues achieve together — without anyone's health data being shared.</div>
      </div>
    </div>
  );
  if (!data.length) {
    return (
      <div className="stack fade-in">
        {head}
        <div className="card empty">You're not in a Circle yet. A Circle is your family, workplace or club, seeing your impact together.</div>
      </div>
    );
  }
  const c = data[Math.min(active, data.length - 1)];
  const maxContext = Math.max(...c.contexts.map((x) => x.count), 1);

  return (
    <div className="stack fade-in">
      {head}
      <DropLine donorId={donorId} screen="community" version={version} />

      <div className="tabs">
        {data.map((x, i) => <button key={x.id} className={`tab ${i === active ? 'active' : ''}`} onClick={() => setActive(i)}><Icon name={KIND_ICON[x.kind] || 'users'} size={14} /> {x.name}</button>)}
      </div>

      <div className="hero" style={{ background: 'linear-gradient(140deg, #1e3a8a, #6d28d9)' }}>
        <div className="muted small">{c.description}</div>
        <div className="row wrap mt-12" style={{ gap: 28 }}>
          <div><div className="hero-big" style={{ fontSize: 44 }}>{c.totals.patientsHelped}</div><div className="muted small">patients helped together</div></div>
          <div><div className="hero-big" style={{ fontSize: 44 }}>{c.totals.donations}</div><div className="muted small">donations</div></div>
          <div><div className="hero-big" style={{ fontSize: 44 }}>{c.participation}%</div><div className="muted small">donated in the last year</div></div>
        </div>
      </div>

      <div className="grid grid-2">
        <Section title="What your circle's blood was used for" sub="Anonymised, across all members">
          <div className="stack" style={{ gap: 8 }}>
            {c.contexts.map((x) => (
              <div key={x.context} className="bar-row">
                <span className="small">{x.context}</span>
                <div className="bar"><span style={{ width: `${(x.count / maxContext) * 100}%`, background: '#6d28d9' }} /></div>
                <span className="small bold" style={{ textAlign: 'right' }}>{x.count}</span>
              </div>
            ))}
          </div>
        </Section>
        <Section title="Leaderboard" sub={`${c.memberCount} members${c.hiddenMembers ? ` · ${c.hiddenMembers} prefer not to be listed` : ''}`}>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>#</th><th>Member</th><th>Donations</th><th>Helped</th></tr></thead>
              <tbody>
                {c.leaderboard.map((m, i) => (
                  <tr key={m.name} style={m.isYou ? { background: 'var(--brand-soft)' } : undefined}>
                    <td>{i + 1}</td><td className={m.isYou ? 'bold' : ''}>{m.name}</td><td>{m.donations}</td><td className="bold">{m.patientsHelped}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      <Section title="Blood groups in your circle" sub="Useful in an emergency — the blood centre can call the right group">
        <div className="row wrap" style={{ gap: 8 }}>
          {c.bloodGroups.sort((a, b) => b.count - a.count).map((g) => <span key={g.group} className={`pill ${g.group.endsWith('-') ? 'pill-brand' : 'pill-neutral'}`}>{g.group} · {g.count}</span>)}
        </div>
      </Section>

      <div className="callout callout-info small"><Icon name="lock" size={16} /> {c.privacyNote}</div>
    </div>
  );
}
