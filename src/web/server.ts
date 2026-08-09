import { createServer } from "node:http";
import { openDb } from "../db/client.js";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// Opening the DB here just proves the skeleton wires ingestion → storage →
// web together; the comparateur page itself lands in Tranche 4.
openDb();

const server = createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("topoffres.fr — squelette en place, page comparateur en Tranche 4");
});

server.listen(PORT, () => {
  console.log(`TopOffres squelette : http://localhost:${PORT}`);
});
