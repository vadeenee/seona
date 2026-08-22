import { AuditCategory } from "@/lib/types";

// The diagnosis-free and pro-locked tiers need a SERP data API and an LLM API
// key (build priority 4 in CLAUDE.md) — until then they stay illustrative so
// the freemium UI has something to show. Free-tier categories next to these
// are real, computed by ../checks/*.
export const placeholderCategories: AuditCategory[] = [
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
        title: 'No FAQ section, but a "People also ask" box exists',
        severity: "serious",
        description:
          "Google shows 4 related questions in the SERP for this query — an FAQ block is the highest-probability way to win that space.",
        fixLabel: "Generate FAQ block",
      },
      {
        id: "no-table",
        title: "Comparison data is written as prose",
        severity: "warning",
        description: "A structured table qualifies for richer result types more often than paragraph text.",
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
        description: "Pages on your site cover related topics and are good candidates to pass authority to this page.",
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
];
