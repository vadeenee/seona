export type Severity = "critical" | "serious" | "warning" | "good";

export type Tier =
  | "free" // fully free, fully fixable
  | "diagnosis-free" // diagnosis visible free, fix requires pro
  | "pro-locked"; // entire category locked on free plan

export interface AuditIssue {
  id: string;
  title: string;
  severity: Severity;
  description?: string;
  fixLabel?: string; // label for the "Fix" / "Unlock fix" action
}

export interface AuditCategory {
  id: string;
  title: string;
  subtitle: string;
  tier: Tier;
  issues: AuditIssue[];
}

export interface AuditResult {
  url: string;
  score: number; // 0-100
  headline: string;
  summary: string;
  categories: AuditCategory[];
}
