-- Ragama Relief — D1 (SQLite) schema.
-- This has already been applied to the live "ragama-relief-db" D1 database
-- for you. Keep this file as the source of truth / for recreating the DB
-- elsewhere (e.g. `wrangler d1 execute ragama-relief-db --file=schema.sql`).

CREATE TABLE IF NOT EXISTS households (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  house_number TEXT NOT NULL UNIQUE,
  head_name TEXT NOT NULL DEFAULT '',
  resident_count INTEGER NOT NULL DEFAULT 1,
  gps_lat REAL,
  gps_lng REAL,
  status TEXT NOT NULL DEFAULT 'Safe'
    CHECK (status IN (
      'Safe', 'Needs Immediate Rescue', 'Needs Food',
      'Needs Medical Aid', 'Needs Non-Food Items', 'Evacuated'
    )),
  notes TEXT NOT NULL DEFAULT '',
  created_by TEXT,
  updated_by TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS user_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'volunteer'
    CHECK (role IN ('admin', 'volunteer')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_households_status ON households(status);
CREATE INDEX IF NOT EXISTS idx_households_house_number ON households(house_number);

-- First admin, so you can manage volunteer/admin access from the Users page
-- immediately after your first sign-in.
INSERT OR IGNORE INTO user_roles (email, role) VALUES ('helpdeskit@leco.lk', 'admin');
