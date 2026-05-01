import { Hono } from 'hono';
import type { Env } from '../index';

export const scannerRoutes = new Hono<{ Bindings: Env }>();

scannerRoutes.get('/scanner/status', async (c) => {
  // Scanner status is managed by the physical device; return a default state
  return c.json({
    connected: false,
    mode: null,
    event_id: null,
  });
});
