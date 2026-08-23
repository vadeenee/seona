import { AuditCategory } from "@/lib/types";

export function EvidencePanel({ category }: { category: AuditCategory | undefined }) {
  if (!category) return null;
  const [primary] = category.issues;
  if (!primary) return null;

  return (
    <div className="bg-[var(--surface-2)] border border-[var(--border)] px-9 py-9 mb-5.5">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand)] mb-5">
        {primary.evidence ? "Live evidence — checked just now against Google" : "Search Intent & Topical Coverage"}
      </div>

      <div className="flex gap-5 items-start">
        {primary.evidence && (
          <span className="font-serif text-[64px] leading-[0.5] text-[var(--brand-100)] shrink-0 mt-4" aria-hidden>
            &ldquo;
          </span>
        )}
        <p className="font-serif text-[22px] leading-snug italic m-0 max-w-[42ch]">
          {primary.title}
          {primary.description && (
            <span className="block not-italic text-[13px] text-[var(--text-secondary)] mt-3 leading-relaxed">
              {primary.description}
            </span>
          )}
        </p>
      </div>

      {primary.evidence && primary.evidence.length > 0 && (
        <div className="mt-7 border-t border-[var(--gridline)] pt-5">
          <ol className="m-0 pl-[22px] text-[13.5px] leading-[2.1] text-[var(--text-secondary)]">
            {primary.evidence.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--brand)] underline hover:opacity-80"
                >
                  {source.domain}
                </a>
                {" — “"}
                {source.title}
                {"”"}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
