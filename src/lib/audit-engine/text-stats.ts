// Deterministic text analysis: sentence/word counts, a Flesch-style
// readability score, and heuristics for long sentences and passive voice.
// No external APIs — this is what backs the free content-quality checks.

export interface SentenceInfo {
  text: string;
  wordCount: number;
  isPassive: boolean;
}

export interface TextStats {
  wordCount: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
  fleschScore: number; // 0-100, higher = easier to read
  longSentences: SentenceInfo[]; // sentences over 30 words
  passiveSentenceCount: number;
  passiveRatio: number; // 0-1
}

const PASSIVE_AUXILIARY = /\b(am|is|are|was|were|be|been|being)\b/i;
// Heuristic: an -ed/-en past participle (with common irregulars) following a
// passive auxiliary, optionally with an adverb in between ("was quickly written").
const PASSIVE_PARTICIPLE =
  /\b(am|is|are|was|were|be|been|being)\b\s+(\w+ly\s+)?(\w+ed|\w+en|born|built|brought|bought|caught|chosen|done|found|given|gone|held|known|made|paid|read|said|seen|sent|shown|sold|taken|taught|told|thought|understood|written)\b/i;

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).filter(Boolean).length >= 3); // skip fragments/headings
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
  const sentences = splitSentences(rawText);
  const sentenceInfos: SentenceInfo[] = sentences.map((s) => {
    const words = s.split(/\s+/).filter(Boolean);
    return {
      text: s,
      wordCount: words.length,
      isPassive: PASSIVE_AUXILIARY.test(s) && PASSIVE_PARTICIPLE.test(s),
    };
  });

  const words = rawText.split(/\s+/).filter(Boolean);
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
  const passiveSentenceCount = sentenceInfos.filter((s) => s.isPassive).length;
  const passiveRatio = sentenceCount > 0 ? passiveSentenceCount / sentenceCount : 0;

  return {
    wordCount,
    sentenceCount,
    avgWordsPerSentence,
    fleschScore,
    longSentences,
    passiveSentenceCount,
    passiveRatio,
  };
}
