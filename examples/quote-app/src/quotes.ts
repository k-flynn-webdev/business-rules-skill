import fs from "node:fs";
import path from "node:path";

export interface Quote {
  text: string;
  author?: string;
  category?: string;
}

export const QUOTES_PATH = path.join("data", "QUOTES.md");

// br-B05: the one quote that lives in code. It is not a member of the pool.
export const FALLBACK_QUOTE: Quote = {
  text: "Hard work beats talent when talent doesn't work hard.",
  author: "Tim Notke",
};

const DAY_MS = 86_400_000;

function parseAttribution(line: string): string | null {
  const trimmed = line.trim();
  for (const dash of ["— ", "- ", "—", "-"]) {
    if (trimmed.startsWith(dash)) return trimmed.substring(dash.length).trim();
  }
  return null;
}

/** A block that holds only an attribution: one a formatter split from its quote with a blank line. */
function isAttributionBlock(block: string): boolean {
  const lines = block.trim().split("\n").filter((l) => l.trim());
  return lines.length > 0 && lines.every((l) => parseAttribution(l) !== null);
}

/**
 * Reads quotes out of the QUOTES.md format.
 * @see br-D02 A quote entry is `> text` lines, an optional `- Attribution` line, under a `##` heading.
 */
export function parseQuotes(markdown: string): Quote[] {
  const quotes: Quote[] = [];
  const blocks = markdown.split(/\n\s*\n/);
  let category = "";

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();

    // br-B03: a heading sets the category of every quote below it, until the next heading.
    if (block.startsWith("## ")) {
      category = block.substring(3).trim();
      continue;
    }

    const textLines: string[] = [];
    let author = "";
    for (const line of block.split("\n")) {
      if (line.startsWith(">")) textLines.push(line.replace(/^> ?/, "").trim());
      else author = parseAttribution(line) ?? author;
    }
    // br-D02: a block with no `> ` lines is not a quote, and is skipped.
    if (textLines.length === 0) continue;

    if (!author && i + 1 < blocks.length && isAttributionBlock(blocks[i + 1])) {
      author = parseAttribution(blocks[++i].trim().split("\n")[0]) ?? "";
    }

    quotes.push({
      text: textLines.join("\n"),
      // br-B02: the attribution is optional; a quote without one has no author field.
      ...(author ? { author } : {}),
      ...(category ? { category } : {}),
    });
  }
  return quotes;
}

/**
 * The pool: every quote in QUOTES.md. A missing file is an empty pool, not an error.
 * @see br-B01 QUOTES.md is the canonical source of quotes.
 */
export function getAllQuotes(file = QUOTES_PATH): Quote[] {
  try {
    return parseQuotes(fs.readFileSync(file, "utf8"));
  } catch {
    return [];
  }
}

/**
 * The quote of the day for the UTC date of `now`.
 * @see br-B04 The server chooses the quote of the day from the UTC date.
 */
export function pickQuoteOfTheDay(quotes: Quote[], now: Date): Quote {
  // br-B05: an empty pool shows the fallback quote, never a blank page.
  if (quotes.length === 0) return FALLBACK_QUOTE;
  const day = Math.floor(now.getTime() / DAY_MS);
  // A prime stride visits every quote once per cycle and keeps neighbouring days far apart
  // in the file. It must not divide the pool size; 7919 only does at 7919+ quotes.
  const stride = quotes.length % 7919 === 0 ? 7907 : 7919;
  return quotes[(day * stride) % quotes.length];
}

/**
 * A random quote other than `exclude`, unless the pool has only one quote.
 * @see br-B07 `?new_quote=true` shows another quote for that page load only.
 */
export function pickRandomQuote(quotes: Quote[], exclude: Quote): Quote {
  const others = quotes.length > 1 ? quotes.filter((q) => q !== exclude) : quotes;
  if (others.length === 0) return FALLBACK_QUOTE;
  return others[Math.floor(Math.random() * others.length)];
}

/**
 * The quote a page load shows: the quote of the day, or another one when asked.
 * Nothing about the request is stored, so the next page load is unaffected (br-B06).
 * @see br-B07
 */
export function selectQuote(quotes: Quote[], params: URLSearchParams, now = new Date()): Quote {
  const daily = pickQuoteOfTheDay(quotes, now);
  return params.get("new_quote") === "true" ? pickRandomQuote(quotes, daily) : daily;
}
