import { writeFileSync } from "node:fs";
import { openDb } from "../db/client.js";
import { getAllDeals } from "../db/deals-repo.js";
import { buildProspectList } from "./prospects.js";
import { toCsv } from "./csv.js";

const db = openDb();
const deals = getAllDeals(db);
const csv = toCsv(buildProspectList(deals));

writeFileSync("prospects.csv", csv, "utf-8");
console.log(`Wrote prospects.csv (${deals.length} rows). Nothing was sent anywhere — review before reaching out.`);
