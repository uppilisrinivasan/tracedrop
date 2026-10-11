/** Privacy policy and terms. Public: Google's consent screen links here before anyone signs in. */
import { Icon } from './ui';

const CONTACT = 'sandeepsamant1702@gmail.com';
const UPDATED = '11 October 2026';

export const LEGAL_PATHS = ['/privacy', '/terms'];

export function LegalLinks() {
  return (
    <p className="tiny muted legal-links">
      By continuing you agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.
    </p>
  );
}

function Privacy() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="tiny muted">Last updated {UPDATED}</p>
      <h2>What we collect</h2>
      <p>When you sign in with Google we receive your name, email address, profile picture and Google account ID. We store these with the time of each sign-in and your browser's user agent, so we know who used TraceDrop and when.</p>
      <p>We also keep the information you enter into TraceDrop, such as donor records and lab report photos you upload.</p>
      <h2>How we use it</h2>
      <p>We use your Google profile only to sign you in and to keep a record of access. We do not sell your data, show ads, or share it with anyone except the services that run TraceDrop.</p>
      <h2>Where it is stored</h2>
      <p>TraceDrop runs on Google Cloud in India (asia-south1). Sign-in records are kept in Google Cloud Firestore. AI features send the relevant text to Google Vertex AI (Gemini) to produce an answer; Google does not use this to train its models.</p>
      <h2>Sessions</h2>
      <p>A session lasts 1 day and is held in a secure cookie. After that you sign in again. TraceDrop sets no other cookies; Google's sign-in button follows Google's own privacy policy.</p>
      <h2>Your choices</h2>
      <p>To see or delete the data we hold about you, email <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. You can also remove TraceDrop's access at any time from your Google Account under Security, Third-party connections.</p>
      <h2>Contact</h2>
      <p><a href={`mailto:${CONTACT}`}>{CONTACT}</a></p>
    </>
  );
}

function Terms() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p className="tiny muted">Last updated {UPDATED}</p>
      <h2>Using TraceDrop</h2>
      <p>TraceDrop is a demonstration platform for tracing blood donations. You need a Google account to sign in. Use it lawfully and do not try to access data or accounts that are not yours.</p>
      <h2>Your content</h2>
      <p>You are responsible for the information you enter. Do not upload real medical records or personal data of other people without their consent.</p>
      <h2>No medical advice</h2>
      <p>AI answers and screening suggestions are for information only. They are not medical advice and must not replace a qualified professional's judgement.</p>
      <h2>Availability</h2>
      <p>TraceDrop is provided as is, without warranty. It may change, pause, or stop at any time, and we may end access for anyone who misuses it.</p>
      <h2>Privacy</h2>
      <p>How we handle your data is described in the <a href="/privacy">Privacy Policy</a>.</p>
      <h2>Contact</h2>
      <p><a href={`mailto:${CONTACT}`}>{CONTACT}</a></p>
    </>
  );
}

export default function Legal({ path }: { path: string }) {
  return (
    <div className="login">
      <article className="login-card legal">
        <a href="/" className="brand"><span className="brand-mark"><Icon name="drop" size={18} stroke={2.4} /></span>TraceDrop</a>
        {path === '/terms' ? <Terms /> : <Privacy />}
        <p className="tiny muted legal-links"><a href="/">Back to sign in</a> · <a href={path === '/terms' ? '/privacy' : '/terms'}>{path === '/terms' ? 'Privacy Policy' : 'Terms of Service'}</a></p>
      </article>
    </div>
  );
}
