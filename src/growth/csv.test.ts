import test from "node:test";
import assert from "node:assert/strict";
import { toCsv } from "./csv.js";
import type { ProspectRow } from "./prospects.js";

function row(overrides: Partial<ProspectRow> = {}): ProspectRow {
  return {
    company: "Acme Analytics",
    category: "Analytics",
    dealUrl: "https://example.com/acme",
    discountPercent: 50,
    launchedAt: "2026-08-09T00:00:00Z",
    source: "producthunt",
    outreachNote: "Already featured — worth a note.",
    ...overrides,
  };
}

test("writes a header row and one line per prospect", () => {
  const csv = toCsv([row(), row({ company: "Second Co" })]);
  const lines = csv.trim().split("\r\n");

  assert.equal(lines.length, 3);
  assert.equal(lines[0], "company,category,dealUrl,discountPercent,launchedAt,source,outreachNote");
  assert.ok(lines[1]!.startsWith("Acme Analytics,"));
  assert.ok(lines[2]!.startsWith("Second Co,"));
});

test("quotes a field that contains a comma", () => {
  const csv = toCsv([row({ company: "Acme, Inc." })]);
  assert.ok(csv.includes('"Acme, Inc."'));
});

test("escapes an embedded quote by doubling it", () => {
  const csv = toCsv([row({ outreachNote: 'Say "hi" to them' })]);
  assert.ok(csv.includes('"Say ""hi"" to them"'));
});

test("quotes a field containing a newline", () => {
  const csv = toCsv([row({ outreachNote: "Line one\nLine two" })]);
  assert.ok(csv.includes('"Line one\nLine two"'));
});

test("a plain field is left unquoted", () => {
  const csv = toCsv([row({ company: "Plain Co" })]);
  assert.ok(csv.includes("Plain Co,"));
  assert.ok(!csv.includes('"Plain Co"'));
});

test("a null discount renders as an empty field, not the string 'null'", () => {
  const csv = toCsv([row({ discountPercent: null })]);
  assert.ok(!csv.includes("null"));
});
