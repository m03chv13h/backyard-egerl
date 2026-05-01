import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRoutes } from './routes/auth';
import { eventRoutes } from './routes/events';
import { runnerRoutes } from './routes/runners';
import { timingRoutes } from './routes/timing';
import { tagInfoRoutes } from './routes/tagInfo';
import { scannerRoutes } from './routes/scanner';

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

app.route('/', authRoutes);
app.route('/', eventRoutes);
app.route('/', runnerRoutes);
app.route('/', timingRoutes);
app.route('/', tagInfoRoutes);
app.route('/', scannerRoutes);

export default app;
