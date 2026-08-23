"use client";

import { useState } from "react";
import { AuditCategory, Severity } from "@/lib/types";

const severityColor: Record<Severity, string> = {
  critical: "var(--critical)",
  serious: "var(--serious)",
  warning: "var(--warning)",
  good: "var(--good)",
};

const severityLabelClass: Record<Severity, string> = {
  critical: "text-[var(--critical)]",
  serious: "text-[var(--serious)]",
  warning: "text-[#9c6f18]",
  good: "text-[var(--success-text)]",
};

function Dot({ severity }: { severity: Severity }) {
  return (
    <span
      className="w-2 h-2 rounded-full shrink-0 mt-[5px]"
      style={{ background: severityColor[severity] }}
    />
  );
}

function LockIcon({ className = "" }: { className?: string }) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

const primaryButtonClass =
  "bg-gradient-to-br from-[var(--brand)] to-[var(--brand-2)] text-white border-none rounded-lg font-bold cursor-pointer " +
  "transition-all duration-200 ease-out shadow-[0_1px_2px_rgba(0,0,0,0.08)] " +
  "hover:shadow-[0_4px_14px_-2px_var(--brand)] hover:-translate-y-px active:translate-y-0 active:shadow-[0_1px_2px_rgba(0,0,0,0.08)] " +
  "disabled:opacity-60 disabled:pointer-events-none disabled:translate-y-0 disabled:shadow-none";

export function CategoryCard({
  category,
  plan,
  onUpgrade,
}: {
  category: AuditCategory;
  plan: "free" | "pro";
  onUpgrade: () => void;
}) {
  const [fixed, setFixed] = useState<Record<string, boolean>>({});
  const badge =
    category.tier === "free" ? (
      <span className="text-[10.5px] font-bold uppercase tracking-wide px-2 py-[3px] rounded-full border border-[var(--border-strong)] text-[var(--text-secondary)]">
        Free
      </span>
    ) : (
      <span className="text-[10.5px] font-bold uppercase tracking-wide px-2 py-[3px] rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--brand-2)] text-white">
        Pro
      </span>
    );

  if (category.tier === "pro-locked") {
    const unlocked = plan === "pro";
    return (
      <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl mb-3.5 overflow-hidden shadow-sm transition-shadow duration-200">
        <div className="flex items-center justify-between px-[18px] py-[15px] border-b border-[var(--gridline)]">
          <div>
            <div className="font-display text-[16px] font-extrabold tracking-tight">{category.title}</div>
            <div className="text-[11.5px] text-[var(--text-muted)] mt-px">{category.subtitle}</div>
          </div>
          {badge}
        </div>
        <div className="relative px-[18px] pb-[22px] pt-1 min-h-[132px]">
          <div
            className={
              unlocked
                ? ""
                : "blur-[3px] saturate-[0.7] select-none pointer-events-none opacity-70"
            }
          >
            <div className="px-0">
              {category.issues.map((issue) => (
                <div key={issue.id} className="flex gap-2.5 py-3 border-b border-[var(--gridline)] last:border-b-0">
                  <Dot severity={issue.severity} />
                  <div className="text-[13px] font-semibold">{issue.title}</div>
                </div>
              ))}
            </div>
          </div>
          {!unlocked && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 text-center px-5"
              style={{
                background:
                  "radial-gradient(ellipse at center, transparent 0%, var(--surface-2) 72%)",
              }}
            >
              <div
                className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--brand-100)] to-[var(--surface-1)] text-[var(--brand)] flex items-center justify-center"
                style={{ boxShadow: "0 0 0 1px var(--border), 0 6px 16px -6px var(--brand)" }}
              >
                <LockIcon />
              </div>
              <h3 className="text-[14.5px] font-bold m-0 tracking-tight">{category.issues.length} issues found</h3>
              <p className="text-[12.5px] text-[var(--text-secondary)] m-0 max-w-[34ch] leading-relaxed">
                Unlock the full breakdown and one-click fixes for this category.
              </p>
              <button onClick={onUpgrade} className={`${primaryButtonClass} px-[18px] py-[9px] text-[12.5px] mt-0.5`}>
                Unlock with Pro
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl mb-3.5 overflow-hidden shadow-sm transition-shadow duration-200">
      <div className="flex items-center justify-between px-[18px] py-[15px] border-b border-[var(--gridline)]">
        <div>
          <div className="font-display text-[16px] font-extrabold tracking-tight">{category.title}</div>
          <div className="text-[11.5px] text-[var(--text-muted)] mt-px">{category.subtitle}</div>
        </div>
        {badge}
      </div>
      <div className="px-[18px] pb-3.5 pt-1">
        {category.issues.map((issue) => (
          <div key={issue.id} className="flex gap-2.5 py-3 border-b border-[var(--gridline)] last:border-b-0">
            <Dot severity={issue.severity} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] font-semibold">{issue.title}</span>
                <span className={`text-[10.5px] font-bold uppercase tracking-wide ${severityLabelClass[issue.severity]}`}>
                  {issue.severity === "good" ? "Passing" : issue.severity}
                </span>
              </div>
              {issue.description && (
                <p className="text-[12.5px] text-[var(--text-secondary)] mt-1 leading-relaxed">{issue.description}</p>
              )}

              {issue.fixLabel && category.tier === "free" && (
                <div className="mt-2.5">
                  <button
                    onClick={() => setFixed((f) => ({ ...f, [issue.id]: true }))}
                    disabled={!!fixed[issue.id]}
                    className={`${primaryButtonClass} px-3.5 py-[7px] text-xs ${
                      fixed[issue.id] ? "from-[var(--good)] to-[var(--good)]" : ""
                    }`}
                  >
                    {fixed[issue.id] ? "Fixed ✓" : issue.fixLabel}
                  </button>
                </div>
              )}

              {issue.fixLabel && category.tier === "diagnosis-free" && (
                <>
                  {plan === "free" ? (
                    <div className="mt-2.5 border border-dashed border-[var(--border-strong)] rounded-[9px] px-3 py-2.5 bg-[var(--surface-1)] flex items-center justify-between gap-2.5 flex-wrap">
                      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                        <LockIcon /> Fix available with Pro
                      </div>
                      <button
                        onClick={onUpgrade}
                        className="bg-transparent border border-[var(--brand)] text-[var(--brand)] rounded-md px-2.5 py-1.5 text-[11.5px] font-bold cursor-pointer whitespace-nowrap transition-all duration-200 ease-out hover:bg-[var(--brand-100)] active:scale-[0.97]"
                      >
                        Unlock fix
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2.5">
                      <button
                        onClick={() => setFixed((f) => ({ ...f, [issue.id]: true }))}
                        disabled={!!fixed[issue.id]}
                        className={`${primaryButtonClass} px-3.5 py-[7px] text-xs ${
                          fixed[issue.id] ? "from-[var(--good)] to-[var(--good)]" : ""
                        }`}
                      >
                        {fixed[issue.id] ? "Fixed ✓" : issue.fixLabel}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
