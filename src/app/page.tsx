"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { writeStoredAuditInput } from "@/lib/audit-input-storage";
import { ContentType } from "@/lib/types";

const DEFAULT_INPUT = "yourblog.com/best-running-shoes";

export default function Home() {
  const router = useRouter();
  const [value, setValue] = useState(DEFAULT_INPUT);
  const [keyword, setKeyword] = useState("");
  const [contentType, setContentType] = useState<ContentType>("general");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input = value.trim() || DEFAULT_INPUT;
    writeStoredAuditInput({ input, keyword: keyword.trim() || undefined, contentType });
    router.push("/audit");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-[640px] text-center">
        <div className="flex items-center justify-center gap-2 font-bold text-[17px] mb-8">
          <span className="w-[26px] h-[26px] inline-block bg-[var(--brand)]" />
          Seona
        </div>

        <h1 className="font-serif text-[30px] sm:text-[38px] font-medium leading-tight mb-3">
          Grammarly for SEO and for AI search.
        </h1>
        <p className="text-[15px] text-[var(--text-secondary)] mb-8 max-w-[52ch] mx-auto">
          Paste your content or a URL. Get one plain-English audit covering on-page SEO,
          content quality, search intent, and whether AI Overviews and chat assistants
          will actually cite this page, with one-click fixes instead of just a scorecard.
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-[var(--surface-2)] border border-[var(--border)] p-2 flex flex-col text-left gap-2"
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Paste a URL or your content here..."
              className="w-full sm:flex-1 min-w-0 bg-transparent border-none outline-none px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
            <button
              type="submit"
              className="bg-[var(--brand)] text-white px-5 py-2.5 text-sm font-bold whitespace-nowrap text-center cursor-pointer"
            >
              Run free audit
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border-t border-[var(--border)] pt-2 px-1">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Target keyword (optional, e.g. best running shoes)"
              className="w-full sm:flex-1 min-w-0 bg-transparent border-none outline-none px-2 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value as ContentType)}
              className="bg-[var(--surface-1)] border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] cursor-pointer"
            >
              <option value="general">General audience</option>
              <option value="technical">Technical / B2B</option>
            </select>
          </div>
        </form>

        <p className="text-xs text-[var(--text-muted)] mt-4">
          No signup required for your first audit.
        </p>
      </div>
    </div>
  );
}
