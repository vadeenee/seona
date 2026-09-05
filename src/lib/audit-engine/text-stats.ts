// Deterministic text analysis: sentence/word counts, a Flesch-style
// readability score, and heuristics for long sentences and passive voice.
// No external APIs. This is what backs the free content-quality checks.

export interface SentenceInfo {
  text: string;
  wordCount: number;
  isPassive: boolean;
  start: number; // character offset into the normalized text
  end: number;
}

export interface WordMatch {
  word: string;
  start: number; // character offset into the normalized text
  end: number;
}

export interface RepeatedWordGroup {
  word: string;
  occurrences: WordMatch[]; // the close-together repeats, not counting the first mention
}

export interface TextStats {
  normalizedText: string; // whitespace-collapsed text the offsets below are relative to
  wordCount: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
  fleschScore: number; // 0-100, higher = easier to read
  longSentences: SentenceInfo[]; // sentences over 30 words
  passiveSentences: SentenceInfo[];
  passiveSentenceCount: number;
  passiveRatio: number; // 0-1
  adverbs: WordMatch[];
  fillerWords: WordMatch[];
  repeatedWords: RepeatedWordGroup[]; // distinct words that repeat closely 3+ times
}

const PASSIVE_AUXILIARY = /\b(am|is|are|was|were|be|been|being)\b/i;
// Heuristic: an -ed/-en past participle (with common irregulars) following a
// passive auxiliary, optionally with an adverb in between ("was quickly written").
const PASSIVE_PARTICIPLE =
  /\b(am|is|are|was|were|be|been|being)\b\s+(\w+ly\s+)?(\w+ed|\w+en|born|built|brought|bought|caught|chosen|done|found|given|gone|held|known|made|paid|read|said|seen|sent|shown|sold|taken|taught|told|thought|understood|written)\b/i;

// Splits on sentence-ending punctuation, then re-locates each piece in the
// normalized text to recover its character offsets (needed to highlight the
// exact sentence in the editor UI). Pieces appear in order and don't overlap,
// so a moving-cursor indexOf is enough, no need for a position-aware parser.
function splitSentences(normalizedText: string): SentenceInfo[] {
  const rawSentences = normalizedText
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).filter(Boolean).length >= 3); // skip fragments/headings

  let cursor = 0;
  const sentences: SentenceInfo[] = [];
  for (const text of rawSentences) {
    const start = normalizedText.indexOf(text, cursor);
    if (start === -1) continue; // shouldn't happen, but don't crash on it
    const end = start + text.length;
    cursor = end;
    const words = text.split(/\s+/).filter(Boolean);
    sentences.push({
      text,
      wordCount: words.length,
      isPassive: PASSIVE_AUXILIARY.test(text) && PASSIVE_PARTICIPLE.test(text),
      start,
      end,
    });
  }
  return sentences;
}

function tokenizeWords(text: string): WordMatch[] {
  const matches: WordMatch[] = [];
  const re = /[A-Za-z']+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    matches.push({ word: m[0], start: m.index, end: m.index + m[0].length });
  }
  return matches;
}

// Words that end in -ly but aren't adverbs (adjectives/nouns), kept out of
// the adverb-overuse heuristic so it doesn't cry wolf on ordinary vocabulary.
const ADVERB_SUFFIX_EXCLUDE = new Set([
  "family", "supply", "apply", "imply", "reply", "comply", "multiply", "rely",
  "holy", "ugly", "silly", "jolly", "friendly", "costly", "deadly", "timely",
  "monthly", "weekly", "daily", "yearly", "hourly", "elderly", "lively", "early",
  "italy", "ally", "rally", "bully", "belly", "jelly", "fully",
]);

function findAdverbs(text: string): WordMatch[] {
  return tokenizeWords(text).filter(
    (w) => w.word.length > 4 && /ly$/i.test(w.word) && !ADVERB_SUFFIX_EXCLUDE.has(w.word.toLowerCase())
  );
}

const FILLER_WORDS = new Set([
  "very", "really", "just", "actually", "basically", "literally", "definitely",
  "totally", "simply", "quite", "rather", "certainly", "truly", "virtually",
  "practically", "essentially", "obviously",
]);

function findFillerWords(text: string): WordMatch[] {
  return tokenizeWords(text).filter((w) => FILLER_WORDS.has(w.word.toLowerCase()));
}

// Common function words are excluded — repeating "the" or "that" is normal
// English, not a writing problem worth flagging.
const REPETITION_STOPWORDS = new Set([
  "the", "and", "that", "this", "with", "from", "have", "were", "was", "for",
  "are", "but", "not", "you", "your", "they", "their", "there", "when", "what",
  "which", "would", "could", "should", "about", "into", "than", "then", "them",
  "these", "those", "been", "being", "will", "can", "its", "our", "out", "over",
  "also", "more", "most", "such", "only", "some", "any", "all", "each", "other",
]);

// Grouped by word rather than a flat instance count: a word that appears
// twice in quick succession is normal English, but a word that clusters
// three-plus times is a real "vary your word choice" signal. Grouping also
// lets the caller exclude the page's own target keyword — repeating THAT is
// good for SEO, not a writing flaw, so it shouldn't get flagged here.
function findRepeatedWords(text: string, windowWords = 12): RepeatedWordGroup[] {
  const words = tokenizeWords(text);
  const lastSeenIndex = new Map<string, number>();
  const groups = new Map<string, WordMatch[]>();
  words.forEach((w, i) => {
    const lower = w.word.toLowerCase();
    if (lower.length <= 3 || REPETITION_STOPWORDS.has(lower)) return;
    const last = lastSeenIndex.get(lower);
    if (last !== undefined && i - last <= windowWords) {
      const list = groups.get(lower) ?? [];
      list.push(w);
      groups.set(lower, list);
    }
    lastSeenIndex.set(lower, i);
  });
  return [...groups.entries()]
    .map(([word, occurrences]) => ({ word, occurrences }))
    .filter((g) => g.occurrences.length >= 2) // 3+ total mentions bunched together
    .sort((a, b) => b.occurrences.length - a.occurrences.length);
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const stripped = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  const matches = stripped.match(/[aeiouy]{1,2}/g);
  return matches ? Math.max(1, matches.length) : 1;
}

export function analyzeText(rawText: string): TextStats {
  const normalizedText = rawText.replace(/\s+/g, " ").trim();
  const sentenceInfos = splitSentences(normalizedText);

  const words = normalizedText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentenceCount = sentenceInfos.length || (wordCount > 0 ? 1 : 0);
  const syllableCount = words.reduce((sum, w) => sum + countSyllables(w), 0);

  const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  const avgSyllablesPerWord = wordCount > 0 ? syllableCount / wordCount : 0;

  const fleschScoreRaw =
    sentenceCount > 0 && wordCount > 0
      ? 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord
      : 0;
  const fleschScore = Math.max(0, Math.min(100, Math.round(fleschScoreRaw)));

  const longSentences = sentenceInfos.filter((s) => s.wordCount > 30);
  const passiveSentences = sentenceInfos.filter((s) => s.isPassive);
  const passiveSentenceCount = passiveSentences.length;
  const passiveRatio = sentenceCount > 0 ? passiveSentenceCount / sentenceCount : 0;

  const adverbs = findAdverbs(normalizedText);
  const fillerWords = findFillerWords(normalizedText);
  const repeatedWords = findRepeatedWords(normalizedText);

  return {
    normalizedText,
    wordCount,
    sentenceCount,
    avgWordsPerSentence,
    fleschScore,
    longSentences,
    passiveSentences,
    passiveSentenceCount,
    passiveRatio,
    adverbs,
    fillerWords,
    repeatedWords,
  };
}
