import Link from "next/link";

export function Header({ right }: { right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5.5">
      <Link href="/" className="flex items-center gap-2 font-bold text-[17px] no-underline text-[var(--text-primary)]">
        <span className="w-[26px] h-[26px] rounded-[7px] inline-block bg-gradient-to-br from-[var(--brand)] to-[var(--brand-2)]" />
        Seona
      </Link>
      {right}
    </div>
  );
}
