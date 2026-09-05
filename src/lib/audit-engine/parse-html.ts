import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

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

// Tags whose content is never meant to be read as prose.
const NON_CONTENT_SELECTOR = "script, style, noscript, template, nav, header, footer, form, aside, iframe, svg, button";

// A lot of real-world nav/menu clutter isn't wrapped in a semantic <nav> tag
// at all — component-based sites routinely build a mega-menu out of plain
// <div>s ("MoneyPilot Product All Class Actions Login Claim Now..."). A
// block whose text is almost entirely link text, and short enough to be a
// menu rather than an article that happens to link a lot, is a reasonable
// sign it's navigation rather than prose — even without jsdom/Readability.
function stripLinkHeavyBlocks($: cheerio.CheerioAPI, root: cheerio.Cheerio<AnyNode>): void {
  root.find("div, ul, section").each((_, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    if (!text || text.length > 500) return;
    const links = $el.find("a");
    if (links.length < 4) return;
    const linkText = links.text().trim();
    if (linkText.length / text.length > 0.7) $el.remove();
  });
}

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

  const bodyClone = $("body").clone();
  bodyClone.find(NON_CONTENT_SELECTOR).remove();
  stripLinkHeavyBlocks($, bodyClone);
  const bodyText = flattenToText($, bodyClone);

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
