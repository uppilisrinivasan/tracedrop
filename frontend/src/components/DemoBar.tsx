/** Demo-only bar: moves the shared demo clock so Drop's behaviour over days and weeks can be shown. */
import { useEffect, useState } from 'react';
import { api, type DemoClock } from '../api';
import { Icon } from '../ui';
import DropKnows from './drop/DropKnows';
import './drop/drop.css';

const TIMES: Record<DemoClock['partName'], string> = { morning: '8 am', afternoon: '2 pm', evening: '7 pm', night: '9 pm' };

function fmt(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export default function DemoBar({ donorId, onChange }: { donorId: string; onChange: () => void }) {
  const [clock, setClock] = useState<DemoClock | null>(null);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [knows, setKnows] = useState(false);

  // Stay in step with the server: it can restart (which resets the demo) or move on elsewhere
  useEffect(() => {
    const load = () => api.demoClock().then(setClock).catch(() => setClock(null));
    load();
    const onClock = (e: Event) => setClock((e as CustomEvent<DemoClock>).detail);
    window.addEventListener('demo:clock', onClock);
    window.addEventListener('focus', load);
    return () => { window.removeEventListener('demo:clock', onClock); window.removeEventListener('focus', load); };
  }, []);
  if (!clock) return null; // demo mode is off

  async function run(action: Promise<DemoClock>) {
    setBusy(true);
    try {
      setClock(await action);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  if (hidden) return <button className="demobar-tab" onClick={() => setHidden(false)}><Icon name="refresh" size={14} /> Demo · {fmt(clock.date)}</button>;

  return (
    <div className="demobar" role="region" aria-label="Demo controls">
      <button className="date" onClick={() => setHidden(true)} title="Hide the demo bar">
        <Icon name="calendar" size={16} /> {fmt(clock.date)} · {TIMES[clock.partName]}
      </button>
      <button className="b" aria-label="What is this bar?" aria-expanded={info} onClick={() => setInfo(!info)}><Icon name="info" size={16} /></button>
      <span className="grow" />
      <button className="b" disabled={busy} onClick={() => run(api.demoAdvance(1))}>+ few hours</button>
      <button className="b" disabled={busy} onClick={() => run(api.demoAdvance(4))}>+1 day</button>
      <button className="b" disabled={busy} onClick={() => run(api.demoAdvance(28))}>+1 week</button>
      <button className="b" disabled={busy} onClick={() => run(api.demoNext(donorId))}>Next event</button>
      <button className="b" disabled={busy} aria-label="Reset the demo" title="Reset the demo" onClick={() => run(api.demoReset())}><Icon name="refresh" size={16} /></button>
      <button className="b" aria-pressed={knows} onClick={() => setKnows(!knows)}><Icon name="cpu" size={15} /> What Drop knows</button>
      {knows && <DropKnows donorId={donorId} onClose={() => setKnows(false)} />}
      {info && (
        <div className="demobar-info">
          <b>Demo only.</b> Moves the app's date so you can see how Drop behaves over days and weeks. Real donors never see this bar. Reset puts everything back to Sat 10 Oct. Tap the date to hide the bar.
        </div>
      )}
    </div>
  );
}
