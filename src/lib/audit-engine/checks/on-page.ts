import { AuditCategory, AuditIssue } from "@/lib/types";
import { PageData } from "../parse-html";

const TITLE_MAX = 60;
const META_DESC_MIN = 50;
const META_DESC_MAX = 160;

export function buildOnPageCategory(pageData: PageData | null): AuditCategory {
  if (!pageData) {
    return {
      id: "on-page",
      title: "On-Page SEO",
      subtitle: "Titles, meta, headings",
      tier: "free",
      issues: [
        {
          id: "no-html",
          title: "No page markup to check",
          severity: "warning",
          description:
            "Title tags, meta descriptions, and heading structure only exist on HTML pages. Paste a URL instead of raw text to check these.",
        },
      ],
    };
  }

  const issues: AuditIssue[] = [];

  if (!pageData.title) {
    issues.push({
      id: "title-missing",
      title: "Title tag is missing",
      severity: "critical",
      description:
        "Every page needs a unique <title> tag — it's the headline shown in search results and browser tabs.",
      fixLabel: "Generate title tag",
    });
  } else if (pageData.title.length > TITLE_MAX) {
    issues.push({
      id: "title-length",
      title: `Title tag is ${pageData.title.length} characters`,
      severity: "warning",
      description: `Titles over ~${TITLE_MAX} characters get truncated in search results on most devices.`,
      fixLabel: "Shorten title",
    });
  } else {
    issues.push({
      id: "title-ok",
      title: `Title tag length is good (${pageData.title.length} characters)`,
      severity: "good",
    });
  }

  if (!pageData.metaDescription) {
    issues.push({
      id: "meta-desc",
      title: "Meta description is missing",
      severity: "critical",
      description:
        "Google is writing its own snippet for this page, which usually lowers click-through rate from search results.",
      fixLabel: "Generate meta description",
    });
  } else if (
    pageData.metaDescription.length < META_DESC_MIN ||
    pageData.metaDescription.length > META_DESC_MAX
  ) {
    issues.push({
      id: "meta-desc-length",
      title: `Meta description is ${pageData.metaDescription.length} characters`,
      severity: "warning",
      description: `Aim for ${META_DESC_MIN}-${META_DESC_MAX} characters so it isn't truncated or padded out by Google.`,
      fixLabel: "Rewrite meta description",
    });
  } else {
    issues.push({
      id: "meta-desc-ok",
      title: "Meta description length is good",
      severity: "good",
    });
  }

  const h1s = pageData.headings.filter((h) => h.level === 1);
  if (h1s.length === 0) {
    issues.push({
      id: "h1-missing",
      title: "No H1 heading found",
      severity: "critical",
      description: "Every page should have exactly one H1 that describes what the page is about.",
      fixLabel: "Add an H1",
    });
  } else if (h1s.length > 1) {
    issues.push({
      id: "h1-multiple",
      title: `Multiple H1 headings found (${h1s.length})`,
      severity: "warning",
      description: "Having more than one H1 can dilute the page's topical signal — most pages should have exactly one.",
      fixLabel: "Reduce to one H1",
    });
  } else {
    issues.push({
      id: "h1-ok",
      title: "H1 present and unique",
      severity: "good",
    });
  }

  return {
    id: "on-page",
    title: "On-Page SEO",
    subtitle: "Titles, meta, headings",
    tier: "free",
    issues,
  };
}
