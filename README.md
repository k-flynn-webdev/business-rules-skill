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

The usual places for decisions do not hold up:

- **Specs** are prose. Prose cannot be falsified, so nobody checks it, and it drifts from the code
  the week it is written.
- **Tests** record what the code does, not what anyone decided, and they cannot show what is
  missing. There is no test for the rule nobody wrote.
- **Notes files** hold the best reasoning and have the shortest half-life. Nothing ties them to
  the code.

A ledger is the notes file with two things added: **an ID per decision**, and **a checker that
keeps reporting whether the code still agrees**.

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

`grep -r "br-B02"` returns the rule, the code and the tests together. The checker reads the same
IDs and writes each rule's enforcement into the ledger's index:

| Enforcement | Meaning                                                    |
| ----------- | ---------------------------------------------------------- |
| `none`      | Written down. No code cites it.                            |
| `cited`     | Code cites it, but not every test in the ledger exists.    |
| `tested`    | Every test in the ledger has a test named after it.        |
| `passing`   | Those tests ran and passed in the results you gave it.     |

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
scripts/package.sh            builds dist/business-rules-ledger-<version>.zip
scripts/check.sh              one version everywhere; the example's copies match the assets (--fix syncs)
```

## Install

Build the zip, or download it from the repo's releases when there is one:

```sh
./scripts/package.sh        # → dist/business-rules-ledger-2.6.0.zip
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

| You say                                                       | What happens                                                                                  |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| "Write this down: blank entries should be rejected."          | Drafts the rule from your words, checks it against intents and the glossary, asks what's missing. |
| "How should this behave when…?" while working on a ticket      | Captures the decision as a rule, `open` with questions if it isn't settled.                   |
| "Build a ledger from this codebase."                          | Reads rules out of the code as `observed`, flags likely accidents as `suspect`.              |
| "Intent review"                                               | Walks the observed rules with you: intended, accident (becomes a `gap`), or doesn't matter.   |
| "Grill me"                                                    | Settles open rules until every answer is testable: one question at a time, or a numbered batch you answer in one message. |
| "Fresh eyes" / "review the ledger"                            | Looks for rot: stale sources, undefined terms, rules over two sentences, specs that contradict rules. |
| "What's left?" / "which rules are enforced?"                  | Runs the checker and reports settled rules below `passing`, grouped by intent, and the gaps.  |
| "Write a spec for…"                                           | Writes a lite spec that cites a rule for every decision, capturing missing rules first.       |
| An area grows past about eight rules                          | Offers a lite spec, so the flow and mechanism move out and each rule stays short.             |
| "Read me the rules"                                           | Produces a listening script: each intent, then the rules that serve it.                       |

## The checker

```sh
npx tsx scripts/ledger-check.ts                         # report
npx tsx scripts/ledger-check.ts --write                 # rebuild the index from the rules
npx tsx scripts/ledger-check.ts --results=results.json  # test results decide "passing"
npx tsx scripts/ledger-check.ts --verify                # exit 1 if the index is stale
npx tsx scripts/ledger-check.ts --require=tested        # exit 1 if a settled rule has no tests
npx tsx scripts/ledger-check.ts --tag=privacy           # list the rules carrying a tag
```

It reads Jest and Vitest JSON, TRX (`dotnet test --logger trx`) and JUnit XML (pytest, Go via
gotestsum), so it works across a TypeScript front end and a .NET or Python back end in one repo.
In CI, run the tests with a results file and then `--verify --require=tested`.

## The example

[`examples/journal-app`](examples/journal-app) is the quickest way to see it working. It is the
domain logic of a journaling app, adapted from the production app this skill was built on: 17
rules across five intents, real sources, real code and 36 tests. `npm ci && npm run ledger`
rebuilds its index and shows every enforcement level, plus open, observed and retired rules.
Its README is a guided tour, rule by rule.

## Versions

The skill is at **2.6.0**. Every ledger states its format (`Format: business-rules-ledger 2.6.0`),
and the skill offers to upgrade an older ledger, listing the changes first. The changelog is at
the end of [`SKILL.md`](business-rules-ledger/SKILL.md).

2.6.0 makes rules quicker to write and shorter to read: a smallest-complete-rule template, a test
only where it can fail for its own reason, lite specs to hold the flow and mechanism of an area,
and numbered batch answers for review sessions.

2.5.0 removed most of what was written twice: the index is built from the rules, a rule's short
fields share one line, example rows are the tests, and there is no change log inside the ledger
(git keeps it).

## Status

Early, in daily use, and being built on. Issues and ideas are welcome.

## License

MIT. See [`LICENSE`](LICENSE).
