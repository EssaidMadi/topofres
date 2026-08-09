import type { IncomingMessage, ServerResponse } from "node:http";
import type { DatabaseSync } from "node:sqlite";
import { getAllDeals, getDealById } from "../db/deals-repo.js";
import { recordEvent } from "../analytics/events-repo.js";
import { deriveConclusions } from "../analytics/conclusions.js";
import { rankDeals } from "../scoring/score.js";
import { renderComparateurPage } from "./render.js";
import { getAllArticles, getArticleBySlug } from "../content/articles-repo.js";
import { renderArticlePage, renderBlogIndex } from "../content/render.js";

const OUT_PATH = /^\/out\/(\d+)$/;
const ARTICLE_PATH = /^\/blog\/([a-z0-9-]+)$/;

/**
 * All routing lives here, decoupled from the process-level `listen()` call
 * in server.ts, so tests can bind a real HTTP server to an ephemeral port
 * against an in-memory db instead of touching disk or a fixed port.
 */
export function createRequestHandler(db: DatabaseSync) {
  return (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const referrer = req.headers.referer ?? null;

    if (req.method === "GET" && url.pathname === "/") {
      recordEvent(db, { type: "pageview", target: "/", referrer });
      const ranked = rankDeals(getAllDeals(db));
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(renderComparateurPage(ranked));
      return;
    }

    // No auth on this route yet — fine while nothing sensitive is in the
    // report, but revisit before it carries anything you wouldn't want a
    // competitor to see (see tasks/todo.md Tranche 6 note).
    if (req.method === "GET" && url.pathname === "/internal/conclusions") {
      const report = deriveConclusions(db);
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(report, null, 2));
      return;
    }

    if (req.method === "GET" && url.pathname === "/blog") {
      recordEvent(db, { type: "pageview", target: "/blog", referrer });
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(renderBlogIndex(getAllArticles(db)));
      return;
    }

    const articleMatch = url.pathname.match(ARTICLE_PATH);
    if (req.method === "GET" && articleMatch) {
      const article = getArticleBySlug(db, articleMatch[1]!);
      if (!article) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Article not found");
        return;
      }
      // Tracked with its own path as target, so /internal/conclusions-style
      // analysis can later tell articles apart from the homepage and from
      // each other — the other half of "which article brings traffic".
      recordEvent(db, { type: "pageview", target: url.pathname, referrer });
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(renderArticlePage(article));
      return;
    }

    const outMatch = url.pathname.match(OUT_PATH);
    if (req.method === "GET" && outMatch) {
      const deal = getDealById(db, Number(outMatch[1]));
      if (!deal) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Deal not found");
        return;
      }
      recordEvent(db, { type: "deal_click", target: String(deal.id), referrer });
      res.writeHead(302, { Location: deal.url });
      res.end();
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  };
}
