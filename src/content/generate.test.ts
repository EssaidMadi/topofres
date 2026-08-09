import test from "node:test";
import assert from "node:assert/strict";
import { generateArticle } from "./generate.js";
import type { StoredDeal } from "../db/deals-repo.js";
import type { Scored } from "../scoring/score.js";
import type { ConclusionsReport } from "../analytics/conclusions.js";

const NOW = new Date("2026-08-09T00:00:00Z");

function scoredDeal(overrides: Partial<StoredDeal & Scored> = {}): StoredDeal & Scored {
  return {
    id: 1,
    source: "producthunt",
    title: "Some Deal",
    description: null,
    url: "https://example.com/deal",
    category: "Analytics",
    discountPercent: 30,
    launchedAt: NOW.toISOString(),
    collectedAt: NOW.toISOString(),
    votesCount: null,
    score: 0.5,
    breakdown: { recency: 1, discount: 0.3, votes: 0 },
    ...overrides,
  };
}

const NOT_READY: ConclusionsReport = {
  ready: false,
  totalClicks: 0,
  minSampleClicks: 10,
  stats: [],
  conclusions: [],
};

const READY_WITH_CONCLUSION: ConclusionsReport = {
  ready: true,
  totalClicks: 12,
  minSampleClicks: 10,
  stats: [],
  conclusions: [
    {
      category: "Analytics",
      clicksPerDeal: 5,
      liftOverAverage: 0.67,
      summary: '"Analytics" deals get 5.00 clicks/deal on average — 67% above the site average (3.00).',
    },
  ],
};

test("returns null when there are no deals to write about", () => {
  assert.equal(generateArticle([], NOT_READY, NOW), null);
});

test("falls back to a generic top-deals roundup when no conclusion is ready", () => {
  const deals = [scoredDeal({ id: 1, title: "Deal A" }), scoredDeal({ id: 2, title: "Deal B" })];
  const article = generateArticle(deals, NOT_READY, NOW);

  assert.ok(article);
  assert.equal(article!.category, null);
  assert.equal(article!.title, "This week's top SaaS deals");
  assert.equal(article!.slug, "top-deals-2026-08-09");
  assert.ok(article!.bodyHtml.includes("Deal A"));
  assert.ok(article!.bodyHtml.includes("Deal B"));
});

test("spotlights the winning category when a conclusion is ready, using the real stat", () => {
  const analyticsDeal = scoredDeal({ id: 1, title: "Analytics Winner", category: "Analytics" });
  const marketingDeal = scoredDeal({ id: 2, title: "Marketing Deal", category: "Marketing" });

  const article = generateArticle([analyticsDeal, marketingDeal], READY_WITH_CONCLUSION, NOW);

  assert.ok(article);
  assert.equal(article!.category, "Analytics");
  assert.match(article!.title, /Analytics/);
  assert.equal(article!.slug, "analytics-2026-08-09");
  // the real percentage from the conclusion, not an invented number
  assert.ok(article!.bodyHtml.includes("67% above the site average"));
  assert.ok(article!.bodyHtml.includes("Analytics Winner"));
  assert.ok(!article!.bodyHtml.includes("Marketing Deal"), "should only list deals from the spotlighted category");
});

test("escapes deal titles in the generated HTML", () => {
  const malicious = scoredDeal({ title: `<script>alert(1)</script>` });
  const article = generateArticle([malicious], NOT_READY, NOW);

  assert.ok(!article!.bodyHtml.includes("<script>alert"));
  assert.ok(article!.bodyHtml.includes("&lt;script&gt;"));
});

test("links to deals through /out/:id, not the raw external URL", () => {
  const deal = scoredDeal({ id: 42 });
  const article = generateArticle([deal], NOT_READY, NOW);

  assert.ok(article!.bodyHtml.includes('href="/out/42"'));
});
