import type { Scored } from "../scoring/score.js";
import type { StoredDeal } from "../db/deals-repo.js";

/**
 * Every string interpolated below can come from an external source (deal
 * titles/descriptions are Product Hunt content, not ours) — escape before
 * it ever touches the page. See spec.md Boundaries: no trusting source data.
 */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!,
  );
}

function daysAgo(iso: string, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000));
}

function dealCard(deal: StoredDeal & Scored, now: Date): string {
  const age = daysAgo(deal.launchedAt ?? deal.collectedAt, now);
  const ageLabel = age === 0 ? "today" : age === 1 ? "yesterday" : `${age} days ago`;
  const discountBadge =
    deal.discountPercent != null
      ? `<span class="badge">-${escapeHtml(String(deal.discountPercent))}%</span>`
      : "";

  return `
    <li class="deal">
      <div class="deal-head">
        <a class="deal-title" href="${escapeHtml(deal.url)}" rel="nofollow noopener" target="_blank">${escapeHtml(deal.title)}</a>
        ${discountBadge}
      </div>
      ${deal.description ? `<p class="deal-desc">${escapeHtml(deal.description)}</p>` : ""}
      <div class="deal-meta">
        ${deal.category ? `<span>${escapeHtml(deal.category)}</span>` : ""}
        <span>${ageLabel}</span>
        <span class="source">via ${escapeHtml(deal.source)}</span>
      </div>
    </li>`;
}

export function renderComparateurPage(rankedDeals: Array<StoredDeal & Scored>, now = new Date()): string {
  const body =
    rankedDeals.length > 0
      ? `<ol class="deals">${rankedDeals.map((d) => dealCard(d, now)).join("")}</ol>`
      : `<p class="empty">No deals yet — ingestion hasn't run.</p>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>BestDealsPlus — the best SaaS deals, ranked live</title>
<style>
  :root { color-scheme: light dark; }
  body {
    font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    max-width: 720px;
    margin: 0 auto;
    padding: 32px 20px 80px;
    line-height: 1.5;
  }
  header { margin-bottom: 28px; }
  h1 { font-size: 22px; margin: 0 0 6px; }
  header p { margin: 0; opacity: 0.7; font-size: 14px; }
  .deals { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 14px; }
  .deal { border: 1px solid currentColor; border-radius: 8px; padding: 14px 16px; opacity: 0.95; }
  .deal-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .deal-title { font-weight: 600; text-decoration: none; color: inherit; }
  .deal-title:hover { text-decoration: underline; }
  .badge { font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: #1c8f6f; color: #fff; }
  .deal-desc { margin: 8px 0 0; font-size: 14px; opacity: 0.85; }
  .deal-meta { margin-top: 8px; display: flex; gap: 12px; font-size: 12px; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.04em; }
  .empty { opacity: 0.7; }
</style>
</head>
<body>
<header>
  <h1>BestDealsPlus</h1>
  <p>SaaS deals ranked live — discount, freshness, popularity. Not a static list.</p>
</header>
${body}
</body>
</html>`;
}
