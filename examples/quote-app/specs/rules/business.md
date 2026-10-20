# Area B — Business (Daily Dose)

Area file of [`BUSINESS-RULES.md`](../BUSINESS-RULES.md): intents, glossary, registry and the index of
every rule live there. How to read and write these rules: [`BUSINESS-RULES-AUTHORING.md`](../BUSINESS-RULES-AUTHORING.md).

---

## br-B01

kind: invariant | serves: in-04 | status: settled

`QUOTES.md` is the canonical source of quotes. The fallback quote is the only quote in code.

`#quotes` `#content`

**Tests**

- B01.1 — Given `QUOTES.md` holds two quotes. When the pool is read. Then it holds exactly those two.

> Fails if any quote other than the fallback is hardcoded in application code.

**Source**

- 2026-09-13, Claude Code session. A file keeps quotes editable without a deploy, and versioned in git.

---

## br-B02

kind: definition | serves: in-04 | given: br-D02 | status: settled

A quote's attribution line is optional.

`#quotes`

**Tests**

- B02.1 — Given an entry with no attribution line. When it is parsed. Then it is a quote with no author.

> Fails if an entry with no attribution line is dropped or causes an error.

**Source**

- 2026-09-13, Claude Code session. Not every quote has a known author.
- 2026-09-22, fresh-eyes review. Category is required for every valid quote (br-D02). A test for "no category" was removed; it tested an impossible state.

---

## br-B03

kind: behaviour | serves: in-04 | given: br-D02 | status: settled

When a quote is parsed, then its category is the text of the `##` heading above it.

`#quotes` `#category`

**Tests**

- B03.1 — Given a quote under `## Business & Productivity`. When it is parsed. Then its category is `Business & Productivity`.
- B03.2 — Given a quote under a second heading. When it is parsed. Then its category is the second heading, not the first.

> Fails if a quote's category does not match the heading above it in the file.

**Source**

- 2026-09-14, Claude Code session. Category is structural. The heading already carries it, so a quote does not repeat it.

---

## br-B04

kind: definition | serves: in-02 | given: br-B01 | status: settled

The quote of the day is chosen by the server from the current UTC date. It is the same for every visitor until the next UTC midnight.

`#quotes` `#selection`

**Tests**

- B04.1 — Given a populated pool. When pages load at 00:00:00 and 23:59:59 UTC on the same day. Then both show the same quote.
- B04.2 — Given a pool of two or more quotes. When the UTC date changes at midnight. Then the quote of the day changes.
- B04.3 — Given a pool of N quotes. When N consecutive UTC days pass. Then every quote is the quote of the day exactly once.

> Fails if two page loads on the same UTC day, with the same pool, show different quotes without the override (br-B07).

**Design notes**

- Index = (whole UTC days since 1970-01-01 × 7919) mod pool size. 7919 is prime, so the cycle visits every quote once and neighbouring days land far apart in the file.
- The pool is part of the input. A deploy that adds, removes or reorders quotes starts a new cycle and can change the quote mid-day.

**Source**

- 2026-09-21, Claude Code session. Previously: a random quote on every page load, to keep every quote in circulation without timezone or cycling logic. Superseded 2026-10-02.
- 2026-10-02, conversation. The owner asked for the server to set a quote of the day, using the UTC date as the change input.

---

## br-B05

kind: behaviour | serves: in-05 | given: br-B01 | status: settled

When the pool is empty, then the fallback quote is shown.

`#quotes` `#selection`

**Tests**

- B05.1 — Given `QUOTES.md` is missing. When a page loads. Then the fallback quote is shown.
- B05.2 — Given `QUOTES.md` holds no parseable quotes. When a page loads. Then the fallback quote is shown.

> Fails if the application throws or renders nothing when the pool is empty.

**Source**

- 2026-09-13, Claude Code session. An empty pool must never produce a blank page. The fallback is "Hard work beats talent when talent doesn't work hard." — Tim Notke.

---

## br-B06

kind: invariant | serves: in-06 | status: settled

The core experience sets no cookies, writes nothing to local storage, and runs no client-side tracking.

`#privacy`

**Tests**

- B06.1 — Given a visitor loads the page. When it finishes loading. Then no cookie is set and nothing is written to local storage.

> Fails if any analytics or tracking script is added to the core page.

**Source**

- 2026-09-21, product brief. The product is a ritual, not a feed. Tracking would contradict the premise.
- 2026-09-22, grill session. Client-side only. Server access logs (IP, path, time) are not covered by this rule.

---

## br-B07

kind: behaviour | serves: in-02 | given: br-B04, br-B06 | status: settled

When a page load has the query `new_quote=true`, then it shows a random quote other than the quote of the day, for that page load only.

`#quotes` `#selection`

**Tests**

- B07.1 — Given a pool of two or more quotes. When a page loads with `?new_quote=true`. Then it shows a quote other than the quote of the day.
- B07.2 — Given a page load with `?new_quote=true`. When the next page loads without the query. Then it shows the quote of the day.
- B07.3 — Given a pool of one quote. When a page loads with `?new_quote=true`. Then it shows that quote.
- B07.4 — Given `new_quote` with any value other than `true`. When the page loads. Then it shows the quote of the day.

> Fails if a `new_quote=true` page load changes the quote any other page load shows.

**Source**

- 2026-10-02, conversation. The owner wanted a way for one visitor to get another quote without changing the quote of the day. It is a URL query only, with no control on the page (br-U06).

