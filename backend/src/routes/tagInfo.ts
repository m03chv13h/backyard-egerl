import { Hono } from 'hono';
import type { Env } from '../index';
import { requireAuth } from '../auth';

export const tagInfoRoutes = new Hono<{ Bindings: Env }>();

tagInfoRoutes.get('/tag-info', async (c) => {
  const tagInfo = await c.env.DB.prepare(
    'SELECT rfid_tag_id, time FROM tag_info ORDER BY time DESC LIMIT 1',
  ).first();
  return c.json(tagInfo ?? null);
});

tagInfoRoutes.post('/tag-info', async (c) => {
  const user = await requireAuth(c);
  if (user instanceof Response) return user;

  const body = await c.req.json<{ rfid_tag_id: string; time: string }>();

  await c.env.DB.prepare(
    'INSERT OR REPLACE INTO tag_info (rfid_tag_id, time) VALUES (?, ?)',
  )
    .bind(body.rfid_tag_id, body.time)
    .run();

  return c.json(body, 201);
});
