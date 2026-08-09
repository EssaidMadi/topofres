import { openDb } from "../db/client.js";
import { getAllDeals } from "../db/deals-repo.js";
import { rankDeals } from "../scoring/score.js";
import { deriveConclusions } from "../analytics/conclusions.js";
import { generateArticle } from "./generate.js";
import { saveArticle } from "./articles-repo.js";

const db = openDb();
const ranked = rankDeals(getAllDeals(db));
const conclusions = deriveConclusions(db);
const article = generateArticle(ranked, conclusions);

if (!article) {
  console.log("No deals in the database yet — nothing to write about.");
  process.exit(0);
}

const { published } = saveArticle(db, article);
console.log(
  published
    ? `Published: "${article.title}" (/blog/${article.slug})`
    : `Already published today: /blog/${article.slug} (no-op)`,
);
