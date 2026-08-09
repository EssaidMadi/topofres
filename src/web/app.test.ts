import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { DatabaseSync } from "node:sqlite";
import { openDb } from "../db/client.js";
import { storeDeals } from "../ingestion/store.js";
import { createRequestHandler } from "./app.js";

async function withTestServer(
  run: (baseUrl: string, db: DatabaseSync) => Promise<void>,
): Promise<void> {
  const db = openDb(":memory:");
  storeDeals(db, [
    {
      source: "producthunt",
      sourceId: "post_1",
      title: "Acme Analytics",
      description: "50% off",
      url: "https://example.com/acme",
      category: "Analytics",
      discountPercent: 50,
      launchedAt: new Date().toISOString(),
    },
  ]);

  const server = createServer(createRequestHandler(db));
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("expected server to bind to a port");
  }

  try {
    await run(`http://localhost:${address.port}`, db);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

function countEvents(db: DatabaseSync, type: string): number {
  const row = db.prepare("SELECT COUNT(*) as count FROM events WHERE type = ?").get(type) as {
    count: number;
  };
  return row.count;
}

test("GET / serves the ranked page and records a pageview", async () => {
  await withTestServer(async (baseUrl, db) => {
    const res = await fetch(baseUrl + "/");
    const html = await res.text();

    assert.equal(res.status, 200);
    assert.ok(html.includes("Acme Analytics"));
    assert.equal(countEvents(db, "pageview"), 1);
  });
});

test("GET /out/:id redirects to the deal URL and records a click", async () => {
  await withTestServer(async (baseUrl, db) => {
    const res = await fetch(baseUrl + "/out/1", { redirect: "manual" });

    assert.equal(res.status, 302);
    assert.equal(res.headers.get("location"), "https://example.com/acme");
    assert.equal(countEvents(db, "deal_click"), 1);

    const target = db.prepare("SELECT target FROM events WHERE type = 'deal_click'").get() as {
      target: string;
    };
    assert.equal(target.target, "1");
  });
});

test("GET /out/:id for an unknown deal 404s without recording a click", async () => {
  await withTestServer(async (baseUrl, db) => {
    const res = await fetch(baseUrl + "/out/999", { redirect: "manual" });

    assert.equal(res.status, 404);
    assert.equal(countEvents(db, "deal_click"), 0);
  });
});

test("an unknown path 404s", async () => {
  await withTestServer(async (baseUrl) => {
    const res = await fetch(baseUrl + "/nonsense");
    assert.equal(res.status, 404);
  });
});
