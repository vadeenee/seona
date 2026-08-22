"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AuditView } from "@/components/AuditView";
import { EditorView } from "@/components/EditorView";
import { AuditResult, ContentType } from "@/lib/types";
import { readStoredAuditInput } from "@/lib/audit-input-storage";

type Status = "loading" | "error" | "ready";

const NO_INPUT_MESSAGE = "No content to audit yet — head back and paste a URL or some content.";

async function requestAudit(input: string, keyword?: string, contentType?: ContentType): Promise<AuditResult> {
  const res = await fetch("/api/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input, keyword, contentType }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Couldn't analyze that input.");
  return data as AuditResult;
}

export default function AuditPage() {
  const [stored] = useState(readStoredAuditInput);
  const [status, setStatus] = useState<Status>(stored ? "loading" : "error");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(stored ? null : NO_INPUT_MESSAGE);

  // No synchronous setState here — the initial `status`/`error` state already
  // accounts for the mount case, and the async continuation below only
  // touches state after the fetch settles.
  const fetchAudit = useCallback((input: string) => {
    requestAudit(input, stored?.keyword, stored?.contentType)
      .then((r) => {
        setResult(r);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Couldn't analyze that input.");
        setStatus("error");
      });
  }, [stored]);

  useEffect(() => {
    if (stored) fetchAudit(stored.input);
    // Only ever run the initial audit once, for the input captured on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reanalyze = useCallback(
    (input: string) => {
      setStatus("loading");
      setError(null);
      fetchAudit(input);
    },
    [fetchAudit]
  );

  const editorAnalyze = useCallback(
    (text: string) => requestAudit(text, stored?.keyword, stored?.contentType),
    [stored]
  );

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="text-sm text-[var(--text-secondary)]">Analyzing your page…</div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="max-w-[440px] text-center">
          <p className="text-sm text-[var(--text-secondary)] mb-4">{error}</p>
          <Link
            href="/"
            className="bg-[var(--brand)] text-white rounded-xl px-5 py-2.5 text-sm font-bold inline-block"
          >
            Back to start
          </Link>
        </div>
      </div>
    );
  }

  if (result!.mode === "text") {
    return (
      <EditorView
        initialResult={result!}
        keyword={stored?.keyword}
        contentType={stored?.contentType ?? "general"}
        onAnalyze={editorAnalyze}
      />
    );
  }

  return (
    <AuditView result={result!} onReanalyze={stored ? () => reanalyze(stored.input) : undefined} />
  );
}
