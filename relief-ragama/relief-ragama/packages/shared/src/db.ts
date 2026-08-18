// Cloudflare D1 (SQLite) helpers. D1 is bound natively to Workers — no npm
// database driver required at runtime.

export async function getUserRole(db: D1Database, email: string): Promise<string | null> {
  const row = await db
    .prepare("SELECT role FROM user_roles WHERE email = ?")
    .bind(email.toLowerCase())
    .first<{ role: string }>();
  return row?.role ?? null;
}

/** SQLite "UNIQUE constraint failed" error message check, used for friendly 409 responses. */
export function isUniqueConstraintError(e: unknown): boolean {
  return e instanceof Error && e.message.includes("UNIQUE constraint failed");
}
