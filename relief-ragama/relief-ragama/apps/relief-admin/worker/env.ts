import type { SessionUser } from "@relief/shared";

export interface Env {
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  SESSION_SECRET: string;
  PUBLIC_URL: string;
}

export type Variables = { sessionUser: SessionUser | null };
export type AppBindings = { Bindings: Env; Variables: Variables };
