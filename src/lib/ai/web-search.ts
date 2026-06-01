import { WebSearchResult } from "../types";

let tavilyClient: any = null;

async function getTavilyClient() {
  if (tavilyClient) return tavilyClient;

  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return null;

  try {
    const { tavily } = await import("@tavily/core");
    tavilyClient = tavily({ apiKey });
    return tavilyClient;
  } catch {
    return null;
  }
}

export function isWebSearchAvailable(): boolean {
  return !!process.env.TAVILY_API_KEY;
}

export async function searchTopics(
  queries: string[],
  maxResultsPerQuery: number = 3
): Promise<WebSearchResult[]> {
  const client = await getTavilyClient();
  if (!client) return [];

  const results: WebSearchResult[] = [];

  const batches: string[][] = [];
  for (let i = 0; i < queries.length; i += 4) {
    batches.push(queries.slice(i, i + 4));
  }

  for (const batch of batches) {
    const batchResults = await Promise.allSettled(
      batch.map(async (query) => {
        try {
          const response = await client.search(query, {
            maxResults: maxResultsPerQuery,
            searchDepth: "basic",
            includeAnswer: false,
          });
          return {
            query,
            results: (response.results ?? []).map((r: any) => ({
              title: r.title ?? "",
              url: r.url ?? "",
              content: r.content ?? "",
            })),
          } as WebSearchResult;
        } catch {
          return { query, results: [] } as WebSearchResult;
        }
      })
    );

    for (const r of batchResults) {
      if (r.status === "fulfilled") results.push(r.value);
    }
  }

  return results;
}
