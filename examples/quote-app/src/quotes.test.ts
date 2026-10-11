import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";
import {
  FALLBACK_QUOTE,
  getAllQuotes,
  parseQuotes,
  pickQuoteOfTheDay,
  selectQuote,
  type Quote,
} from "./quotes";

const pool: Quote[] = Array.from({ length: 98 }, (_, i) => ({ text: `Quote ${i}` }));
const at = (iso: string) => new Date(iso);
const daily = (iso: string) => pickQuoteOfTheDay(pool, at(iso));
const query = (q: string) => new URLSearchParams(q);

/** Writes `contents` to a QUOTES.md in a fresh temporary folder and returns its path. */
function quotesFile(contents: string): string {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "quotes-")), "QUOTES.md");
  fs.writeFileSync(file, contents);
  return file;
}

describe("the pool", () => {
  test("br-B01.1 the pool is exactly the quotes in QUOTES.md", () => {
    const file = quotesFile("## Focus\n\n> One.\n\n> Two.\n- Someone");
    expect(getAllQuotes(file).map((q) => q.text)).toEqual(["One.", "Two."]);
  });

  test("br-B02.1 an entry with no attribution line is a quote with no author", () => {
    const [quote] = parseQuotes("## Focus\n\n> No known author.");
    expect(quote).toEqual({ text: "No known author.", category: "Focus" });
  });

  test("br-B03.1 a quote's category is the heading above it", () => {
    const [quote] = parseQuotes("## Business & Productivity\n\n> Sell results.");
    expect(quote.category).toBe("Business & Productivity");
  });

  test("br-B03.2 a quote under the second heading takes the second heading", () => {
    const quotes = parseQuotes("## Personal\n\n> First.\n\n## Focus\n\n> Second.");
    expect(quotes.map((q) => q.category)).toEqual(["Personal", "Focus"]);
  });
});

describe("the QUOTES.md format", () => {
  test("br-D02.1 `> ` lines are quote text, joined line by line", () => {
    const [quote] = parseQuotes("## Personal\n\n> First line\n> Second line");
    expect(quote.text).toBe("First line\nSecond line");
  });

  test.each(["- Bruce Lee", "— Bruce Lee"])("br-D02.2 `%s` right after the text is the attribution", (line) => {
    const [quote] = parseQuotes(`## Focus\n\n> Be water.\n${line}`);
    expect(quote.author).toBe("Bruce Lee");
  });

  test("br-D02.3 an entry with no `> ` lines is skipped", () => {
    expect(parseQuotes("## Focus\n\nJust a note.\n\n> A quote.")).toHaveLength(1);
  });
});

describe("quote of the day", () => {
  test("br-B04.1 every page load on the same UTC day shows the same quote", () => {
    expect(daily("2026-10-02T00:00:00Z")).toBe(daily("2026-10-02T23:59:59Z"));
  });

  test("br-B04.2 the quote changes at UTC midnight", () => {
    expect(daily("2026-10-02T23:59:59Z")).not.toBe(daily("2026-10-03T00:00:00Z"));
  });

  test("br-B04.3 every quote appears once in as many UTC days as there are quotes", () => {
    const start = at("2026-10-02T12:00:00Z").getTime();
    const seen = new Set(pool.map((_, i) => pickQuoteOfTheDay(pool, new Date(start + i * 86_400_000))));
    expect(seen.size).toBe(pool.length);
  });
});

describe("fallback quote", () => {
  test("br-B05.1 with QUOTES.md missing, the fallback quote is shown", () => {
    const missing = path.join(os.tmpdir(), "no-such-folder", "QUOTES.md");
    expect(pickQuoteOfTheDay(getAllQuotes(missing), new Date())).toBe(FALLBACK_QUOTE);
  });

  test("br-B05.2 with no parseable quotes, the fallback quote is shown", () => {
    const file = quotesFile("## Focus\n\nNothing quoted here.");
    expect(pickQuoteOfTheDay(getAllQuotes(file), new Date())).toBe(FALLBACK_QUOTE);
  });
});

describe("new quote override", () => {
  const now = at("2026-10-02T09:00:00Z");
  const today = pickQuoteOfTheDay(pool, now);

  test("br-B07.1 new_quote=true shows a quote other than the quote of the day", () => {
    for (let i = 0; i < 200; i++) {
      expect(selectQuote(pool, query("new_quote=true"), now)).not.toBe(today);
    }
  });

  test("br-B07.2 the next page load without the query shows the quote of the day", () => {
    selectQuote(pool, query("new_quote=true"), now);
    expect(selectQuote(pool, query(""), now)).toBe(today);
  });

  test("br-B07.3 with one quote in the pool, new_quote=true shows that quote", () => {
    const one = [{ text: "Only" }];
    expect(selectQuote(one, query("new_quote=true"), now)).toBe(one[0]);
  });

  test.each(["new_quote=1", "new_quote=yes", "new_quote=TRUE", "new_quote="])(
    "br-B07.4 `%s` shows the quote of the day",
    (q) => {
      expect(selectQuote(pool, query(q), now)).toBe(today);
    },
  );
});
