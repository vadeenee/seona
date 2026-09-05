import { AuditCategory, AuditResult, ContentType, InputMode, PageType, Severity } from "@/lib/types";
import { fetchPage } from "./fetch-page";
import { parseHtml, looksLikeHtml, PageData } from "./parse-html";
import { analyzeText } from "./text-stats";
import { buildOnPageCategory, ManualMeta } from "./checks/on-page";
import { buildContentQualityCategory } from "./checks/content-quality";
import { buildTechnicalCategory } from "./checks/technical";
import { buildSearchIntentCategory } from "./checks/search-intent";
import { placeholderCategories } from "./placeholder-categories";

export interface RunAuditOptions {
  keyword?: string;
  contentType?: ContentType;
  pageType?: PageType;
  seoTitle?: string;
  seoMetaDescription?: string;
}

const URL_PATTERN = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+([/?#]\S*)?$/i;

function detectMode(input: string): InputMode {
  const trimmed = input.trim();
  if (looksLikeHtml(trimmed)) return "html";
  if (!/\s/.test(trimmed) && URL_PATTERN.test(trimmed)) return "url";
  return "text";
}

const SEVERITY_PENALTY: Record<Severity, number> = {
  critical: 15,
  serious: 8,
  warning: 3,
  good: 0,
};

// Scored from the free-tier categories only. Those are the ones the engine
// actually computes today. The diagnosis-free/pro-locked categories are still
// illustrative placeholders (see placeholder-categories.ts) and always carry
// the same fixed set of issues, so folding them into the score would push
// every audit toward the same low number regardless of the page's real
// quality.
function computeScore(freeCategories: AuditCategory[]): number {
  const penalty = freeCategories
    .flatMap((c) => c.issues)
    .reduce((sum, issue) => sum + SEVERITY_PENALTY[issue.severity], 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}

function buildSummary(categories: AuditCategory[], freeCategories: AuditCategory[], score: number) {
  const allIssues = categories.flatMap((c) => c.issues);
  const issueCount = allIssues.filter((i) => i.severity !== "good").length;
  const criticalCount = freeCategories
    .flatMap((c) => c.issues)
    .filter((i) => i.severity === "critical").length;

  const tone = score >= 85 ? "Great start" : score >= 60 ? "Needs work" : "Needs significant work";
  const headline =
    issueCount === 0
      ? `Looking good, no issues found across ${categories.length} categories`
      : `${tone}: ${issueCount} issue${issueCount === 1 ? "" : "s"} found across ${categories.length} categories`;

  const summary =
    criticalCount > 0
      ? `Fix the ${criticalCount} critical issue${criticalCount === 1 ? "" : "s"} below first. They're the most likely to be hurting rankings today. Unlock the full audit for AI-search readiness and competitive gaps.`
      : "Your page has strong basics. Unlock the full audit below for search-intent, structure, and AI-search readiness checks.";

  return { headline, summary };
}

export async function runAudit(input: string, options: RunAuditOptions = {}): Promise<AuditResult> {
  const mode = detectMode(input);

  let pageData: PageData | null = null;
  let loadTimeMs: number | null = null;
  let displayUrl = input.trim();

  if (mode === "url") {
    const fetched = await fetchPage(input);
    pageData = parseHtml(fetched.html);
    loadTimeMs = fetched.loadTimeMs;
    displayUrl = fetched.finalUrl;
  } else if (mode === "html") {
    pageData = parseHtml(input);
    displayUrl = "Pasted HTML";
  } else {
    displayUrl = "Pasted content";
  }

  const textSource = pageData ? pageData.bodyText : input;
  const stats = analyzeText(textSource);

  const manualMeta: ManualMeta = { title: options.seoTitle, metaDescription: options.seoMetaDescription };
  const freeCategories: AuditCategory[] = [
    buildOnPageCategory(pageData, options.keyword, manualMeta, options.pageType),
    buildContentQualityCategory(stats, options.contentType, options.keyword),
    buildTechnicalCategory(pageData, loadTimeMs),
  ];
  const searchIntentCategory = await buildSearchIntentCategory(options.keyword, pageData?.title ?? undefined);
  const categories: AuditCategory[] = [...freeCategories, searchIntentCategory, ...placeholderCategories];

  const score = computeScore(freeCategories);
  const { headline, summary } = buildSummary(categories, freeCategories, score);

  return {
    url: displayUrl,
    score,
    headline,
    summary,
    categories,
    mode,
    analyzedText: stats.normalizedText,
  };
}
