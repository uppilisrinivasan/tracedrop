const express = require('express');
const { authDisabled, SESSION_MS } = require('../auth/policy');
const session = require('../auth/session');
const { verifyGoogleCredential } = require('../auth/google');
const { recordSignIn } = require('../auth/accessLog');

const router = express.Router();
const ok = (res, data) => res.json({ success: true, data });
const fail = (res, status, error) => res.status(status).json({ success: false, error });

router.get('/config', (req, res) => ok(res, {
  authDisabled: authDisabled(),
  clientId: authDisabled() ? '' : (process.env.GOOGLE_CLIENT_ID || ''),
  sessionMinutes: SESSION_MS / 60000,
}));

router.get('/me', (req, res) => {
  if (authDisabled()) {
    return ok(res, { email: 'local-dev', name: 'Local development', picture: '', expiresAt: null, local: true });
  }
  const user = session.readRequest(req);
  if (!user) return fail(res, 401, 'Sign in with Google');
  return ok(res, user);
});

router.post('/google', async (req, res) => {
  if (authDisabled()) return fail(res, 400, 'Sign-in is turned off for local development');
  try {
    const user = await verifyGoogleCredential(req.body && req.body.credential);
    await recordSignIn(user, req);
    const issued = session.sign(user);
    session.setCookie(res, issued.token);
    return ok(res, issued.user);
  } catch (error) {
    console.error(`[auth] ${error.message}`);
    return fail(res, error.status || 401, error.message || 'Sign in with Google');
  }
});

router.post('/logout', (req, res) => {
  session.clearCookie(res);
  return ok(res, { signedOut: true });
});

module.exports = router;
