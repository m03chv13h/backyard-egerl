import { Hono } from 'hono';
import type { Env } from '../index';
import { createToken, verifyPassword, requireAuth } from '../auth';

export const authRoutes = new Hono<{ Bindings: Env }>();

authRoutes.post('/token', async (c) => {
  const body = await c.req.parseBody();
  const username = body['username'] as string;
  const password = body['password'] as string;

  if (!username || !password) {
    return c.json({ detail: 'Missing credentials' }, 400);
  }

  const user = await c.env.DB.prepare(
    'SELECT id, name, password_hash, usergroup FROM users WHERE name = ?',
  )
    .bind(username)
    .first<{ id: number; name: string; password_hash: string; usergroup: number }>();

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return c.json({ detail: 'Invalid credentials' }, 401);
  }

  const token = await createToken(c.env.JWT_SECRET, {
    sub: String(user.id),
    name: user.name,
    usergroup: user.usergroup,
  });

  return c.json({ access_token: token, token_type: 'bearer' });
});

authRoutes.get('/users/me', async (c) => {
  const user = await requireAuth(c);
  if (user instanceof Response) return user;
  return c.json({ name: user.name, usergroup: user.usergroup });
});
