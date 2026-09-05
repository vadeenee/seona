"use client";

import { useMemo, useState } from "react";
import { AuditResult, Severity } from "@/lib/types";
import { ScoreDisplay } from "./ScoreDisplay";
import { CategoryCard } from "./CategoryCard";
import { EvidencePanel } from "./EvidencePanel";
import { Header } from "./Header";
import { SerpPreview } from "./SerpPreview";

const fieldClass =
  "w-full bg-[var(--surface-1)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] outline-none transition-colors duration-150 focus:border-[var(--border-strong)] placeholder:text-[var(--text-muted)]";

function severityCounts(result: AuditResult) {
  const counts: Record<Severity, number> = { critical: 0, serious: 0, warning: 0, good: 0 };
  result.categories.forEach((c) => c.issues.forEach((i) => counts[i.severity]++));
  return counts;
}

const dotColor: Record<Severity, string> = {
  critical: "var(--critical)",
  serious: "var(--serious)",
  warning: "var(--warning)",
  good: "var(--good)",
};

export function AuditView({
  result,
  onReanalyze,
  onRecheckMeta,
  onHome,
}: {
  result: AuditResult;
  onReanalyze?: () => void;
  onRecheckMeta?: (keyword: string, seoTitle: string, seoMetaDescription: string) => void;
  onHome?: () => void;
}) {
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [keywordDraft, setKeywordDraft] = useState(result.keyword ?? "");
  const [titleDraft, setTitleDraft] = useState(result.seoTitle ?? "");
  const [descDraft, setDescDraft] = useState(result.seoMetaDescription ?? "");
  // Tracks the result a fresh analysis last echoed back, so a genuinely new
  // result (including one triggered by this editor's own "Apply & Recheck")
  // can re-sync the drafts during render rather than in an effect — safe to
  // overwrite here since the server echoes back exactly what was submitted.
  const [syncedResult, setSyncedResult] = useState(result);
  if (result !== syncedResult) {
    setSyncedResult(result);
    setKeywordDraft(result.keyword ?? "");
    setTitleDraft(result.seoTitle ?? "");
    setDescDraft(result.seoMetaDescription ?? "");
  }

  const counts = useMemo(() => severityCounts(result), [result]);
  const lockedCount = useMemo(
    () =>
      result.categories
        .filter((c) => c.tier !== "free")
        .reduce((sum, c) => sum + c.issues.length, 0),
    [result]
  );

  const freeCategories = result.categories.filter((c) => c.tier === "free");
  const intentCategory = result.categories.find((c) => c.id === "intent-coverage");
  const proDiagnosisCategories = result.categories.filter(
    (c) => c.tier === "diagnosis-free" && c.id !== "intent-coverage"
  );
  const proLockedCategories = result.categories.filter((c) => c.tier === "pro-locked");

  return (
    <div className="max-w-[1200px] mx-auto px-5 pt-7 pb-36 animate-fade-in">
      <Header
        onLogoClick={onHome}
        right={
          <div className="flex items-center gap-2 border border-[var(--border-strong)] bg-[var(--surface-2)] rounded-full p-1 text-xs font-semibold">
            <button
              onClick={() => setPlan("free")}
              className={`border-none rounded-full px-3.5 py-1.5 cursor-pointer transition-colors duration-200 ${
                plan === "free" ? "bg-[var(--text-primary)] text-[var(--surface-1)]" : "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Free view
            </button>
            <button
              onClick={() => setPlan("pro")}
              className={`border-none rounded-full px-3.5 py-1.5 cursor-pointer transition-colors duration-200 ${
                plan === "pro" ? "bg-gradient-to-br from-[var(--brand)] to-[var(--brand-2)] text-white" : "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Pro view
            </button>
          </div>
        }
      />

      {/* Input bar */}
      <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl px-4 py-3.5 flex items-center gap-3 mb-5.5 shadow-sm">
        <div className="flex-1 text-[13.5px] text-[var(--text-secondary)] flex items-center gap-2 overflow-hidden">
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="shrink-0 text-[var(--text-muted)]">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span className="whitespace-nowrap overflow-hidden text-ellipsis">
            Analyzed: {result.url}
          </span>
        </div>
        <button
          onClick={onReanalyze}
          disabled={!onReanalyze}
          className="bg-[var(--surface-1)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-lg px-3.5 py-2 text-xs font-semibold cursor-pointer whitespace-nowrap transition-all duration-200 hover:border-[var(--border-strong)] hover:shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-default disabled:active:scale-100"
        >
          Re-analyze
        </button>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row items-start">
        {/* Main column */}
        <div className="flex-1 min-w-0 w-full">
          <EvidencePanel category={intentCategory} />

          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mt-6.5 mb-2.5 ml-0.5">
            Free: fix these now
          </div>
          {freeCategories.map((c, i) => (
            <CategoryCard key={c.id} category={c} plan={plan} onUpgrade={() => setPlan("pro")} index={i} />
          ))}

          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mt-6.5 mb-2.5 ml-0.5">
            Flagged for you: unlock the fix with Pro
          </div>
          {proDiagnosisCategories.map((c, i) => (
            <CategoryCard key={c.id} category={c} plan={plan} onUpgrade={() => setPlan("pro")} index={i} />
          ))}

          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mt-6.5 mb-2.5 ml-0.5">
            Pro-only: your biggest opportunity
          </div>
          {proLockedCategories.map((c, i) => (
            <CategoryCard key={c.id} category={c} plan={plan} onUpgrade={() => setPlan("pro")} index={i} />
          ))}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-[340px] shrink-0 lg:sticky lg:top-7">
          <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl px-6 py-6 shadow-sm">
            <ScoreDisplay score={result.score} />
            <h1 className="font-display text-[17px] font-extrabold tracking-tight m-0 mt-4 mb-1.5 leading-snug">{result.headline}</h1>
            <p className="text-[12.5px] text-[var(--text-secondary)] m-0 mb-4 leading-relaxed">{result.summary}</p>
            <div className="flex gap-2 flex-wrap">
              {(["critical", "serious", "warning", "good"] as Severity[]).map((s) => (
                <div
                  key={s}
                  className="flex items-center gap-1.5 border border-[var(--border)] rounded-[10px] px-2.5 py-1.5 text-xs font-semibold bg-[var(--surface-1)]"
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dotColor[s] }} />
                  <span>{counts[s]}</span>
                  <span className="text-[var(--text-muted)] font-medium capitalize">
                    {s === "good" ? "Passing" : s}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {onRecheckMeta && (
            <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl px-6 py-6 shadow-sm mt-4">
              <h3 className="font-display text-[14px] font-extrabold tracking-tight m-0 mb-3">SEO snippet editor</h3>

              <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5">
                Focus keyword
                {result.keywordIsSuggested && keywordDraft === (result.keyword ?? "") && (
                  <span className="normal-case font-semibold text-[10px] px-1.5 py-px rounded-full bg-[var(--brand-100)] text-[var(--brand)] tracking-normal">
                    suggested from title
                  </span>
                )}
              </label>
              <input
                type="text"
                value={keywordDraft}
                onChange={(e) => setKeywordDraft(e.target.value)}
                placeholder="e.g. best running shoes"
                className={`${fieldClass} mb-3`}
              />

              <label className="block text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5">
                SEO title
              </label>
              <input
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                className={`${fieldClass} mb-3`}
              />

              <label className="block text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5">
                Meta description
              </label>
              <textarea
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                rows={3}
                className={`${fieldClass} mb-4 resize-none`}
              />

              <SerpPreview title={titleDraft} description={descDraft} displayUrl={result.url} />

              <button
                onClick={() => onRecheckMeta(keywordDraft, titleDraft, descDraft)}
                disabled={
                  keywordDraft === (result.keyword ?? "") &&
                  titleDraft === (result.seoTitle ?? "") &&
                  descDraft === (result.seoMetaDescription ?? "")
                }
                className="w-full mt-4 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-2)] text-white border-none rounded-lg px-4 py-2.5 text-[12.5px] font-bold cursor-pointer transition-all duration-200 ease-out hover:shadow-[0_4px_14px_-2px_var(--brand)] hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0 disabled:shadow-none"
              >
                Apply &amp; recheck
              </button>
            </div>
          )}
        </div>
      </div>

      {plan === "free" && (
        <div className="fixed left-0 right-0 bottom-0 flex items-center justify-center gap-4 bg-[var(--text-primary)] text-[var(--surface-1)] px-5 py-3.5 text-[13px] z-20 flex-wrap shadow-[0_-8px_24px_rgba(0,0,0,0.12)]">
          <span>
            <strong>{lockedCount} fixes</strong> are ready to apply with Pro.
          </span>
          <button
            onClick={() => setPlan("pro")}
            className="bg-gradient-to-br from-[var(--brand)] to-[var(--brand-2)] text-white border-none rounded-lg px-4 py-2.5 text-[12.5px] font-bold cursor-pointer whitespace-nowrap transition-all duration-200 ease-out hover:shadow-[0_4px_14px_-2px_var(--brand)] hover:-translate-y-px active:translate-y-0"
          >
            Unlock everything ($19/mo)
          </button>
        </div>
      )}
    </div>
  );
}
