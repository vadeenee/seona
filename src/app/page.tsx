import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-[640px] text-center">
        <div className="flex items-center justify-center gap-2 font-bold text-[17px] mb-8">
          <span className="w-[26px] h-[26px] rounded-[7px] inline-block bg-gradient-to-br from-[var(--brand)] to-[var(--good)]" />
          Lumen SEO
        </div>

        <h1 className="text-[28px] sm:text-[34px] font-bold leading-tight mb-3">
          Grammarly for SEO — and for AI search.
        </h1>
        <p className="text-[15px] text-[var(--text-secondary)] mb-8 max-w-[52ch] mx-auto">
          Paste your content or a URL. Get one plain-English audit covering on-page SEO,
          content quality, search intent, and whether AI Overviews and chat assistants
          will actually cite this page — with one-click fixes, not just a scorecard.
        </p>

        <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl p-2 flex items-center gap-2 text-left">
          <input
            type="text"
            placeholder="Paste a URL or your content here..."
            className="flex-1 bg-transparent border-none outline-none px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            defaultValue="yourblog.com/best-running-shoes"
          />
          <Link
            href="/audit"
            className="bg-[var(--brand)] text-white rounded-xl px-5 py-2.5 text-sm font-bold whitespace-nowrap"
          >
            Run free audit
          </Link>
        </div>

        <p className="text-xs text-[var(--text-muted)] mt-4">
          No signup required for your first audit.
        </p>
      </div>
    </div>
  );
}
