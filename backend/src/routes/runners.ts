import { Hono } from 'hono';
import type { Env } from '../index';
import { requireAuth } from '../auth';

export const runnerRoutes = new Hono<{ Bindings: Env }>();

runnerRoutes.post('/runner', async (c) => {
  const user = await requireAuth(c);
  if (user instanceof Response) return user;

  const body = await c.req.json<{ name: string }>();
  const result = await c.env.DB.prepare('INSERT INTO runners (name) VALUES (?)')
    .bind(body.name)
    .run();

  return c.json({ id: result.meta.last_row_id, name: body.name }, 201);
});

runnerRoutes.get('/runner/:id', async (c) => {
  const id = c.req.param('id');
  const runner = await c.env.DB.prepare(
    'SELECT id, name FROM runners WHERE id = ?',
  )
    .bind(id)
    .first();
  if (!runner) return c.json({ detail: 'Not found' }, 404);
  return c.json(runner);
});
