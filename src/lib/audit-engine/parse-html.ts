import * as cheerio from "cheerio";

export interface HeadingInfo {
  level: number; // 1-6
  text: string;
}

export interface ImageInfo {
  src: string;
  alt: string | null;
}

export interface PageData {
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  headings: HeadingInfo[];
  images: ImageInfo[];
  bodyText: string;
}

// Tags whose content is never meant to be read as prose.
const NON_CONTENT_SELECTOR = "script, style, noscript, template, nav, footer";

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

  const bodyClone = $("body").clone();
  bodyClone.find(NON_CONTENT_SELECTOR).remove();
  const bodyText = bodyClone.text().replace(/\s+/g, " ").trim();

  return { title, metaDescription, canonical, headings, images, bodyText };
}

/** For pasted content that isn't a full document, still worth extracting
 * headings/images/text from if the user pasted an HTML fragment. */
export function looksLikeHtml(input: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(input);
}
