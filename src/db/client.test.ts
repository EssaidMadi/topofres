import test from "node:test";
import assert from "node:assert/strict";
import { openDb } from "./client.js";

test("creates the deals and events tables", () => {
  const db = openDb(":memory:");
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
    .all()
    .map((row) => (row as { name: string }).name);

  assert.ok(tables.includes("deals"), "expected a deals table");
  assert.ok(tables.includes("events"), "expected an events table");
});

test("enforces one row per (source, source_id)", () => {
  const db = openDb(":memory:");
  const insert = db.prepare(
    "INSERT INTO deals (source, source_id, title, url) VALUES (?, ?, ?, ?)",
  );
  insert.run("producthunt", "abc123", "Some tool", "https://example.com");

  assert.throws(() => {
    insert.run("producthunt", "abc123", "Duplicate", "https://example.com");
  });
});
