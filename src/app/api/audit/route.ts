import { NextResponse } from "next/server";
import { runAudit } from "@/lib/audit-engine";
import { PageType } from "@/lib/types";
import { isContentType } from "@/lib/niches";

const PAGE_TYPES: PageType[] = ["blog", "landing", "product", "other"];

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const input = typeof body?.input === "string" ? body.input.trim() : "";
  const keyword = typeof body?.keyword === "string" ? body.keyword.trim() : undefined;
  const contentType = typeof body?.contentType === "string" && isContentType(body.contentType) ? body.contentType : "general";
  const pageType = PAGE_TYPES.includes(body?.pageType) ? (body.pageType as PageType) : "blog";
  const seoTitle = typeof body?.seoTitle === "string" ? body.seoTitle.trim() : undefined;
  const seoMetaDescription = typeof body?.seoMetaDescription === "string" ? body.seoMetaDescription.trim() : undefined;

  if (!input) {
    return NextResponse.json({ error: "Paste a URL or some content to audit." }, { status: 400 });
  }

  try {
    const result = await runAudit(input, { keyword, contentType, pageType, seoTitle, seoMetaDescription });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't analyze that input.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
