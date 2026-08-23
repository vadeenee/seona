"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { writeStoredAuditInput } from "@/lib/audit-input-storage";
import { ContentType } from "@/lib/types";
import { Footer } from "@/components/Footer";

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
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-16">
      <div className="w-full max-w-[640px] text-center animate-fade-in">
        <div className="flex items-center justify-center gap-2 font-bold text-[17px] mb-8">
          <span className="w-[26px] h-[26px] rounded-[7px] inline-block bg-gradient-to-br from-[var(--brand)] to-[var(--brand-2)]" />
          Seona
        </div>

        <h1 className="text-[30px] sm:text-[38px] font-extrabold leading-tight mb-3 tracking-tight">
          Optimize your content for AI Overviews and search.
        </h1>
        <p className="text-[15px] text-[var(--text-secondary)] mb-8 max-w-[52ch] mx-auto">
          Paste a URL or your draft. Get one plain-English audit covering on-page SEO,
          content quality, and whether AI Overviews and chat assistants will actually cite
          this page, with one-click fixes instead of just a scorecard.
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl p-2 flex flex-col text-left gap-2 shadow-[0_1px_2px_rgba(10,10,15,0.04),0_12px_28px_-12px_rgba(10,10,15,0.12)]"
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Paste a URL or your content here..."
              className="w-full sm:flex-1 min-w-0 bg-transparent border-none outline-none rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
            <button
              type="submit"
              className="bg-gradient-to-br from-[var(--brand)] to-[var(--brand-2)] text-white rounded-xl px-5 py-2.5 text-sm font-bold whitespace-nowrap text-center cursor-pointer transition-all duration-200 ease-out shadow-[0_1px_2px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_18px_-4px_var(--brand)] hover:-translate-y-px active:translate-y-0"
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
              className="w-full sm:flex-1 min-w-0 bg-transparent border-none outline-none rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value as ContentType)}
              className="bg-[var(--surface-1)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-secondary)] cursor-pointer transition-colors duration-150 hover:border-[var(--border-strong)]"
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
      <div className="w-full max-w-[640px]">
        <Footer />
      </div>
    </div>
  );
}
