import { createServer } from "node:http";
import { openDb } from "../db/client.js";
import { createRequestHandler } from "./app.js";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const db = openDb();

const server = createServer(createRequestHandler(db));

server.listen(PORT, () => {
  console.log(`BestDealsPlus : http://localhost:${PORT}`);
});
