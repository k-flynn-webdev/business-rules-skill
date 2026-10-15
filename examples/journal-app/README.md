# Example: a journal app with a business rules ledger

A small journaling app's domain logic (tracks, streaks, an anniversary card), built against a
business rules ledger. It is adapted from a real production app that was rebuilt with this skill;
the rules here are a trimmed selection of its real ones, with their real reasons.

There is no UI or server. That is deliberate: the point is how the ledger, the code and the tests
connect, and that fits in a few small files.

```
journal-app/
├── specs/
│   ├── BUSINESS-RULES.md              ← the ledger: intents, glossary, index, rules
│   ├── BUSINESS-RULES-AUTHORING.md    ← how to write rules (br-M), installed from the skill
│   ├── lite-spec-streaks.md           ← a readable overview that decides nothing
│   └── lite-spec-anniversary-card.md
├── src/
│   ├── tracks.ts, streaks.ts, …       ← code that cites rules: `// br-B02:` and `@see br-B07`
│   └── *.test.ts                      ← tests named after test IDs: "br-B02.1 …"
└── scripts/
    ├── ledger-check.ts                ← builds the index and computes enforcement
    └── audio-ledger.ts                ← reads the ledger aloud, intent by intent
```

## Run it

```sh
npm ci
npm test                 # 36 tests
npm run typecheck
npm run ledger           # run the tests, rebuild the index, report enforcement
npm run ledger:verify    # what CI runs: fails if the index is stale
npm run ledger:audio     # a listening script of the intents and rules
```

`npm run ledger` prints a report like this:

```
Rules: 17 active (1 observed, 1 open, 15 settled), 1 retired. Intents: 5 (5 settled).
Settled enforcement: 5 none, 1 cited, 0 tested, 9 passing.
Other documents beside the ledger: 2 checked for rule and intent IDs.

Settled rules not yet passing:
  in-04
    br-B07  cited — missing tests: B07.5
    br-B16  none — missing tests: B16.1
  in-03
    br-B14  none, gap — missing tests: B14.1, B14.2
  …
Waiting on the owner (1 observed rule, 1 open rule), oldest first:
  br-U02  observed (since 2026-09-25, …)
  br-B22  open, 3 questions (since 2026-10-02, …)

Known gaps:
  br-B14  no erasure script exists; requests would be handled by hand.
  br-D05  the admin track browser shows track text.
```

That report is the work list. Every settled rule that is not `passing` is work left, every
`gap` is a known way the code does not do what the rule says yet, and everything waiting on the
owner is a decision nobody has made.

## A tour of the ledger

Open [`specs/BUSINESS-RULES.md`](specs/BUSINESS-RULES.md). Each part of the skill shows up in at
least one rule:

| Look at       | It shows                                                                                                                   |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| in-01 … in-05 | **Intents**: the user outcome, who it is for, what "broken" looks like, and **non-goals** that settle arguments early.     |
| Glossary      | Each domain term defined once. "Day", "open streak" and "character" each caused a real bug before they were pinned down. |
| Index         | **Built by the checker** from the rule entries. Nobody edits it.                                                           |
| br-B06        | A **definition** with **worked examples**. Each examples row is a test (`B06.1` …), tested in `src/streaks.test.ts`.      |
| br-B02        | **Boundary tests**: just below, at and just above both limits, plus the emoji case that made "character" a glossary term. |
| br-B07        | Example rows *and* a written test. B07.5 has no test in code yet, so the rule is `cited`, not `passing`.                  |
| br-B08        | A **decision table** and a **tunable number**: the threshold is config, the tests state 7 themselves (br-M31).            |
| br-B05, A04   | **`attended: required`**: an agent must not change these without the owner present. The source says why.                 |
| br-B14, D05   | **`gap:`**: the rule is settled, the code does not conform yet, and the ledger says so out loud.                          |
| br-B16        | A **stored-value invariant** (br-M23): stored equals recomputed. Its design note points at the lite spec.                 |
| br-B11        | A **retired** rule, kept with the reason it was wrong, so nobody brings it back.                                          |
| br-B21        | A rule born while building: the ledger didn't say whether to trim, so the build stopped and asked.                        |
| br-B22        | An **open** rule: its questions are written down, and it stays open until each has a testable answer.                    |
| br-U02        | An **observed** rule read out of the code, flagged `suspect`: a hard-coded 20 nobody has confirmed.                       |
| br-B10        | A design note that **points at a spec** instead of restating it, so a change to the card's look needs no ledger edit.     |

## How the pieces connect

Take br-B02, track length:

1. **The rule** in the ledger states the decision, its source, and eight examples, each a test.
2. **The code** cites it where it is enforced, in `src/tracks.ts`:
   ```ts
   // br-B02: characters are UTF-16 code units, as the browser counts them. An emoji can be 2.
   if (text.length < MIN_CHARS) return { ok: false, error: … };
   ```
3. **The tests** are named after the test IDs, in `src/tracks.test.ts`:
   ```ts
   ["br-B02.7 100 emoji, 200 characters, are allowed", wave.repeat(100), true],
   ```
4. **The checker** finds the citation and the eight named tests, reads the test results, and
   writes `passing` into the index.

`git grep -n "br-B02"` now returns the rule, the code and every test, in one search.

## Specs alongside the ledger

The two `lite-spec-*.md` files are what a spec looks like next to a ledger. Each names the
intents it serves, explains how its area fits together, and cites a rule for every decision it
mentions. They own detail the ledger points at (how the anniversary card looks, how streaks will
be stored), and they decide nothing.

The checker reads them too. A rule or intent ID that names nothing is a warning, and so is a
document beside the ledger that names no intent: usually an old spec nobody has updated. The
[quote-app example](../quote-app) has one.
