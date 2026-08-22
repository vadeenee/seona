import { AuditResult } from "./types";

// Placeholder data standing in for the real audit engine. Shape mirrors
// what the API route (or server action) should eventually return.
export const mockAudit: AuditResult = {
  url: "yourblog.com/best-running-shoes",
  score: 61,
  headline: "Needs work — 12 issues found across 8 categories",
  summary:
    "Your page has strong basics but is missing the structure and depth that AI search experiences look for. Fix the free items below, or unlock the full audit.",
  categories: [
    {
      id: "on-page",
      title: "On-Page SEO",
      subtitle: "Titles, meta, headings",
      tier: "free",
      issues: [
        {
          id: "meta-desc",
          title: "Meta description is missing",
          severity: "critical",
          description:
            "Google is writing its own snippet for this page, which usually lowers click-through rate from search results.",
          fixLabel: "Generate meta description",
        },
        {
          id: "title-length",
          title: "Title tag is 74 characters",
          severity: "warning",
          description:
            "Titles over ~60 characters get truncated in search results on most devices.",
          fixLabel: "Shorten title",
        },
        {
          id: "h1-ok",
          title: "H1 present and matches primary keyword",
          severity: "good",
        },
      ],
    },
    {
      id: "content-quality",
      title: "Content Quality & Readability",
      subtitle: "Clarity, structure, tone",
      tier: "free",
      issues: [
        {
          id: "long-sentences",
          title: "3 sentences are over 30 words",
          severity: "serious",
          description:
            "Long sentences slow readers down and are harder for AI systems to extract a clean answer from.",
          fixLabel: "Simplify sentences",
        },
        {
          id: "passive-voice",
          title: "Passive voice in 18% of sentences",
          severity: "warning",
          description: "Above the 10% threshold that tends to read as stiff or evasive.",
          fixLabel: "Rewrite in active voice",
        },
        {
          id: "reading-level-ok",
          title: "Reading level matches target audience",
          severity: "good",
        },
      ],
    },
    {
      id: "technical",
      title: "Technical SEO",
      subtitle: "Crawlability & page basics",
      tier: "free",
      issues: [
        {
          id: "canonical",
          title: "Canonical tag is missing",
          severity: "critical",
          description:
            "Without a canonical tag, search engines may index a duplicate or parameterized version of this page instead.",
          fixLabel: "Add canonical tag",
        },
        {
          id: "alt-text",
          title: "2 images are missing alt text",
          severity: "warning",
          description:
            "Alt text helps image search, accessibility, and gives AI crawlers more context about the page.",
          fixLabel: "Generate alt text",
        },
        {
          id: "load-time-ok",
          title: "Page loads in 1.8s",
          severity: "good",
        },
      ],
    },
    {
      id: "intent-coverage",
      title: "Search Intent & Topical Coverage",
      subtitle: "Vs. the top 10 ranking pages",
      tier: "diagnosis-free",
      issues: [
        {
          id: "intent-mismatch",
          title: "Page reads as informational, but intent is commercial",
          severity: "critical",
          description:
            "9 of the top 10 ranking pages for this topic are structured as buying guides with comparisons and prices — yours opens as a narrative story.",
          fixLabel: "Rewrite intro to match commercial intent",
        },
        {
          id: "missing-subtopics",
          title: "6 subtopics competitors cover are missing",
          severity: "serious",
          description:
            "Cushioning, durability, half-marathon-specific fit, price tiers, and 2 more are covered by ranking competitors but not here.",
          fixLabel: "Generate missing sections",
        },
      ],
    },
    {
      id: "structure",
      title: "Content Structure: Tables & FAQs",
      subtitle: "Snippet & answer-box readiness",
      tier: "diagnosis-free",
      issues: [
        {
          id: "no-faq",
          title: "No FAQ section, but a \"People also ask\" box exists",
          severity: "serious",
          description:
            "Google shows 4 related questions in the SERP for this query — an FAQ block is the highest-probability way to win that space.",
          fixLabel: "Generate FAQ block",
        },
        {
          id: "no-table",
          title: "Comparison data is written as prose",
          severity: "warning",
          description:
            "A structured table qualifies for richer result types more often than paragraph text.",
          fixLabel: "Convert to table",
        },
      ],
    },
    {
      id: "internal-linking",
      title: "Internal Linking",
      subtitle: "Site-wide link graph",
      tier: "diagnosis-free",
      issues: [
        {
          id: "missing-links",
          title: "5 related pages should link here but don't",
          severity: "serious",
          description:
            "Pages on your site cover related topics and are good candidates to pass authority to this page.",
          fixLabel: "View + add suggested links",
        },
      ],
    },
    {
      id: "aeo",
      title: "AEO / AI Overview Readiness",
      subtitle: "Will ChatGPT, Perplexity & AI Overviews cite this page?",
      tier: "pro-locked",
      issues: [
        {
          id: "no-direct-answer",
          title: "No direct-answer paragraph within the first 100 words",
          severity: "critical",
        },
        {
          id: "unattributed-claims",
          title: "Claims aren't attributed to a checkable source",
          severity: "serious",
        },
        {
          id: "entity-inconsistency",
          title: "Entity mentions are inconsistent across the page",
          severity: "serious",
        },
      ],
    },
    {
      id: "schema",
      title: "Schema Markup",
      subtitle: "Structured data for rich results",
      tier: "pro-locked",
      issues: [
        {
          id: "faq-schema",
          title: "No FAQPage schema despite an FAQ section",
          severity: "serious",
        },
        {
          id: "article-schema",
          title: "Article schema missing author & date fields",
          severity: "warning",
        },
        {
          id: "product-schema",
          title: "Product schema not present for reviewed items",
          severity: "warning",
        },
      ],
    },
  ],
};
