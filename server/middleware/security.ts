import { NextFunction, Request, Response } from 'express';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const MAX_JSON_BYTES = 5 * 1024 * 1024;
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;
const buckets = new Map<string, { count: number; resetAt: number }>();

function getClientKey(req: Request) {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function requestSecurity(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

  // Rate-limit API traffic only. Vite serves many module/static requests during
  // development; applying the API limiter to every browser asset request causes
  // legitimate dev-server traffic to receive HTTP 429 and leaves the app blank.
  if (!req.path.startsWith('/api/')) {
    return next();
  }

  const now = Date.now();
  const key = getClientKey(req);
  // Keep the in-memory limiter bounded when many clients connect.
  if (buckets.size > 10_000) {
    for (const [bucketKey, value] of buckets) {
      if (value.resetAt <= now) buckets.delete(bucketKey);
    }
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else if (bucket.count >= MAX_REQUESTS) {
    res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
    return res.status(429).json({ error: 'Too many requests. Please retry shortly.' });
  } else {
    bucket.count += 1;
  }

  return next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token || token.length > 8192) {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }

  try {
    if (!getApps().length) {
      const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
      if (projectId) initializeApp({ projectId });
      else initializeApp();
    }

    getAuth().verifyIdToken(token).then((decoded) => {
      res.locals.user = decoded;
      return next();
    }).catch(() => res.status(401).json({ error: 'Invalid authentication token' }));
  } catch {
    return res.status(503).json({ error: 'Authentication service unavailable' });
  }
}

export function validateBodySize(req: Request, res: Response, next: NextFunction) {
  const contentLength = Number(req.headers['content-length'] || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_JSON_BYTES) {
    return res.status(413).json({ error: 'Request body is too large' });
  }
  return next();
}
