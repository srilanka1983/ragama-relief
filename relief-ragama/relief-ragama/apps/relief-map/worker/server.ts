import { Hono } from "hono";

interface Env {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

app.get("/app-api/households", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, house_number, head_name, resident_count,
            gps_lat, gps_lng, status, notes, updated_at
     FROM households
     ORDER BY house_number`,
  ).all();
  return c.json(results);
});

app.get("/app-api/health", (c) => c.json({ ok: true }));

export default app;
