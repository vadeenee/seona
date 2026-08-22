import { ContentType } from "./types";

export const AUDIT_INPUT_STORAGE_KEY = "seona:audit-input";

export interface StoredAuditInput {
  input: string;
  keyword?: string;
  contentType: ContentType;
}

export function readStoredAuditInput(): StoredAuditInput | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(AUDIT_INPUT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.input !== "string" || !parsed.input) return null;
    return {
      input: parsed.input,
      keyword: typeof parsed.keyword === "string" && parsed.keyword ? parsed.keyword : undefined,
      contentType: parsed.contentType === "technical" ? "technical" : "general",
    };
  } catch {
    return null;
  }
}

export function writeStoredAuditInput(value: StoredAuditInput) {
  sessionStorage.setItem(AUDIT_INPUT_STORAGE_KEY, JSON.stringify(value));
}
