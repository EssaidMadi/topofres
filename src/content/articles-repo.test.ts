import test from "node:test";
import assert from "node:assert/strict";
import { openDb } from "../db/client.js";
import { saveArticle, getArticleBySlug, getAllArticles } from "./articles-repo.js";
import type { Article } from "./generate.js";

function article(overrides: Partial<Article> = {}): Article {
  return {
    slug: "top-deals-2026-08-09",
    title: "This week's top SaaS deals",
    bodyHtml: "<p>...</p>",
    category: null,
    ...overrides,
  };
}

test("saves a new article and reports it as published", () => {
  const db = openDb(":memory:");
  const { published } = saveArticle(db, article());

  assert.equal(published, true);
  assert.ok(getArticleBySlug(db, "top-deals-2026-08-09"));
});

test("re-publishing the same slug is a no-op, not a duplicate", () => {
  const db = openDb(":memory:");
  saveArticle(db, article());
  const { published } = saveArticle(db, article({ title: "Different title, same slug" }));

  assert.equal(published, false);
  assert.equal(getAllArticles(db).length, 1);
  // the original wins — INSERT OR IGNORE doesn't overwrite
  assert.equal(getArticleBySlug(db, "top-deals-2026-08-09")!.title, "This week's top SaaS deals");
});

test("getArticleBySlug returns null for an unknown slug", () => {
  const db = openDb(":memory:");
  assert.equal(getArticleBySlug(db, "nope"), null);
});

test("getAllArticles orders newest first", () => {
  const db = openDb(":memory:");
  saveArticle(db, article({ slug: "a" }));
  db.exec("UPDATE articles SET published_at = '2020-01-01T00:00:00Z' WHERE slug = 'a'");
  saveArticle(db, article({ slug: "b" }));

  const all = getAllArticles(db);
  assert.equal(all[0]!.slug, "b");
  assert.equal(all[1]!.slug, "a");
});
