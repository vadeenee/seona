function bandColor(score: number) {
  if (score >= 80) return "var(--good)";
  if (score >= 50) return "var(--warning)";
  return "var(--critical)";
}

export function ScoreRing({ score }: { score: number }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="relative w-[116px] h-[116px] shrink-0">
      <svg width={116} height={116} viewBox="0 0 116 116" className="-rotate-90">
        <circle cx={58} cy={58} r={radius} fill="none" stroke="var(--gridline)" strokeWidth={10} />
        <circle
          cx={58}
          cy={58}
          r={radius}
          fill="none"
          stroke={bandColor(score)}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
          style={{ filter: `drop-shadow(0 2px 6px color-mix(in srgb, ${bandColor(score)} 45%, transparent))` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[30px] font-bold leading-none">{score}</span>
        <span className="text-[10.5px] text-[var(--text-muted)] mt-0.5 tracking-wide">/ 100</span>
      </div>
    </div>
  );
}
