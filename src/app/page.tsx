"use client";

import { useCallback, useState } from "react";
import { EditorView } from "@/components/EditorView";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SerpPreview } from "@/components/SerpPreview";
import { AuditResult, ContentType, PageType } from "@/lib/types";
import { NICHES } from "@/lib/niches";

type Status = "idle" | "loading" | "ready" | "error";

interface AuditRequest {
  input: string;
  keyword?: string;
  contentType: ContentType;
  pageType: PageType;
  seoTitle?: string;
  seoMetaDescription?: string;
  bodyText?: string;
}

async function requestAudit(req: AuditRequest): Promise<AuditResult> {
  const res = await fetch("/api/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
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

const fieldClass =
  "w-full bg-[var(--surface-1)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] outline-none transition-colors duration-150 focus:border-[var(--border-strong)] placeholder:text-[var(--text-muted)]";

export default function Home() {
  const [content, setContent] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [contentType, setContentType] = useState<ContentType>("general");
  const [pageType, setPageType] = useState<PageType>("blog");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoMetaDescription, setSeoMetaDescription] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastInput, setLastInput] = useState("");

  const buildRequest = useCallback(
    (input: string): AuditRequest => ({
      input,
      keyword: keyword.trim() || undefined,
      contentType,
      pageType,
      seoTitle: seoTitle.trim() || undefined,
      seoMetaDescription: seoMetaDescription.trim() || undefined,
    }),
    [keyword, contentType, pageType, seoTitle, seoMetaDescription]
  );

  const runAudit = useCallback(
    (input: string) => {
      setStatus("loading");
      setError(null);
      requestAudit(buildRequest(input))
        .then((r) => {
          setResult(r);
          setLastInput(input);
          setStatus("ready");
          // The server already resolved manual-vs-extracted precedence for
          // us (a typed value comes back unchanged; an empty field comes
          // back as whatever was extracted/suggested from a real page) — so
          // it's always correct to reflect its answer back into the
          // editable fields. Without this, a URL audit's real title/meta/
          // keyword gets used for scoring but never shown to edit.
          setKeyword(r.keyword ?? "");
          setSeoTitle(r.seoTitle ?? "");
          setSeoMetaDescription(r.seoMetaDescription ?? "");
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Couldn't analyze that input.");
          setStatus("error");
        });
    },
    [buildRequest]
  );

  function handleAnalyze() {
    const input = urlInput.trim() || content.trim();
    if (!input) return;
    runAudit(input);
  }

  // For pasted text, the edited canvas text IS the input — there's no
  // separate source to preserve. For a URL/HTML audit, the canvas shows the
  // real crawled body text, but re-submitting it as `input` would make the
  // engine treat it as a fresh block of pasted text and lose the technical
  // checks (canonical, alt text, load time, Open Graph) that only exist for
  // a real fetched page. So the original URL stays as `input` and the edited
  // text rides along as a `bodyText` override instead — same
  // manual-wins-over-extracted precedence already used for title/meta/keyword.
  const editorAnalyze = useCallback(
    (text: string) =>
      requestAudit(
        result?.mode === "text" ? buildRequest(text) : { ...buildRequest(lastInput), bodyText: text }
      ).then((r) => {
        // Same resync as the initial analysis — keeps the fields honest if
        // e.g. the keyword was cleared and rechecked, prompting a fresh
        // suggestion from the title instead.
        setKeyword(r.keyword ?? "");
        setSeoTitle(r.seoTitle ?? "");
        setSeoMetaDescription(r.seoMetaDescription ?? "");
        return r;
      }),
    [buildRequest, lastInput, result]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const canAnalyze = Boolean(content.trim() || urlInput.trim());

  if (status === "ready" && result) {
    return (
      <EditorView
        initialResult={result}
        keyword={keyword}
        contentType={contentType}
        seoTitle={seoTitle}
        seoMetaDescription={seoMetaDescription}
        onKeywordChange={setKeyword}
        onSeoTitleChange={setSeoTitle}
        onSeoMetaDescriptionChange={setSeoMetaDescription}
        onAnalyze={editorAnalyze}
        onHome={reset}
      />
    );
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
            <select
              value={pageType}
              onChange={(e) => setPageType(e.target.value as PageType)}
              className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] cursor-pointer transition-colors duration-150 hover:border-[var(--border-strong)]"
            >
              <option value="blog">Blog post</option>
              <option value="landing">Landing page</option>
              <option value="product">Product page</option>
              <option value="other">Other</option>
            </select>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value as ContentType)}
              className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] cursor-pointer transition-colors duration-150 hover:border-[var(--border-strong)]"
            >
              <optgroup label="General">
                {NICHES.filter((n) => n.group === "General").map((n) => (
                  <option key={n.value} value={n.value}>
                    {n.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Niche">
                {NICHES.filter((n) => n.group === "Niche").map((n) => (
                  <option key={n.value} value={n.value}>
                    {n.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your content here, or start typing your draft..."
            className="flex-1 w-full min-h-[300px] bg-transparent border-none outline-none resize-none text-[15px] leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-muted)] animate-fade-in"
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

        {/* SEO Meta panel */}
        <div className="w-full lg:w-[380px] shrink-0 border-t lg:border-t-0 lg:border-l border-[var(--border)] px-6 py-6 overflow-y-auto">
          {status === "loading" ? (
            <div className="flex flex-col items-center justify-center gap-3 h-full animate-fade-in">
              <span className="w-9 h-9 rounded-full border-[3px] border-[var(--gridline)] border-t-[var(--brand)] animate-spin" />
              <div className="text-sm text-[var(--text-secondary)]">Analyzing…</div>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-[var(--brand-100)] flex items-center justify-center shrink-0">
                  <EmptyStateIcon />
                </div>
                <h2 className="font-display text-[15px] font-extrabold tracking-tight m-0">SEO snippet editor</h2>
              </div>
              <div className="text-[10.5px] font-bold uppercase tracking-wide text-[var(--brand)] mt-1">
                Tuned for {NICHES.find((n) => n.value === contentType)?.label ?? "General / Lifestyle"}
              </div>
              <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed mt-1.5 mb-5">
                Fill these in and hit Analyze — they&rsquo;re checked for length and keyword match just like a real page&rsquo;s title and meta tags.
              </p>

              <label className="block text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5">
                Focus keyword
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. best running shoes"
                className={`${fieldClass} mb-4`}
              />

              <label className="block text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5">
                SEO title
              </label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="What should show up as the headline in Google?"
                className={`${fieldClass} mb-4`}
              />

              <label className="block text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5">
                Meta description
              </label>
              <textarea
                value={seoMetaDescription}
                onChange={(e) => setSeoMetaDescription(e.target.value)}
                placeholder="The snippet Google shows under your title"
                rows={3}
                className={`${fieldClass} mb-5 resize-none`}
              />

              <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5">
                Google preview
              </div>
              <SerpPreview
                title={seoTitle}
                description={seoMetaDescription}
                displayUrl={urlInput.trim() || "yourblog.com › post-title"}
              />
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
