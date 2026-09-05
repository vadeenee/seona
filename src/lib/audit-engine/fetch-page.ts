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
        // A self-identifying bot string ("SeonaAuditBot/0.1") gets a
        // different response from a lot of real-world sites — CDNs and bot
        // -management layers commonly serve an unrecognized bot a stripped
        // -down or cached "safe" page instead of the real one, silently
        // breaking title/meta/content extraction. Presenting as a normal
        // Chrome browser instead gets the same HTML a human visitor sees.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
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
      `Couldn't reach "${url}". Double check the URL is correct and publicly accessible.`
    );
  } finally {
    clearTimeout(timeout);
  }
}
