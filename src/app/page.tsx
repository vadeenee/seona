"use client";

import { useCallback, useState } from "react";
import { AuditView } from "@/components/AuditView";
import { EditorView } from "@/components/EditorView";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuditResult, ContentType } from "@/lib/types";

type Status = "idle" | "loading" | "ready" | "error";

async function requestAudit(input: string, keyword?: string, contentType?: ContentType): Promise<AuditResult> {
  const res = await fetch("/api/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input, keyword, contentType }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Couldn't analyze that input.");
  return data as AuditResult;
}

function EmptyStateIcon() {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth={1.8}>
      <path d="M9 2h6l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
      <path d="M14 2v5h5" />
      <path d="M8 13h8M8 17h5" strokeLinecap="round" />
    </svg>
  );
}

export default function Home() {
  const [content, setContent] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [contentType, setContentType] = useState<ContentType>("general");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastInput, setLastInput] = useState("");

  const runAudit = useCallback(
    (input: string) => {
      setStatus("loading");
      setError(null);
      requestAudit(input, keyword.trim() || undefined, contentType)
        .then((r) => {
          setResult(r);
          setLastInput(input);
          setStatus("ready");
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Couldn't analyze that input.");
          setStatus("error");
        });
    },
    [keyword, contentType]
  );

  function handleAnalyze() {
    const input = urlInput.trim() || content.trim();
    if (!input) return;
    runAudit(input);
  }

  const editorAnalyze = useCallback(
    (text: string) => requestAudit(text, keyword.trim() || undefined, contentType),
    [keyword, contentType]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const canAnalyze = Boolean(content.trim() || urlInput.trim());

  if (status === "ready" && result) {
    if (result.mode === "text") {
      return (
        <EditorView
          initialResult={result}
          keyword={keyword.trim() || undefined}
          contentType={contentType}
          onAnalyze={editorAnalyze}
          onHome={reset}
        />
      );
    }
    return <AuditView result={result} onReanalyze={() => runAudit(lastInput)} onHome={reset} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="px-6 pt-5">
        <Header />
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Canvas */}
        <div className="flex-1 min-w-0 flex flex-col px-6 pb-6">
          <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-[var(--border)] mb-4 animate-fade-in">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Or paste a URL instead..."
              className="flex-1 min-w-[200px] bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] outline-none transition-colors duration-150 focus:border-[var(--border-strong)] placeholder:text-[var(--text-muted)]"
            />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Target keyword (optional)"
              className="flex-1 min-w-[180px] bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] outline-none transition-colors duration-150 focus:border-[var(--border-strong)] placeholder:text-[var(--text-muted)]"
            />
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value as ContentType)}
              className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] cursor-pointer transition-colors duration-150 hover:border-[var(--border-strong)]"
            >
              <option value="general">General audience</option>
              <option value="technical">Technical / B2B</option>
            </select>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your content here, or start typing your draft..."
            className="flex-1 w-full min-h-[360px] bg-transparent border-none outline-none resize-none text-[15px] leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-muted)] animate-fade-in"
          />

          {error && <div className="text-xs text-[var(--critical)] mb-3 animate-fade-in">{error}</div>}

          <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
            <span className="text-xs text-[var(--text-muted)]">{wordCount} words</span>
            <button
              onClick={handleAnalyze}
              disabled={status === "loading" || !canAnalyze}
              className="bg-gradient-to-br from-[var(--brand)] to-[var(--brand-2)] text-white rounded-lg px-5 py-2.5 text-sm font-bold cursor-pointer transition-all duration-200 ease-out hover:shadow-[0_6px_18px_-4px_var(--brand)] hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0 disabled:shadow-none"
            >
              {status === "loading" ? "Analyzing…" : "Analyze"}
            </button>
          </div>
        </div>

        {/* Results panel */}
        <div className="w-full lg:w-[400px] shrink-0 border-t lg:border-t-0 lg:border-l border-[var(--border)] px-6 py-10 flex flex-col items-center justify-center text-center">
          {status === "loading" ? (
            <div className="flex flex-col items-center gap-3 animate-fade-in">
              <span className="w-9 h-9 rounded-full border-[3px] border-[var(--gridline)] border-t-[var(--brand)] animate-spin" />
              <div className="text-sm text-[var(--text-secondary)]">Analyzing…</div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 max-w-[260px] animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-[var(--brand-100)] flex items-center justify-center">
                <EmptyStateIcon />
              </div>
              <h2 className="font-display text-[16px] font-extrabold tracking-tight m-0">Nothing to show yet</h2>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed m-0">
                Paste your content or a URL, then hit Analyze to see your SEO and AI-search audit here.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="px-6">
        <Footer />
      </div>
    </div>
  );
}
