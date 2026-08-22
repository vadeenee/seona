import { NextResponse } from "next/server";
import { runAudit } from "@/lib/audit-engine";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const input = typeof body?.input === "string" ? body.input.trim() : "";
  const keyword = typeof body?.keyword === "string" ? body.keyword.trim() : undefined;
  const contentType = body?.contentType === "technical" ? "technical" : "general";

  if (!input) {
    return NextResponse.json({ error: "Paste a URL or some content to audit." }, { status: 400 });
  }

  try {
    const result = await runAudit(input, { keyword, contentType });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't analyze that input.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
