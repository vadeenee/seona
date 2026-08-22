// Deterministic text analysis: sentence/word counts, a Flesch-style
// readability score, and heuristics for long sentences and passive voice.
// No external APIs — this is what backs the free content-quality checks.

export interface SentenceInfo {
  text: string;
  wordCount: number;
  isPassive: boolean;
  start: number; // character offset into the normalized text
  end: number;
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
}

const PASSIVE_AUXILIARY = /\b(am|is|are|was|were|be|been|being)\b/i;
// Heuristic: an -ed/-en past participle (with common irregulars) following a
// passive auxiliary, optionally with an adverb in between ("was quickly written").
const PASSIVE_PARTICIPLE =
  /\b(am|is|are|was|were|be|been|being)\b\s+(\w+ly\s+)?(\w+ed|\w+en|born|built|brought|bought|caught|chosen|done|found|given|gone|held|known|made|paid|read|said|seen|sent|shown|sold|taken|taught|told|thought|understood|written)\b/i;

// Splits on sentence-ending punctuation, then re-locates each piece in the
// normalized text to recover its character offsets (needed to highlight the
// exact sentence in the editor UI). Pieces appear in order and don't overlap,
// so a moving-cursor indexOf is enough — no need for a position-aware parser.
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
  };
}
