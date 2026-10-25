# Lite spec — Checker

Serves: in-01 (enforcement is computed), in-02 (trust the index), in-03 (nothing waits silently),
in-05 (read one rule or area), in-06 (scan only the repo's own code).

A lite spec is the readable overview of one area. It decides nothing: every decision it mentions
cites the rule that holds it in [`BUSINESS-RULES.md`](BUSINESS-RULES.md), and when the two
disagree, the ledger wins (br-M30). The ledger's lint rules are area L, not covered here.

## The idea in one paragraph

The checker turns a ledger of claims into a ledger of evidence. It reads the code, not the
ledger's opinion of it: a rule is only as enforced as the citations, test names and test results
it can find (br-C03). Everything it writes back is computed, so the index can be trusted without
opening the entries (br-C11), and a run in CI fails when the index is stale (br-C12) or a settled
rule falls short of the level the project requires (br-C14). The rest is about reading less: one
area, one rule, or one area's slice of the index (br-C20, br-C21, br-C22).

## How it fits together

One run, in order:

1. **Read the ledger.** The master's header sets the scan's scope: `Ignore:` paths are never
   read, code or documents (br-C17); `Scan:` paths are read although skipped by default
   (br-C18); a path that does not exist is a warning (br-C19). The registry names the area
   files, which are read too.
2. **Walk the code.** Scanned code is every file with a code extension, shell scripts included,
   outside dependency and build folders, never the ledger and never a copy of the checker
   (br-C16).
3. **Read every rule ID in it, three ways.**
   - Followed by a colon or after `@see`, it is a citation (br-C01).
   - A test ID inside a one-line string is a test name (br-C02).
   - Anything else is a mention, which counts for nothing.

   Whichever it is, an ID that names no rule is an error (br-C08). A test the rule's entry does
   not list is a warning (br-C09), and so is a test ID missing its `br-` prefix (br-C10).
4. **Read the results**, if given: Jest or Vitest JSON, TRX or JUnit XML, recognised by content
   (br-C06). One failure fails the test (br-C05). A results file with no br- test names is a
   warning (br-C07).
5. **Compute each rule's enforcement**: unlinked, linked, tests written, tests pass (br-C03).
   Without results, a rule already at tests pass stays there while its test names exist (br-C04).
6. **Build the index** from the entries (br-C11). `--write` rewrites it (br-C13); `--verify`
   compares and fails on a difference (br-C12).
7. **Report.** The settled rules counted by level, highest first (br-C23), those whose tests do
   not pass yet, what waits on the owner oldest first (br-C15), and known gaps. `--require` sets
   the exit code (br-C14).

Instead of the full report, three modes print less: `--area` (br-C20), `--rule` (br-C21) and
`--index` (br-C22).

| Part in `ledger-check.ts`           | What it does                                     | Rules                  |
| ----------------------------------- | ------------------------------------------------ | ---------------------- |
| `setting()`, `walk()`               | Header settings; which files are scanned         | br-C16, br-C17, br-C18, br-C19 |
| `stringSpans()`, `isCitation()`, `scanCode()` | Citations, test names and mentions     | br-C01, br-C02, br-C08, br-C09, br-C10 |
| `readResults()` and the `*Outcomes()` readers | Test results, by format                | br-C05, br-C06, br-C07 |
| `main()`, the level computation, `cellFor()` | Enforcement                             | br-C03, br-C04         |
| `renderIndex()`                     | The index                                        | br-C11, br-C12, br-C13 |
| `main()`, the report                | Counts, waiting list, gaps, exit code            | br-C14, br-C15, br-C23 |
| `areaLetters()`, `aboutArea()`      | Narrowing to areas                               | br-C20, br-C22         |

## Why these rules work together

**Evidence only rises with proof.** A citation says where a rule lives, a test name says a test
exists, and a result says it passed (br-C01, br-C02, br-C03). Nothing in the ledger can claim a
level its code does not reach. A test name with no citation still counts as tests written, because the
test is the proof and the citation only a pointer; the missing pointer is a warning.

**Sticky "tests pass" is safe because CI always has results.** br-C04 keeps a quick local run
from dropping every rule to tests written. It can hide a newly failing test only until the next run with
results, and CI runs with results every time. br-C05 makes sure that run cannot be fooled by one
passing result among several.

**A gap does not lower the level.** `--require` counts the level and nothing else (br-C14), so
`tests pass, gap` meets `--require=tests-pass`. The gap stays visible under _Known gaps_, and br-L15
warns that either the gap is stale or the tests miss it.

**The index is rebuilt locally and verified in CI.** `--write` and `--verify` build the same
table (br-C12, br-C13), so a developer who ran `--write` passes CI, and one who edited a
statement without it does not. CI never rewrites the index (in-02's non-goal).

**Every reference must land somewhere.** br-C08 holds a mention to the same standard as a
citation. That is how a deleted rule's leftovers are found; retired rules stay in the ledger, so
pointing at one is fine.

**Scope is a guess the ledger can correct.** The default scan (br-C16) suits one project per
repo. A repo that ships examples, or copies of the checker, says so in its header (br-C17,
br-C18). The checker never reads a copy of itself unless `Scan:` names that file, which is why
the citations it carries, written for this ledger, never count in a user's project.

**One area can be gated on its own.** With `--area`, the exit code follows what is shown
(br-C20), so `--area=B --require=tests-written` gates area B without waiting for the others. The full
run, without `--area`, still fails on any error anywhere.

## Mechanism

- One TypeScript file, no dependencies, run with `tsx`. A project copies it into `scripts/`;
  this repo's `scripts/check.sh --fix` keeps the examples' copies identical to the asset.
- Code is read line by line with one ID pattern. Strings are found per line, which is why a test
  name must sit on one line (br-C02).
- Results formats are told apart by their content: JSON with `testResults`, XML with
  `TestRun` or `testsuite` (br-C06).
- br-C04 reads the previous Enforcement column from the index being replaced, so a sticky
  "tests pass" needs no state file. It also reads `passing`, the name before 2.10.0.
- The tests in `tests/checker/` run the shipped checker against small throwaway repos, one test
  per test ID. Fixture text never spells out a rule ID, so the checker reading this repo never
  counts a fixture's rule as its own.

## Known issues

- None. Every rule is at tests pass, tested by name in `tests/checker/`.

## History

- 2026-10-22: the ledger was built from the code as observed rules. Building it showed that a
  repo with examples could not scope the scan, which became `Ignore:` and `Scan:` in 2.9.1.
- 2026-10-25: intent review settled every rule. Shell scripts became scanned code and
  passing-with-a-gap a warning (2.9.2).
- 2026-10-25: every rule tested by name and cited where the checker enforces it. A copy of the
  checker is read only when `Scan:` names its file (2.9.3).
- 2026-10-25: the levels renamed unlinked, linked, tests written and tests pass, and the report
  counts settled rules highest first, without empty levels (2.10.0).
