import { AuditCategory, AuditIssue, ContentType, TextRange } from "@/lib/types";
import { nicheLabel } from "@/lib/niches";
import { TextStats } from "../text-stats";

const MIN_WORDS_FOR_READABILITY = 250;

// Different niches carry different reasonable expectations for how dense
// writing can be before it starts losing readers. A recipe blog should read
// almost effortlessly; legal or finance content is allowed to sit lower on
// the Flesch scale before it counts as "too hard" for its own audience. Same
// 0-100 Flesch scale throughout — just a different bar per niche for what
// counts as "good" vs. "critical."
const FLESCH_BANDS: Record<ContentType, { good: number; warning: number }> = {
  general: { good: 60, warning: 30 },
  technical: { good: 40, warning: 20 },
  ecommerce: { good: 55, warning: 30 },
  health: { good: 55, warning: 30 },
  finance: { good: 45, warning: 25 },
  legal: { good: 35, warning: 15 },
  food: { good: 65, warning: 35 },
  travel: { good: 60, warning: 30 },
  realestate: { good: 50, warning: 25 },
  education: { good: 55, warning: 30 },
  parenting: { good: 60, warning: 30 },
  fitness: { good: 55, warning: 30 },
  beauty: { good: 60, warning: 30 },
  home: { good: 55, warning: 30 },
  news: { good: 50, warning: 25 },
};

const MAX_HIGHLIGHTS = 25;

function toHighlights(spans: { start: number; end: number }[]): TextRange[] {
  return spans.slice(0, MAX_HIGHLIGHTS).map((s) => ({ start: s.start, end: s.end }));
}

export function buildContentQualityCategory(
  stats: TextStats,
  contentType: ContentType = "general",
  keyword?: string
): AuditCategory {
  const issues: AuditIssue[] = [];
  // Repeating the target keyword is good for SEO, not a writing flaw — don't
  // flag the keyword's own words as "overused" here.
  const keywordWords = new Set((keyword ?? "").toLowerCase().split(/\s+/).filter(Boolean));
  const repeatedWords = stats.repeatedWords.filter((g) => !keywordWords.has(g.word));

  if (stats.wordCount < MIN_WORDS_FOR_READABILITY) {
    issues.push({
      id: "not-enough-text",
      title: `Only ${stats.wordCount} words found`,
      severity: "warning",
      description: `At least ${MIN_WORDS_FOR_READABILITY} words are needed to reliably score readability, sentence length, and passive voice.`,
    });
    return {
      id: "content-quality",
      title: "Content Quality & Readability",
      subtitle: "Clarity, structure, tone",
      tier: "free",
      issues,
    };
  }

  if (stats.longSentences.length > 0) {
    issues.push({
      id: "long-sentences",
      title: `${stats.longSentences.length} sentence${stats.longSentences.length === 1 ? "" : "s"} ${
        stats.longSentences.length === 1 ? "is" : "are"
      } over 30 words`,
      severity: stats.longSentences.length >= 3 ? "serious" : "warning",
      description:
        "Long sentences slow readers down and are harder for AI systems to extract a clean answer from.",
      highlights: toHighlights(stats.longSentences),
    });
  } else {
    issues.push({
      id: "long-sentences-ok",
      title: "No overly long sentences found",
      severity: "good",
    });
  }

  const passivePercent = Math.round(stats.passiveRatio * 100);
  if (stats.passiveRatio > 0.1) {
    issues.push({
      id: "passive-voice",
      title: `Passive voice in ${passivePercent}% of sentences`,
      severity: stats.passiveRatio > 0.25 ? "serious" : "warning",
      description: "Above the 10% threshold that tends to read as stiff or evasive.",
      highlights: toHighlights(stats.passiveSentences),
    });
  } else {
    issues.push({
      id: "passive-voice-ok",
      title: `Passive voice in ${passivePercent}% of sentences`,
      severity: "good",
    });
  }

  const band = FLESCH_BANDS[contentType];
  const audienceNote = contentType === "general" ? "" : ` for a ${nicheLabel(contentType).toLowerCase()} audience`;
  if (stats.fleschScore >= band.good) {
    issues.push({
      id: "reading-level-ok",
      title: `Reading level is easy to follow (score ${stats.fleschScore}/100)`,
      severity: "good",
    });
  } else if (stats.fleschScore >= band.warning) {
    issues.push({
      id: "reading-level-warning",
      title: `Reading level is fairly difficult (score ${stats.fleschScore}/100)`,
      severity: "warning",
      description: `A Flesch score below ${band.good}${audienceNote} means shorter sentences and simpler words would help most readers.`,
    });
  } else {
    issues.push({
      id: "reading-level-critical",
      title: `Reading level is very difficult (score ${stats.fleschScore}/100)`,
      severity: "serious",
      description: `This reads at a level that will lose most readers${audienceNote}. Aim for shorter sentences and plainer words.`,
    });
  }

  const adverbRatio = stats.wordCount > 0 ? stats.adverbs.length / stats.wordCount : 0;
  if (adverbRatio > 0.03) {
    issues.push({
      id: "adverb-overuse",
      title: `${stats.adverbs.length} adverbs found (${Math.round(adverbRatio * 100)}% of words)`,
      severity: adverbRatio > 0.06 ? "serious" : "warning",
      description: "Above roughly 3% of words, adverbs usually mean a stronger verb is available instead of propping up a weak one.",
      highlights: toHighlights(stats.adverbs),
    });
  } else {
    issues.push({
      id: "adverb-overuse-ok",
      title: "Adverb use is reasonable",
      severity: "good",
    });
  }

  if (stats.fillerWords.length > 0) {
    issues.push({
      id: "filler-words",
      title: `${stats.fillerWords.length} filler word${stats.fillerWords.length === 1 ? "" : "s"} found`,
      severity: stats.fillerWords.length >= 5 ? "serious" : "warning",
      description: 'Words like "very", "really", and "just" rarely add meaning. Cutting them makes writing read more direct and confident.',
      highlights: toHighlights(stats.fillerWords),
    });
  } else {
    issues.push({
      id: "filler-words-ok",
      title: "No filler words found",
      severity: "good",
    });
  }

  if (repeatedWords.length > 0) {
    const examples = repeatedWords.slice(0, 4).map((g) => `"${g.word}"`).join(", ");
    const more = repeatedWords.length > 4 ? `, +${repeatedWords.length - 4} more` : "";
    issues.push({
      id: "repeated-words",
      title: `${repeatedWords.length} word${repeatedWords.length === 1 ? "" : "s"} repeated too often close together`,
      severity: repeatedWords.length >= 6 ? "serious" : "warning",
      description: `${examples}${more}. The same word clustering within a sentence or two reads as repetitive — try a synonym or restructure the sentence.`,
      highlights: toHighlights(repeatedWords.flatMap((g) => g.occurrences)),
    });
  } else {
    issues.push({
      id: "repeated-words-ok",
      title: "No close word repetition found",
      severity: "good",
    });
  }

  return {
    id: "content-quality",
    title: "Content Quality & Readability",
    subtitle: "Clarity, structure, tone",
    tier: "free",
    issues,
  };
}
