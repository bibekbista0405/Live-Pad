import { Router } from 'express';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { randomUUID } from 'node:crypto';

export const authRouter = Router();
let guestAuthWarningShown = false;

function ensureAdminApp() {
  if (getApps().length) return;
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
  if (projectId) initializeApp({ projectId });
  else initializeApp();
}

/**
 * Creates a pseudonymous Firebase identity when the project's Anonymous Auth
 * provider is disabled. The UID is generated server-side, never accepted from
 * the browser. Firestore rules still enforce membership and roles.
 */
authRouter.post('/auth/guest-token', async (_req, res) => {
  try {
    ensureAdminApp();
    const uid = `guest_${randomUUID().replaceAll('-', '')}`;
    const token = await getAuth().createCustomToken(uid, { livepadGuest: true });
    return res.json({ token });
  } catch (error) {
    if (!guestAuthWarningShown) {
      guestAuthWarningShown = true;
      console.warn('[LivePad Auth] Guest cloud authentication is unavailable; public rooms will use the local server transport.');
    }
    return res.status(503).json({ error: 'Guest cloud authentication is not configured on the server.' });
  }
});
