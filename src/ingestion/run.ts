import { openDb } from "../db/client.js";
import { fetchRecentPosts, toDealInputs } from "./producthunt.js";
import { storeDeals } from "./store.js";

const token = process.env.PRODUCT_HUNT_TOKEN;
if (!token) {
  console.error("PRODUCT_HUNT_TOKEN manquant dans l'environnement — voir .env.example.");
  process.exit(1);
}

const posts = await fetchRecentPosts(token);
const deals = toDealInputs(posts);
const db = openDb();
const { inserted } = storeDeals(db, deals);

console.log(`${posts.length} lancements récupérés sur Product Hunt.`);
console.log(`${inserted} nouveaux deals stockés (les autres existaient déjà).`);
