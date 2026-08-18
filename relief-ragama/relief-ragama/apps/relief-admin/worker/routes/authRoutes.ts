import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { googleAuthUrl, exchangeCodeForUser, setSessionCookie, clearSessionCookie } from "@relief/shared";
import type { AppBindings } from "../env";

const authRoutes = new Hono<AppBindings>();

authRoutes.get("/login", (c) => {
  const state = crypto.randomUUID();
  setCookie(c, "oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 600,
  });
  return c.redirect(googleAuthUrl(c.env, state));
});

authRoutes.get("/callback", async (c) => {
  const url = new URL(c.req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const savedState = getCookie(c, "oauth_state");
  deleteCookie(c, "oauth_state", { path: "/" });

  if (!code || !state || !savedState || state !== savedState) {
    return c.text("Sign-in failed: invalid or expired login attempt. Please try again from the app.", 400);
  }

  try {
    const user = await exchangeCodeForUser(c.env, code);
    await setSessionCookie(c, user, c.env.SESSION_SECRET);
  } catch (err) {
    console.error("Google sign-in failed", err);
    return c.text("Sign-in failed. Please try again.", 500);
  }
  return c.redirect("/");
});

authRoutes.post("/logout", (c) => {
  clearSessionCookie(c);
  return c.json({ ok: true });
});

export default authRoutes;
