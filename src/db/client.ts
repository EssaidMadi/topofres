import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { SCHEMA_SQL } from "./schema.js";

/**
 * Opens (and initializes) the SQLite database.
 *
 * Pass ":memory:" in tests to avoid touching disk. In dev/prod, defaults
 * to ./data/topoffres.sqlite, creating the ./data directory if needed.
 */
export function openDb(path = "./data/topoffres.sqlite"): DatabaseSync {
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new DatabaseSync(path);
  db.exec(SCHEMA_SQL);
  return db;
}
