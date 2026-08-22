import { AuditCategory, AuditIssue, ContentType, TextRange } from "@/lib/types";
import { TextStats } from "../text-stats";

const MIN_WORDS_FOR_READABILITY = 250;

// A technical/B2B audience is expected to tolerate denser writing than a
// general-audience piece — same Flesch scale, lower bar for what counts as
// "good" or "critical".
const FLESCH_BANDS: Record<ContentType, { good: number; warning: number }> = {
  general: { good: 60, warning: 30 },
  technical: { good: 40, warning: 20 },
};

function toHighlights(sentences: { start: number; end: number }[]): TextRange[] {
  return sentences.map((s) => ({ start: s.start, end: s.end }));
}

export function buildContentQualityCategory(
  stats: TextStats,
  contentType: ContentType = "general"
): AuditCategory {
  const issues: AuditIssue[] = [];

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
      fixLabel: "Simplify sentences",
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
      fixLabel: "Rewrite in active voice",
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
  const audienceNote = contentType === "technical" ? " for a technical/B2B audience" : "";
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
      fixLabel: "Simplify wording",
    });
  } else {
    issues.push({
      id: "reading-level-critical",
      title: `Reading level is very difficult (score ${stats.fleschScore}/100)`,
      severity: "serious",
      description: `This reads at a level that will lose most readers${audienceNote} — aim for shorter sentences and plainer words.`,
      fixLabel: "Simplify wording",
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
