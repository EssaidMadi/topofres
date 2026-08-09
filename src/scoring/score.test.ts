import test from "node:test";
import assert from "node:assert/strict";
import { scoreDeal, rankDeals, type ScorableDeal } from "./score.js";

const NOW = new Date("2026-08-09T00:00:00Z");

function deal(overrides: Partial<ScorableDeal> = {}): ScorableDeal {
  return {
    discountPercent: null,
    launchedAt: NOW.toISOString(),
    collectedAt: NOW.toISOString(),
    votesCount: null,
    ...overrides,
  };
}

test("a recent, high-discount deal outranks an old, no-discount deal", () => {
  const fresh = deal({ discountPercent: 50, launchedAt: NOW.toISOString() });
  const stale = deal({
    discountPercent: null,
    launchedAt: new Date(NOW.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
  });

  // rankDeals returns new merged objects (pure — it doesn't mutate its
  // inputs), so we compare by the field that distinguishes them, not by
  // reference.
  const [first, second] = rankDeals([stale, fresh], NOW);
  assert.equal(first!.discountPercent, 50);
  assert.equal(second!.discountPercent, null);
});

test("recency decays to zero at the 30-day window and beyond", () => {
  const atWindow = deal({ launchedAt: new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString() });
  const pastWindow = deal({ launchedAt: new Date(NOW.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString() });

  assert.equal(scoreDeal(atWindow, NOW).breakdown.recency, 0);
  assert.equal(scoreDeal(pastWindow, NOW).breakdown.recency, 0);
});

test("discount score is the plain percentage, clamped to [0, 1]", () => {
  assert.equal(scoreDeal(deal({ discountPercent: 25 }), NOW).breakdown.discount, 0.25);
  assert.equal(scoreDeal(deal({ discountPercent: null }), NOW).breakdown.discount, 0);
  assert.equal(scoreDeal(deal({ discountPercent: 500 }), NOW).breakdown.discount, 1); // clamped
});

test("votes give diminishing returns rather than dominating the score", () => {
  const few = scoreDeal(deal({ votesCount: 10 }), NOW).breakdown.votes;
  const many = scoreDeal(deal({ votesCount: 1000 }), NOW).breakdown.votes;
  const none = scoreDeal(deal({ votesCount: null }), NOW).breakdown.votes;

  assert.ok(few > none);
  assert.ok(many > few);
  assert.ok(many < 1); // never reaches 1, no matter how viral
});

test("rankDeals never crashes on missing signals and returns a valid order", () => {
  const deals = [deal({ discountPercent: null, votesCount: null }), deal({ discountPercent: 10, votesCount: 5 })];
  const ranked = rankDeals(deals, NOW);

  assert.equal(ranked.length, 2);
  assert.ok(ranked[0]!.score >= ranked[1]!.score);
});
