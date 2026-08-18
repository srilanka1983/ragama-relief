import { Hono } from "hono";
import { auth, getUserRole, sessionMiddleware } from "@relief/shared";
import type { AppBindings } from "./env";
import households from "./routes/households";
import userRoles from "./routes/userRoles";
import authRoutes from "./routes/authRoutes";

const app = new Hono<AppBindings>();

app.use("*", sessionMiddleware((c) => c.env.SESSION_SECRET));

app.route("/auth", authRoutes);
app.route("/app-api/households", households);
app.route("/app-api/user-roles", userRoles);

// GET current user + role
app.get("/app-api/me", async (c) => {
  const user = auth(c).user();
  if (!user) return c.json({ email: null, name: null, picture: null, role: null });
  const role = await getUserRole(c.env.DB, user.email);
  return c.json({ email: user.email, name: user.name, picture: user.picture, role: role ?? null });
});

app.get("/app-api/health", (c) => c.json({ ok: true }));

export default app;
