import { escapeHtml } from "../web/render.js";
import type { StoredArticle } from "./articles-repo.js";

const PAGE_STYLE = `
  :root { color-scheme: light dark; }
  body {
    font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    max-width: 720px;
    margin: 0 auto;
    padding: 32px 20px 80px;
    line-height: 1.6;
  }
  header { margin-bottom: 28px; }
  h1 { font-size: 22px; margin: 0 0 6px; }
  header p, .byline { margin: 0; opacity: 0.7; font-size: 14px; }
  a { color: inherit; }
  ul { padding-left: 20px; }
  .articles { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 14px; }
  .article-card { border: 1px solid currentColor; border-radius: 8px; padding: 14px 16px; opacity: 0.95; }
  .article-card a { font-weight: 600; text-decoration: none; }
  .article-card a:hover { text-decoration: underline; }
  .empty { opacity: 0.7; }
`;

function shell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${PAGE_STYLE}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

export function renderArticlePage(article: StoredArticle): string {
  const body = `
<header>
  <p class="byline"><a href="/blog">← All articles</a></p>
  <h1>${escapeHtml(article.title)}</h1>
  <p class="byline">Published ${escapeHtml(article.publishedAt)}</p>
</header>
${article.bodyHtml}`;
  return shell(`${article.title} — BestDealsPlus`, body);
}

export function renderBlogIndex(articles: StoredArticle[]): string {
  const list =
    articles.length > 0
      ? `<ul class="articles">${articles
          .map(
            (a) =>
              `<li class="article-card"><a href="/blog/${escapeHtml(a.slug)}">${escapeHtml(a.title)}</a><div class="byline">${escapeHtml(a.publishedAt)}</div></li>`,
          )
          .join("")}</ul>`
      : `<p class="empty">No articles yet.</p>`;

  const body = `
<header>
  <p class="byline"><a href="/">← BestDealsPlus</a></p>
  <h1>Blog</h1>
</header>
${list}`;
  return shell("Blog — BestDealsPlus", body);
}
