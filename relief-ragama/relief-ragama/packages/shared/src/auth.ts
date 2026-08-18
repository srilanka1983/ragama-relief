import type { Context, MiddlewareHandler } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { SessionUser } from "./types";

const COOKIE_NAME = "relief_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days

export interface AuthEnv {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  SESSION_SECRET: string;
  PUBLIC_URL: string;
}

type Variables = { sessionUser: SessionUser | null };
export type AuthContext = Context<{ Bindings: any; Variables: Variables }>;

function toB64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let str = "";
  for (const b of arr) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64Url(s: string): Uint8Array {
  const normalized = s.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const str = atob(padded);
  const arr = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) arr[i] = str.charCodeAt(i);
  return arr;
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function signPayload(payload: string, secret: string): Promise<string> {
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toB64Url(sig);
}

export async function createSessionValue(user: SessionUser, secret: string): Promise<string> {
  const payload = toB64Url(new TextEncoder().encode(JSON.stringify(user)));
  const sig = await signPayload(payload, secret);
  return `${payload}.${sig}`;
}

export async function verifySessionValue(value: string, secret: string): Promise<SessionUser | null> {
  const [payload, sig] = value.split(".");
  if (!payload || !sig) return null;
  const expected = await signPayload(payload, secret);
  if (expected !== sig) return null;
  try {
    const json = new TextDecoder().decode(fromB64Url(payload));
    return JSON.parse(json) as SessionUser;
  } catch {
    return null;
  }
}

export function googleAuthUrl(env: AuthEnv, state: string): string {
  const redirectUri = `${env.PUBLIC_URL}/auth/callback`;
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForUser(env: AuthEnv, code: string): Promise<SessionUser> {
  const redirectUri = `${env.PUBLIC_URL}/auth/callback`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    throw new Error(`Google token exchange failed: ${await tokenRes.text()}`);
  }
  const tokenJson = (await tokenRes.json()) as { access_token: string };

  const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  if (!userRes.ok) {
    throw new Error(`Google userinfo failed: ${await userRes.text()}`);
  }
  const profile = (await userRes.json()) as {
    email: string;
    email_verified: boolean;
    name?: string;
    picture?: string;
  };
  if (!profile.email_verified) {
    throw new Error("Google account email is not verified");
  }
  return {
    email: profile.email.toLowerCase(),
    name: profile.name ?? null,
    picture: profile.picture ?? null,
  };
}

export async function setSessionCookie(c: Context, user: SessionUser, secret: string) {
  const value = await createSessionValue(user, secret);
  setCookie(c, COOKIE_NAME, value, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(c: Context) {
  deleteCookie(c, COOKIE_NAME, { path: "/" });
}

/**
 * Middleware that resolves the signed session cookie (if any) once per
 * request and stashes it on the context, so route handlers can read it
 * synchronously via `auth(c).user()`.
 */
export function sessionMiddleware(getSecret: (c: any) => string): MiddlewareHandler {
  return async (c, next) => {
    const secret = getSecret(c);
    const value = getCookie(c, COOKIE_NAME);
    const user = value ? await verifySessionValue(value, secret) : null;
    c.set("sessionUser", user);
    await next();
  };
}

/** Matches the `const user = auth(c).user();` calling convention. */
export function auth(c: AuthContext) {
  return {
    user: () => c.get("sessionUser") as SessionUser | null,
  };
}
