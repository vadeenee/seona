function bandColor(score: number) {
  if (score >= 80) return "var(--good)";
  if (score >= 50) return "var(--warning)";
  return "var(--critical)";
}

export function ScoreDisplay({ score }: { score: number }) {
  const color = bandColor(score);

  return (
    <div className="shrink-0">
      <div className="flex items-baseline gap-1.5">
        <span
          className="text-[56px] font-extrabold leading-none tracking-tight tabular-nums"
          style={{
            backgroundImage: `linear-gradient(135deg, ${color}, var(--brand-2))`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {score}
        </span>
        <span className="text-[14px] font-semibold text-[var(--text-muted)]">/ 100</span>
      </div>
      <div className="h-[5px] w-[140px] rounded-full bg-[var(--gridline)] overflow-hidden mt-2.5">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${score}%`, backgroundImage: `linear-gradient(90deg, ${color}, var(--brand-2))` }}
        />
      </div>
    </div>
  );
}
