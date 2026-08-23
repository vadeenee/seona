import { AuditCategory } from "@/lib/types";

export function EvidencePanel({ category }: { category: AuditCategory | undefined }) {
  if (!category) return null;
  const [primary] = category.issues;
  if (!primary) return null;

  return (
    <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl px-6.5 py-6 mb-5.5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth={2.2}>
          <path d="M12 2 3 7v6c0 5 4 8.5 9 9 5-.5 9-4 9-9V7l-9-5Z" />
          <path d="m8.5 12 2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[12px] font-bold text-[var(--brand)]">
          {primary.evidence ? "Checked against live Google results, just now" : "Search Intent & Topical Coverage"}
        </span>
      </div>

      <h3 className="font-display text-[17px] font-extrabold tracking-tight m-0 mb-1.5 max-w-[52ch]">{primary.title}</h3>
      {primary.description && (
        <p className="text-[13px] text-[var(--text-secondary)] m-0 leading-relaxed max-w-[56ch]">
          {primary.description}
        </p>
      )}

      {primary.evidence && primary.evidence.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {primary.evidence.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 border border-[var(--border)] rounded-full pl-1 pr-3 py-1 text-[12px] font-semibold text-[var(--text-secondary)] bg-[var(--surface-1)] transition-all duration-200 hover:border-[var(--border-strong)] hover:shadow-sm hover:-translate-y-px"
              title={source.title}
            >
              <span className="w-5 h-5 rounded-full bg-[var(--brand-100)] text-[var(--brand)] text-[10px] font-bold flex items-center justify-center shrink-0">
                {source.domain.charAt(0).toUpperCase()}
              </span>
              {source.domain}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
