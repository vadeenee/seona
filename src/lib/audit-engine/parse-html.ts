import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export interface HeadingInfo {
  level: number; // 1-6
  text: string;
}

export interface ImageInfo {
  src: string;
  alt: string | null;
}

export interface OpenGraphData {
  title: string | null;
  description: string | null;
  image: string | null;
}

export interface PageData {
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  headings: HeadingInfo[];
  images: ImageInfo[];
  bodyText: string;
  openGraph: OpenGraphData;
}

// Tags whose content is never meant to be read as prose. Used as the
// fallback path when Readability can't confidently find an article (landing
// pages, product pages, anything that isn't long-form content).
const NON_CONTENT_SELECTOR = "script, style, noscript, template, nav, header, footer, form, aside, iframe, svg, button";

// Real-world markup is routinely minified with zero whitespace between
// adjacent tags ("<td>Fees</td><td>25%</td>" with nothing between them, or a
// whole nav menu as "<a>Home</a><a>Login</a><a>Claim</a>"). Flattening that
// straight to plain text mashes every cell/item into one run-on word or
// sentence, which then reads as an absurdly long "sentence" or corrupts
// passive-voice/reading-level stats. Inserting explicit separators before
// flattening keeps every row, bullet, and block as its own real unit.
function addTextSeparators($: cheerio.CheerioAPI, root: cheerio.Cheerio<AnyNode>): void {
  root.find("td, th, p, div, h1, h2, h3, h4, h5, h6, br, a, span, blockquote").each((_, el) => {
    $(el).after(" ");
  });
  root.find("tr, li").each((_, el) => {
    const $el = $(el);
    if (!/[.!?]\s*$/.test($el.text())) $el.append(". ");
  });
}

function flattenToText($: cheerio.CheerioAPI, root: cheerio.Cheerio<AnyNode>): string {
  addTextSeparators($, root);
  return root
    .text()
    .replace(/\s+/g, " ")
    .trim();
}

export function parseHtml(html: string): PageData {
  const $ = cheerio.load(html);

  const title = $("head > title").first().text().trim() || null;
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() || null;
  const canonical = $('link[rel="canonical"]').attr("href")?.trim() || null;

  const headings: HeadingInfo[] = [];
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const level = Number(el.tagName.slice(1));
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text) headings.push({ level, text });
  });

  const images: ImageInfo[] = [];
  $("img").each((_, el) => {
    const src = $(el).attr("src") ?? "";
    const alt = $(el).attr("alt");
    images.push({ src, alt: alt === undefined ? null : alt });
  });

  const openGraph: OpenGraphData = {
    title: $('meta[property="og:title"]').attr("content")?.trim() || null,
    description: $('meta[property="og:description"]').attr("content")?.trim() || null,
    image: $('meta[property="og:image"]').attr("content")?.trim() || null,
  };

  // Try to identify the actual article content the way Firefox's Reader Mode
  // does — scoring text/link density rather than guessing at markup
  // conventions — so a mega-menu, cookie banner, or related-posts rail built
  // from plain <div>s (not semantic <nav>/<footer> tags the fallback below
  // can catch) doesn't get read as part of the page's prose. Falls back to
  // a plain tag-denylist strip of the full body for pages that aren't
  // article-shaped (landing pages, product pages) where Readability
  // reasonably finds nothing.
  let bodyText: string;
  try {
    const dom = new JSDOM(html, { url: "https://example.com/" });
    const article = new Readability(dom.window.document).parse();
    if (article?.content && (article.textContent?.trim().length ?? 0) > 200) {
      const $article = cheerio.load(article.content);
      $article("script, style, noscript, iframe, svg, form, button").remove();
      bodyText = flattenToText($article, $article.root());
    } else {
      throw new Error("Readability found nothing substantial");
    }
  } catch {
    const bodyClone = $("body").clone();
    bodyClone.find(NON_CONTENT_SELECTOR).remove();
    bodyText = flattenToText($, bodyClone);
  }

  return {
    title: title || openGraph.title,
    metaDescription: metaDescription || openGraph.description,
    canonical,
    headings,
    images,
    bodyText,
    openGraph,
  };
}

/** For pasted content that isn't a full document, still worth extracting
 * headings/images/text from if the user pasted an HTML fragment. */
export function looksLikeHtml(input: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(input);
}
