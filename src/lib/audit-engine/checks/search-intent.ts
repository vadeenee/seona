import { AuditCategory, AuditIssue } from "@/lib/types";
import { fetchSerpResults, isCompetitorResearchConfigured, SerpOrganicResult } from "../dataforseo";

const CATEGORY_SHELL = {
  id: "intent-coverage",
  title: "Search Intent & Topical Coverage",
  subtitle: "Vs. the top 10 ranking pages",
  tier: "diagnosis-free" as const,
};

// Cheap, defensible signal for "this ranking page is a categorized listicle"
// No LLM needed. Real competitor titles are checked against this, not
// guessed at.
function looksLikeListicle(title: string): boolean {
  return /^\d+\b/.test(title.trim()) || /\bbest\b/i.test(title) || /\btop\s*\d+\b/i.test(title);
}

function withoutKeyword(): AuditCategory {
  return {
    ...CATEGORY_SHELL,
    issues: [
      {
        id: "intent-no-keyword",
        title: "Add a target keyword to unlock real competitor research",
        severity: "warning",
        description:
          "This category checks live Google results for your target keyword against your content. Add a keyword on the home page to run it for real instead of seeing an example.",
      },
    ],
  };
}

function unconfigured(keyword: string): AuditCategory {
  return {
    ...CATEGORY_SHELL,
    issues: [
      {
        id: "intent-unconfigured",
        title: `Competitor research for "${keyword}" isn't connected yet`,
        severity: "warning",
        description: "This needs a DataForSEO connection on the server. Ask whoever runs this site to finish that setup.",
      },
    ],
  };
}

function lookupFailed(keyword: string, message: string): AuditCategory {
  return {
    ...CATEGORY_SHELL,
    issues: [
      {
        id: "intent-lookup-failed",
        title: `Couldn't fetch live results for "${keyword}"`,
        severity: "warning",
        description: message,
      },
    ],
  };
}

function toEvidence(results: SerpOrganicResult[]): AuditIssue["evidence"] {
  return results.slice(0, 5).map((r) => ({ domain: r.domain, title: r.title, url: r.url }));
}

function buildFromResults(keyword: string, ownTitle: string | undefined, results: SerpOrganicResult[]): AuditCategory {
  const issues: AuditIssue[] = [];

  if (results.length === 0) {
    issues.push({
      id: "intent-no-results",
      title: `No organic results came back for "${keyword}"`,
      severity: "warning",
      description: "Double check the keyword is realistic. Very obscure or malformed queries can return nothing.",
    });
    return { ...CATEGORY_SHELL, issues };
  }

  const listicleCount = results.filter((r) => looksLikeListicle(r.title)).length;
  const listicleMajority = listicleCount / results.length >= 0.5;
  const ownIsListicle = ownTitle ? looksLikeListicle(ownTitle) : false;
  const evidence = toEvidence(results);

  if (listicleMajority && !ownIsListicle) {
    issues.push({
      id: "intent-format-mismatch",
      title: `${listicleCount} of ${results.length} top-ranking pages for "${keyword}" use a "best of" format; yours doesn't`,
      severity: "critical",
      description:
        "Pages structured as a categorized list (best overall, best budget, etc.) are dominating this result. Matching that structure is the single highest-leverage change available for this keyword.",
      fixLabel: "Restructure as a listicle",
      evidence,
    });
  } else if (listicleMajority && ownIsListicle) {
    issues.push({
      id: "intent-format-ok",
      title: `Your content's format matches what's actually ranking for "${keyword}"`,
      severity: "good",
      description: `${listicleCount} of ${results.length} top-ranking pages use the same "best of" structure yours does.`,
      evidence,
    });
  } else {
    issues.push({
      id: "intent-format-mixed",
      title: `No single dominant format among top-ranking pages for "${keyword}"`,
      severity: "good",
      description: "Competitors are split across formats here, so format alone isn't the deciding factor for this keyword.",
      evidence,
    });
  }

  return { ...CATEGORY_SHELL, issues };
}

export async function buildSearchIntentCategory(
  keyword: string | undefined,
  ownTitle: string | undefined
): Promise<AuditCategory> {
  const trimmedKeyword = keyword?.trim();
  if (!trimmedKeyword) return withoutKeyword();
  if (!isCompetitorResearchConfigured()) return unconfigured(trimmedKeyword);

  try {
    const { results } = await fetchSerpResults(trimmedKeyword);
    return buildFromResults(trimmedKeyword, ownTitle, results);
  } catch (err) {
    return lookupFailed(trimmedKeyword, err instanceof Error ? err.message : "That lookup failed.");
  }
}
