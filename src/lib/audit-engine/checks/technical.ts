import { AuditCategory, AuditIssue } from "@/lib/types";
import { PageData } from "../parse-html";

export function buildTechnicalCategory(
  pageData: PageData | null,
  loadTimeMs: number | null
): AuditCategory {
  if (!pageData) {
    return {
      id: "technical",
      title: "Technical SEO",
      subtitle: "Crawlability & page basics",
      tier: "free",
      issues: [
        {
          id: "no-html",
          title: "No page markup to check",
          severity: "warning",
          description:
            "Canonical tags, image alt text, and load time only exist on a real page. Paste a URL instead of raw text to check these.",
        },
      ],
    };
  }

  const issues: AuditIssue[] = [];

  if (!pageData.canonical) {
    issues.push({
      id: "canonical",
      title: "Canonical tag is missing",
      severity: "critical",
      description:
        "Without a canonical tag, search engines may index a duplicate or parameterized version of this page instead.",
      fixLabel: "Add canonical tag",
    });
  } else {
    issues.push({
      id: "canonical-ok",
      title: "Canonical tag is present",
      severity: "good",
    });
  }

  const missingAlt = pageData.images.filter((img) => !img.alt || img.alt.trim() === "");
  if (pageData.images.length === 0) {
    issues.push({
      id: "alt-text-none",
      title: "No images found on this page",
      severity: "good",
    });
  } else if (missingAlt.length > 0) {
    issues.push({
      id: "alt-text",
      title: `${missingAlt.length} image${missingAlt.length === 1 ? "" : "s"} ${
        missingAlt.length === 1 ? "is" : "are"
      } missing alt text`,
      severity: missingAlt.length > 2 ? "serious" : "warning",
      description:
        "Alt text helps image search, accessibility, and gives AI crawlers more context about the page.",
      fixLabel: "Generate alt text",
    });
  } else {
    issues.push({
      id: "alt-text-ok",
      title: `All ${pageData.images.length} images have alt text`,
      severity: "good",
    });
  }

  if (loadTimeMs !== null) {
    const seconds = (loadTimeMs / 1000).toFixed(1);
    if (loadTimeMs > 4000) {
      issues.push({
        id: "load-time-slow",
        title: `Page loaded in ${seconds}s`,
        severity: "critical",
        description: "Pages over 4s to load lose visitors and can be deprioritized by search crawlers.",
      });
    } else if (loadTimeMs > 2500) {
      issues.push({
        id: "load-time-warning",
        title: `Page loaded in ${seconds}s`,
        severity: "warning",
        description: "Aim for under 2.5s — this is a rough fetch-time measurement, not a full Core Web Vitals audit.",
      });
    } else {
      issues.push({
        id: "load-time-ok",
        title: `Page loaded in ${seconds}s`,
        severity: "good",
      });
    }
  }

  return {
    id: "technical",
    title: "Technical SEO",
    subtitle: "Crawlability & page basics",
    tier: "free",
    issues,
  };
}
