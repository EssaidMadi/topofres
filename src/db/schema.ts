/**
 * Base schema for TopOffres.
 *
 * `deals`  — one row per deal collected from a source (Product Hunt first).
 * `events` — internal analytics: every pageview / click we track ourselves,
 *            no third-party tracker involved (see spec.md Boundaries).
 *
 * Both tables are intentionally minimal for the skeleton slice — ingestion,
 * scoring and analytics tasks extend them as needed rather than guessing
 * every column up front.
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS deals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  category TEXT,
  discount_percent INTEGER,
  launched_at TEXT,
  collected_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (source, source_id)
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  target TEXT NOT NULL,
  referrer TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;
