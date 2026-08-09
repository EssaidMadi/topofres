import type { ProspectRow } from "./prospects.js";

const HEADER = "company,category,dealUrl,discountPercent,launchedAt,source,outreachNote";

/** Quote a field only when it needs it — comma, quote, or newline inside. */
function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function rowToLine(row: ProspectRow): string {
  return [
    row.company,
    row.category,
    row.dealUrl,
    row.discountPercent != null ? String(row.discountPercent) : "",
    row.launchedAt ?? "",
    row.source,
    row.outreachNote,
  ]
    .map(escapeCsvField)
    .join(",");
}

export function toCsv(rows: ProspectRow[]): string {
  return [HEADER, ...rows.map(rowToLine)].join("\r\n") + "\r\n";
}
