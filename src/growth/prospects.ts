import type { StoredDeal } from "../db/deals-repo.js";

/**
 * Prospects = the SaaS makers already in `deals` — companies we're
 * featuring for free, who plausibly want to know about it (partnership,
 * backlink, promoting their own listing). This is a list to review and
 * send from by hand (spec.md: outreach is assisted, never automatic) —
 * nothing here sends anything anywhere.
 */
export interface ProspectRow {
  company: string;
  category: string;
  dealUrl: string;
  discountPercent: number | null;
  launchedAt: string | null;
  source: string;
  outreachNote: string;
}

export function buildProspectList(deals: StoredDeal[]): ProspectRow[] {
  return deals.map((deal) => ({
    company: deal.title,
    category: deal.category ?? "Uncategorized",
    dealUrl: deal.url,
    discountPercent: deal.discountPercent,
    launchedAt: deal.launchedAt,
    source: deal.source,
    outreachNote: "Already featured on BestDealsPlus — worth a note about a partnership or backlink.",
  }));
}
