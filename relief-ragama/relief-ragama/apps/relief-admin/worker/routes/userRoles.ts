import { Hono } from "hono";
import { auth, getUserRole } from "@relief/shared";
import type { AppBindings } from "../env";
import type { Context } from "hono";

const userRoles = new Hono<AppBindings>();

async function requireAdmin(c: Context<AppBindings>) {
  const user = auth(c).user();
  if (!user) return { error: c.json({ error: "Sign in required" }, 401) as const };
  const role = await getUserRole(c.env.DB, user.email);
  if (role !== "admin") return { error: c.json({ error: "Admin access required" }, 403) as const };
  return { user };
}

userRoles.get("/", async (c) => {
  const result = await requireAdmin(c);
  if ("error" in result) return result.error;
  const { results } = await c.env.DB.prepare("SELECT * FROM user_roles ORDER BY email").all();
  return c.json(results);
});

userRoles.post("/", async (c) => {
  const result = await requireAdmin(c);
  if ("error" in result) return result.error;

  const body = await c.req.json<{ email?: string; role?: string }>();
  const email = (body.email || "").trim().toLowerCase();
  const role = body.role === "admin" ? "admin" : body.role === "volunteer" ? "volunteer" : null;
  if (!email || !email.includes("@")) return c.json({ error: "A valid email is required" }, 400);
  if (!role) return c.json({ error: "Role must be 'admin' or 'volunteer'" }, 400);

  const row = await c.env.DB.prepare(
    `INSERT INTO user_roles (email, role) VALUES (?, ?)
     ON CONFLICT(email) DO UPDATE SET role = excluded.role
     RETURNING *`,
  )
    .bind(email, role)
    .first();
  return c.json(row);
});

userRoles.delete("/:id", async (c) => {
  const result = await requireAdmin(c);
  if ("error" in result) return result.error;

  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "Invalid id" }, 400);

  const target = await c.env.DB.prepare("SELECT email FROM user_roles WHERE id = ?").bind(id).first<{ email: string }>();
  if (target && target.email === result.user.email) {
    return c.json({ error: "You cannot remove your own admin access" }, 400);
  }
  await c.env.DB.prepare("DELETE FROM user_roles WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

export default userRoles;
