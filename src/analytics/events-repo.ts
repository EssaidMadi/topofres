import type { DatabaseSync } from "node:sqlite";

/**
 * Internal-only analytics events (spec.md Boundaries: no third-party
 * tracker). Intentionally minimal — type, target, referrer — no IP or
 * user-agent capture; we don't need it for "which content drives traffic"
 * and collecting it by default isn't a decision to make silently.
 */
export type EventType = "pageview" | "deal_click";

export interface EventInput {
  type: EventType;
  target: string;
  referrer: string | null;
}

export function recordEvent(db: DatabaseSync, event: EventInput): void {
  db.prepare("INSERT INTO events (type, target, referrer) VALUES (?, ?, ?)").run(
    event.type,
    event.target,
    event.referrer,
  );
}
