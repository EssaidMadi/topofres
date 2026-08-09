import type { DealInput } from "./types.js";

const PH_GRAPHQL_ENDPOINT = "https://api.producthunt.com/v2/api/graphql";

const RECENT_POSTS_QUERY = `
  query RecentPosts($first: Int!) {
    posts(first: $first, order: NEWEST) {
      edges {
        node {
          id
          name
          tagline
          description
          url
          votesCount
          createdAt
          topics(first: 3) {
            edges { node { name } }
          }
        }
      }
    }
  }
`;

export interface ProductHuntPost {
  id: string;
  name: string;
  tagline: string;
  description: string | null;
  url: string;
  votesCount: number;
  createdAt: string;
  topics: string[];
}

/** Minimal shape of `fetch` we depend on — lets tests inject a fake without mocking globals. */
type FetchLike = (url: string, init: RequestInit) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

export async function fetchRecentPosts(
  token: string,
  { first = 20, fetchImpl = fetch as FetchLike }: { first?: number; fetchImpl?: FetchLike } = {},
): Promise<ProductHuntPost[]> {
  const res = await fetchImpl(PH_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: RECENT_POSTS_QUERY, variables: { first } }),
  });

  if (!res.ok) {
    throw new Error(`Product Hunt API error: HTTP ${res.status}`);
  }

  const body = (await res.json()) as {
    errors?: Array<{ message: string }>;
    data?: {
      posts?: {
        edges: Array<{
          node: {
            id: string;
            name: string;
            tagline: string;
            description: string | null;
            url: string;
            votesCount: number;
            createdAt: string;
            topics: { edges: Array<{ node: { name: string } }> };
          };
        }>;
      };
    };
  };

  if (body.errors?.length) {
    throw new Error(`Product Hunt API error: ${body.errors.map((e) => e.message).join("; ")}`);
  }

  const edges = body.data?.posts?.edges ?? [];
  return edges.map(({ node }) => ({
    id: node.id,
    name: node.name,
    tagline: node.tagline,
    description: node.description,
    url: node.url,
    votesCount: node.votesCount,
    createdAt: node.createdAt,
    topics: node.topics.edges.map((t) => t.node.name),
  }));
}

/**
 * Heuristic only: Product Hunt has no structured "discount" field, so we
 * guess from the tagline/description text (e.g. "50% off launch week").
 * This will miss deals phrased differently and can misfire on unrelated
 * percentages — good enough to unblock scoring in Tranche 3, not a source
 * of truth. Revisit once a second source (with real deal data) exists.
 */
export function guessDiscountPercent(post: ProductHuntPost): number | null {
  const text = `${post.tagline} ${post.description ?? ""}`;
  const match = text.match(/(\d{1,3})\s?%/);
  if (!match) return null;
  const value = Number(match[1]);
  return value > 0 && value <= 100 ? value : null;
}

export function toDealInputs(posts: ProductHuntPost[]): DealInput[] {
  return posts.map((post) => ({
    source: "producthunt",
    sourceId: post.id,
    title: post.name,
    description: post.tagline,
    url: post.url,
    category: post.topics[0] ?? null,
    discountPercent: guessDiscountPercent(post),
    launchedAt: post.createdAt,
  }));
}
