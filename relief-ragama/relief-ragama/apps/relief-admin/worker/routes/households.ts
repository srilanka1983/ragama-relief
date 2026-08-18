import { Hono } from "hono";
import { auth, getUserRole, isUniqueConstraintError, STATUSES } from "@relief/shared";
import type { AppBindings } from "../env";

const households = new Hono<AppBindings>();

function isValidStatus(s: unknown): s is (typeof STATUSES)[number] {
  return typeof s === "string" && (STATUSES as readonly string[]).includes(s);
}

const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ','now')";

// GET all households — sign-in required (any authenticated user, role or not).
households.get("/", async (c) => {
  const user = auth(c).user();
  if (!user) return c.json({ error: "Sign in required" }, 401);
  const { results } = await c.env.DB.prepare("SELECT * FROM households ORDER BY house_number").all();
  return c.json(results);
});

// POST new household (volunteer or admin)
households.post("/", async (c) => {
  const user = auth(c).user();
  if (!user) return c.json({ error: "Sign in required" }, 401);
  const role = await getUserRole(c.env.DB, user.email);
  if (role !== "admin" && role !== "volunteer") {
    return c.json({ error: "You do not have permission to add households" }, 403);
  }

  const body = await c.req.json<Record<string, unknown>>();
  const house_number = typeof body.house_number === "string" ? body.house_number.trim() : "";
  const head_name = typeof body.head_name === "string" ? body.head_name.trim() : "";
  const resident_count = Number.isFinite(Number(body.resident_count)) ? Math.max(1, Number(body.resident_count)) : 1;
  const gps_lat = typeof body.gps_lat === "number" ? body.gps_lat : null;
  const gps_lng = typeof body.gps_lng === "number" ? body.gps_lng : null;
  const status = isValidStatus(body.status) ? body.status : "Safe";
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";

  if (!house_number) return c.json({ error: "House number is required" }, 400);

  try {
    const row = await c.env.DB.prepare(
      `INSERT INTO households
         (house_number, head_name, resident_count, gps_lat, gps_lng, status, notes, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
    )
      .bind(house_number, head_name, resident_count, gps_lat, gps_lng, status, notes, user.email, user.email)
      .first();
    return c.json(row, 201);
  } catch (e) {
    if (isUniqueConstraintError(e)) {
      return c.json({ error: "A household with that number already exists" }, 409);
    }
    throw e;
  }
});

// PUT update status/notes/head_name/resident_count (volunteer or admin)
households.put("/:id", async (c) => {
  const user = auth(c).user();
  if (!user) return c.json({ error: "Sign in required" }, 401);
  const role = await getUserRole(c.env.DB, user.email);
  if (role !== "admin" && role !== "volunteer") {
    return c.json({ error: "You do not have permission to update households" }, 403);
  }

  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "Invalid household id" }, 400);

  const body = await c.req.json<Record<string, unknown>>();
  const status = isValidStatus(body.status) ? body.status : null;
  const notes = typeof body.notes === "string" ? body.notes : null;
  const head_name = typeof body.head_name === "string" ? body.head_name : null;
  const resident_count = Number.isFinite(Number(body.resident_count)) ? Number(body.resident_count) : null;

  const row = await c.env.DB.prepare(
    `UPDATE households SET
       status = COALESCE(?, status),
       notes = COALESCE(?, notes),
       head_name = COALESCE(?, head_name),
       resident_count = COALESCE(?, resident_count),
       updated_by = ?,
       updated_at = ${NOW}
     WHERE id = ?
     RETURNING *`,
  )
    .bind(status, notes, head_name, resident_count, user.email, id)
    .first();
  if (!row) return c.json({ error: "Household not found" }, 404);
  return c.json(row);
});

// PUT full admin edit — including house_number and GPS (admin only)
households.put("/:id/admin", async (c) => {
  const user = auth(c).user();
  if (!user) return c.json({ error: "Sign in required" }, 401);
  const role = await getUserRole(c.env.DB, user.email);
  if (role !== "admin") return c.json({ error: "Admin access required" }, 403);

  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "Invalid household id" }, 400);

  const body = await c.req.json<Record<string, unknown>>();
  const house_number = typeof body.house_number === "string" ? body.house_number.trim() : null;
  const head_name = typeof body.head_name === "string" ? body.head_name : null;
  const resident_count = Number.isFinite(Number(body.resident_count)) ? Number(body.resident_count) : null;
  const gps_lat = typeof body.gps_lat === "number" ? body.gps_lat : null;
  const gps_lng = typeof body.gps_lng === "number" ? body.gps_lng : null;
  const status = isValidStatus(body.status) ? body.status : null;
  const notes = typeof body.notes === "string" ? body.notes : null;

  try {
    const row = await c.env.DB.prepare(
      `UPDATE households SET
         house_number = COALESCE(?, house_number),
         head_name = COALESCE(?, head_name),
         resident_count = COALESCE(?, resident_count),
         gps_lat = COALESCE(?, gps_lat),
         gps_lng = COALESCE(?, gps_lng),
         status = COALESCE(?, status),
         notes = COALESCE(?, notes),
         updated_by = ?,
         updated_at = ${NOW}
       WHERE id = ?
       RETURNING *`,
    )
      .bind(house_number, head_name, resident_count, gps_lat, gps_lng, status, notes, user.email, id)
      .first();
    if (!row) return c.json({ error: "Household not found" }, 404);
    return c.json(row);
  } catch (e) {
    if (isUniqueConstraintError(e)) {
      return c.json({ error: "A household with that number already exists" }, 409);
    }
    throw e;
  }
});

// DELETE household (admin only) — for cleaning up duplicate/mistaken entries
households.delete("/:id", async (c) => {
  const user = auth(c).user();
  if (!user) return c.json({ error: "Sign in required" }, 401);
  const role = await getUserRole(c.env.DB, user.email);
  if (role !== "admin") return c.json({ error: "Admin access required" }, 403);

  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "Invalid household id" }, 400);
  await c.env.DB.prepare("DELETE FROM households WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

export default households;
