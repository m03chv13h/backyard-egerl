import { Hono } from 'hono';
import type { Env } from '../index';
import { requireAuth } from '../auth';

export const eventRoutes = new Hono<{ Bindings: Env }>();

eventRoutes.get('/events', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, name, date, lap_duration, min_lap_duration FROM events ORDER BY date DESC',
  ).all();
  return c.json(results);
});

eventRoutes.get('/event/:id', async (c) => {
  const id = c.req.param('id');
  const event = await c.env.DB.prepare(
    'SELECT id, name, date, lap_duration, min_lap_duration FROM events WHERE id = ?',
  )
    .bind(id)
    .first();
  if (!event) return c.json({ detail: 'Not found' }, 404);
  return c.json(event);
});

eventRoutes.post('/event', async (c) => {
  const user = await requireAuth(c);
  if (user instanceof Response) return user;

  const body = await c.req.json<{
    name: string;
    date: string;
    lap_duration: string;
    min_lap_duration: string;
  }>();

  const result = await c.env.DB.prepare(
    'INSERT INTO events (name, date, lap_duration, min_lap_duration) VALUES (?, ?, ?, ?)',
  )
    .bind(body.name, body.date, body.lap_duration, body.min_lap_duration)
    .run();

  const event = await c.env.DB.prepare('SELECT * FROM events WHERE id = ?')
    .bind(result.meta.last_row_id)
    .first();

  return c.json(event, 201);
});

eventRoutes.delete('/event/:id', async (c) => {
  const user = await requireAuth(c);
  if (user instanceof Response) return user;

  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM events WHERE id = ?').bind(id).run();
  return c.body(null, 204);
});

eventRoutes.get('/event/:id/registrations', async (c) => {
  const id = c.req.param('id');
  const { results } = await c.env.DB.prepare(
    `SELECT r.event_id, r.runner_id, r.bib_nr, r.rfid_tag_id, r.dnf_lap, r.start_lap,
            ru.id as runner__id, ru.name as runner__name
     FROM registrations r
     JOIN runners ru ON ru.id = r.runner_id
     WHERE r.event_id = ?`,
  )
    .bind(id)
    .all();

  const mapped = results.map((row: Record<string, unknown>) => ({
    event_id: row.event_id,
    runner_id: row.runner_id,
    bib_nr: row.bib_nr,
    rfid_tag_id: row.rfid_tag_id,
    dnf_lap: row.dnf_lap,
    start_lap: row.start_lap,
    runner: { id: row.runner__id, name: row.runner__name },
  }));

  return c.json(mapped);
});

eventRoutes.post('/event/:id/runner', async (c) => {
  const user = await requireAuth(c);
  if (user instanceof Response) return user;

  const eventId = Number(c.req.param('id'));
  const body = await c.req.json<{
    name: string;
    bib_nr: number | null;
    rfid_tag_id: string | null;
    start_lap?: number;
  }>();

  const runnerResult = await c.env.DB.prepare(
    'INSERT INTO runners (name) VALUES (?)',
  )
    .bind(body.name)
    .run();

  const runnerId = runnerResult.meta.last_row_id;

  await c.env.DB.prepare(
    'INSERT INTO registrations (event_id, runner_id, bib_nr, rfid_tag_id, start_lap) VALUES (?, ?, ?, ?, ?)',
  )
    .bind(eventId, runnerId, body.bib_nr, body.rfid_tag_id, body.start_lap ?? 1)
    .run();

  return c.json({
    event_id: eventId,
    runner_id: runnerId,
    bib_nr: body.bib_nr,
    rfid_tag_id: body.rfid_tag_id,
    dnf_lap: null,
    start_lap: body.start_lap ?? 1,
    runner: { id: runnerId, name: body.name },
  }, 201);
});

eventRoutes.patch('/event/:eventId/registration/:runnerId', async (c) => {
  const user = await requireAuth(c);
  if (user instanceof Response) return user;

  const eventId = c.req.param('eventId');
  const runnerId = c.req.param('runnerId');
  const body = await c.req.json<{
    bib_nr: number | null;
    rfid_tag_id: string | null;
    dnf_lap: number | null;
  }>();

  await c.env.DB.prepare(
    'UPDATE registrations SET bib_nr = ?, rfid_tag_id = ?, dnf_lap = ? WHERE event_id = ? AND runner_id = ?',
  )
    .bind(body.bib_nr, body.rfid_tag_id, body.dnf_lap, eventId, runnerId)
    .run();

  const reg = await c.env.DB.prepare(
    'SELECT * FROM registrations WHERE event_id = ? AND runner_id = ?',
  )
    .bind(eventId, runnerId)
    .first();

  return c.json(reg);
});

eventRoutes.delete('/event/:eventId/registration/:runnerId', async (c) => {
  const user = await requireAuth(c);
  if (user instanceof Response) return user;

  const eventId = c.req.param('eventId');
  const runnerId = c.req.param('runnerId');
  await c.env.DB.prepare(
    'DELETE FROM registrations WHERE event_id = ? AND runner_id = ?',
  )
    .bind(eventId, runnerId)
    .run();

  return c.body(null, 204);
});
