/** First page. The only way in is a Google account. */
import { useEffect, useRef, useState } from 'react';
import { api, type AuthUser } from './api';
import { Icon } from './ui';
import { LegalLinks } from './Legal';

interface CredentialResponse { credential: string }
interface GoogleAccounts {
  id: {
    initialize: (config: { client_id: string; callback: (response: CredentialResponse) => void; auto_select: boolean }) => void;
    renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void;
  };
}

declare global {
  interface Window { google?: { accounts: GoogleAccounts }; }
}

function sessionLength(minutes: number) {
  if (minutes % 1440 === 0) {
    const days = minutes / 1440;
    return days === 1 ? '1 day' : `${days} days`;
  }
  return `${minutes} minutes`;
}

export default function Login({ clientId, sessionMinutes, onSignedIn }: {
  clientId: string;
  sessionMinutes: number;
  onSignedIn: (user: AuthUser) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!clientId || !host.current) return;
    let cancelled = false;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      if (cancelled || !host.current || !window.google) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        auto_select: false,
        callback: (response) => {
          setBusy(true);
          setError('');
          api.googleSignIn(response.credential)
            .then(onSignedIn)
            .catch((e: Error) => setError(e.message))
            .finally(() => setBusy(false));
        },
      });
      window.google.accounts.id.renderButton(host.current, {
        theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill', width: 320,
      });
    };
    script.onerror = () => setError('Google sign-in could not be loaded');
    document.head.appendChild(script);
    return () => { cancelled = true; script.remove(); };
  }, [clientId, onSignedIn]);

  return (
    <div className="login">
      <div className="login-card">
        <div className="brand"><span className="brand-mark"><Icon name="drop" size={18} stroke={2.4} /></span>TraceDrop</div>
        <h1>Sign in with Google</h1>
        <p className="muted">TraceDrop is available only after you sign in with a Google account. A session lasts {sessionLength(sessionMinutes)}, then you sign in again.</p>
        {clientId ? <div ref={host} className="login-google" /> : <p className="login-error">Google sign-in is not configured.</p>}
        {busy && <p className="tiny muted">Checking your Google account…</p>}
        {error && <p className="login-error">{error}</p>}
        <LegalLinks />
      </div>
    </div>
  );
}
