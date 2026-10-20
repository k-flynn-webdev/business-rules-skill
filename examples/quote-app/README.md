# Example: a ledger written after the app existed

Daily Dose shows one quote a day, the same for every visitor, with nothing to scroll. This is
its domain logic: reading quotes from a Markdown file, choosing the quote of the day, and the
page's cache header. It is adapted from a real production app, renamed. The ledger is that
app's real ledger, upgraded from format 2.2.1 to 2.7.0.

The [journal example](../journal-app) shows a ledger written first, with the code built against
it. This one goes the other way. The app was built and shipped first. Its ledger was written
during the build and after it, and parts of it were never confirmed by the owner. Most apps
start here.

```
quote-app/
├── data/QUOTES.md                    ← the quotes; the owner edits this file
├── specs/
│   ├── BUSINESS-RULES.md             ← the master: intents, glossary, index of every rule, registry,
│   │                                    and the Data and API rules
│   ├── rules/business.md             ← area B: the Business rules
│   ├── rules/interface.md            ← area U: the Interface rules
│   ├── BUSINESS-RULES-AUTHORING.md   ← how to read, cite and write rules, installed from the skill
│   └── ARCHITECTURE.md               ← a spec from before the ledger. Left in on purpose.
├── src/
│   ├── quotes.ts, cache.ts           ← code that cites rules
│   └── *.test.ts                     ← tests named after test IDs
└── scripts/                          ← the checker and the audio script
```

The ledger is split into area files, to show how a large product keeps its ledger readable. The
registry in the master gives Business and Interface their own files and owners; Data and API stay
in the master. The index in the master still lists all 16 rules, and the checker reads every file.
A change to the home page reads the master and `rules/interface.md`, about 3.8k tokens, instead of
the whole 6.4k-token ledger it was before the split. See _Area files_ in the skill.

## Run it

```sh
npm ci
npm test                 # 23 tests
npm run typecheck
npm run ledger           # run the tests, rebuild the index, report enforcement
npm run ledger:verify    # what CI runs: fails if the index is stale
npm run ledger:audio     # a listening script of the intents and rules
```

`npm run ledger` prints:

```
Ledger: specs/BUSINESS-RULES.md and 2 area files: specs/rules/business.md, specs/rules/interface.md
Rules: 16 active (0 observed, 0 open, 16 settled), 0 retired. Intents: 6 (5 observed, 1 settled).
Settled enforcement: 8 none, 2 cited, 0 tested, 6 passing.
Other documents beside the ledger: 1 checked for rule and intent IDs.

Settled rules not yet passing:
  in-04
    br-D01  none — missing tests: D01.1, D01.2
    br-D02  cited — missing tests: D02.4
  …
Waiting on the owner (5 observed intents), oldest first:
  in-01   observed (since 2026-10-01, …)
  in-03   observed (since 2026-10-01, …)
  …
Known gaps:
  br-D02  the parser keeps `> ` lines that have no `##` heading above them, as a quote with no category.

Warnings (1):
  1 document beside the ledger names no intent: specs/ARCHITECTURE.md. …
```

## What the report says

Read the report top down. Each part is something the ledger caught that nothing else in the
project would have.

**Every rule is settled, but five of six intents are not.** The rules were decided one at a
time, as the build needed them. The intents were drafted later, from the product brief, and only
in-02 was ever confirmed. So sixteen decisions rest on five guesses about what the product is
for. The checker lists the guesses under _Waiting on the owner_, oldest first, so they cannot sit
there unnoticed. The next step is an intent review: half an hour with the owner, and every rule
above it stands on something confirmed.

**Eight rules are `none`.** Seven of them are about the page itself: one quote, no navigation,
the category label smaller than the quote, no overflow on a phone, no cookies. This example has
no UI, so nothing here cites them. The real app had none of these tested either. `none` says so
honestly; a spec would have said nothing. A browser test that names U01.1, U03.2 and B06.1 would
move them on. br-D01 is about editor and formatter settings, which a unit test cannot hold.

**br-D02 has a gap.** The ledger says `> ` lines with no `##` heading above them are skipped,
because a quote with no heading has no category. The parser keeps them anyway. An older parser
test even relied on it. Writing D02 as an examples table made the case visible: row D02.4 is the
only row with no test in code, and the gap says why.

**br-A01 is `cited`.** Rows A01.1 to A01.3 are tested in `src/cache.test.ts`. Tests A01.4 and
A01.5 are about ETags and 304 responses, which the web framework handles. Its design note says
so. The rule is still the owner's decision; until something tests it, the checker reports it as
`cited` rather than `passing`.

**`ARCHITECTURE.md` contradicts the ledger.** It is the spec from before the ledger. It says the
quote follows the user's local date; br-B04 says UTC, decided later on purpose. It names
Next.js, and the app was moved to another framework. It plans a share image that no rule covers. The
checker cannot read prose, but it can see that the document names no intent and cites no rule,
which is a strong sign it has not been touched since the ledger arrived. The fix is to delete
it, or rewrite it as a lite spec that names its intents and cites rules for every decision.

## A tour of the ledger

| Look at         | It shows                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| in-01 … in-06   | **Observed intents**, drafted from a product brief. Only in-02 is settled; its source says when and why.      |
| in-02           | An intent **rewritten when a decision changed**: random per page load became one quote per UTC day.          |
| br-B04          | A **definition with a superseded source**. The old behaviour stays in the source with the date it ended.      |
| br-B07          | A behaviour whose `given:` names two rules, so it restates neither.                                           |
| br-B01, br-B05  | **One test per reason to fail** (br-M32). B01 used to repeat B05's missing-file test; it takes B05 as given now. |
| br-D02          | An **examples table** where each row is a test, and a `gap:` on the one row the code breaks.                  |
| br-A01          | Example rows for the numbers, plus two written tests for what the rows can't show.                            |
| br-U02          | A test that pins an ambiguous word: "subordinate" means a smaller font size, not just a lighter colour.       |
| br-U01, br-U06  | A rule **split in two** in review, because a rogue link and two rendered quotes fail for different reasons.   |
| br-D01          | A rule about tooling, held by editor settings, with a design note on the parser's second line of defence.      |

## Upgrading the ledger from 2.2.1

The real ledger was on format 2.2.1. The upgrade to 2.7.0 removed the _Recent changes_ table,
because each rule's source lines and git keep the history. It moved the authoring rules out to
`BUSINESS-RULES-AUTHORING.md` and let the checker build the index. It turned D02 and A01 into
examples tables. It dropped tests that another rule already held. No decision changed. The one
new fact, the D02 gap, came from running the checker against the code for the first time.
