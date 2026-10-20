# Area U — Interface (Daily Dose)

Area file of [`BUSINESS-RULES.md`](../BUSINESS-RULES.md): intents, glossary, registry and the index of
every rule live there. How to read and write these rules: [`BUSINESS-RULES-AUTHORING.md`](../BUSINESS-RULES-AUTHORING.md).

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

