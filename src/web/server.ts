import { createServer } from "node:http";
import { openDb } from "../db/client.js";
import { getAllDeals } from "../db/deals-repo.js";
import { rankDeals } from "../scoring/score.js";
import { renderComparateurPage } from "./render.js";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const db = openDb();

const server = createServer((_req, res) => {
  const deals = getAllDeals(db);
  const ranked = rankDeals(deals);
  const html = renderComparateurPage(ranked);

  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
});

server.listen(PORT, () => {
  console.log(`TopOffres : http://localhost:${PORT}`);
});
