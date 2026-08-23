"use client";

import { useMemo, useState } from "react";
import { AuditIssue, AuditResult, ContentType, Severity } from "@/lib/types";
import { ScoreDisplay } from "./ScoreDisplay";
import { CategoryCard } from "./CategoryCard";
import { Header } from "./Header";

const dotColor: Record<Severity, string> = {
  critical: "var(--critical)",
  serious: "var(--serious)",
  warning: "var(--warning)",
  good: "var(--good)",
};

function severityCounts(result: AuditResult) {
  const counts: Record<Severity, number> = { critical: 0, serious: 0, warning: 0, good: 0 };
  result.categories.forEach((c) => c.issues.forEach((i) => counts[i.severity]++));
  return counts;
}

const SEVERITY_RANK: Record<Severity, number> = { critical: 3, serious: 2, warning: 1, good: 0 };

interface Mark {
  start: number;
  end: number;
  severity: Severity;
  issues: Pick<AuditIssue, "title" | "description" | "fixLabel">[];
}

function buildMarks(result: AuditResult): Mark[] {
  const contentQuality = result.categories.find((c) => c.id === "content-quality");
  if (!contentQuality) return [];

  const byRange = new Map<string, Mark>();
  for (const issue of contentQuality.issues) {
    if (!issue.highlights) continue;
    for (const range of issue.highlights) {
      const key = `${range.start}-${range.end}`;
      const existing = byRange.get(key);
      if (existing) {
        existing.issues.push(issue);
        if (SEVERITY_RANK[issue.severity] > SEVERITY_RANK[existing.severity]) {
          existing.severity = issue.severity;
        }
      } else {
        byRange.set(key, { start: range.start, end: range.end, severity: issue.severity, issues: [issue] });
      }
    }
  }
  return [...byRange.values()].sort((a, b) => a.start - b.start);
}

interface PopoverState {
  key: string;
  x: number;
  y: number;
  issues: Pick<AuditIssue, "title" | "description" | "fixLabel">[];
}

export function EditorView({
  initialResult,
  keyword,
  contentType,
  onAnalyze,
  onHome,
}: {
  initialResult: AuditResult;
  keyword?: string;
  contentType: ContentType;
  onAnalyze: (text: string) => Promise<AuditResult>;
  onHome?: () => void;
}) {
  const [result, setResult] = useState(initialResult);
  const [text, setText] = useState(initialResult.analyzedText);
  const [viewMode, setViewMode] = useState<"reviewed" | "editing">("reviewed");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [popover, setPopover] = useState<PopoverState | null>(null);

  const counts = useMemo(() => severityCounts(result), [result]);
  const marks = useMemo(() => buildMarks(result), [result]);
  const lockedCount = useMemo(
    () =>
      result.categories
        .filter((c) => c.tier !== "free")
        .reduce((sum, c) => sum + c.issues.length, 0),
    [result]
  );

  async function handleAnalyze() {
    setStatus("loading");
    setError(null);
    setPopover(null);
    try {
      const next = await onAnalyze(text);
      setResult(next);
      setText(next.analyzedText);
      setViewMode("reviewed");
      setStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't analyze that text.");
      setStatus("error");
    }
  }

  function handleMarkClick(e: React.MouseEvent, mark: Mark, key: string) {
    e.stopPropagation();
    if (popover?.key === key) {
      setPopover(null);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopover({ key, x: rect.left, y: rect.bottom + 6, issues: mark.issues });
  }

  const reviewNodes: React.ReactNode[] = [];
  let cursor = 0;
  marks.forEach((mark, i) => {
    if (mark.start > cursor) reviewNodes.push(<span key={`t-${i}`}>{text.slice(cursor, mark.start)}</span>);
    const key = `${mark.start}-${mark.end}`;
    reviewNodes.push(
      <mark
        key={`m-${i}`}
        onClick={(e) => handleMarkClick(e, mark, key)}
        className="cursor-pointer rounded-[3px] px-0.5 py-px"
        style={{
          background: `color-mix(in srgb, ${dotColor[mark.severity]} 28%, transparent)`,
          borderBottom: `2px solid ${dotColor[mark.severity]}`,
        }}
      >
        {text.slice(mark.start, mark.end)}
      </mark>
    );
    cursor = mark.end;
  });
  if (cursor < text.length) reviewNodes.push(<span key="t-last">{text.slice(cursor)}</span>);

  return (
    <div className="min-h-screen" onClick={() => setPopover(null)}>
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

        <div className="flex gap-6 flex-col lg:flex-row items-start">
          {/* Editor panel */}
          <div className="flex-1 min-w-0 w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-[18px] py-[15px] border-b border-[var(--gridline)]">
              <div className="text-[13.5px] text-[var(--text-secondary)] flex items-center gap-2">
                <span>Editing: Pasted content</span>
                {keyword && (
                  <span className="text-[10.5px] font-bold uppercase tracking-wide px-2 py-[3px] rounded-full border border-[var(--border-strong)] text-[var(--text-secondary)]">
                    Keyword: {keyword}
                  </span>
                )}
                <span className="text-[10.5px] font-bold uppercase tracking-wide px-2 py-[3px] rounded-full border border-[var(--border-strong)] text-[var(--text-secondary)]">
                  {contentType === "technical" ? "Technical / B2B" : "General audience"}
                </span>
              </div>
              {viewMode === "reviewed" ? (
                <button
                  onClick={() => setViewMode("editing")}
                  className="bg-[var(--surface-1)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-lg px-3.5 py-2 text-xs font-semibold cursor-pointer whitespace-nowrap transition-all duration-200 hover:shadow-sm active:scale-[0.98]"
                >
                  Edit text
                </button>
              ) : (
                <button
                  onClick={handleAnalyze}
                  disabled={status === "loading"}
                  className="bg-gradient-to-br from-[var(--brand)] to-[var(--brand-2)] text-white border-none rounded-lg px-3.5 py-2 text-xs font-bold cursor-pointer whitespace-nowrap transition-all duration-200 ease-out hover:shadow-[0_4px_14px_-2px_var(--brand)] hover:-translate-y-px active:translate-y-0 disabled:opacity-60 disabled:pointer-events-none disabled:translate-y-0 disabled:shadow-none"
                >
                  {status === "loading" ? "Analyzing…" : "Analyze"}
                </button>
              )}
            </div>

            {error && (
              <div className="px-[18px] pt-3 text-xs text-[var(--critical)]">{error}</div>
            )}

            <div className="px-[18px] py-4">
              {viewMode === "editing" ? (
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={18}
                  className="w-full bg-transparent border-none outline-none resize-y rounded-lg text-[14px] leading-relaxed text-[var(--text-primary)]"
                />
              ) : (
                <div className="text-[14px] leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap">
                  {reviewNodes}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-[380px] shrink-0 lg:sticky lg:top-7">
            <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl px-5 py-5 mb-4 shadow-sm">
              <ScoreDisplay score={result.score} />
              <div className="mt-4">
                <h1 className="font-display text-[16px] font-extrabold tracking-tight m-0 mb-1">{result.headline}</h1>
                <p className="text-[12px] text-[var(--text-secondary)] m-0 mb-3 max-w-[40ch]">{result.summary}</p>
                <div className="flex gap-2 flex-wrap">
                  {(["critical", "serious", "warning", "good"] as Severity[]).map((s) => (
                    <div
                      key={s}
                      className="flex items-center gap-1.5 border border-[var(--border)] rounded-[8px] px-2 py-1 text-[11px] font-semibold bg-[var(--surface-1)]"
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dotColor[s] }} />
                      <span>{counts[s]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {result.categories.map((c, i) => (
              <CategoryCard key={c.id} category={c} plan={plan} onUpgrade={() => setPlan("pro")} index={i} />
            ))}
          </div>
        </div>
      </div>

      {popover && (
        <div
          className="fixed z-30 bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-xl shadow-lg p-3.5 w-[280px] text-left animate-fade-in"
          style={{ left: popover.x, top: popover.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {popover.issues.map((issue, i) => (
            <div key={i} className={i > 0 ? "mt-3 pt-3 border-t border-[var(--gridline)]" : ""}>
              <div className="text-[12.5px] font-bold mb-1">{issue.title}</div>
              {issue.description && (
                <p className="text-[11.5px] text-[var(--text-secondary)] leading-relaxed m-0">{issue.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

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
