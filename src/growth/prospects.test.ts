import test from "node:test";
import assert from "node:assert/strict";
import { buildProspectList } from "./prospects.js";
import type { StoredDeal } from "../db/deals-repo.js";

function deal(overrides: Partial<StoredDeal> = {}): StoredDeal {
  return {
    id: 1,
    source: "producthunt",
    title: "Acme Analytics",
    description: "Ship dashboards faster",
    url: "https://example.com/acme",
    category: "Analytics",
    discountPercent: 50,
    launchedAt: "2026-08-09T00:00:00Z",
    collectedAt: "2026-08-09T00:00:00Z",
    votesCount: null,
    ...overrides,
  };
}

test("maps each deal to one prospect row with the deal's real fields", () => {
  const [prospect] = buildProspectList([deal()]);
  assert.equal(prospect!.company, "Acme Analytics");
  assert.equal(prospect!.category, "Analytics");
  assert.equal(prospect!.dealUrl, "https://example.com/acme");
  assert.equal(prospect!.discountPercent, 50);
  assert.equal(prospect!.source, "producthunt");
});

test("falls back to 'Uncategorized' when a deal has no category", () => {
  const [prospect] = buildProspectList([deal({ category: null })]);
  assert.equal(prospect!.category, "Uncategorized");
});

test("one row per deal, in the same order", () => {
  const rows = buildProspectList([deal({ id: 1, title: "A" }), deal({ id: 2, title: "B" })]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0]!.company, "A");
  assert.equal(rows[1]!.company, "B");
});
