/** Shape matching the `deals` table columns we write to (see src/db/schema.ts). */
export interface DealInput {
  source: string;
  sourceId: string;
  title: string;
  description: string | null;
  url: string;
  category: string | null;
  discountPercent: number | null;
  launchedAt: string | null;
}
