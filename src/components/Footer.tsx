export function Footer() {
  return (
    <div className="mt-16 pt-6 border-t border-[var(--border)] flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
      <span className="w-[16px] h-[16px] rounded-[5px] inline-block bg-gradient-to-br from-[var(--brand)] to-[var(--brand-2)]" />
      <span>&copy; {new Date().getFullYear()} Seona</span>
    </div>
  );
}
