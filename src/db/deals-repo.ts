import type { DatabaseSync } from "node:sqlite";
import type { ScorableDeal } from "../scoring/score.js";

export interface StoredDeal extends ScorableDeal {
  id: number;
  source: string;
  title: string;
  description: string | null;
  url: string;
  category: string | null;
}

interface DealRow {
  id: number;
  source: string;
  title: string;
  description: string | null;
  url: string;
  category: string | null;
  discount_percent: number | null;
  launched_at: string | null;
  collected_at: string;
}

function mapRow(row: DealRow): StoredDeal {
  return {
    id: row.id,
    source: row.source,
    title: row.title,
    description: row.description,
    url: row.url,
    category: row.category,
    discountPercent: row.discount_percent,
    launchedAt: row.launched_at,
    collectedAt: row.collected_at,
    votesCount: null, // not stored yet — see Tranche 3 note in tasks/todo.md
  };
}

/** All deals, newest-collected first (ranking/ordering for display happens in scoring). */
export function getAllDeals(db: DatabaseSync): StoredDeal[] {
  const rows = db
    .prepare("SELECT * FROM deals ORDER BY collected_at DESC")
    .all() as unknown as DealRow[];
  return rows.map(mapRow);
}

/** Used by the /out/:id click-tracking redirect — null if the id doesn't exist. */
export function getDealById(db: DatabaseSync, id: number): StoredDeal | null {
  const row = db.prepare("SELECT * FROM deals WHERE id = ?").get(id) as DealRow | undefined;
  return row ? mapRow(row) : null;
}
