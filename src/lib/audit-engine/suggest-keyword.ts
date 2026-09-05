// Cheap, deterministic focus-keyword suggestion derived from a page's own
// title — not real keyword research (no search volume, difficulty, or
// competitor data). It exists so a pasted URL doesn't leave the Focus
// Keyword field empty when the page's own title already states its topic;
// the user can always edit or replace it before rechecking.

// Titles almost always follow "Page Topic | Site Name" (or " - ", " — ",
// " :: " as the separator) — the topic segment is the one worth keeping. A
// bare hyphen only counts as a separator with whitespace on both sides, so
// this doesn't also split inline hyphenated words like "non-slip".
const SEPARATORS = /\s+-\s+|\s*[|–—:]{1,2}\s*/;

const LEADING_STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "how",
  "to",
  "what",
  "is",
  "are",
  "why",
  "your",
]);

export function suggestKeywordFromTitle(title: string | null | undefined): string | null {
  const trimmed = title?.trim();
  if (!trimmed) return null;

  const segments = trimmed.split(SEPARATORS).map((s) => s.trim()).filter(Boolean);
  // Pick the longest segment (by word count) rather than always the first —
  // some sites put the brand name first ("Brand | Page Topic").
  const topic = segments.reduce((longest, s) => (s.split(/\s+/).length > longest.split(/\s+/).length ? s : longest), segments[0] ?? trimmed);

  const words = topic.split(/\s+/).filter(Boolean);
  while (words.length > 1 && LEADING_STOPWORDS.has(words[0].toLowerCase())) {
    words.shift();
  }

  const suggestion = words.slice(0, 7).join(" ").trim();
  return suggestion.length > 0 ? suggestion : null;
}
