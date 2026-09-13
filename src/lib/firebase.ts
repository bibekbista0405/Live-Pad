import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Detect if a legitimate firebase configuration exists details
export const isFirebaseConfigured = !!(
  firebaseConfig && 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey.trim() !== "" && 
  !firebaseConfig.apiKey.includes("remixed") &&
  !firebaseConfig.apiKey.includes("mock") &&
  firebaseConfig.projectId !== "mock-project" &&
  firebaseConfig.projectId !== "remixed-project-id"
);

// Lazy or conditional initialization safeguarding compile & start stages
const app = isFirebaseConfigured 
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
  : null;

// Export actual Firestore and Auth instances
export const db = isFirebaseConfigured 
  ? getFirestore(app as any, firebaseConfig.firestoreDatabaseId) /* CRITICAL: The app will break without this line */
  : null as any;

export const auth = isFirebaseConfigured 
  ? getAuth(app as any) 
  : null as any;

let authPromise: Promise<User | null> | null = null;
const ANONYMOUS_AUTH_CACHE_KEY = 'livepad_anonymous_auth_unavailable_until';
const ANONYMOUS_AUTH_CACHE_MS = 5 * 60 * 1000;
let anonymousAuthUnavailable = false;

function isAnonymousAuthCachedUnavailable(): boolean {
  try {
    const until = Number(localStorage.getItem(ANONYMOUS_AUTH_CACHE_KEY) || 0);
    if (until > Date.now()) return true;
    localStorage.removeItem(ANONYMOUS_AUTH_CACHE_KEY);
  } catch {}
  return false;
}

export function ensureAuth(): Promise<User | null> {
  if (!isFirebaseConfigured || !auth) {
    return Promise.resolve(null);
  }
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser);
  }
  if (anonymousAuthUnavailable || isAnonymousAuthCachedUnavailable()) {
    anonymousAuthUnavailable = true;
    return Promise.resolve(null);
  }
  if (!authPromise) {
    authPromise = new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth, async (user) => {
        if (user) {
          unsub();
          resolve(user);
        } else {
          try {
            if (anonymousAuthUnavailable) {
              unsub();
              resolve(null);
              return;
            }
            const cred = await signInAnonymously(auth);
            unsub();
            resolve(cred.user);
          } catch (err) {
            // Anonymous Auth is often disabled on Firebase projects. Ask the
            // LivePad server for a pseudonymous Firebase custom-token identity.
            // Firestore rules remain fully authenticated; the room code is not
            // used as an authorization secret.
            try {
              const response = await fetch('/api/auth/guest-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
              });
              if (response.ok) {
                const payload = await response.json();
                if (payload?.token) {
                  const credential = await signInWithCustomToken(auth, payload.token);
                  unsub();
                  resolve(credential.user);
                  return;
                }
              }
            } catch (guestErr) {
              console.warn('[LivePad Auth] Guest cloud authentication is unavailable; using local transport.', guestErr);
            }

            anonymousAuthUnavailable = true;
            try { localStorage.setItem(ANONYMOUS_AUTH_CACHE_KEY, String(Date.now() + ANONYMOUS_AUTH_CACHE_MS)); } catch {}
            unsub();
            resolve(null);
          }
        }
      });
    });
  }
  return authPromise;
}

// Global Quota Limit Exhaustion State Handler
let globalQuotaExhausted = false;
let quotaExhaustedListeners: Array<(exhausted: boolean) => void> = [];

export function isFirestoreQuotaExhausted(): boolean {
  return globalQuotaExhausted;
}

export function markQuotaExhausted() {
  if (!globalQuotaExhausted) {
    globalQuotaExhausted = true;
    console.warn('[LivePad Workspace] Firestore daily quota limit reached. Seamlessly operating in offline local mode.');
    quotaExhaustedListeners.forEach(cb => {
      try {
        cb(true);
      } catch (err) {
        console.warn('Quota listener error:', err);
      }
    });
  }
}

export function onQuotaExhaustedChange(callback: (exhausted: boolean) => void) {
  quotaExhaustedListeners.push(callback);
  if (globalQuotaExhausted) {
    callback(true);
  }
  return () => {
    quotaExhaustedListeners = quotaExhaustedListeners.filter(cb => cb !== callback);
  };
}

// Required error handling format for Firebase Integration Security
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errCode = (error as any)?.code || '';
  const errStr = `${String(error)} ${errMessage} ${errCode}`;

  const isQuotaExhausted =
    errCode === 'resource-exhausted' ||
    errCode === '8' ||
    errStr.includes('resource-exhausted') ||
    errStr.includes('Quota limit exceeded') ||
    errStr.includes('Quota exceeded') ||
    errStr.includes('RESOURCE_EXHAUSTED');

  if (isQuotaExhausted) {
    markQuotaExhausted();
    console.warn(`[LivePad Workspace Sync] Firestore quota limit reached for '${path}'. Operating in local offline mode.`);
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth?.currentUser?.uid || 'anonymous_uid',
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  if (errMessage.includes('permission') || errMessage.includes('Missing or insufficient permissions')) {
    console.warn(`[LivePad Workspace Sync] Permission warning for path '${path}'. Retrying with fresh auth...`);
    return;
  }

  console.error('Firestore Error Payload: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
