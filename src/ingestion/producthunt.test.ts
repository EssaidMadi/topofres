import test from "node:test";
import assert from "node:assert/strict";
import { fetchRecentPosts, guessDiscountPercent, toDealInputs } from "./producthunt.js";

const SAMPLE_RESPONSE = {
  data: {
    posts: {
      edges: [
        {
          node: {
            id: "post_1",
            name: "Acme Analytics",
            tagline: "Ship dashboards faster — 50% off launch week",
            description: "Analytics for indie teams.",
            url: "https://producthunt.com/posts/acme-analytics",
            votesCount: 120,
            createdAt: "2026-08-01T10:00:00Z",
            topics: { edges: [{ node: { name: "Analytics" } }] },
          },
        },
        {
          node: {
            id: "post_2",
            name: "Plain Tool",
            tagline: "Just a tool, no deal mentioned",
            description: null,
            url: "https://producthunt.com/posts/plain-tool",
            votesCount: 10,
            createdAt: "2026-08-02T10:00:00Z",
            topics: { edges: [] },
          },
        },
      ],
    },
  },
};

function fakeFetch(capturedInit: { value?: RequestInit }) {
  return async (_url: string, init: RequestInit) => {
    capturedInit.value = init;
    return { ok: true, status: 200, json: async () => SAMPLE_RESPONSE };
  };
}

test("fetchRecentPosts sends the token and maps posts", async () => {
  const captured: { value?: RequestInit } = {};
  const posts = await fetchRecentPosts("secret-token", { fetchImpl: fakeFetch(captured) });

  assert.equal(posts.length, 2);
  assert.equal(posts[0]?.name, "Acme Analytics");
  assert.equal(posts[0]?.topics[0], "Analytics");

  const headers = captured.value?.headers as Record<string, string>;
  assert.equal(headers.Authorization, "Bearer secret-token");
});

test("fetchRecentPosts throws on a non-ok response", async () => {
  const fetchImpl = async () => ({ ok: false, status: 401, json: async () => ({}) });
  await assert.rejects(() => fetchRecentPosts("bad-token", { fetchImpl }));
});

test("fetchRecentPosts throws on a GraphQL error payload", async () => {
  const fetchImpl = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ errors: [{ message: "rate limited" }] }),
  });
  await assert.rejects(() => fetchRecentPosts("token", { fetchImpl }));
});

test("guessDiscountPercent finds a percentage in tagline or description", () => {
  const withDiscount = SAMPLE_RESPONSE.data.posts.edges[0]!.node;
  const withoutDiscount = SAMPLE_RESPONSE.data.posts.edges[1]!.node;

  assert.equal(
    guessDiscountPercent({ ...withDiscount, topics: [] }),
    50,
  );
  assert.equal(
    guessDiscountPercent({ ...withoutDiscount, topics: [] }),
    null,
  );
});

test("toDealInputs maps Product Hunt posts to deal rows", async () => {
  const posts = await fetchRecentPosts("token", { fetchImpl: fakeFetch({}) });
  const deals = toDealInputs(posts);

  assert.equal(deals.length, 2);
  assert.deepEqual(deals[0], {
    source: "producthunt",
    sourceId: "post_1",
    title: "Acme Analytics",
    description: "Ship dashboards faster — 50% off launch week",
    url: "https://producthunt.com/posts/acme-analytics",
    category: "Analytics",
    discountPercent: 50,
    launchedAt: "2026-08-01T10:00:00Z",
  });
});
