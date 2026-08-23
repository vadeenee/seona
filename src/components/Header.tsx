export function Header({ right, onLogoClick }: { right?: React.ReactNode; onLogoClick?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-5.5">
      <button
        onClick={onLogoClick}
        disabled={!onLogoClick}
        className="font-display flex items-center gap-2 font-extrabold text-[18px] tracking-tight bg-transparent border-none p-0 text-[var(--text-primary)] enabled:cursor-pointer"
      >
        <span className="w-[26px] h-[26px] rounded-[7px] inline-block bg-gradient-to-br from-[var(--brand)] to-[var(--brand-2)]" />
        Seona
      </button>
      {right}
    </div>
  );
}
