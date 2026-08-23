"use client";

import { useMemo, useState } from "react";
import { AuditResult, Severity } from "@/lib/types";
import { ScoreRing } from "./ScoreRing";
import { CategoryCard } from "./CategoryCard";
import { EvidencePanel } from "./EvidencePanel";

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
}: {
  result: AuditResult;
  onReanalyze?: () => void;
}) {
  const [plan, setPlan] = useState<"free" | "pro">("free");
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
    <div className="max-w-[880px] mx-auto px-5 pt-7 pb-36">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-5.5">
        <div className="flex items-center gap-2 font-bold text-[17px]">
          <span className="w-[26px] h-[26px] rounded-[7px] inline-block bg-gradient-to-br from-[var(--brand)] to-[var(--brand-2)]" />
          Seona
        </div>
        <div className="flex items-center gap-2 border border-[var(--border-strong)] bg-[var(--surface-2)] rounded-full p-1 text-xs font-semibold">
          <button
            onClick={() => setPlan("free")}
            className={`border-none rounded-full px-3.5 py-1.5 cursor-pointer ${
              plan === "free" ? "bg-[var(--text-primary)] text-[var(--surface-1)]" : "bg-transparent text-[var(--text-secondary)]"
            }`}
          >
            Free view
          </button>
          <button
            onClick={() => setPlan("pro")}
            className={`border-none rounded-full px-3.5 py-1.5 cursor-pointer ${
              plan === "pro" ? "bg-[var(--brand)] text-white" : "bg-transparent text-[var(--text-secondary)]"
            }`}
          >
            Pro view
          </button>
        </div>
      </div>

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
          className="bg-[var(--surface-1)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-lg px-3.5 py-2 text-xs font-semibold cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-default"
        >
          Re-analyze
        </button>
      </div>

      {/* Hero score */}
      <div className="flex gap-7 items-center bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl px-6.5 py-6 mb-5.5 flex-wrap shadow-sm">
        <ScoreRing score={result.score} />
        <div className="flex-1 min-w-[240px]">
          <h1 className="text-[16px] font-bold m-0 mb-1.5">{result.headline}</h1>
          <p className="text-[13px] text-[var(--text-secondary)] m-0 mb-3.5 max-w-[46ch]">{result.summary}</p>
          <div className="flex gap-2.5 flex-wrap">
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
      </div>

      <EvidencePanel category={intentCategory} />

      <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mt-6.5 mb-2.5 ml-0.5">
        Free: fix these now
      </div>
      {freeCategories.map((c) => (
        <CategoryCard key={c.id} category={c} plan={plan} onUpgrade={() => setPlan("pro")} />
      ))}

      <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mt-6.5 mb-2.5 ml-0.5">
        Flagged for you: unlock the fix with Pro
      </div>
      {proDiagnosisCategories.map((c) => (
        <CategoryCard key={c.id} category={c} plan={plan} onUpgrade={() => setPlan("pro")} />
      ))}

      <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mt-6.5 mb-2.5 ml-0.5">
        Pro-only: your biggest opportunity
      </div>
      {proLockedCategories.map((c) => (
        <CategoryCard key={c.id} category={c} plan={plan} onUpgrade={() => setPlan("pro")} />
      ))}

      {plan === "free" && (
        <div className="fixed left-0 right-0 bottom-0 flex items-center justify-center gap-4 bg-[var(--text-primary)] text-[var(--surface-1)] px-5 py-3.5 text-[13px] z-20 flex-wrap">
          <span>
            <strong>{lockedCount} fixes</strong> are ready to apply with Pro.
          </span>
          <button
            onClick={() => setPlan("pro")}
            className="bg-[var(--brand)] text-white border-none rounded-lg px-4 py-2.5 text-[12.5px] font-bold cursor-pointer whitespace-nowrap"
          >
            Unlock everything ($19/mo)
          </button>
        </div>
      )}
    </div>
  );
}
