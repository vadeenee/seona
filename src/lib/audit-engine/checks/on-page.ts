import { AuditCategory, AuditIssue, PageType } from "@/lib/types";
import { PageData } from "../parse-html";

const TITLE_MIN = 30;
const TITLE_MAX = 60;
const META_DESC_MIN = 50;
const META_DESC_MAX = 160;

export interface ManualMeta {
  title?: string;
  metaDescription?: string;
}

export function buildOnPageCategory(
  pageData: PageData | null,
  keyword?: string,
  manual?: ManualMeta,
  pageType: PageType = "blog"
): AuditCategory {
  // Pasted content has no HTML to read a title/meta description from, but the
  // user may have authored them directly in the SEO Title / Meta Description
  // fields (Yoast-style) — use those so on-page checks still run instead of
  // going dark just because there's no live page.
  const title = pageData?.title ?? manual?.title?.trim() ?? null;
  const metaDescription = pageData?.metaDescription ?? manual?.metaDescription?.trim() ?? null;

  if (!pageData && !title && !metaDescription) {
    return {
      id: "on-page",
      title: "On-Page SEO",
      subtitle: "Titles, meta, headings",
      tier: "free",
      issues: [
        {
          id: "no-html",
          title: "No SEO title or meta description to check yet",
          severity: "warning",
          description:
            "Fill in the SEO Title and Meta Description fields, or paste a URL instead of raw text, to check these.",
        },
      ],
    };
  }

  const issues: AuditIssue[] = [];

  if (!title) {
    issues.push({
      id: "title-missing",
      title: "SEO title is missing",
      severity: "critical",
      description: "Every page needs a title. It's the headline shown in search results and browser tabs.",
      fixLabel: "Generate title tag",
    });
  } else if (title.length > TITLE_MAX) {
    issues.push({
      id: "title-length",
      title: `SEO title is ${title.length} characters`,
      severity: "warning",
      description: `Titles over ~${TITLE_MAX} characters get truncated in search results on most devices.`,
      fixLabel: "Shorten title",
    });
  } else if (title.length < TITLE_MIN) {
    issues.push({
      id: "title-too-short",
      title: `SEO title is only ${title.length} characters`,
      severity: "warning",
      description: `Titles under ~${TITLE_MIN} characters usually aren't descriptive enough and waste the space Google gives you in the result.`,
      fixLabel: "Expand title",
    });
  } else {
    issues.push({
      id: "title-ok",
      title: `SEO title length is good (${title.length} characters)`,
      severity: "good",
    });
  }

  if (!metaDescription) {
    issues.push({
      id: "meta-desc",
      title: "Meta description is missing",
      severity: "critical",
      description:
        "Google is writing its own snippet for this page, which usually lowers click-through rate from search results.",
      fixLabel: "Generate meta description",
    });
  } else if (metaDescription.length < META_DESC_MIN || metaDescription.length > META_DESC_MAX) {
    issues.push({
      id: "meta-desc-length",
      title: `Meta description is ${metaDescription.length} characters`,
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

  const h1s = pageData?.headings.filter((h) => h.level === 1) ?? [];
  if (pageData) {
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
  }

  const trimmedKeyword = keyword?.trim();
  if (trimmedKeyword) {
    const lowerKeyword = trimmedKeyword.toLowerCase();
    if (title) {
      issues.push(
        title.toLowerCase().includes(lowerKeyword)
          ? { id: "title-keyword-ok", title: "SEO title includes your target keyword", severity: "good" }
          : {
              id: "title-keyword-missing",
              title: "SEO title doesn't include your target keyword",
              severity: "warning",
              description: `"${trimmedKeyword}" doesn't appear in the title. Titles that match the target keyword tend to earn a higher click-through rate.`,
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
    if (metaDescription) {
      issues.push(
        metaDescription.toLowerCase().includes(lowerKeyword)
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

  if (pageData) {
    const bodyWordCount = pageData.bodyText.split(/\s+/).filter(Boolean).length;
    const h2s = pageData.headings.filter((h) => h.level === 2);
    // Landing pages are legitimately often short, single-purpose (hero +
    // CTA sections) and don't need long-form H2 structure the way a blog
    // article does — skip this check for that page type instead of
    // penalizing a page for correctly being short.
    if (bodyWordCount > 150 && pageType !== "landing") {
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
  }

  return {
    id: "on-page",
    title: "On-Page SEO",
    subtitle: "Titles, meta, headings",
    tier: "free",
    issues,
  };
}
