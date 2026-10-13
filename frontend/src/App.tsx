import { useEffect, useState } from 'react';
import { api, type AuthUser } from './api';
import { Icon } from './ui';
import Copilot from './components/Copilot';
import DemoBar from './components/DemoBar';
import AccountMenu from './components/AccountMenu';
import Home from './pages/Home';
import Impact from './pages/Impact';
import Health from './pages/Health';
import Cover from './pages/Cover';
import Community from './pages/Community';
import Donate from './pages/Donate';
import Ecosystem from './pages/Ecosystem';
import AIConsole from './pages/AIConsole';

export type Screen = 'home' | 'donate' | 'impact' | 'health' | 'cover' | 'community' | 'plan' | 'labs' | 'ecosystem' | 'ai';

const NAV: { id: Screen; label: string; icon: string; mobile?: boolean }[] = [
  { id: 'home', label: 'Home', icon: 'home', mobile: true },
  { id: 'donate', label: 'Donate', icon: 'calendar', mobile: true },
  { id: 'impact', label: 'My impact', icon: 'drop', mobile: true },
  { id: 'health', label: 'My health', icon: 'heart', mobile: true },
  { id: 'cover', label: 'Health cover', icon: 'shield', mobile: true },
  { id: 'community', label: 'Community', icon: 'users' },
  { id: 'ecosystem', label: 'Ecosystem view', icon: 'globe' },
];

function readStored(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function initialScreen(): Screen {
  const hash = window.location.hash.replace('#', '') as Screen;
  return NAV.some((n) => n.id === hash) || hash === 'plan' || hash === 'labs' || hash === 'ai' ? hash : 'home';
}

export default function App({ user, clientId, onSignOut }: { user: AuthUser; clientId: string; onSignOut: () => void }) {
  const [donorId, setDonorId] = useState(() => readStored('tracedrop.donor', 'D-001'));
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [personas, setPersonas] = useState<{ id: string; name: string; bloodGroup: string }[]>([]);
  const [version, setVersion] = useState(0); // bump to refresh data after a donation or upload

  useEffect(() => { api.personas().then(setPersonas).catch(() => setPersonas([])); }, []);
  useEffect(() => {
    try { localStorage.setItem('tracedrop.donor', donorId); } catch { /* storage unavailable */ }
  }, [donorId]);
  useEffect(() => {
    const onHash = () => setScreen(initialScreen());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (next: Screen) => {
    window.location.hash = next;
    setScreen(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const refresh = () => setVersion((v) => v + 1);
  const page = { donorId, go, version, refresh, clientId };

  const personaPicker = (
    <select className="persona-select" value={donorId} onChange={(e) => { setDonorId(e.target.value); go('home'); }} aria-label="Signed in as (demo donor)">
      {personas.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.bloodGroup}</option>)}
    </select>
  );

  const donor = personas.find((p) => p.id === donorId);
  const donorLabel = donor ? `${donor.name} · ${donor.bloodGroup}` : '';

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><Icon name="drop" size={18} stroke={2.4} /></span>TraceDrop</div>
        {NAV.map((n) => (
          <button key={n.id} className={`nav-item ${screen === n.id || (n.id === 'health' && (screen === 'plan' || screen === 'labs')) ? 'active' : ''}`} onClick={() => go(n.id)}>
            <Icon name={n.icon} /> {n.label}
          </button>
        ))}
        <div className="sidebar-foot">
          <AccountMenu user={user} donorPicker={personaPicker} donorLabel={donorLabel} onSignOut={onSignOut} />
        </div>
      </aside>

      <main className="main">
        <div className="mobile-top">
          <div className="brand" style={{ padding: 0 }}><span className="brand-mark"><Icon name="drop" size={18} stroke={2.4} /></span>TraceDrop</div>
          <AccountMenu user={user} donorPicker={personaPicker} donorLabel={donorLabel} onSignOut={onSignOut} compact />
        </div>
        {screen === 'home' && <DemoBar donorId={donorId} onChange={refresh} />}
        {screen === 'home' && <Home {...page} />}
        {screen === 'impact' && <Impact {...page} />}
        {(screen === 'health' || screen === 'plan' || screen === 'labs') && <Health {...page} focus={screen} />}
        {screen === 'cover' && <Cover {...page} />}
        {screen === 'community' && <Community {...page} />}
        {screen === 'donate' && <Donate {...page} />}
        {screen === 'ecosystem' && <Ecosystem {...page} />}
        {screen === 'ai' && <AIConsole />}
      </main>

      <nav className="bottom-nav">
        {NAV.filter((n) => n.mobile).map((n) => (
          <button key={n.id} className={screen === n.id ? 'active' : ''} onClick={() => go(n.id)}>
            <Icon name={n.icon} size={20} /> {{ impact: 'Impact', health: 'Health', cover: 'Cover' }[n.id as string] || n.label}
          </button>
        ))}
      </nav>

      {screen !== 'home' && <Copilot key={donorId} donorId={donorId} go={go} clientId={clientId} />}
    </div>
  );
}

export interface PageProps {
  donorId: string;
  go: (screen: Screen) => void;
  version: number;
  refresh: () => void;
  clientId: string;
}
