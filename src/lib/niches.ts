import { ContentType } from "./types";

// A single source of truth for the content-niche dropdown (composer UI) and
// the audience-aware copy in the content-quality checks. Grouping is purely
// presentational (rendered as <optgroup>s); the flat NICHES array below is
// what the audit engine and validation actually key off of.
export interface NicheOption {
  value: ContentType;
  label: string;
  group: "General" | "Niche";
}

export const NICHES: NicheOption[] = [
  { value: "general", label: "General / Lifestyle", group: "General" },
  { value: "technical", label: "Technical / SaaS / B2B", group: "General" },
  { value: "ecommerce", label: "E-commerce / Product Reviews", group: "Niche" },
  { value: "health", label: "Health & Wellness", group: "Niche" },
  { value: "finance", label: "Finance & Investing", group: "Niche" },
  { value: "legal", label: "Legal", group: "Niche" },
  { value: "food", label: "Food & Recipes", group: "Niche" },
  { value: "travel", label: "Travel", group: "Niche" },
  { value: "realestate", label: "Real Estate", group: "Niche" },
  { value: "education", label: "Education / How-To", group: "Niche" },
  { value: "parenting", label: "Parenting & Family", group: "Niche" },
  { value: "fitness", label: "Fitness & Sports", group: "Niche" },
  { value: "beauty", label: "Beauty & Fashion", group: "Niche" },
  { value: "home", label: "Home & DIY", group: "Niche" },
  { value: "news", label: "News / Journalism", group: "Niche" },
];

const NICHE_LOOKUP: Record<ContentType, NicheOption> = Object.fromEntries(
  NICHES.map((n) => [n.value, n])
) as Record<ContentType, NicheOption>;

export function nicheLabel(type: ContentType): string {
  return NICHE_LOOKUP[type]?.label ?? "General / Lifestyle";
}

export function isContentType(value: string): value is ContentType {
  return value in NICHE_LOOKUP;
}
