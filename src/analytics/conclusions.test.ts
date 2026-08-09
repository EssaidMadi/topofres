import test from "node:test";
import assert from "node:assert/strict";
import type { DatabaseSync } from "node:sqlite";
import { openDb } from "../db/client.js";
import { storeDeals } from "../ingestion/store.js";
import { recordEvent } from "./events-repo.js";
import { deriveConclusions } from "./conclusions.js";
import type { DealInput } from "../ingestion/types.js";

function seedDeal(db: DatabaseSync, sourceId: string, category: string): number {
  storeDeals(db, [
    {
      source: "producthunt",
      sourceId,
      title: `Deal ${sourceId}`,
      description: null,
      url: `https://example.com/${sourceId}`,
      category,
      discountPercent: null,
      launchedAt: new Date().toISOString(),
    } satisfies DealInput,
  ]);
  const row = db.prepare("SELECT id FROM deals WHERE source_id = ?").get(sourceId) as { id: number };
  return row.id;
}

function clickTimes(db: DatabaseSync, dealId: number, times: number): void {
  for (let i = 0; i < times; i++) {
    recordEvent(db, { type: "deal_click", target: String(dealId), referrer: null });
  }
}

test("below the sample-size threshold, no conclusion is drawn — just noise", () => {
  const db = openDb(":memory:");
  const dealId = seedDeal(db, "a1", "Analytics");
  clickTimes(db, dealId, 3); // fewer than MIN_SAMPLE_CLICKS (10)

  const report = deriveConclusions(db);

  assert.equal(report.ready, false);
  assert.equal(report.totalClicks, 3);
  assert.deepEqual(report.conclusions, []);
});

test("finds an injected correlation once there's enough data", () => {
  const db = openDb(":memory:");

  // 3 Analytics deals, 3 Marketing deals — same listing size, so this
  // isolates click behaviour, not "more deals = more clicks".
  const analyticsIds = ["a1", "a2", "a3"].map((id) => seedDeal(db, id, "Analytics"));
  const marketingIds = ["m1", "m2", "m3"].map((id) => seedDeal(db, id, "Marketing"));

  // Analytics: 9 clicks / 3 deals = 3 clicks/deal
  for (const id of analyticsIds) clickTimes(db, id, 3);
  // Marketing: 3 clicks / 3 deals = 1 click/deal
  clickTimes(db, marketingIds[0]!, 3);

  const report = deriveConclusions(db);

  assert.equal(report.ready, true);
  assert.equal(report.totalClicks, 12); // 9 + 3, above the threshold of 10

  assert.equal(report.conclusions.length, 1);
  const [top] = report.conclusions;
  assert.equal(top!.category, "Analytics");
  assert.equal(top!.clicksPerDeal, 3);
  assert.ok(Math.abs(top!.liftOverAverage - 0.5) < 1e-9, "expected +50% lift over the 2.0 average");
  assert.match(top!.summary, /Analytics.*3\.00 clicks\/deal.*50% above/);
});

test("a category that only matches the average isn't reported as a finding", () => {
  const db = openDb(":memory:");
  const a = seedDeal(db, "a1", "Analytics");
  const b = seedDeal(db, "b1", "Marketing");
  clickTimes(db, a, 5);
  clickTimes(db, b, 5); // identical performance — nothing to conclude

  const report = deriveConclusions(db);
  assert.equal(report.ready, true);
  assert.deepEqual(report.conclusions, []);
});

test("never crashes when deals have no category at all", () => {
  const db = openDb(":memory:");
  const id = seedDeal(db, "a1", "");
  db.prepare("UPDATE deals SET category = NULL WHERE id = ?").run(id);
  clickTimes(db, id, 10);

  const report = deriveConclusions(db);
  assert.equal(report.ready, true);
  assert.deepEqual(report.stats, []);
  assert.deepEqual(report.conclusions, []);
});
