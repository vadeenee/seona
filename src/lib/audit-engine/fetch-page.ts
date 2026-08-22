export interface FetchedPage {
  html: string;
  finalUrl: string;
  loadTimeMs: number;
}

const FETCH_TIMEOUT_MS = 10_000;

// Thrown deliberately below, with a message that's already safe to show the
// user. Anything else escaping the try block (DNS failure, connection
// refused, etc.) is a lower-level network error whose message ("fetch
// failed") isn't meaningful to a non-technical reader, so it gets rewritten.
class FetchPageError extends Error {}

export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export async function fetchPage(input: string): Promise<FetchedPage> {
  const url = normalizeUrl(input);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  const start = Date.now();
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "SeonaAuditBot/0.1 (+https://seona-khaki.vercel.app)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    const loadTimeMs = Date.now() - start;

    if (!res.ok) {
      throw new FetchPageError(`Page responded with ${res.status} ${res.statusText}`);
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("xml")) {
      throw new FetchPageError(`Expected an HTML page, got content-type "${contentType}"`);
    }

    const html = await res.text();
    return { html, finalUrl: res.url || url, loadTimeMs };
  } catch (err) {
    if (err instanceof FetchPageError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Timed out fetching the page (10s limit).");
    }
    throw new Error(
      `Couldn't reach "${url}" — double check the URL is correct and publicly accessible.`
    );
  } finally {
    clearTimeout(timeout);
  }
}
