/** Shows the login page until a Google session exists. The API enforces the same rule. */
import { useCallback, useEffect, useState } from 'react';
import { api, setUnauthorizedHandler, type AuthUser } from './api';
import App from './App';
import BookingChat from './BookingChat';
import Login from './Login';
import { Icon } from './ui';

type Phase = 'loading' | 'in' | 'out';

export default function AuthGate() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [clientId, setClientId] = useState('');
  const [sessionMinutes, setSessionMinutes] = useState(24 * 60);
  const [setup, setSetup] = useState<'pending' | 'show' | 'hide'>('pending');

  const signOut = useCallback((remote = true) => {
    if (remote) api.logout().catch(() => undefined);
    setUser(null);
    setPhase('out');
  }, []);
  const signedIn = useCallback((next: AuthUser) => { setSetup('pending'); setUser(next); setPhase('in'); }, []);

  useEffect(() => {
    let live = true;
    setUnauthorizedHandler(() => { if (live) signOut(false); });
    api.authConfig().then(async (config) => {
      if (!live) return;
      setClientId(config.clientId);
      setSessionMinutes(config.sessionMinutes);
      if (config.authDisabled) {
        setUser({ email: 'local-dev', name: 'Local development', picture: '', expiresAt: null, local: true });
        setPhase('in');
        return;
      }
      try {
        const me = await api.me();
        if (!live) return;
        setUser(me);
        setPhase('in');
      } catch {
        if (live) setPhase('out');
      }
    }).catch(() => { if (live) setPhase('out'); });
    return () => { live = false; };
  }, [signOut]);

  useEffect(() => {
    if (phase !== 'in' || !user) return;
    let live = true;
    api.preferences().then((prefs) => {
      if (!live) return;
      setSetup(prefs?.onboardingComplete || prefs?.onboardingSkipped ? 'hide' : 'show');
    }).catch(() => { if (live) setSetup('show'); });
    return () => { live = false; };
  }, [phase, user]);

  useEffect(() => {
    if (!user?.expiresAt) return;
    const wait = user.expiresAt - Date.now();
    const timer = window.setTimeout(() => signOut(false), Math.max(wait, 0));
    return () => window.clearTimeout(timer);
  }, [user, signOut]);

  if (phase === 'loading') {
    return <div className="login"><p className="muted">TraceDrop</p></div>;
  }
  if (phase === 'out' || !user) {
    return <Login clientId={clientId} sessionMinutes={sessionMinutes} onSignedIn={signedIn} />;
  }
  if (setup !== 'hide') {
    return (
      <div className="login">
        <div className="login-card legal">
          <div className="brand"><span className="brand-mark"><Icon name="drop" size={18} stroke={2.4} /></span>TraceDrop</div>
          <h1>When can you donate?</h1>
          <p className="muted">These answers are saved to your account and used whenever you book. Skip if you want to decide later.</p>
          {setup === 'show'
            ? <BookingChat mode="setup" clientId={clientId} onFinished={() => setSetup('hide')} />
            : <p className="tiny muted">Loading your donation preferences…</p>}
        </div>
      </div>
    );
  }
  return <App user={user} clientId={clientId} onSignOut={() => signOut(true)} />;
}
