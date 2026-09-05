const TITLE_MIN = 30;
const TITLE_MAX = 60;
const DESC_MIN = 50;
const DESC_MAX = 160;

function counterColor(len: number, min: number, max: number): string {
  if (len === 0) return "var(--text-muted)";
  if (len < min || len > max) return "var(--warning)";
  return "var(--good)";
}

export function SerpPreview({
  title,
  description,
  displayUrl,
}: {
  title: string;
  description: string;
  displayUrl: string;
}) {
  const previewTitle = title.trim() || "Your SEO title will appear here";
  const previewDescription = description.trim() || "Your meta description will appear here, exactly as Google would show it in search results.";

  return (
    <div>
      <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-xl px-4 py-3.5">
        <div className="text-[13px] text-[var(--success-text)] mb-0.5 truncate">{displayUrl}</div>
        <div
          className={`text-[17px] leading-snug truncate ${title.trim() ? "text-[#1a0dab]" : "text-[var(--text-muted)]"}`}
          style={{ fontFamily: "arial, sans-serif" }}
        >
          {previewTitle}
        </div>
        <p
          className={`text-[13px] leading-snug mt-0.5 m-0 line-clamp-2 ${description.trim() ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"}`}
        >
          {previewDescription}
        </p>
      </div>
      <div className="flex items-center justify-between mt-1.5 px-0.5">
        <span className="text-[10.5px] font-semibold" style={{ color: counterColor(title.length, TITLE_MIN, TITLE_MAX) }}>
          Title: {title.length}/{TITLE_MAX}
        </span>
        <span className="text-[10.5px] font-semibold" style={{ color: counterColor(description.length, DESC_MIN, DESC_MAX) }}>
          Description: {description.length}/{DESC_MAX}
        </span>
      </div>
    </div>
  );
}
