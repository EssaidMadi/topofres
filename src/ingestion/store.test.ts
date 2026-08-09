import test from "node:test";
import assert from "node:assert/strict";
import { openDb } from "../db/client.js";
import { storeDeals } from "./store.js";
import type { DealInput } from "./types.js";

function sampleDeal(overrides: Partial<DealInput> = {}): DealInput {
  return {
    source: "producthunt",
    sourceId: "post_1",
    title: "Acme Analytics",
    description: "50% off launch week",
    url: "https://producthunt.com/posts/acme-analytics",
    category: "Analytics",
    discountPercent: 50,
    launchedAt: "2026-08-01T10:00:00Z",
    ...overrides,
  };
}

test("stores new deals and reports how many were inserted", () => {
  const db = openDb(":memory:");
  const { inserted } = storeDeals(db, [sampleDeal(), sampleDeal({ sourceId: "post_2" })]);

  assert.equal(inserted, 2);
  const rows = db.prepare("SELECT source, source_id, title FROM deals ORDER BY source_id").all();
  assert.equal(rows.length, 2);
});

test("re-ingesting the same source+sourceId is a no-op, not a crash", () => {
  const db = openDb(":memory:");
  storeDeals(db, [sampleDeal()]);
  const { inserted } = storeDeals(db, [sampleDeal()]);

  assert.equal(inserted, 0);
  const rows = db.prepare("SELECT COUNT(*) as count FROM deals").get() as { count: number };
  assert.equal(rows.count, 1);
});

test("every stored deal keeps its source, as required by the Boundaries", () => {
  const db = openDb(":memory:");
  storeDeals(db, [sampleDeal()]);
  const row = db.prepare("SELECT source FROM deals WHERE source_id = ?").get("post_1") as {
    source: string;
  };
  assert.equal(row.source, "producthunt");
});
