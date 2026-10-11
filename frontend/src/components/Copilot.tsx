/** Drop, the AI copilot: answers across the platform using tools and can navigate the app. */
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { api, type AgentStep } from '../api';
import { AgentTrace, AIBadge, Icon, Thinking } from '../ui';
import type { Screen } from '../App';

interface Turn { role: 'user' | 'ai'; text: string; steps?: AgentStep[]; offline?: boolean; navigatedTo?: string }

/** Minimal formatter for model replies: **bold**, "- " bullets and paragraphs. No HTML injection. */
function Rich({ text }: { text: string }) {
  const inline = (line: string) => line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <b key={i}>{part.slice(2, -2)}</b> : <span key={i}>{part}</span>);
  const blocks: ReactElement[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (bullets.length) blocks.push(<ul key={`u${blocks.length}`} style={{ margin: '4px 0', paddingLeft: 18 }}>{bullets.map((b, i) => <li key={i}>{inline(b)}</li>)}</ul>);
    bullets = [];
  };
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    const bullet = /^([-*•]|\d+\.)\s+(.*)$/.exec(line);
    if (bullet) { bullets.push(bullet[2]); continue; }
    flush();
    if (line) blocks.push(<p key={`p${blocks.length}`} style={{ margin: '4px 0' }}>{inline(line)}</p>);
  }
  flush();
  return <>{blocks}</>;
}

const SUGGESTIONS = [
  'Where did my blood go?',
  'Why is my cover not higher, and what would raise it?',
  'Explain my blood pressure trend',
  'What should I eat this week for my results?',
  'How has my company community helped?',
  'ನನ್ನ ರಕ್ತ ಯಾರಿಗೆ ಸಹಾಯ ಮಾಡಿತು?',
];

export default function Copilot({ donorId, go }: { donorId: string; go: (s: Screen) => void }) {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [history, setHistory] = useState<unknown[] | null>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const body = useRef<HTMLDivElement>(null);

  useEffect(() => { body.current?.scrollTo({ top: body.current.scrollHeight, behavior: 'smooth' }); }, [turns, busy]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setInput('');
    setTurns((t) => [...t, { role: 'user', text: message }]);
    setBusy(true);
    try {
      const r = await api.copilot(donorId, message, history);
      if (r.history) setHistory(r.history);
      const nav = r.actions.find((a) => a.type === 'navigate');
      setTurns((t) => [...t, { role: 'ai', text: r.reply, steps: r.steps, offline: r.offline, navigatedTo: nav?.screen }]);
      if (nav) go(nav.screen as Screen);
    } catch (e) {
      setTurns((t) => [...t, { role: 'ai', text: `Sorry, something went wrong: ${(e as Error).message}` }]);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button className="fab" onClick={() => setOpen(true)} aria-label="Ask Drop, your AI assistant">
        <Icon name="sparkles" size={20} /> Ask Drop
      </button>
    );
  }

  return (
    <div className="chat fade-in" role="dialog" aria-label="Drop AI assistant">
      <div className="chat-head">
        <div className="row">
          <span className="brand-mark" style={{ background: 'var(--ai)' }}><Icon name="sparkles" size={16} /></span>
          <div>
            <div className="bold">Drop <AIBadge label="Agent" /></div>
            <div className="tiny muted">Answers from your real records · any language</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)} aria-label="Close"><Icon name="x" /></button>
      </div>
      <div className="chat-body" ref={body}>
        {turns.length === 0 && (
          <div className="stack">
            <div className="msg msg-ai">Hi! I'm Drop. I can trace your blood, explain your results, work out how to raise your health cover, or take you anywhere in the app. Ask in English, ಕನ್ನಡ, हिंदी, தமிழ் or తెలుగు.</div>
            <div className="suggestions">
              {SUGGESTIONS.map((s) => <button key={s} className="suggestion" onClick={() => send(s)}>{s}</button>)}
            </div>
          </div>
        )}
        {turns.map((t, i) => (
          <div key={i} className="stack" style={{ gap: 6, alignItems: t.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div className={`msg ${t.role === 'user' ? 'msg-user' : 'msg-ai'}`} style={t.role === 'ai' ? { whiteSpace: 'normal' } : undefined}>
              {t.role === 'ai' ? <Rich text={t.text} /> : t.text}
            </div>
            {t.navigatedTo && <span className="pill pill-ai"><Icon name="arrow" size={12} /> Opened {t.navigatedTo}</span>}
            {t.steps && t.steps.length > 0 && <div style={{ width: '100%' }}><AgentTrace steps={t.steps} title="Tools Drop used" /></div>}
          </div>
        ))}
        {busy && <Thinking label="Drop is checking your records…" />}
      </div>
      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything about your donations, health or cover" aria-label="Message" />
        <button className="btn btn-ai" disabled={busy || !input.trim()} aria-label="Send"><Icon name="send" size={16} /></button>
      </form>
    </div>
  );
}
