import type { StoredDeal } from "../db/deals-repo.js";
import type { Scored } from "../scoring/score.js";
import type { ConclusionsReport } from "../analytics/conclusions.js";
import { escapeHtml } from "../web/render.js";

export interface Article {
  slug: string;
  title: string;
  bodyHtml: string;
  /** Set when this article spotlights one category — lets future analysis
   *  correlate "articles about X" with "clicks on X" (Tranche 6's engine
   *  already tracks clicks by category; this is the other half). */
  category: string | null;
}

function slugDate(now: Date): string {
  return now.toISOString().slice(0, 10); // YYYY-MM-DD
}

function dealListItem(deal: StoredDeal & Scored): string {
  const discount = deal.discountPercent != null ? ` — ${escapeHtml(String(deal.discountPercent))}% off` : "";
  return `<li><a href="/out/${deal.id}" rel="nofollow noopener" target="_blank">${escapeHtml(deal.title)}</a>${discount}</li>`;
}

/**
 * Template-based, not an LLM — deterministic, free, and every number in
 * the output traces back to real rows (spec.md: no improvised content,
 * only publish what the scoring/conclusions pipeline actually found).
 *
 * Two shapes:
 *   - a conclusion is available -> spotlight that category with the real
 *     stat behind it
 *   - otherwise -> a plain "top deals this week" roundup
 */
export function generateArticle(
  rankedDeals: Array<StoredDeal & Scored>,
  conclusions: ConclusionsReport,
  now: Date = new Date(),
): Article | null {
  if (rankedDeals.length === 0) return null;

  const topConclusion = conclusions.ready ? conclusions.conclusions[0] : undefined;

  if (topConclusion) {
    const spotlightDeals = rankedDeals.filter((d) => d.category === topConclusion.category).slice(0, 5);
    const title = `Why ${topConclusion.category} deals are worth watching this week`;
    const slug = `${topConclusion.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${slugDate(now)}`;
    const bodyHtml = `
      <p>${escapeHtml(topConclusion.summary)}</p>
      <p>Here's what's currently live in that category:</p>
      <ul>${spotlightDeals.map(dealListItem).join("")}</ul>
    `.trim();
    return { slug, title, bodyHtml, category: topConclusion.category };
  }

  const top = rankedDeals.slice(0, 3);
  const title = `This week's top SaaS deals`;
  const slug = `top-deals-${slugDate(now)}`;
  const bodyHtml = `
    <p>Ranked live by discount, freshness and popularity — not a static list. Here are today's top picks:</p>
    <ul>${top.map(dealListItem).join("")}</ul>
  `.trim();
  return { slug, title, bodyHtml, category: null };
}
