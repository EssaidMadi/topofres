/**
 * Objective, explicit ranking — no black box (spec.md: "classement objectif").
 * Three signals, each normalized to [0, 1], then combined by fixed weights:
 *
 *   - recency  (40%) — fresher deals score higher, decays to 0 after 30 days
 *   - discount (40%) — the deal's discount_percent, straight percentage
 *   - votes    (20%) — Product Hunt votes, diminishing returns past ~50
 *
 * Discount and recency are weighted equally and heaviest, because "un bon
 * deal récent" is the whole product; votes is a legitimacy signal, not the
 * point, hence the smaller weight.
 */

export interface ScorableDeal {
  discountPercent: number | null;
  launchedAt: string | null;
  collectedAt: string;
  votesCount: number | null;
}

export interface ScoreBreakdown {
  recency: number;
  discount: number;
  votes: number;
}

export interface Scored {
  score: number;
  breakdown: ScoreBreakdown;
}

const WEIGHTS = { recency: 0.4, discount: 0.4, votes: 0.2 } as const;
const RECENCY_WINDOW_DAYS = 30;
const VOTES_SOFT_CAP = 50;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function recencyScore(dateIso: string, now: Date): number {
  const days = (now.getTime() - new Date(dateIso).getTime()) / MS_PER_DAY;
  if (days < 0) return 1; // clock skew / future timestamp — treat as fresh
  return Math.max(0, 1 - days / RECENCY_WINDOW_DAYS);
}

function discountScore(discountPercent: number | null): number {
  if (discountPercent == null) return 0;
  return Math.min(Math.max(discountPercent, 0), 100) / 100;
}

function votesScore(votesCount: number | null): number {
  if (!votesCount || votesCount <= 0) return 0;
  return votesCount / (votesCount + VOTES_SOFT_CAP);
}

export function scoreDeal(deal: ScorableDeal, now: Date = new Date()): Scored {
  const breakdown: ScoreBreakdown = {
    recency: recencyScore(deal.launchedAt ?? deal.collectedAt, now),
    discount: discountScore(deal.discountPercent),
    votes: votesScore(deal.votesCount),
  };
  const score =
    breakdown.recency * WEIGHTS.recency +
    breakdown.discount * WEIGHTS.discount +
    breakdown.votes * WEIGHTS.votes;
  return { score, breakdown };
}

/** Ranks deals highest-score first. Ties keep their original relative order. */
export function rankDeals<T extends ScorableDeal>(deals: T[], now: Date = new Date()): Array<T & Scored> {
  return deals
    .map((deal) => ({ ...deal, ...scoreDeal(deal, now) }))
    .sort((a, b) => b.score - a.score);
}
