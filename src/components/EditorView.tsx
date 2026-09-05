"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AuditIssue, AuditResult, ContentType, Severity } from "@/lib/types";
import { nicheLabel } from "@/lib/niches";
import { ScoreDisplay } from "./ScoreDisplay";
import { CategoryCard } from "./CategoryCard";
import { Header } from "./Header";
import { SerpPreview } from "./SerpPreview";

const fieldClass =
  "w-full bg-[var(--surface-1)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] outline-none transition-colors duration-150 focus:border-[var(--border-strong)] placeholder:text-[var(--text-muted)]";

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

// Highlights come at different granularities — whole-sentence spans (long
// sentences, passive voice) and single-word spans nested inside them
// (adverbs, filler words, repeats) — so they routinely overlap. Rendering
// each raw range as its own <mark> would slice the same characters into the
// output twice wherever a word-level range sits inside a sentence-level one.
// Sorting by start and merging anything that overlaps or touches the
// previous mark keeps the final set non-overlapping, so the render pass can
// walk it with a single moving cursor.
function buildMarks(result: AuditResult): Mark[] {
  const contentQuality = result.categories.find((c) => c.id === "content-quality");
  if (!contentQuality) return [];

  interface RawMark {
    start: number;
    end: number;
    severity: Severity;
    issue: Pick<AuditIssue, "title" | "description" | "fixLabel">;
  }
  const raw: RawMark[] = [];
  for (const issue of contentQuality.issues) {
    if (!issue.highlights) continue;
    for (const range of issue.highlights) {
      raw.push({ start: range.start, end: range.end, severity: issue.severity, issue });
    }
  }
  raw.sort((a, b) => a.start - b.start || a.end - b.end);

  const merged: Mark[] = [];
  for (const r of raw) {
    const last = merged[merged.length - 1];
    if (last && r.start <= last.end) {
      last.end = Math.max(last.end, r.end);
      if (SEVERITY_RANK[r.severity] > SEVERITY_RANK[last.severity]) last.severity = r.severity;
      if (!last.issues.some((i) => i.title === r.issue.title)) last.issues.push(r.issue);
    } else {
      merged.push({ start: r.start, end: r.end, severity: r.severity, issues: [r.issue] });
    }
  }
  return merged;
}

interface PopoverState {
  key: string;
  x: number;
  y: number;
  range: { start: number; end: number };
  issues: Pick<AuditIssue, "title" | "description" | "fixLabel">[];
}

export function EditorView({
  initialResult,
  keyword,
  contentType,
  seoTitle,
  seoMetaDescription,
  onKeywordChange,
  onSeoTitleChange,
  onSeoMetaDescriptionChange,
  onAnalyze,
  onHome,
}: {
  initialResult: AuditResult;
  keyword: string;
  contentType: ContentType;
  seoTitle: string;
  seoMetaDescription: string;
  onKeywordChange: (value: string) => void;
  onSeoTitleChange: (value: string) => void;
  onSeoMetaDescriptionChange: (value: string) => void;
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingSelectionRef = useRef<{ start: number; end: number } | null>(null);

  // The textarea only exists in the DOM once viewMode flips to "editing" —
  // applying the selection has to wait for that render to actually commit,
  // which a requestAnimationFrame right after setViewMode can race with.
  useEffect(() => {
    if (viewMode !== "editing" || !pendingSelectionRef.current) return;
    const range = pendingSelectionRef.current;
    pendingSelectionRef.current = null;
    const ta = textareaRef.current;
    if (ta) {
      ta.focus();
      ta.setSelectionRange(range.start, range.end);
    }
  }, [viewMode]);

  const counts = useMemo(() => severityCounts(result), [result]);
  const marks = useMemo(() => buildMarks(result), [result]);
  // For a URL/HTML audit, the canvas below shows the real crawled body text
  // — editable, same as pasted text — so the header should say what was
  // actually analyzed instead of a generic "Editing" label.
  const sourceLabel = result.mode === "text" ? "Editing: Pasted content" : `Analyzed: ${result.url}`;
  const crawled = result.mode !== "text";
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
    setPopover({
      key,
      x: rect.left,
      y: rect.bottom + 6,
      range: { start: mark.start, end: mark.end },
      issues: mark.issues,
    });
  }

  // The real fix for a writing-quality issue (long sentence, passive voice,
  // repeated word) is rewriting that exact text — there's no one-click
  // automated fix to fake. This jumps straight into edit mode with the
  // flagged span selected, instead of leaving the popover as a dead end.
  function handleFixHere(range: { start: number; end: number }) {
    setPopover(null);
    pendingSelectionRef.current = range;
    setViewMode("editing");
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
            <div className="flex items-center justify-between flex-wrap gap-2 px-[18px] py-[15px] border-b border-[var(--gridline)]">
              <div className="text-[13.5px] text-[var(--text-secondary)] flex items-center flex-wrap gap-2 min-w-0">
                <span className="truncate max-w-[220px]">{sourceLabel}</span>
                {crawled && (
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-[var(--brand)] hover:underline whitespace-nowrap shrink-0"
                  >
                    View live page ↗
                  </a>
                )}
                {keyword && (
                  <span className="text-[10.5px] font-bold uppercase tracking-wide px-2 py-[3px] rounded-full border border-[var(--border-strong)] text-[var(--text-secondary)]">
                    Keyword: {keyword}
                  </span>
                )}
                <span className="text-[10.5px] font-bold uppercase tracking-wide px-2 py-[3px] rounded-full border border-[var(--border-strong)] text-[var(--text-secondary)]">
                  {nicheLabel(contentType)}
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
                  ref={textareaRef}
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

            <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl px-5 py-5 mb-4 shadow-sm">
              <h3 className="font-display text-[14px] font-extrabold tracking-tight m-0 mb-3">SEO snippet editor</h3>

              <label className="block text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5">
                Focus keyword
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => onKeywordChange(e.target.value)}
                placeholder="e.g. best running shoes"
                className={`${fieldClass} mb-1`}
              />
              <p className="text-[10.5px] text-[var(--warning)] mt-0 mb-2 min-h-[13px]">
                {crawled && !keyword && "Couldn’t find a clear topic on this page to suggest one — type your target keyword."}
              </p>

              <label className="block text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5">
                SEO title
              </label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => onSeoTitleChange(e.target.value)}
                placeholder="What should show up as the headline in Google?"
                className={`${fieldClass} mb-1`}
              />
              <p className="text-[10.5px] text-[var(--warning)] mt-0 mb-2 min-h-[13px]">
                {crawled && !seoTitle && "No <title> tag found on this page — type one to get started."}
              </p>

              <label className="block text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5">
                Meta description
              </label>
              <textarea
                value={seoMetaDescription}
                onChange={(e) => onSeoMetaDescriptionChange(e.target.value)}
                placeholder="The snippet Google shows under your title"
                rows={3}
                className={`${fieldClass} mb-1 resize-none`}
              />
              <p className="text-[10.5px] text-[var(--warning)] mt-0 mb-3 min-h-[13px]">
                {crawled && !seoMetaDescription && "No meta description found on this page — type one to get started."}
              </p>

              <SerpPreview
                title={seoTitle}
                description={seoMetaDescription}
                displayUrl={crawled ? result.url : "yourblog.com › post-title"}
              />
              <p className="text-[10.5px] text-[var(--text-muted)] mt-2 mb-0">
                Edit these, then hit Analyze to recheck.
              </p>
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
          <button
            onClick={() => handleFixHere(popover.range)}
            className="w-full mt-3 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-2)] text-white border-none rounded-lg px-3 py-2 text-[12px] font-bold cursor-pointer transition-all duration-200 ease-out hover:shadow-[0_4px_14px_-2px_var(--brand)] active:translate-y-px"
          >
            Fix this text →
          </button>
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
