# Business Rules Ledger

A skill for Claude that keeps your product's decisions in a **business rules ledger**: a living,
grep-able list of numbered rules that your code cites, your tests are named after, and a checker
verifies.

> A spec tells you what someone once intended. A ledger tells you which of those intentions the
> code is currently keeping.

## Quick start

1. **Install.** Copy the `business-rules-ledger` folder into `~/.claude/skills/` for Claude Code,
   or upload the zip in Claude's settings. See [Install](#install).
2. **Write a decision down.** In your project, tell Claude: _"Write this down: blank entries
   should be rejected."_ It drafts the rule and, if there is no ledger yet, offers to start one.
3. **See what the code keeps.** Ask _"what's left?"_. Claude offers to install the checker, then
   reports which rules the code enforces and which it does not yet.
4. **Look up one rule.** `npx tsx scripts/ledger-check.ts --rule br-B02`.

Then keep the five [day-to-day habits](#day-to-day). The rest of this page explains why it works.

---

## The situation

Working with a coding agent, decisions get made fast and quietly. "Should blank text be
rejected or trimmed?" gets answered in a line of code, by whoever happened to write it, and the
answer lives nowhere else. Weeks later nobody can say whether that behaviour was chosen or
accidental, and the agent cannot either.

The decisions are there, but they are scattered. Some are in a spec, some in a ticket thread,
some in a notes file, most only in the code. Each place fails in its own way:

- **Specs** are good at explaining an area, and they still have a place beside the ledger. As the
  only record of decisions they are weak: prose cannot be falsified, so nobody checks it, and it
  drifts from the code soon after it is written.
- **Tests** record what the code does, not what anyone decided, and they cannot show what is
  missing. There is no test for the rule nobody wrote.
- **Tickets and chat** hold the reason for a decision, and then scroll away. Nobody finds them
  again, least of all an agent.
- **Notes files** hold the best reasoning and have the shortest half-life. Nothing ties them to
  the code.

When the same decision is written in three places, the three copies drift apart, and nobody
knows which one is true. When it is written nowhere, the next person decides it again,
differently.

## The idea: every decision in one place

The ledger is the one place where decisions live. Each decision is written once, as a numbered
rule of one or two sentences, with its tests and the reason it exists. Everything else points at
it: the code cites the rule where it enforces it, the tests are named after it, and any document
that mentions the decision cites its ID instead of restating it.

Consolidating decisions this way buys four things:

- **One place to look.** `git grep -nw "br-B02"` returns the rule, the code that enforces it and the
  tests that prove it, or [any one of them](#searching-by-id). You, a reviewer and an agent all
  read the same answer.
- **One place to change.** Amend the rule, and every document that cites it is still right. A
  decision that is copied into a spec and a ticket is three edits, and someone forgets one.
- **A clear winner.** When a spec, a ticket or the code disagrees with the ledger, the ledger
  wins and the other is fixed. There is no argument about which copy is current.
- **Visible gaps.** Each rule is small enough to pass or fail on its own, so a checker can say
  which rules the code keeps and which it does not yet. A question the ledger does not answer
  is visible too: the agent stops and asks, and the answer becomes a rule instead of a guess.

A ledger is the notes file with two things added: **an ID per decision**, and **a checker that
keeps reporting whether the code still agrees**.

## What a rule looks like

```markdown
## br-B02

kind: invariant | serves: in-01 | given: br-B21 | status: settled

Track text is between 2 and 200 characters, counted after trimming.

`#track` `#validation`

**Examples**

| Test  | Text, after trimming | Characters | Result   |
| ----- | -------------------- | ---------- | -------- |
| B02.1 | `x`                  | 1          | rejected |
| B02.2 | `xx`                 | 2          | allowed  |
| B02.6 | 201 × `x`            | 201        | rejected |
| B02.7 | 100 × 👋             | 200        | allowed  |

> Fails if a track under 2 or over 200 characters is stored, or one from 2 to 200 is refused.

**Source**

- 2026-09-24, review. Characters are UTF-16 code units, as the browser counts them, so the
  counter and the server agree.
```

The code cites the rule where it enforces it, and each test is named after a test ID:

```ts
// br-B02: characters are UTF-16 code units, as the browser counts them.
if (text.length > MAX_CHARS) return { ok: false, error: `Keep it to ${MAX_CHARS} characters.` };

it("br-B02.7 100 emoji, 200 characters, are allowed", () => { … });
```

`git grep -nw "br-B02"` returns the rule, the code and the tests together. The checker reads the same
IDs and writes each rule's enforcement into the ledger's index:

| Enforcement | Meaning                                                 |
| ----------- | ------------------------------------------------------- |
| `none`      | Written down. No code cites it.                         |
| `cited`     | Code cites it, but not every test in the ledger exists. |
| `tested`    | Every test in the ledger has a test named after it.     |
| `passing`   | Those tests ran and passed in the results you gave it.  |

### Reading the IDs

| ID       | What it is                                                                                   |
| -------- | -------------------------------------------------------------------------------------------- |
| `in-01`  | An intent: what a user should be able to do. Every rule serves one.                          |
| `br-B02` | A rule. The letter is its area: **B** business, **U** interface, **A** API, **D** data. Add letters as you need them. |
| `B02.1`  | A test of br-B02, as the ledger lists it. In code the test is named `br-B02.1`.              |
| `br-M22` | An authoring rule: how to write rules. These live in `BUSINESS-RULES-AUTHORING.md`, with how to read and cite the ledger. |

### Searching by ID

The quickest way to see one rule is the checker:

```
$ npx tsx scripts/ledger-check.ts --rule br-B02
br-B02  settled, passing
Track text is between 2 and 200 characters, counted after trimming.

Entry:     specs/BUSINESS-RULES.md:232
Serves:    in-01
Tags:      track, validation

Cited in code:
  src/tracks.test.ts:10
  src/tracks.ts:24
  src/tracks.ts:30

Tests (8 of 8 in code):
  br-B02.1  src/tracks.test.ts:12
  br-B02.2  src/tracks.test.ts:13
  …
```

With `"rule": "tsx scripts/ledger-check.ts --rule"` in `package.json`, that is `npm run rule
br-B02`. The skill adds the script when it installs the checker.

Without the checker, `git grep` finds the same things. Each place an ID appears has its own
shape, so you can search for one kind at a time:

| You want                              | Shape                      | Command                                                        |
| ------------------------------------- | -------------------------- | -------------------------------------------------------------- |
| Everything about the rule             | `br-B02` anywhere          | `git grep -nw "br-B02"`                                        |
| Just the rule, in one line            | its row in the index       | `git grep -h "^\| br-B02 \|"`                                  |
| The code that enforces it (citations) | `br-B02:` or `@see br-B02` | `git grep -nE "br-B02:\|@see +br-B02([^.0-9]\|$)" -- ':!*.md'` |
| Its tests                             | `br-B02.1`, `br-B02.2`, …  | `git grep -nE "br-B02\.[0-9]+" -- ':!*.md'`                    |

`git grep` searches only files git tracks, so `node_modules` and test-result files stay out of
the answer. `-w` stops `br-B02` matching `br-B020`. `-- ':!*.md'` leaves out the ledger and other
documents, so the last two return only code. Only `br-B02:` and `@see br-B02` count as citations;
any other mention does not count as enforcement. To print a rule's whole entry from the ledger,
see [Advanced searches](#advanced-searches).

## Where everything else lives

Consolidating decisions does not mean putting everything in the ledger. Each kind of thing has
its own home:

| Question                   | Where it lives                          |
| -------------------------- | --------------------------------------- |
| Why?                       | Intents, in the ledger                  |
| **What must it do?**       | **Rules, in the ledger**                |
| Is it true yet?            | The checker                             |
| How is it built?           | Design notes, or the lite spec          |
| How does the area fit?     | Lite spec                               |
| How does it look?          | Lite spec, or a design guide            |
| What work is planned?      | Tickets                                 |

Only rules decide. Everything else points at them, and loses when it disagrees.

**Lite specs are encouraged.** A lite spec is a one-page overview of one area, beside the
ledger: what the area is for, how its parts fit, the reasoning that spans several rules, and the
mechanism worth more than a line. It explains and decides nothing. Every decision it mentions
cites the rule that holds it, and a decision with no rule ID is a missing rule.

**UI and visual design go in the lite spec, not the ledger.** Layout, spacing, colour, type and
component choice are not logic, and a rule about them would be tested by eye, not by code. What
the user relies on stays a rule: that an error is shown, when a button is disabled, the wording
when the wording is a decision. The test is simple: if the product would _behave_ differently,
it is a rule; if it would only _look_ different, it belongs in the lite spec.

So the ledger stays short and strict, and the documents around it stay readable. The ledger
holds the decisions. Everything else explains them.

## Tickets in the decision loop

Tickets are where most decisions start. Someone works a ticket, hits a question the ticket does
not answer, and decides it in the code. The ledger pulls that decision back into the loop:

1. **The ticket raises the question.** While working it, you describe how something should
   behave. The skill drafts the rule from your words, or records it as `open` with the question
   written under it, so it waits for an answer instead of being guessed.
2. **The rule cites the ticket.** Its source line names the ticket and the reason, so the "why"
   outlives the ticket thread (`2026-08-02, TICK-118. Venues were cancelling on the Friday…`).
3. **The ticket cites the rule.** Its acceptance criteria become rule IDs, `br-B02` and
   `br-B05`, not a paraphrase. When a rule is amended, the ticket is still right.
4. **The checker closes the loop.** The ticket is done when its rules reach `passing`. A rule the
   code does not keep yet carries a `gap:` line, which can name the ticket that will fix it.

So the tracker keeps what it is good at — planning, ownership, status — and stops being a place
where decisions get lost. A new ticket that contradicts a rule shows up as a conflict to settle,
not as a quiet change in behaviour.

## Day to day

Five habits. Most are one line.

- **Before you change something,** read the rules it touches: `npm run rule br-B02`, or ask
  Claude _"what are the rules for tracks?"_.
- **In code,** cite the rule where you enforce it: `// br-B02: …` or `@see br-B02`.
- **In tests,** name each test after its test ID: `it("br-B02.1 1 character is rejected", …)`.
- **When the ledger does not answer,** do not guess. Say _"write this down"_, or leave the rule
  `open` with the question under it.
- **Before the PR,** run the checker. In CI, run the tests with a results file, then
  `ledger-check.ts --results=… --verify --require=tested`.

## When the ledger grows

A ledger stays one file while it is small. Past about 100 rules, move areas into **area files**,
so a reader loads only what the work touches:

```
specs/BUSINESS-RULES.md      the master: intents, glossary, the index of every rule, registry
specs/rules/billing.md       one area's rules, and nothing else
specs/rules/accounts.md
```

- **The registry says where each area lives,** and who owns it: `| B | Billing | rules/billing.md | @payments |`.
- **IDs never change,** so code, tests and tickets that cite a rule stay right when it moves.
- **One index, in the master, lists every rule.** The checker builds it from every file, fails CI
  when it is out of date, and reports a missing file, a rule in the wrong file or a duplicate ID.
- **Each owner gets their own report.** `--area` lists the areas with their owners and what is
  waiting on each; `--area=B` shows one area's report, and `--area=B --require=tested` gates it in CI.
  `--index --area=B` prints just that area's index rows, and the audio script takes `--area=B` too.
- **What everyone shares lives once,** in `BUSINESS-RULES-AUTHORING.md`: how to read the ledger,
  how to cite it, and the authoring rules. The ledger holds only this product's content.

In the quote example, a change to the interface now reads about 3.8k tokens (the master and one
area file) instead of the whole 6.4k-token ledger. At 500–750 rules the difference is a session
that reads about 45k tokens instead of about 200k.

## Where it came from

This skill grew out of rebuilding a real production app on a new stack. The ledger became the
acceptance list for the rebuild: each piece of work cited its rules, named its tests by ID, and
the checker said what was left. When the ledger did not answer a question, the build stopped and
asked, and the answer became a rule instead of a guess.

## What's in this repo

```
business-rules-ledger/        the skill: install this folder
├── SKILL.md                  the full reference Claude reads: modes, formats, judgement calls
├── README.md                 the idea in a few pages
└── assets/
    ├── ledger-template.md            an empty ledger to start from
    ├── business-rules-authoring.md   the authoring rules (br-M), installed beside the ledger
    ├── ledger-check.ts               the checker: builds the index, computes enforcement, lints
    ├── audio-ledger.ts               turns the ledger into a script you can listen to
    └── lite-spec-template.md         a one-page overview of an area, beside the ledger

examples/journal-app/         a small app built against a ledger. Start here.
examples/quote-app/           a ledger written after the app shipped, split into area files
specs/BUSINESS-RULES.md       the skill's own ledger: the rules its checker keeps
scripts/package.sh            builds dist/business-rules-ledger-<version>.zip
scripts/check.sh              one version everywhere; each example's copies match the assets (--fix syncs)
```

## Install

Build the zip, or download it from the repo's releases when there is one:

```sh
./scripts/package.sh        # → dist/business-rules-ledger-2.9.1.zip
```

- **Claude apps (claude.ai, Desktop):** upload the zip as a custom skill in Claude's settings,
  under Capabilities.
- **Claude Code:** copy the `business-rules-ledger` folder into `~/.claude/skills/` for every
  project, or into a project's `.claude/skills/` for that project only.

The skill installs its own scripts into a project when you first ask for them: the checker as
`scripts/ledger-check.ts`, and the authoring rules as `specs/BUSINESS-RULES-AUTHORING.md`. Both
need only Node and `tsx`.

## Using it

Talk to Claude normally; the skill triggers on what you are doing.

| You say                                                   | What happens                                                                                                              |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| "Write this down: blank entries should be rejected."      | Drafts the rule from your words, checks it against intents and the glossary, asks what's missing.                         |
| "How should this behave when…?" while working on a ticket | Captures the decision as a rule, `open` with questions if it isn't settled.                                               |
| "Build a ledger from this codebase."                      | Reads rules out of the code as `observed`, flags likely accidents as `suspect`.                                           |
| "Intent review"                                           | Walks the observed rules with you: intended, accident (becomes a `gap`), or doesn't matter.                               |
| "Grill me"                                                | Settles open rules until every answer is testable: one question at a time, or a numbered batch you answer in one message. |
| "Fresh eyes" / "review the ledger"                        | Looks for rot: stale sources, undefined terms, rules over two sentences, specs that contradict rules.                     |
| "What's left?" / "which rules are enforced?"              | Runs the checker and reports settled rules below `passing`, grouped by intent, and the gaps.                              |
| "Write a spec for…"                                       | Writes a lite spec that cites a rule for every decision, capturing missing rules first.                                   |
| An area grows past about eight rules                      | Offers a lite spec, so the flow, mechanism and look and feel move out and each rule stays short.                          |
| "Read me the rules"                                       | Produces a listening script: each intent, then the rules that serve it.                                                   |

## The checker

```sh
npx tsx scripts/ledger-check.ts                         # report
npx tsx scripts/ledger-check.ts --write                 # rebuild the index from the rules
npx tsx scripts/ledger-check.ts --results=results.json  # test results decide "passing"
npx tsx scripts/ledger-check.ts --verify                # exit 1 if the index is stale
npx tsx scripts/ledger-check.ts --require=tested        # exit 1 if a settled rule has no tests
npx tsx scripts/ledger-check.ts --tag=privacy           # list the rules carrying a tag
npx tsx scripts/ledger-check.ts --rule br-B02           # one rule: entry, citations, tests
npx tsx scripts/ledger-check.ts --area                  # list the areas: file, owner, what is waiting
npx tsx scripts/ledger-check.ts --area=B                # the report for one area
npx tsx scripts/ledger-check.ts --index --area=B        # one area's rows of the index
npx tsx scripts/ledger-check.ts --waiting               # list everything waiting on the owner, not only the oldest 10
```

It reads Jest and Vitest JSON, TRX (`dotnet test --logger trx`) and JUnit XML (pytest, Go via
gotestsum), so it works across a TypeScript front end and a .NET or Python back end in one repo.
In CI, run the tests with a results file and then `--verify --require=tested`.

`--require` counts the enforcement level and nothing else. **A rule with a `gap:` still meets it**:
`passing, gap` meets `--require=passing`. The gap stays in the report under _Known gaps_, and the
checker warns when a rule passes with one, because either the gap is stale or the tests miss it.

## The examples

[`examples/journal-app`](examples/journal-app) is the quickest way to see it working. It is the
domain logic of a journaling app, adapted from the production app this skill was built on: 17
rules across five intents, real sources, real code and 36 tests. `npm ci && npm run ledger`
rebuilds its index and shows every enforcement level, plus open, observed and retired rules.
Its README is a guided tour, rule by rule.

[`examples/quote-app`](examples/quote-app) is the other common case: an app that shipped first,
with a ledger written during and after the build. It is a quote-of-the-day app, renamed from a
real one, with its real ledger upgraded to the current format. Its report shows what a ledger
catches on an existing app: rules settled on intents nobody confirmed, page rules nothing
tests, a gap the first checker run found, and an old spec beside the ledger that contradicts it.
Its ledger is split into a master and two area files, to show how a larger product is laid out.

The skill also keeps a ledger of its own, [`specs/BUSINESS-RULES.md`](specs/BUSINESS-RULES.md):
the rules its checker keeps, read out of `ledger-check.ts` and waiting for review like any
ledger built from code. `npx tsx business-rules-ledger/assets/ledger-check.ts` checks it. Its
header uses `Ignore: examples/`, because the examples have ledgers of their own, and
`Scan: business-rules-ledger/assets/`, because here the checker is the product.

## Versions

The skill is at **2.9.1**. Every ledger states its format (`Format: business-rules-ledger 2.9.1`),
and the skill offers to upgrade an older ledger, listing the changes first. What changed in each
version is in the changelog at the end of [`SKILL.md`](business-rules-ledger/SKILL.md).

## Advanced searches

Print a rule's whole entry, from its heading to the next rule: statement, examples, Fails if and
source.

```sh
awk '/^## br-B02$/{p=1} p&&/^## /&&!/^## br-B02$/{exit} p' specs/BUSINESS-RULES.md
```

It starts printing at the `## br-B02` heading and stops at the next `## ` heading. Change both
`br-B02`s to the rule you want.

## Status

Early, in daily use, and being built on. Issues and ideas are welcome.

## License

MIT. See [`LICENSE`](LICENSE).
