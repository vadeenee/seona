import { AuditCategory, AuditIssue } from "@/lib/types";
import { PageData } from "../parse-html";

const TITLE_MAX = 60;
const META_DESC_MIN = 50;
const META_DESC_MAX = 160;

export function buildOnPageCategory(pageData: PageData | null, keyword?: string): AuditCategory {
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
        "Every page needs a unique <title> tag. It's the headline shown in search results and browser tabs.",
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
      description: "Having more than one H1 can dilute the page's topical signal. Most pages should have exactly one.",
      fixLabel: "Reduce to one H1",
    });
  } else {
    issues.push({
      id: "h1-ok",
      title: "H1 present and unique",
      severity: "good",
    });
  }

  const trimmedKeyword = keyword?.trim();
  if (trimmedKeyword) {
    const lowerKeyword = trimmedKeyword.toLowerCase();
    if (pageData.title) {
      issues.push(
        pageData.title.toLowerCase().includes(lowerKeyword)
          ? { id: "title-keyword-ok", title: "Title tag includes your target keyword", severity: "good" }
          : {
              id: "title-keyword-missing",
              title: "Title tag doesn't include your target keyword",
              severity: "warning",
              description: `"${trimmedKeyword}" doesn't appear in the title tag. Titles that match the target keyword tend to earn a higher click-through rate.`,
              fixLabel: "Update title",
            }
      );
    }
    if (h1s.length === 1) {
      issues.push(
        h1s[0].text.toLowerCase().includes(lowerKeyword)
          ? { id: "h1-keyword-ok", title: "H1 includes your target keyword", severity: "good" }
          : {
              id: "h1-keyword-missing",
              title: "H1 doesn't include your target keyword",
              severity: "warning",
              description: `"${trimmedKeyword}" doesn't appear in the H1. It's one of the strongest on-page signals for what a page is about.`,
              fixLabel: "Update H1",
            }
      );
    }
    if (pageData.metaDescription) {
      issues.push(
        pageData.metaDescription.toLowerCase().includes(lowerKeyword)
          ? { id: "meta-desc-keyword-ok", title: "Meta description includes your target keyword", severity: "good" }
          : {
              id: "meta-desc-keyword-missing",
              title: "Meta description doesn't include your target keyword",
              severity: "warning",
              description: `"${trimmedKeyword}" doesn't appear in the meta description. Working it in naturally reinforces relevance and often gets bolded in search results.`,
              fixLabel: "Rewrite meta description",
            }
      );
    }
  }

  const bodyWordCount = pageData.bodyText.split(/\s+/).filter(Boolean).length;
  const h2s = pageData.headings.filter((h) => h.level === 2);
  if (bodyWordCount > 150) {
    if (h2s.length === 0) {
      issues.push({
        id: "subheadings-missing",
        title: "No subheadings (H2s) break up the content",
        severity: "warning",
        description:
          "A page this long with no H2 sections reads as one dense block. Subheadings make content scannable and easier for AI systems to extract specific sections from.",
        fixLabel: "Add section headings",
      });
    } else {
      issues.push({
        id: "subheadings-ok",
        title: `Content is organized into ${h2s.length} section${h2s.length === 1 ? "" : "s"} with H2 headings`,
        severity: "good",
      });
    }
  }

  const og = pageData.openGraph;
  const missingOg = [
    !og.title && "og:title",
    !og.description && "og:description",
    !og.image && "og:image",
  ].filter((v): v is string => Boolean(v));
  if (missingOg.length > 0) {
    issues.push({
      id: "og-tags-missing",
      title: `Missing Open Graph tags: ${missingOg.join(", ")}`,
      severity: "warning",
      description:
        "Open Graph tags control how this page looks when shared on social media, Slack, or messaging apps. Without them, shares show a blank or generic preview.",
      fixLabel: "Generate Open Graph tags",
    });
  } else {
    issues.push({
      id: "og-tags-ok",
      title: "Open Graph tags are present",
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
