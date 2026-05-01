import type { Context } from 'hono';
import type { Env } from './index';

interface JwtPayload {
  sub: string;
  name: string;
  usergroup: number;
  exp: number;
}

export async function createToken(
  secret: string,
  payload: Omit<JwtPayload, 'exp'>,
): Promise<string> {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 24h
  const payloadStr = btoa(JSON.stringify({ ...payload, exp }))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const data = `${header}.${payloadStr}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const sigStr = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${data}.${sigStr}`;
}

export async function verifyToken(
  secret: string,
  token: string,
): Promise<JwtPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const data = `${header}.${payload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  const sigBytes = Uint8Array.from(
    atob(signature.replace(/-/g, '+').replace(/_/g, '/')),
    (c) => c.charCodeAt(0),
  );

  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    sigBytes,
    new TextEncoder().encode(data),
  );
  if (!valid) return null;

  const decoded = JSON.parse(
    atob(payload.replace(/-/g, '+').replace(/_/g, '/')),
  ) as JwtPayload;

  if (decoded.exp < Math.floor(Date.now() / 1000)) return null;

  return decoded;
}

export async function getUser(c: Context<{ Bindings: Env }>) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  return verifyToken(c.env.JWT_SECRET, token);
}

export async function requireAuth(c: Context<{ Bindings: Env }>) {
  const user = await getUser(c);
  if (!user) {
    return c.json({ detail: 'Not authenticated' }, 401);
  }
  return user;
}

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === hash;
}
