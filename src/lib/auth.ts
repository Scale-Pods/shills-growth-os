import crypto from 'node:crypto';

/**
 * Password hashing + verification and a small signed session token.
 * No external deps — Node's crypto only. Server-side use only.
 *
 * Hash format stored in users.password_hash:
 *   pbkdf2$<iterations>$<saltB64>$<hashB64>
 */

const PBKDF2_ITERATIONS = 120_000;
const PBKDF2_KEYLEN = 32;
const PBKDF2_DIGEST = 'sha256';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations < 1) return false;
  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(parts[2], 'base64');
    expected = Buffer.from(parts[3], 'base64');
  } catch {
    return false;
  }
  const actual = crypto.pbkdf2Sync(password, salt, iterations, expected.length, PBKDF2_DIGEST);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

// --- Session token (compact HMAC-signed JSON, no dep) ---

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes — matches the client-side expiry.

function secret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not set');
  return s;
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64url(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

export interface SessionPayload {
  sub: string; // user id
  email: string;
  name: string | null;
  iat: number;
  exp: number;
}

export function createSessionToken(user: { id: string; email: string; full_name: string | null }): string {
  const now = Date.now();
  const payload: SessionPayload = {
    sub: user.id,
    email: user.email,
    name: user.full_name ?? null,
    iat: now,
    exp: now + SESSION_TTL_MS,
  };
  const body = b64url(Buffer.from(JSON.stringify(payload), 'utf8'));
  const sig = b64url(crypto.createHmac('sha256', secret()).update(body).digest());
  return `${body}.${sig}`;
}

export function verifySessionToken(token: string | null | undefined): SessionPayload | null {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expectedSig = b64url(crypto.createHmac('sha256', secret()).update(body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let payload: SessionPayload;
  try {
    payload = JSON.parse(fromB64url(body).toString('utf8'));
  } catch {
    return null;
  }
  if (!payload || typeof payload.exp !== 'number' || Date.now() > payload.exp) return null;
  return payload;
}

export const SESSION_COOKIE = 'shills_session';
export const SESSION_MAX_AGE_SECONDS = Math.floor(SESSION_TTL_MS / 1000);
