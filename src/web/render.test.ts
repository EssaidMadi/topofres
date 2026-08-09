import test from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, renderComparateurPage } from "./render.js";
import { rankDeals } from "../scoring/score.js";
import type { StoredDeal } from "../db/deals-repo.js";

const NOW = new Date("2026-08-09T00:00:00Z");

function storedDeal(overrides: Partial<StoredDeal> = {}): StoredDeal {
  return {
    id: 1,
    source: "producthunt",
    title: "Acme Analytics",
    description: "Ship dashboards faster",
    url: "https://producthunt.com/posts/acme-analytics",
    category: "Analytics",
    discountPercent: 50,
    launchedAt: NOW.toISOString(),
    collectedAt: NOW.toISOString(),
    votesCount: null,
    ...overrides,
  };
}

test("escapeHtml neutralizes the five HTML-significant characters", () => {
  assert.equal(escapeHtml(`<script>alert('x')&"y"</script>`), "&lt;script&gt;alert(&#39;x&#39;)&amp;&quot;y&quot;&lt;/script&gt;");
});

test("renders deal titles and descriptions escaped, not as raw HTML", () => {
  const malicious = storedDeal({ title: `<img src=x onerror=alert(1)>`, description: `<b>bold</b>` });
  const html = renderComparateurPage(rankDeals([malicious], NOW), NOW);

  assert.ok(!html.includes("<img src=x"), "raw script/tag must not appear unescaped");
  assert.ok(html.includes("&lt;img src=x"));
  assert.ok(html.includes("&lt;b&gt;bold&lt;/b&gt;"));
});

test("shows the highest-ranked deal first", () => {
  const weak = storedDeal({ id: 1, title: "Weak deal", discountPercent: null });
  const strong = storedDeal({ id: 2, title: "Strong deal", discountPercent: 80 });

  const html = renderComparateurPage(rankDeals([weak, strong], NOW), NOW);
  assert.ok(html.indexOf("Strong deal") < html.indexOf("Weak deal"));
});

test("shows an empty state instead of a blank list", () => {
  const html = renderComparateurPage([], NOW);
  assert.ok(html.includes("Aucun deal pour l'instant"));
  assert.ok(!html.includes("<ol"));
});

test("shows the discount badge only when a discount is known", () => {
  const withDiscount = renderComparateurPage(rankDeals([storedDeal({ discountPercent: 30 })], NOW), NOW);
  const withoutDiscount = renderComparateurPage(rankDeals([storedDeal({ discountPercent: null })], NOW), NOW);

  // "badge" alone also matches the static CSS class definition — check the
  // actual markup, not just the word.
  assert.ok(withDiscount.includes('<span class="badge">-30%</span>'));
  assert.ok(!withoutDiscount.includes('<span class="badge">'));
});
