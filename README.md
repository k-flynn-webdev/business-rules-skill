# Business Rules Ledger

A skill for Claude that keeps your product's decisions in a **business rules ledger**: a living,
grep-able list of numbered rules that your code cites, your tests are named after, and a checker
verifies.

> A spec tells you what someone once intended. A ledger tells you which of those intentions the
> code is currently keeping.

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
  tests that prove it. You, a reviewer and an agent all read the same answer.
- **One place to change.** Amend the rule, and every document that cites it is still right. A
  decision that is copied into a spec and a ticket is three edits, and someone forgets one.
- **A clear winner.** When a spec, a ticket or the code disagrees with the ledger, the ledger
  wins and the other is fixed. There is no argument about which copy is current.
- **Visible gaps.** Each rule is small enough to pass or fail on its own, so a checker can say
  which rules the code keeps and which it does not yet. A question the ledger does not answer
  is visible too: the agent stops and asks, and the answer becomes a rule instead of a guess.

A ledger is the notes file with two things added: **an ID per decision**, and **a checker that
keeps reporting whether the code still agrees**.

## Where everything else lives

Consolidating decisions does not mean putting everything in the ledger. A ledger that also holds
explanation, mechanism and design becomes the long prose spec it was meant to replace. So each
kind of thing has its own home, and only one of them decides:

| Question                         | Lives in                                                      | Decides?                        |
| -------------------------------- | ------------------------------------------------------------- | ------------------------------- |
| Why does this exist?             | **Intents**, at the top of the ledger                         | No — rules serve them           |
| What must the product do?        | **Rules**, in the ledger                                      | **Yes**                         |
| Is it true yet?                  | **Enforcement**, computed by the checker                      | No — it measures                |
| How is it built?                 | **Design notes** under the rule, or the lite spec when longer | No                              |
| How does this area fit together? | **Lite spec**, one page per area                              | No — it cites rules             |
| How does it look?                | **Lite spec**, or a design guide it links to                  | No                              |
| Fine detail another team owns    | Visual specs, API specs, design guides                        | No — design notes point at them |
| What work is planned?            | **Tickets**, in your tracker                                  | No — they cite rules            |

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

## Where it came from

This skill grew out of rebuilding a real production app on a new stack. The ledger became the
acceptance list for the rebuild: each piece of work cited its rules, named its tests by ID, and
the checker said what was left. When the ledger did not answer a question, the build stopped and
asked, and the answer became a rule instead of a guess.

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

`git grep -nw "br-B02"` returns the rule, the code and the tests together. It searches only
files git tracks, so `node_modules` and test-result files stay out of the answer. The checker reads the same
IDs and writes each rule's enforcement into the ledger's index:

| Enforcement | Meaning                                                 |
| ----------- | ------------------------------------------------------- |
| `none`      | Written down. No code cites it.                         |
| `cited`     | Code cites it, but not every test in the ledger exists. |
| `tested`    | Every test in the ledger has a test named after it.     |
| `passing`   | Those tests ran and passed in the results you gave it.  |

### Searching by ID

Each place an ID appears has its own shape, so you can search for one kind at a time:

| You want                              | Shape                      | Command                                                        |
| ------------------------------------- | -------------------------- | -------------------------------------------------------------- |
| Everything about the rule             | `br-B02` anywhere          | `git grep -nw "br-B02"`                                        |
| Just the rule, in one line            | its row in the index       | `git grep -h "^\| br-B02 \|"`                                  |
| The code that enforces it (citations) | `br-B02:` or `@see br-B02` | `git grep -nE "br-B02:\|@see +br-B02([^.0-9]\|$)" -- ':!*.md'` |
| Its tests                             | `br-B02.1`, `br-B02.2`, …  | `git grep -nE "br-B02\.[0-9]+" -- ':!*.md'`                    |

The index row gives the statement, intent, tags, status and enforcement together. To print the
whole entry, see [Advanced searches](#advanced-searches).

`-w` stops `br-B02` matching `br-B020`. `-- ':!*.md'` leaves out the ledger and other documents,
so the last two return only code. The citation shape is the same one the checker counts: an ID
with no colon and no `@see` is a mention, not a citation, and does not count as enforcement.

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
examples/quote-app/           a ledger written after the app shipped, with what the checker finds
scripts/package.sh            builds dist/business-rules-ledger-<version>.zip
scripts/check.sh              one version everywhere; each example's copies match the assets (--fix syncs)
```

## Install

Build the zip, or download it from the repo's releases when there is one:

```sh
./scripts/package.sh        # → dist/business-rules-ledger-2.7.1.zip
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
npx tsx scripts/ledger-check.ts --waiting               # list everything waiting on the owner, not only the oldest 10
```

It reads Jest and Vitest JSON, TRX (`dotnet test --logger trx`) and JUnit XML (pytest, Go via
gotestsum), so it works across a TypeScript front end and a .NET or Python back end in one repo.
In CI, run the tests with a results file and then `--verify --require=tested`.

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

## Versions

The skill is at **2.7.1**. Every ledger states its format (`Format: business-rules-ledger 2.7.1`),
and the skill offers to upgrade an older ledger, listing the changes first. The changelog is at
the end of [`SKILL.md`](business-rules-ledger/SKILL.md).

2.7.1 keeps that report short on a large ledger: the oldest 10 waiting entries, ages from when an
entry was read, and one warning for every document that names no intent.

2.7.0 makes sure nothing waits silently: the checker lists what is waiting on the owner, oldest
first, and checks the other documents beside the ledger for IDs that name nothing.

2.6.0 makes rules quicker to write and shorter to read: a smallest-complete-rule template, a test
only where it can fail for its own reason, lite specs to hold the flow and mechanism of an area,
and numbered batch answers for review sessions.

2.5.0 removed most of what was written twice: the index is built from the rules, a rule's short
fields share one line, example rows are the tests, and there is no change log inside the ledger
(git keeps it).

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
