import type { DatabaseSync } from "node:sqlite";
import type { Article } from "./generate.js";

export interface StoredArticle extends Article {
  id: number;
  publishedAt: string;
}

interface ArticleRow {
  id: number;
  slug: string;
  title: string;
  body_html: string;
  category: string | null;
  published_at: string;
}

function mapRow(row: ArticleRow): StoredArticle {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    bodyHtml: row.body_html,
    category: row.category,
    publishedAt: row.published_at,
  };
}

/** INSERT OR IGNORE on slug — running the generator twice the same day is a no-op, not a duplicate. */
export function saveArticle(db: DatabaseSync, article: Article): { published: boolean } {
  const result = db
    .prepare("INSERT OR IGNORE INTO articles (slug, title, body_html, category) VALUES (?, ?, ?, ?)")
    .run(article.slug, article.title, article.bodyHtml, article.category);
  return { published: Number(result.changes) > 0 };
}

export function getArticleBySlug(db: DatabaseSync, slug: string): StoredArticle | null {
  const row = db.prepare("SELECT * FROM articles WHERE slug = ?").get(slug) as ArticleRow | undefined;
  return row ? mapRow(row) : null;
}

export function getAllArticles(db: DatabaseSync): StoredArticle[] {
  const rows = db.prepare("SELECT * FROM articles ORDER BY published_at DESC").all() as unknown as ArticleRow[];
  return rows.map(mapRow);
}
