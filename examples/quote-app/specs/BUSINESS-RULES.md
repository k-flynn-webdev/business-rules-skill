# Business Rules Ledger — Daily Dose (example)

Source of truth. Code and tests conform to this document.
How to read it, cite it in code and write it: [`BUSINESS-RULES-AUTHORING.md`](BUSINESS-RULES-AUTHORING.md).
Format: business-rules-ledger 2.9.2

---

## Intents

What a user should be able to do, and what would feel broken. Every rule serves at least one.

Drafted from the product brief and the rules' sources. Each stays observed until the owner confirms it.

### in-01

A visitor gets one quote to focus on, with nothing to browse or scroll.

for: solo founders and builders starting their workday
broken when: the page shows two quotes, or a control that jumps to a different quote.
non-goal: a feed, a quote list, or navigation between quotes.
status: observed

**Source**

- 2026-10-01, drafted from the product brief. The product is a ritual, not a feed; one forced focus is the point.

### in-02

A visitor gets one quote for the day, and can ask for another when they want one.

for: returning visitors
broken when: two visitors on the same UTC day see different quotes without asking, or one visitor asking for another quote changes it for everyone.
non-goal: remembering that a visitor asked for another quote. Nothing is stored on the client (in-06).
status: settled

**Source**

- 2026-10-01, drafted as "a visitor finds a fresh quote when they come back", when br-B04 picked at random on every page load. Superseded 2026-10-02.
- 2026-10-02, conversation. The owner chose a quote of the day set by the server on the UTC date, with a per-request override. This matches the product brief: one quote every 24 hours.

### in-03

A visitor can read the quote, its author and its category on any screen.

for: visitors on phones and desktops
broken when: a long unbroken string runs past the card edge on a 320px phone, or an author in the data is missing from the page.
status: observed

**Source**

- 2026-10-01, drafted from the sources of br-U03 and br-U05. Overflow on mobile was a real bug.

### in-04

The owner can add and edit quotes in one plain file, and nothing is silently lost.

`#content`

for: the site owner
broken when: a saved edit to QUOTES.md silently drops an author or a quote.
non-goal: a database or admin screen for quotes.
status: observed

**Source**

- 2026-10-01, drafted from the source of br-D01. A formatter inserted blank lines and the parser silently dropped authors.

### in-05

A visitor never sees a blank page.

for: all visitors
broken when: QUOTES.md is missing or empty and the page renders nothing.
status: observed

**Source**

- 2026-10-01, drafted from the source of br-B05.

### in-06

A visitor is not tracked.

`#privacy`

for: all visitors
broken when: a cookie, a local storage write, or an analytics script appears on the core page.
non-goal: analytics on the core experience.
status: observed

**Source**

- 2026-10-01, drafted from the source of br-B06. Tracking would contradict the premise and add friction with no user benefit.

---

## Glossary

Each domain term, defined once. Rules use these terms exactly.

| Term              | Meaning                                                                                       | Defined by |
| ----------------- | --------------------------------------------------------------------------------------------- | ---------- |
| quote             | A valid entry in QUOTES.md: `> text` lines, an optional `- Attribution` line, under a `##` heading. | br-D02     |
| pool              | Every quote parsed from QUOTES.md. The fallback quote is not a member.                        | br-B01     |
| category          | The text of the `##` heading above a quote.                                                   | br-B03     |
| attribution       | The optional line naming a quote's author.                                                    | br-B02     |
| fallback quote    | The single quote in code, shown when the pool is empty.                                       | br-B05     |
| page load         | One request for the page. A reload is a new page load.                                        | br-B07     |
| quote of the day  | The quote the server chooses for the current UTC date, the same for every visitor.            | br-B04     |

---

## Index

Every rule, in this document or an area file. Built by `scripts/ledger-check.ts --write`. Do not edit it by hand.

| ID | Rule | Serves | Tags | Status | Enforcement |
| --- | --- | --- | --- | --- | --- |
| br-D01 | No code formatter processes `QUOTES.md`. | in-04 | `quotes` `content` | settled | none |
| br-D02 | A quote entry in `QUOTES.md` is one or more `> text` lines, an optional `- Attribution` line right below them, under a `##` heading. Anything else is skipped without an error. | in-04 | `quotes` `format` | settled | cited, gap |
| br-A01 | A browser may reuse a cached page for at most five minutes, and never past UTC midnight. After that it checks with the server, which sends the page again only if it changed. | in-02 | `caching` `performance` | settled | cited |
| br-B01 | `QUOTES.md` is the canonical source of quotes. The fallback quote is the only quote in code. | in-04 | `quotes` `content` | settled | passing |
| br-B02 | A quote's attribution line is optional. | in-04 | `quotes` | settled | passing |
| br-B03 | When a quote is parsed, then its category is the text of the `##` heading above it. | in-04 | `quotes` `category` | settled | passing |
| br-B04 | The quote of the day is chosen by the server from the current UTC date. It is the same for every visitor until the next UTC midnight. | in-02 | `quotes` `selection` | settled | passing |
| br-B05 | When the pool is empty, then the fallback quote is shown. | in-05 | `quotes` `selection` | settled | passing |
| br-B06 | The core experience sets no cookies, writes nothing to local storage, and runs no client-side tracking. | in-06 | `privacy` | settled | none |
| br-B07 | When a page load has the query `new_quote=true`, then it shows a random quote other than the quote of the day, for that page load only. | in-02 | `quotes` `selection` | settled | passing |
| br-U01 | The page displays exactly one quote. | in-01 | `display` | settled | none |
| br-U06 | The page exposes no navigation to other quotes. | in-01 | `display` | settled | none |
| br-U02 | The category label appears in the top-left of the quote card, in a smaller font size than the quote text. | in-01 | `display` `category` | settled | none |
| br-U03 | A quote never overflows its card, at any viewport width. | in-03 | `display` `mobile` | settled | none |
| br-U04 | The footer shows the number of quotes in the pool. | in-02 | `display` `footer` | settled | none |
| br-U05 | When a quote has an attribution, then the attribution renders below the quote text. | in-03 | `display` `attribution` | settled | none |

---

## Registry

| Letter | Area | File | Owner |
| --- | --- | --- | --- |
| M | How to write rules | BUSINESS-RULES-AUTHORING.md | — |
| B | Business | rules/business.md | Product owner |
| U | Interface | rules/interface.md | Design lead |
| A | API | — | Product owner |
| D | Data | — | Product owner |

Add a letter when a rule needs it. Not before. `File` is `—` while an area's rules live in this
document. When an area outgrows it, move its rules to an area file and name the file here; the
checker reads it and keeps every rule in the index above. `Owner` is who settles that area's open
rules.

Retire an ID. Never reuse one — rule or intent.

---

## br-D01

kind: invariant | serves: in-04 | status: settled

No code formatter processes `QUOTES.md`.

`#quotes` `#content`

**Tests**

- D01.1 — Given the editor formats Markdown on save. When `data/QUOTES.md` is saved. Then it is unchanged.
- D01.2 — Given Prettier runs on the project. When it processes files. Then it skips the `data/` folder.

> Fails if a blank line appears between a quote's text and its attribution after a save.

**Design notes**

- The editor setting and `.prettierignore` hold this rule. The parser also rejoins an attribution split from its quote by one blank line, so a formatted file loses no authors either way.

**Source**

- 2026-09-15, Claude Code session. The editor's Markdown formatter inserted blank lines between quote text and attribution, and the parser silently dropped authors.

---

## br-D02

kind: definition | serves: in-04 | given: br-D01 | status: settled
gap: the parser keeps `> ` lines that have no `##` heading above them, as a quote with no category.

A quote entry in `QUOTES.md` is one or more `> text` lines, an optional `- Attribution` line right below them, under a `##` heading. Anything else is skipped without an error.

`#quotes` `#format`

**Examples**

| Test  | In QUOTES.md                                   | Read as     |
| ----- | ---------------------------------------------- | ----------- |
| D02.1 | `> text` lines under a `##` heading            | quote text  |
| D02.2 | `- Name` or `— Name` right after quote text    | attribution |
| D02.3 | a block with no `> ` lines                     | skipped     |
| D02.4 | `> ` lines with no `##` heading above them     | skipped     |

> Fails if a malformed entry causes a parse error, or becomes a quote with no category.

**Source**

- 2026-09-21, Claude Code session. The format was implicit in the parser. Writing it down prevents silent loss when quotes are added in the wrong format.
- 2026-09-22, fresh-eyes review. Added D02.4. A block with no heading has no category, which is invalid.
- 2026-10-11, ledger check against the code. The parser does not skip D02.4's case, and an older parser test relied on it.

---

## br-A01

kind: invariant | serves: in-02 | given: br-B04, br-B07 | status: settled

A browser may reuse a cached page for at most five minutes, and never past UTC midnight. After that it checks with the server, which sends the page again only if it changed.

`#caching` `#performance`

**Examples**

| Test  | Request                                  | At (UTC) | Browser may reuse it for |
| ----- | ---------------------------------------- | -------- | ------------------------ |
| A01.1 | the page                                 | 12:00:00 | 300 seconds              |
| A01.2 | the page                                 | 23:58:00 | 120 seconds              |
| A01.3 | `?new_quote=true`, or an error page      | any      | never stored             |

**Tests**

- A01.4 — Given a browser re-checks a page that has not changed. When the server answers. Then it sends 304 with no body.
- A01.5 — Given the page changed since the browser cached it. When the browser re-checks. Then it receives the new page.

> Fails if a returning visitor sees the previous UTC day's quote after midnight, or a deploy takes more than five minutes to reach them.

**Design notes**

- `src/cache.ts` builds `cache-control` for every HTML response: `public, max-age=min(300, seconds to UTC midnight)`, or `no-store`.
- The web framework adds an ETag to every response and answers a matching `If-None-Match` with 304. A01.4 and A01.5 are the framework's behaviour, so no test here names them yet.

**Source**

- 2026-10-02, conversation. The owner asked for browser caching, so a return visit is quicker, with good cache invalidation. Five minutes bounds how long a deploy takes to reach a returning visitor.
