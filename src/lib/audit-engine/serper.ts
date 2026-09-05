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

export function isCompetitorResearchConfigured(): boolean {
  return Boolean(process.env.SERPER_API_KEY);
}

interface SerperOrganicItem {
  title?: string;
  link?: string;
  snippet?: string;
  position?: number;
}

export async function fetchSerpResults(keyword: string): Promise<SerpLookup> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    throw new Error("Competitor research isn't configured yet.");
  }

  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: keyword, gl: "us", hl: "en", num: 10 }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data) {
    throw new Error(`Serper request failed (${res.status}).`);
  }

  const items: SerperOrganicItem[] = data.organic ?? [];
  const results: SerpOrganicResult[] = items
    .filter((item): item is Required<Pick<SerperOrganicItem, "title" | "link">> & SerperOrganicItem =>
      Boolean(item.title) && Boolean(item.link)
    )
    .slice(0, 10)
    .map((item, i) => {
      let domain = item.link!;
      try {
        domain = new URL(item.link!).hostname;
      } catch {
        // leave domain as the raw link if it somehow isn't a valid URL
      }
      return {
        rank: item.position ?? i + 1,
        title: item.title!,
        url: item.link!,
        domain,
        description: item.snippet ?? null,
      };
    });

  return { keyword, results };
}
