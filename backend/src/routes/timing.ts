import { Hono } from 'hono';
import type { Env } from '../index';
import { requireAuth } from '../auth';

export const timingRoutes = new Hono<{ Bindings: Env }>();

timingRoutes.post('/event/:id/timing', async (c) => {
  const user = await requireAuth(c);
  if (user instanceof Response) return user;

  const eventId = Number(c.req.param('id'));
  const body = await c.req.json<{
    rfid_tag_id: string;
    time: string;
  }>();

  const result = await c.env.DB.prepare(
    'INSERT INTO timings (event_id, rfid_tag_id, time) VALUES (?, ?, ?)',
  )
    .bind(eventId, body.rfid_tag_id, body.time)
    .run();

  return c.json(
    {
      id: result.meta.last_row_id,
      event_id: eventId,
      rfid_tag_id: body.rfid_tag_id,
      time: body.time,
    },
    201,
  );
});

timingRoutes.post('/event/:id/lap_timing', async (c) => {
  const user = await requireAuth(c);
  if (user instanceof Response) return user;

  const eventId = Number(c.req.param('id'));
  const body = await c.req.json<{
    rfid_tag_id: string;
    lap: number;
    lap_time: string;
  }>();

  await c.env.DB.prepare(
    'INSERT INTO lap_timings (event_id, rfid_tag_id, lap, lap_time) VALUES (?, ?, ?, ?)',
  )
    .bind(eventId, body.rfid_tag_id, body.lap, body.lap_time)
    .run();

  return c.body(null, 201);
});

timingRoutes.get('/event/:id/live_data', async (c) => {
  const eventId = Number(c.req.param('id'));

  // Get all registrations with runners for this event
  const { results: regs } = await c.env.DB.prepare(
    `SELECT r.runner_id, r.rfid_tag_id, r.dnf_lap, r.start_lap, ru.name
     FROM registrations r
     JOIN runners ru ON ru.id = r.runner_id
     WHERE r.event_id = ?`,
  )
    .bind(eventId)
    .all();

  // Get all lap timings for this event
  const { results: laps } = await c.env.DB.prepare(
    'SELECT rfid_tag_id, lap, lap_time FROM lap_timings WHERE event_id = ? ORDER BY lap ASC',
  )
    .bind(eventId)
    .all();

  // Build live data rows
  const rows = (regs as Record<string, unknown>[]).map((reg) => {
    const runnerLaps = (laps as Record<string, unknown>[])
      .filter((l) => l.rfid_tag_id === reg.rfid_tag_id)
      .sort((a, b) => (a.lap as number) - (b.lap as number));

    const lapTimes = runnerLaps.map((l) => l.lap_time as string);
    const lapCount = runnerLaps.length;

    let status = 'running';
    if (reg.dnf_lap != null) status = 'DNF';

    return {
      rank: 0,
      name: reg.name as string,
      laps: lapCount,
      last_laptime: lapTimes.length > 0 ? lapTimes[lapTimes.length - 1] : null,
      avg_laptime: null,
      min_laptime: null,
      all_laps: lapTimes,
      status,
    };
  });

  // Sort by laps descending, then assign rank
  rows.sort((a, b) => b.laps - a.laps);
  rows.forEach((row, i) => {
    row.rank = i + 1;
  });

  return c.json(rows);
});
