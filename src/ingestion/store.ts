import type { DatabaseSync } from "node:sqlite";
import type { DealInput } from "./types.js";

/**
 * Writes deals to the database, source traced (Boundary: "toujours logger
 * la source"). Uses INSERT OR IGNORE so re-running ingestion on the same
 * source+sourceId is a safe no-op rather than a duplicate or a crash.
 */
export function storeDeals(db: DatabaseSync, deals: DealInput[]): { inserted: number } {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO deals
      (source, source_id, title, description, url, category, discount_percent, launched_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let inserted = 0;
  for (const deal of deals) {
    const result = insert.run(
      deal.source,
      deal.sourceId,
      deal.title,
      deal.description,
      deal.url,
      deal.category,
      deal.discountPercent,
      deal.launchedAt,
    );
    inserted += Number(result.changes);
  }
  return { inserted };
}
