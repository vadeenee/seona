const LOCATION_CODE_US = 2840;

export interface SerpOrganicResult {
  rank: number;
  title: string;
  url: string;
  domain: string;
  description: string | null;
}

export interface SerpLookup {
  keyword: string;
  results: SerpOrganicResult[];
}

function isConfigured(): boolean {
  return Boolean(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD);
}

export function isCompetitorResearchConfigured(): boolean {
  return isConfigured();
}

interface DataForSeoItem {
  type: string;
  rank_absolute?: number;
  rank_group?: number;
  title?: string;
  url?: string;
  domain?: string;
  description?: string;
}

export async function fetchSerpResults(keyword: string): Promise<SerpLookup> {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    throw new Error("Competitor research isn't configured yet.");
  }

  const auth = Buffer.from(`${login}:${password}`).toString("base64");
  const res = await fetch("https://api.dataforseo.com/v3/serp/google/organic/live/advanced", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      {
        keyword,
        location_code: LOCATION_CODE_US,
        language_code: "en",
        device: "desktop",
        depth: 10,
      },
    ]),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data) {
    throw new Error(`DataForSEO request failed (${res.status}).`);
  }

  const task = data.tasks?.[0];
  if (!task || task.status_code !== 20000) {
    throw new Error(task?.status_message ?? "DataForSEO couldn't complete that lookup.");
  }

  const items: DataForSeoItem[] = task.result?.[0]?.items ?? [];
  const results: SerpOrganicResult[] = items
    .filter((item): item is Required<Pick<DataForSeoItem, "title" | "url">> & DataForSeoItem =>
      item.type === "organic" && Boolean(item.title) && Boolean(item.url)
    )
    .slice(0, 10)
    .map((item) => ({
      rank: item.rank_absolute ?? item.rank_group ?? 0,
      title: item.title!,
      url: item.url!,
      domain: item.domain ?? new URL(item.url!).hostname,
      description: item.description ?? null,
    }));

  return { keyword, results };
}
