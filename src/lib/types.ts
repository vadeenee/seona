export type Severity = "critical" | "serious" | "warning" | "good";

export type Tier =
  | "free" // fully free, fully fixable
  | "diagnosis-free" // diagnosis visible free, fix requires pro
  | "pro-locked"; // entire category locked on free plan

export interface TextRange {
  start: number; // character offset into AuditResult.analyzedText
  end: number;
}

export interface EvidenceSource {
  domain: string;
  title: string;
  url: string;
}

export interface AuditIssue {
  id: string;
  title: string;
  severity: Severity;
  description?: string;
  fixLabel?: string; // label for the "Fix" / "Unlock fix" action
  highlights?: TextRange[]; // sentence(s) in analyzedText this issue points at
  evidence?: EvidenceSource[]; // real ranking pages backing this issue, if any
}

export interface AuditCategory {
  id: string;
  title: string;
  subtitle: string;
  tier: Tier;
  issues: AuditIssue[];
}

export type InputMode = "url" | "html" | "text";
export type ContentType =
  | "general"
  | "technical"
  | "ecommerce"
  | "health"
  | "finance"
  | "legal"
  | "food"
  | "travel"
  | "realestate"
  | "education"
  | "parenting"
  | "fitness"
  | "beauty"
  | "home"
  | "news";
export type PageType = "blog" | "landing" | "product" | "other";

export interface AuditResult {
  url: string;
  score: number; // 0-100
  headline: string;
  summary: string;
  categories: AuditCategory[];
  mode: InputMode;
  analyzedText: string; // whitespace-normalized text the content checks ran on
  seoTitle: string | null; // the title actually used for the checks (extracted or manually authored)
  seoMetaDescription: string | null;
  keyword: string | null; // the focus keyword actually used for the checks — typed, or suggested from the title
  keywordIsSuggested: boolean; // true when `keyword` was auto-suggested rather than typed in
}
