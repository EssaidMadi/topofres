import type { DatabaseSync } from "node:sqlite";

/**
 * Turns click events into readable conclusions: which deal category
 * performs better than average, and by how much.
 *
 * Two guards against noise (see tasks/plan.md Risks — "conclusions
 * bruitées au démarrage") :
 *   - MIN_SAMPLE_CLICKS: below this many total clicks, nothing is
 *     reported at all — too little data to mean anything.
 *   - MIN_LIFT: a category has to beat the site average by at least this
 *     much to be called out; small differences are noise, not a finding.
 *
 * "clicksPerDeal" (clicks / number of deals currently listed in that
 * category) is used rather than raw click counts, so a category with
 * more deals listed doesn't look "better" just from having more listings.
 */

const MIN_SAMPLE_CLICKS = 10;
const MIN_LIFT = 0.2;

export interface CategoryStat {
  category: string;
  deals: number;
  clicks: number;
  clicksPerDeal: number;
}

export interface Conclusion {
  category: string;
  clicksPerDeal: number;
  /** e.g. 0.5 = 50% above the site average */
  liftOverAverage: number;
  summary: string;
}

export interface ConclusionsReport {
  ready: boolean;
  totalClicks: number;
  minSampleClicks: number;
  stats: CategoryStat[];
  conclusions: Conclusion[];
}

export function deriveConclusions(
  db: DatabaseSync,
  options: { minSampleClicks?: number; minLift?: number } = {},
): ConclusionsReport {
  const minSampleClicks = options.minSampleClicks ?? MIN_SAMPLE_CLICKS;
  const minLift = options.minLift ?? MIN_LIFT;

  const totalClicks = (
    db.prepare("SELECT COUNT(*) as count FROM events WHERE type = 'deal_click'").get() as {
      count: number;
    }
  ).count;

  if (totalClicks < minSampleClicks) {
    return { ready: false, totalClicks, minSampleClicks, stats: [], conclusions: [] };
  }

  const dealCounts = db
    .prepare("SELECT category, COUNT(*) as count FROM deals WHERE category IS NOT NULL GROUP BY category")
    .all() as Array<{ category: string; count: number }>;

  const clickCounts = db
    .prepare(
      `SELECT d.category as category, COUNT(*) as count
       FROM events e
       JOIN deals d ON CAST(e.target AS INTEGER) = d.id
       WHERE e.type = 'deal_click' AND d.category IS NOT NULL
       GROUP BY d.category`,
    )
    .all() as Array<{ category: string; count: number }>;

  const clicksByCategory = new Map(clickCounts.map((row) => [row.category, row.count]));

  const stats: CategoryStat[] = dealCounts.map(({ category, count: deals }) => {
    const clicks = clicksByCategory.get(category) ?? 0;
    return { category, deals, clicks, clicksPerDeal: clicks / deals };
  });

  if (stats.length === 0) {
    return { ready: true, totalClicks, minSampleClicks, stats: [], conclusions: [] };
  }

  const average = stats.reduce((sum, s) => sum + s.clicksPerDeal, 0) / stats.length;

  const conclusions: Conclusion[] = stats
    .filter((s) => average > 0 && (s.clicksPerDeal - average) / average >= minLift)
    .map((s) => {
      const liftOverAverage = (s.clicksPerDeal - average) / average;
      return {
        category: s.category,
        clicksPerDeal: s.clicksPerDeal,
        liftOverAverage,
        summary: `"${s.category}" deals get ${s.clicksPerDeal.toFixed(2)} clicks/deal on average — ${Math.round(
          liftOverAverage * 100,
        )}% above the site average (${average.toFixed(2)}).`,
      };
    })
    .sort((a, b) => b.liftOverAverage - a.liftOverAverage);

  return { ready: true, totalClicks, minSampleClicks, stats, conclusions };
}
