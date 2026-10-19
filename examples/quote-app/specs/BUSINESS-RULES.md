# Business Rules Ledger — Daily Dose (example)

Source of truth. Code and tests conform to this document.
Written under the authoring rules in [`BUSINESS-RULES-AUTHORING.md`](BUSINESS-RULES-AUTHORING.md).
Format: business-rules-ledger 2.7.2

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

Built by `scripts/ledger-check.ts --write` from the rule entries below. Do not edit it by hand.

| ID     | Rule                                                                                                                                                                            | Serves | Tags                    | Status  | Enforcement |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------- | ------- | ----------- |
| br-B01 | `QUOTES.md` is the canonical source of quotes. The fallback quote is the only quote in code.                                                                                    | in-04  | `quotes` `content`      | settled | passing     |
| br-B02 | A quote's attribution line is optional.                                                                                                                                         | in-04  | `quotes`                | settled | passing     |
| br-B03 | When a quote is parsed, then its category is the text of the `##` heading above it.                                                                                             | in-04  | `quotes` `category`     | settled | passing     |
| br-B04 | The quote of the day is chosen by the server from the current UTC date. It is the same for every visitor until the next UTC midnight.                                           | in-02  | `quotes` `selection`    | settled | passing     |
| br-B05 | When the pool is empty, then the fallback quote is shown.                                                                                                                       | in-05  | `quotes` `selection`    | settled | passing     |
| br-B06 | The core experience sets no cookies, writes nothing to local storage, and runs no client-side tracking.                                                                         | in-06  | `privacy`               | settled | none        |
| br-B07 | When a page load has the query `new_quote=true`, then it shows a random quote other than the quote of the day, for that page load only.                                         | in-02  | `quotes` `selection`    | settled | passing     |
| br-D01 | No code formatter processes `QUOTES.md`.                                                                                                                                        | in-04  | `quotes` `content`      | settled | none        |
| br-D02 | A quote entry in `QUOTES.md` is one or more `> text` lines, an optional `- Attribution` line right below them, under a `##` heading. Anything else is skipped without an error. | in-04  | `quotes` `format`       | settled | cited, gap  |
| br-U01 | The page displays exactly one quote.                                                                                                                                            | in-01  | `display`               | settled | none        |
| br-U06 | The page exposes no navigation to other quotes.                                                                                                                                 | in-01  | `display`               | settled | none        |
| br-U02 | The category label appears in the top-left of the quote card, in a smaller font size than the quote text.                                                                       | in-01  | `display` `category`    | settled | none        |
| br-U03 | A quote never overflows its card, at any viewport width.                                                                                                                        | in-03  | `display` `mobile`      | settled | none        |
| br-U04 | The footer shows the number of quotes in the pool.                                                                                                                              | in-02  | `display` `footer`      | settled | none        |
| br-U05 | When a quote has an attribution, then the attribution renders below the quote text.                                                                                             | in-03  | `display` `attribution` | settled | none        |
| br-A01 | A browser may reuse a cached page for at most five minutes, and never past UTC midnight. After that it checks with the server, which sends the page again only if it changed.   | in-02  | `caching` `performance` | settled | cited       |

---

## How to read this ledger

- A rule's ID is `br-` + area letter + two digits: `br-B03`. IDs are never reused. Its tests are `B03.1`, `B03.2` here, and `br-B03.1` in code.
- An intent (`in-01`) is a user outcome. A rule's `serves:` names the intents it protects. `given:` names the rules it assumes are true.
- Status: `observed` (read from code, not confirmed), `open` (questions unanswered), `settled` (decided), `retired` (no longer applies, kept for history). Only settled rules are decisions.
- A rule's tests are the rows of its examples table, by the ID in the first column, and the numbered lines under **Tests**.
- `> Fails if` is the condition that proves a rule broken. `gap:` records where the code does not conform yet.
- The index is built from the rule entries by `scripts/ledger-check.ts`, which also computes enforcement. Never edit it by hand.
- A rule's history is in its **Source** lines. The ledger keeps no change log; git does.
- Specs and other documents may describe an area, but decisions live here. When they disagree with this ledger, this ledger wins.
- Before adding or changing a rule, read the authoring rules (br-M) in [`BUSINESS-RULES-AUTHORING.md`](BUSINESS-RULES-AUTHORING.md).

---

## Citing rules in code

The ID is the link. `git grep -n "br-[X][NN]"` returns the rule, its tests, and the code that enforces it.
`scripts/ledger-check.ts` reads the same citations to compute enforcement.

A citation is the ID followed by a colon (`br-B07:`) or after `@see`. Mentioning a rule anywhere
else, such as "(br-B07)" in an explanation, does not count as enforcement.

```js
/**
 * [What the function does.]
 * @see br-[X][NN] [The rule, in one line.]
 */
function doTheThing(...) { ... }
```

```js
// br-[X][NN]: [why this branch exists]
if (condition) throw new SomeError();
```

```js
test("br-[X][NN].1 [the test, in domain terms]", () => {
  // Given [starting state]
  // When [event]
  // Then [outcome]
});
```

```csharp
[Fact(DisplayName = "br-[X][NN].1 [the test, in domain terms]")]  // NUnit: TestCase(TestName = …); MSTest: TestMethod("…")
public void TheTest() { /* Given, When, Then */ }
```

Put the test ID in the test's display name, not the method name. Run .NET tests with
`dotnet test --logger trx` and pass the TestResults folder to the checker's `--results=`.

| Enforcement | Meaning                                                                                 |
| ----------- | --------------------------------------------------------------------------------------- |
| none        | No code cites the rule.                                                                 |
| cited       | Code cites the rule, but not every ledger test has a named test in code.                |
| tested      | Every ledger test has a test named after it in code.                                    |
| passing     | Those tests all passed in the supplied results. This does not prove they test the rule. |

`, gap` means the rule has a known divergence recorded in its `gap:` line.

---

## Registry

| Letter | Area                                                |
| ------ | --------------------------------------------------- |
| M      | How to write rules (in BUSINESS-RULES-AUTHORING.md) |
| B      | Business                                            |
| U      | Interface                                           |
| A      | API                                                 |
| D      | Data                                                |

Add a letter when a rule needs it. Not before.

Retire an ID. Never reuse one — rule or intent.

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

## br-U01

kind: invariant | serves: in-01 | status: settled

The page displays exactly one quote.

`#display`

**Tests**

- U01.1 — Given the page has loaded. When it renders. Then exactly one quote is visible.

> Fails if more than one quote is visible on the page at the same time.

**Source**

- 2026-09-13, product brief. The product is a single forced focus; ending scroll fatigue is the point.
- 2026-09-22, fresh-eyes review. Split from a two-part rule. No navigation is br-U06.

---

## br-U06

kind: invariant | serves: in-01 | status: settled

The page exposes no navigation to other quotes.

`#display`

**Tests**

- U06.1 — Given the page has rendered. When a visitor views it. Then no element navigates to a different quote.

> Fails if any element lets the visitor browse to a different quote.

**Source**

- 2026-09-22, fresh-eyes review. Split from br-U01 (br-M01). A rogue link and two rendered quotes fail for different reasons.

---

## br-U02

kind: invariant | serves: in-01 | given: br-B03 | status: settled

The category label appears in the top-left of the quote card, in a smaller font size than the quote text.

`#display` `#category`

**Tests**

- U02.1 — Given a valid quote. When the card renders. Then a category label appears in the top-left of the card.
- U02.2 — Given a category label the same size as the quote text but a lighter colour. When the card renders. Then the rule is broken.

> Fails if the category label is the same size as the quote text, or larger.

**Source**

- 2026-09-21, Claude Code session. The category adds context without competing with the quote.
- 2026-09-22, grill session. "Visually subordinate" means a smaller font size. A lighter colour or weight alone is not enough.

---

## br-U03

kind: invariant | serves: in-03 | status: settled

A quote never overflows its card, at any viewport width.

`#display` `#mobile`

**Tests**

- U03.1 — Given a quote with a long unbroken string. When the card renders. Then the text wraps inside the card.
- U03.2 — Given a 320px-wide viewport. When the page renders. Then the page body does not scroll sideways.

> Fails if any quote text extends past the card border on any screen width.

**Source**

- 2026-09-21, Claude Code session. Quotes and URLs with no natural break points ran past the card edge on phones. Fixed with `overflow-wrap: break-word`.

---

## br-U04

kind: invariant | serves: in-02 | given: br-B01 | status: settled

The footer shows the number of quotes in the pool.

`#display` `#footer`

**Tests**

- U04.1 — Given a pool of N quotes. When the footer renders. Then it shows `(N)`.
- U04.2 — Given an empty pool and the fallback quote showing. When the footer renders. Then it shows `(0)`.

> Fails if the count shown differs from the number of quotes in the pool.

**Source**

- 2026-09-21, Claude Code session. Read from the code: a low-key sign that the pool is deep.
- 2026-09-22, grill session. The fallback is not a pool member, so an empty pool shows `(0)`.

---

## br-U05

kind: behaviour | serves: in-03 | given: br-B02 | status: settled

When a quote has an attribution, then the attribution renders below the quote text.

`#display` `#attribution`

**Tests**

- U05.1 — Given a quote with an attribution. When the card renders. Then the attribution shows below the quote text.
- U05.2 — Given a quote with no attribution. When the card renders. Then no attribution element renders.

> Fails if a quote's attribution is in the data but not on the page.

**Source**

- 2026-09-21, Claude Code session. br-B02 covered only the case with no attribution. The positive case was missing.

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
