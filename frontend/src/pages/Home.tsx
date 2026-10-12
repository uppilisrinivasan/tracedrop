import { api, fmtDate, rupees } from '../api';
import type { PageProps, Screen } from '../App';
import { AIBadge, ErrorNote, Icon, Loading, Thinking, severityPill, useLoad } from '../ui';

export default function Home({ donorId, go, version }: PageProps) {
  const { data, error, loading } = useLoad(() => api.overview(donorId), [donorId, version]);
  const insight = useLoad(() => api.insight(donorId), [donorId, version]);

  if (loading && !data) return <Loading />;
  if (error || !data) return <ErrorNote error={error || 'Could not load'} />;

  const first = data.donor.name.split(' ')[0];
  const { impact: im, health, cover, eligibility: el } = data;
  const scoreDelta = health.score != null && health.previousScore != null ? health.score - health.previousScore : 0;
  const urgent = health.findings.find((f) => f.severity === 'urgent');

  return (
    <div className="home-board fade-in">
      <div className="page-head home-span">
        <div>
          <div className="page-title">Hello, {first}</div>
          <div className="page-sub">{data.donor.bloodGroup} donor since {data.donations.firstDate ? fmtDate(data.donations.firstDate) : '—'} · {data.donor.district}</div>
        </div>
        <button className="btn btn-primary" onClick={() => go('donate')}><Icon name="calendar" /> {el.eligibleNow ? 'Book a donation' : 'Donation status'}</button>
      </div>

      {urgent && (
        <div className="callout callout-bad home-span">
          <Icon name="alert" />
          <div>
            <b>{urgent.title}.</b> {urgent.detail}. Please see a doctor today — your care plan has nearby options.
            <div className="mt-8"><button className="btn btn-sm btn-primary" onClick={() => go('plan')}>Open care plan</button></div>
          </div>
        </div>
      )}

      <div className="home-main">
        <div className="hero">
          <div className="row between wrap" style={{ alignItems: 'flex-start' }}>
            <div>
              <div className="muted small">Your blood has helped</div>
              <div className="hero-big">{im.patientsHelped} <span style={{ fontSize: 22, fontWeight: 700 }}>patients</span></div>
              <div className="muted small mt-8">{data.donations.completed} donations · {im.components} components made · {data.donations.litres} L given{im.children ? ` · ${im.children} children helped` : ''}</div>
            </div>
            <button className="btn" style={{ background: 'rgba(255,255,255,.95)', color: '#9b0c23', border: 0 }} onClick={() => go('impact')}>
              See where it went <Icon name="arrow" size={16} />
            </button>
          </div>
          {data.latestJourney?.recipient && (
            <div className="hero-chip mt-16 small">
              <b>Latest:</b> your {data.latestJourney.name.toLowerCase()} from {fmtDate(data.latestJourney.donationDate)} went to a {data.latestJourney.recipient.patient.toLowerCase()} — {data.latestJourney.recipient.context.toLowerCase()}.
            </div>
          )}
        </div>

        <div className="home-stats">
          <button className="card" style={{ textAlign: 'left' }} onClick={() => go('health')}>
            <div className="row between"><span className="stat-label">Health score</span><Icon name="heart" className="faint" /></div>
            <div className="row mt-8" style={{ alignItems: 'baseline' }}>
              <span className="stat-value">{health.score ?? '—'}</span><span className="muted">/100</span>
              {scoreDelta !== 0 && <span className={`pill ${scoreDelta > 0 ? 'pill-good' : 'pill-warn'}`}>{scoreDelta > 0 ? '▲' : '▼'} {Math.abs(scoreDelta)}</span>}
            </div>
            <div className="row wrap mt-12" style={{ gap: 6 }}>
              {health.findings.length === 0 && <span className="pill pill-good">All results in range</span>}
              {health.findings.slice(0, 3).map((f) => <span key={f.id} className={`pill ${severityPill[f.severity]}`}>{f.title}</span>)}
            </div>
          </button>

          <button className="card" style={{ textAlign: 'left' }} onClick={() => go('cover')}>
            <div className="row between"><span className="stat-label">Health insurance cover</span><Icon name="shield" className="faint" /></div>
            <div className="row mt-8" style={{ alignItems: 'baseline' }}>
              <span className="stat-value">{rupees(cover.current)}</span>
              {cover.current > cover.base && <span className="pill pill-good">+{rupees(cover.current - cover.base)}</span>}
            </div>
            <div className="small muted mt-12">
              {cover.blockedBy === 'monitoring' ? `Qualifies for ${rupees(cover.eligible)} — one more check-up unlocks it`
                : cover.pointsToNext != null && cover.next ? `${cover.pointsToNext} score point${cover.pointsToNext === 1 ? '' : 's'} to ${rupees(cover.next)}, same premium`
                  : cover.next ? 'Keep monitoring to grow your cover' : 'Top cover step reached'}
            </div>
          </button>

          <button className="card" style={{ textAlign: 'left' }} onClick={() => go('donate')}>
            <div className="row between"><span className="stat-label">Next donation</span><Icon name="calendar" className="faint" /></div>
            <div className="stat-value mt-8" style={{ fontSize: 24 }}>
              {el.eligibleNow ? 'Today' : el.nextEligibleDate ? fmtDate(el.nextEligibleDate) : 'On hold'}
            </div>
            <div className="small muted mt-12">
              {el.blockers.length ? `Paused: ${el.blockers[0].toLowerCase()}` : el.eligibleNow ? 'You are eligible — each donation includes a free health check' : `Gap of ${el.gapDays} days after each donation`}
            </div>
          </button>
        </div>
      </div>

      <div className="home-side">
        <div className="card" style={{ borderColor: 'color-mix(in srgb, var(--ai) 30%, var(--border))' }}>
          <div className="row between">
            <div className="row"><AIBadge label="For you today" /></div>
            {insight.data && <span className="tiny faint">{insight.data.generatedBy === 'ai' ? `Picked from ${insight.data.considered.length} signals` : 'Rule-based'}</span>}
          </div>
          {insight.loading && <div className="mt-12"><Thinking label="Finding what matters most for you today…" /></div>}
          {insight.data && (
            <div className="mt-12">
              <div className="bold" style={{ fontSize: 17 }}>{insight.data.title}</div>
              <p className="muted mt-8">{insight.data.message}</p>
              <button className="btn btn-sm mt-12" onClick={() => go(insight.data!.cta as Screen)}>Open <Icon name="arrow" size={14} /></button>
            </div>
          )}
        </div>
        <div className="card">
          <div className="card-title"><Icon name="sparkles" size={17} /> Try the AI</div>
          <div className="stack mt-12" style={{ gap: 8 }}>
            <QuickAI icon="doc" title="Read a lab report" sub="Paste or photograph any lab report — AI maps it to your record" onClick={() => go('labs')} />
            <QuickAI icon="activity" title="Get your care plan" sub="An agent analyses all your results and writes a plan" onClick={() => go('plan')} />
            <QuickAI icon="share" title="Turn a donation into a story" sub="Shareable, private, in your language" onClick={() => go('impact')} />
          </div>
        </div>
        <div className="card">
          <div className="card-title"><Icon name="users" size={17} /> Your circles</div>
          <div className="stack mt-12" style={{ gap: 10 }}>
            {data.communities.map((c) => (
              <button key={c.id} className="circle-row" onClick={() => go('community')}>
                <span><b>{c.name}</b><span className="tiny muted">{c.kind} · {c.memberCount} members</span></span>
                <span className="small">{c.totals.patientsHelped} helped</span>
              </button>
            ))}
            {!data.communities.length && <span className="muted small">Join or create a circle with family, friends or colleagues.</span>}
          </div>
        </div>
      </div>

      <div className="home-span"><AIStatusLine ai={data.ai} /></div>
    </div>
  );
}

function QuickAI({ icon, title, sub, onClick }: { icon: string; title: string; sub: string; onClick: () => void }) {
  return (
    <button className="row" style={{ border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 12, padding: 10, textAlign: 'left' }} onClick={onClick}>
      <span className="unit-icon" style={{ width: 36, height: 36, background: 'var(--ai-soft)', color: 'var(--ai)' }}><Icon name={icon} size={17} /></span>
      <span style={{ flex: 1 }}><span className="bold small">{title}</span><br /><span className="tiny muted">{sub}</span></span>
      <Icon name="chevron" size={16} className="faint" />
    </button>
  );
}

export function AIStatusLine({ ai }: { ai: { live: boolean; model: string; reason: string | null; tokensUsedToday: number; dailyTokenBudget: number } }) {
  return (
    <div className="tiny faint row wrap" style={{ gap: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: 9, background: ai.live ? 'var(--good)' : 'var(--warn)', display: 'inline-block' }} />
      {ai.live ? `AI live · ${ai.model} · ${ai.tokensUsedToday.toLocaleString()} / ${ai.dailyTokenBudget.toLocaleString()} tokens today` : `AI offline (${ai.reason}) — rule-based fallbacks active`}
    </div>
  );
}
