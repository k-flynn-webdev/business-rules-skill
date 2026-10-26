# Business Rules Ledger — business-rules-ledger skill

Source of truth. Code and tests conform to this document.
How to read it, cite it in code and write it: [`BUSINESS-RULES-AUTHORING.md`](BUSINESS-RULES-AUTHORING.md).
Format: business-rules-ledger 2.10.1
Ignore: examples/
Scan: business-rules-ledger/assets/ledger-check.ts

This is the skill's ledger about itself: the rules its checker keeps. The examples have ledgers
of their own, so they are ignored. The checker is the product here, so its file is scanned,
although every other project skips copies of the checker.

---

## Intents

What a user should be able to do, and what would feel broken. Every rule serves at least one.

### in-01

A developer can see how far the code enforces each rule, computed from the code rather than claimed.

`#enforcement`

for: developers and agents building against a ledger
broken when: the index shows a rule at tests pass while one of its named tests is missing or failed.
non-goal: proving that a test checks its rule. Passing means the named tests exist and passed.
status: settled

**Source**

- 2026-10-22, observed: README.md "The bit that makes it stick" and SKILL.md _Enforcement_. Drafted from the docs; not confirmed.
- 2026-10-23, intent review. Confirmed by the owner.
- 2026-10-25, conversation. The levels are renamed unlinked, linked, tests written and tests pass: in the report, "0 none" read as a count of failures, and "tested" sounded as if the tests had run. The old names are still read (br-C04, br-C14).

### in-02

A reader can trust the index as a summary of the ledger without opening every entry.

`#index`

for: anyone who scans the index to find the rules a task touches
broken when: a rule's statement changes, the index still shows the old one, and CI passes.
non-goal: CI rewriting the index. CI verifies; the index is rebuilt locally and committed.
status: settled

**Source**

- 2026-10-22, observed: SKILL.md _The index_ and br-M29. Drafted from the docs; not confirmed.
- 2026-10-23, intent review. Confirmed by the owner.

### in-03

An owner sees what waits on their decision, oldest first, without reading the ledger.

`#waiting`

for: the product owner, or an area's owner
broken when: an observed rule waits weeks for confirmation and the report never mentions it.
non-goal: reminders or notifications outside the report.
status: settled

**Source**

- 2026-10-22, observed: SKILL.md _Open rules_ and the 2.7.0 changelog ("nothing waits silently"). Drafted from the docs; not confirmed.
- 2026-10-23, intent review. Confirmed by the owner.

### in-04

A ledger author hears about a malformed or dangling entry before anyone relies on it.

`#lint`

for: people and agents writing rules
broken when: a rule serves an intent that does not exist, and the checker says nothing.
non-goal: judging whether a rule is right. Meaning is for review mode, not the checker.
status: settled

**Source**

- 2026-10-22, observed: SKILL.md _Enforcement_ ("lints the ledger") and _Review mode_. Drafted from the docs; not confirmed.
- 2026-10-23, intent review. Confirmed by the owner.

### in-05

A reader working on one rule or one area reads only that, however large the ledger grows.

`#scale`

for: developers and agents on a large ledger
broken when: answering "where is br-C01 enforced?" means loading the whole ledger and every area file.
non-goal: a database or server. The ledger stays plain Markdown in the repo, read with grep and changed in a pull request.
status: settled

**Source**

- 2026-10-22, observed: SKILL.md _Area files_ and the 2.8.0 and 2.9.0 changelogs. Drafted from the docs; not confirmed.
- 2026-10-23, intent review. Confirmed by the owner. Non-goal added: a store other than Markdown would lose grep, diff and review.

### in-06

A repo that holds other projects, or copies of the checker, gets a report about its own code only.

`#scan`

for: monorepos, and repos that ship examples with ledgers of their own
broken when: an example's citation counts as enforcement of the repo's own rule, or as an error.
status: settled

**Source**

- 2026-10-22, conversation. Building this repo's own ledger, the examples' citations would have counted against it. The owner asked for an ignore setting inside the ledger.

---

## Glossary

Each domain term, defined once. Rules use these terms exactly.

| Term | Meaning | Defined by |
| --- | --- | --- |
| citation | A rule ID in code followed by a colon, or after `@see`. Marks where the code enforces the rule. | br-C01 |
| mention | Any other rule ID in code. Never counts as enforcement. | br-C01 |
| test name | A test ID with its br- prefix inside a string literal in code, such as `"br-C01.1 …"`. | br-C02 |
| enforcement | How far the code has got with a rule: unlinked, linked, tests written or tests pass. | br-C03 |
| results file | Test results the checker reads to decide tests pass: Jest or Vitest JSON, TRX, or JUnit XML. | br-C06 |
| waiting entry | An observed intent, an observed rule or an open rule: something only the owner can close. | br-C15 |
| scanned code | The code files the checker reads for citations, mentions and test names. | br-C16 |
| master | The ledger file the checker is given. It holds the intents, glossary, index and registry. | br-L11 |
| area file | A file the registry names for an area. It holds that area's rule entries and nothing else. | br-L11 |
| active rule | A rule that is not retired and not an authoring rule (br-M). | br-L01 |

---

## Index

Every rule, in this document or an area file. Built by `business-rules-ledger/assets/ledger-check.ts --write`. Do not edit it by hand.

| ID | Rule | Serves | Tags | Status | Enforcement |
| --- | --- | --- | --- | --- | --- |
| br-C01 | A citation is a rule ID in code followed by a colon, or preceded by `@see`. A list of rule IDs that ends in a colon cites every ID in it. | in-01 | `citation` `enforcement` | settled | tests pass |
| br-C02 | A test name is a test ID with its br- prefix inside a single-line string literal in code. The same text anywhere else is a mention of the rule. | in-01 | `tests` `enforcement` | settled | tests pass |
| br-C03 | A rule's enforcement is tests pass when every ledger test has a test name in code and all of them passed in the results file. Otherwise it is tests written when every ledger test has a test name, linked when code cites the rule, and unlinked when neither holds. | in-01 | `enforcement` | settled | tests pass |
| br-C04 | When the checker runs without a results file, then a rule the index shows at tests pass stays there while every one of its ledger tests still has a test name in code. An index written before 2.10.0 says passing for the same level. | in-01 | `enforcement` `results` | settled | tests pass |
| br-C05 | When any result for a test ID failed, then that test has not passed, even if other results for the same ID passed. | in-01 | `results` `enforcement` | settled | tests pass |
| br-C06 | When the checker is given results, then it reads Jest or Vitest JSON, TRX and JUnit XML from files or directories, comma-separated. It tells the formats apart by their content, not their names. | in-01 | `results` `stacks` | settled | tests pass |
| br-C07 | When a results file holds results but none is named with a br- test ID, then the checker warns and names the file. | in-01 | `results` `stacks` | settled | tests pass |
| br-C08 | When a rule ID in scanned code names no rule in the ledger, then the checker reports an error, whether the ID is a citation, a mention or a test name. Authoring rule IDs (br-M) are exempt. | in-04 | `citation` `lint` | settled | tests pass |
| br-C09 | When scanned code has a test name for a rule whose entry does not list that test, then the checker warns. | in-01 | `tests` | settled | tests pass |
| br-C10 | When a string literal in scanned code holds a test ID without its br- prefix, and the ledger lists that test, then the checker warns that the test is not counted. | in-01 | `tests` | settled | tests pass |
| br-C11 | The index has one row per rule except the authoring rules, retired rules included: the master's rules first, then each area file's in registry order. Every cell but Enforcement comes from the rule's entry. | in-02 | `index` | settled | tests pass |
| br-C12 | When the checker runs with --verify and the index's cells differ from what --write would build, then it exits 1 and names each row that differs. Spacing and padding do not count as differences. | in-02 | `index` `ci` | settled | tests pass |
| br-C13 | When the checker runs with --write and the index differs, then it rewrites the index table and leaves every other line of the master unchanged. | in-02 | `index` | settled | tests pass |
| br-C14 | When the checker runs with --require at a level, then it exits 1 if any settled rule's enforcement is below that level. The level is named with hyphens (tests-pass) or by its name before 2.10.0 (passing). | in-01 | `enforcement` `ci` | settled | tests pass |
| br-C15 | When the ledger has waiting entries, then the report lists them oldest first: an observed entry dated by its oldest source line, an open rule by its newest. It shows the 10 oldest unless --waiting is given. | in-03 | `waiting` | settled | tests pass |
| br-C16 | Scanned code is every file under the repo root with a code extension, shell scripts included, except in dependency and build folders, the ledger itself, and any file named ledger-check.ts. | in-01 in-06 | `scan` | settled | tests pass |
| br-C17 | When the master's header has an `Ignore:` line, then the checker reads no code and no document under those paths, even where `Scan:` names them. | in-06 | `scan` | settled | tests pass |
| br-C18 | When the master's header has a `Scan:` line, then the checker also reads code under those paths that it skips by default. Inside a skipped folder only the named paths are read, and a copy of the checker only when the line names its file. | in-06 | `scan` | settled | tests pass |
| br-C19 | When a path in an `Ignore:` or `Scan:` line does not exist, then the checker warns and names it. | in-06 | `scan` | settled | tests pass |
| br-C20 | When the checker runs with --area, then the report shows only those areas' rules and the messages about them, and counts the rest. The exit code follows what is shown. | in-05 | `scale` `area` | settled | tests pass |
| br-C21 | When the checker runs with --rule and a rule ID, then it prints that rule instead of the report: its statement, status, enforcement, where its entry is, its citations, and its test names with where they are. | in-05 | `scale` | settled | tests pass |
| br-C22 | When the checker runs with --index, then it prints the index as --write would build it, instead of the report. With --area, it prints only those areas' rows. | in-05 | `scale` `index` | settled | tests pass |
| br-C23 | When the report counts anything, then it gives the total first, lists statuses most decided first and levels highest first, and leaves out any count of zero. When one part covers the total it says all, and every count uses a real plural. | in-01 | `enforcement` `report` | settled | tests pass |
| br-C24 | When the checker runs without a results file, then the settled count says where tests pass came from: carried over from the last run that had results, or out of reach. | in-01 | `enforcement` `report` | settled | tests pass |
| br-L01 | When a rule's status is not observed, open, settled or retired, then the checker reports an error. | in-04 | `lint` | settled | tests pass |
| br-L02 | When an active rule has no statement, no Fails if line, or a kind other than definition, invariant or behaviour, then the checker reports an error. | in-04 | `lint` | settled | tests pass |
| br-L03 | When a rule's `serves:` names something that is not an intent, or its `given:` names something that is not a rule, then the checker reports an error. | in-04 | `lint` | settled | tests pass |
| br-L04 | When an active rule serves no intent, lists no tests or has no tags, then the checker warns. | in-04 | `lint` | settled | tests pass |
| br-L05 | When a rule's or an intent's tag is not lowercase letters, digits and hyphens starting with a letter, then the checker warns. | in-04 | `lint` `tags` | settled | tests pass |
| br-L06 | When an active rule's statement is over two sentences and the rule has no `compound:` line, then the checker warns. | in-04 | `lint` `size` | settled | tests pass |
| br-L07 | When a behaviour does not start with When, or a definition or invariant does, then the checker warns. | in-04 | `lint` `kind` | settled | tests pass |
| br-L08 | When a settled rule still has open questions, or an open rule lists none, then the checker warns. | in-03 in-04 | `lint` `waiting` | settled | tests pass |
| br-L09 | When an observed rule has a `gap:` line, then the checker warns. | in-04 | `lint` | settled | tests pass |
| br-L10 | When at least 6 rules are active and more than a third of them are attended, then the checker warns. | in-04 | `lint` `attended` | settled | tests pass |
| br-L11 | When an area file the registry names is missing, a rule sits in a file the registry does not give its area, or a rule ID is defined twice, then the checker reports an error. | in-04 in-05 | `lint` `area` | settled | tests pass |
| br-L12 | When more than 150 active rules sit in the master, then the checker warns that areas should move to area files. | in-05 | `lint` `area` `scale` | settled | tests pass |
| br-L13 | When an intent has no statement, the checker reports an error. When it has no `broken when:` line, or no rule serves it, the checker warns. | in-04 | `lint` `intents` | settled | tests pass |
| br-L14 | When a document beside the ledger names a rule or intent that does not exist, then the checker warns on that line. Documents that name no intent share one warning, unless marked `<!-- ledger: not a spec -->`. | in-04 | `lint` `docs` | settled | tests pass |
| br-L15 | When a rule with a gap is open or settled and every one of its tests passed in the results, then the checker warns. | in-01 in-04 | `lint` `enforcement` | settled | tests pass |

---

## Registry

| Letter | Area | File | Owner |
| --- | --- | --- | --- |
| M | How to write rules | BUSINESS-RULES-AUTHORING.md | — |
| C | Checker | — | Maintainer |
| L | Ledger lint | — | Maintainer |

C holds what the checker computes from the code and the flags that shape its report. L holds what
it says about the ledger itself. Both live in this document while it is small.

Retire an ID. Never reuse one — rule or intent.

---

## br-C01

kind: definition | serves: in-01 | status: settled

A citation is a rule ID in code followed by a colon, or preceded by `@see`. A list of rule IDs that ends in a colon cites every ID in it.

`#citation` `#enforcement`

**Examples**

| Test | Line of code | Cites |
| --- | --- | --- |
| C01.1 | `// br-C01: a colon cites` | br-C01 |
| C01.2 | `/** @see br-C01 */` | br-C01 |
| C01.3 | `// br-C01, br-C02: both` | br-C01 and br-C02 |
| C01.4 | `// explained in br-C01` | nothing; a mention |

> Fails if a line that cites a rule is not counted as a citation, or a line that only mentions one is.

**Source**

- 2026-10-22, observed: `ledger-check.ts` isCitation(). Implements br-M12.
- 2026-10-25, intent review. Intended, confirmed with the citation, test and results rules: these definitions are what make enforcement computed rather than claimed.

---

## br-C02

kind: definition | serves: in-01 | status: settled

A test name is a test ID with its br- prefix inside a single-line string literal in code. The same text anywhere else is a mention of the rule.

`#tests` `#enforcement`

**Examples**

| Test | Line of code | Counts as |
| --- | --- | --- |
| C02.1 | `test("br-C01.1 a colon cites", …)` | test name C01.1 |
| C02.2 | `it('br-C01.1 a colon cites', …)` | test name C01.1 |
| C02.3 | `// br-C01.1 covers this` | a mention of br-C01 |

> Fails if a test ID inside a test's name string is not counted as a test name, or one in a comment is.

**Source**

- 2026-10-22, observed: `ledger-check.ts` stringSpans() and scanCode(). suspect: a string that spans lines, such as a Python triple-quoted string or a multi-line template literal, is not read, so a test named across lines is missed.
- 2026-10-25, intent review. Intended: every common test framework names a test on one line. Reading strings that span lines would also count IDs in long docstrings as tests.

---

## br-C03

kind: definition | serves: in-01 | status: settled

A rule's enforcement is tests pass when every ledger test has a test name in code and all of them passed in the results file. Otherwise it is tests written when every ledger test has a test name, linked when code cites the rule, and unlinked when neither holds.

`#enforcement`

**Examples**

| Test | Every ledger test named in code? | Results | Cited? | Enforcement |
| --- | --- | --- | --- | --- |
| C03.1 | no | — | no | unlinked |
| C03.2 | no | — | yes | linked |
| C03.3 | yes | none given | no | tests written |
| C03.4 | yes | all passed | yes | tests pass |
| C03.5 | yes | one failed | yes | tests written |
| C03.6 | the rule lists no tests | — | yes | linked |

> Fails if a rule is shown at a level its tests, results and citations do not reach.

**Source**

- 2026-10-22, observed: `ledger-check.ts` main(), the level computation. A gap adds `, gap` and a retired rule shows `—`. suspect: tested does not need a citation; a tested rule that nothing cites only gets a warning.
- 2026-10-25, intent review. Intended: the test is the proof. A citation marks where the rule lives, so a missing one earns a warning, not a lower level.
- 2026-10-25, conversation. The levels are renamed unlinked, linked, tests written and tests pass: in the report, "0 none" read as a count of failures, and "tested" sounded as if the tests had run. The old names are still read (br-C04, br-C14).

---

## br-C04

kind: behaviour | serves: in-01 | given: br-C03 | status: settled

When the checker runs without a results file, then a rule the index shows at tests pass stays there while every one of its ledger tests still has a test name in code. An index written before 2.10.0 says passing for the same level.

`#enforcement` `#results`

**Tests**

- C04.1 — Given the index shows a rule at tests pass and all its test names exist. When the checker runs with no results file. Then the rule is still at tests pass.
- C04.2 — Given the index shows a rule at tests pass and one of its test names is gone. When the checker runs with no results file. Then the rule is below tests pass.
- C04.3 — Given the index shows a rule as passing, from before 2.10.0, and all its test names exist. When the checker runs with no results file. Then the rule is at tests pass.

> Fails if a run without results drops a rule at tests pass whose tests all still exist, or keeps one there after a test name is removed.

**Source**

- 2026-10-22, observed: `ledger-check.ts` cellFor(), which reads the previous Enforcement column. suspect: a test that has started failing since the last run with results still shows passing.
- 2026-10-25, intent review. Intended: a quick local run without results should not drop every rule to tested. CI always runs with results, so a newly failing test is caught there.
- 2026-10-25, conversation. The levels are renamed unlinked, linked, tests written and tests pass: in the report, "0 none" read as a count of failures, and "tested" sounded as if the tests had run. The old names are still read (br-C04, br-C14).

---

## br-C05

kind: behaviour | serves: in-01 | status: settled

When any result for a test ID failed, then that test has not passed, even if other results for the same ID passed.

`#results` `#enforcement`

**Tests**

- C05.1 — Given two results named br-C01.1, one passed and one failed. When the checker reads them. Then C01.1 has not passed.
- C05.2 — Given one result named br-C01.1, skipped. When the checker reads it. Then C01.1 has not passed.

> Fails if a test ID with a failing or only skipped result counts as passed.

**Source**

- 2026-10-22, observed: `ledger-check.ts` readResults(). Rows of a data-driven test share one test ID.
- 2026-10-25, intent review. Intended, confirmed with the citation, test and results rules: these definitions are what make enforcement computed rather than claimed.

---

## br-C06

kind: behaviour | serves: in-01 | status: settled

When the checker is given results, then it reads Jest or Vitest JSON, TRX and JUnit XML from files or directories, comma-separated. It tells the formats apart by their content, not their names.

`#results` `#stacks`

**Tests**

- C06.1 — Given a TRX file where br-C01.1 passed. When the checker reads it. Then C01.1 has passed.
- C06.2 — Given a JUnit XML file where br-C01.1 passed. When the checker reads it. Then C01.1 has passed.
- C06.3 — Given a directory holding a Vitest JSON results file and a package.json. When the checker reads the directory. Then it reads the results and ignores package.json.

> Fails if passing results in a supported format do not make their tests pass.

**Source**

- 2026-10-22, observed: `ledger-check.ts` readResults(), trxOutcomes(), junitOutcomes() and jestOutcomes().
- 2026-10-25, intent review. Intended, confirmed with the citation, test and results rules: these definitions are what make enforcement computed rather than claimed.

---

## br-C07

kind: behaviour | serves: in-01 | status: settled

When a results file holds results but none is named with a br- test ID, then the checker warns and names the file.

`#results` `#stacks`

**Tests**

- C07.1 — Given a JUnit XML file with three results and no br- test IDs. When the checker reads it. Then it warns, naming the file, with the hint to use TRX for .NET.
- C07.2 — Given a results file where one result is named br-C01.1. When the checker reads it. Then it does not warn about that file.

> Fails if a results file with no br- test IDs passes without a warning.

**Source**

- 2026-10-22, observed: `ledger-check.ts` readResults(). The .NET JUnit logger writes method names, so display names with the test ID are lost (SKILL.md _Test names by stack_).
- 2026-10-25, intent review. Intended, confirmed with the citation, test and results rules: these definitions are what make enforcement computed rather than claimed.

---

## br-C08

kind: behaviour | serves: in-04 | status: settled

When a rule ID in scanned code names no rule in the ledger, then the checker reports an error, whether the ID is a citation, a mention or a test name. Authoring rule IDs (br-M) are exempt.

`#citation` `#lint`

**Tests**

- C08.1 — Given scanned code citing a rule the ledger does not have. When the checker runs. Then it reports an error with the file and line.
- C08.2 — Given scanned code that only mentions a rule the ledger does not have. When the checker runs. Then it reports an error.
- C08.3 — Given a test named after a rule the ledger does not have. When the checker runs. Then it reports an error.
- C08.4 — Given scanned code mentioning br-M12. When the checker runs. Then it reports nothing about it.

> Fails if an ID in code that names no rule passes silently, or an authoring rule ID is reported.

**Source**

- 2026-10-22, observed: `ledger-check.ts` main(), after scanCode(). suspect: a mention is held to the same standard as a citation, so an old ID in a comment fails the run.
- 2026-10-25, intent review. Intended: a reference to a rule that does not exist misleads whoever reads it, and this is how a deleted rule's leftovers get cleaned up. Retired rules stay in the ledger, so mentioning them stays fine.

---

## br-C09

kind: behaviour | serves: in-01 | given: br-C02 | status: settled

When scanned code has a test name for a rule whose entry does not list that test, then the checker warns.

`#tests`

**Tests**

- C09.1 — Given the ledger lists C01.1 and C01.2, and code has a test named br-C01.3. When the checker runs. Then it warns that the ledger does not list br-C01.3.

> Fails if a test in code that the rule's entry does not list passes without a warning.

**Source**

- 2026-10-22, observed: `ledger-check.ts` main(), the per-rule test comparison.
- 2026-10-25, intent review. Intended, confirmed with the citation, test and results rules: these definitions are what make enforcement computed rather than claimed.

---

## br-C10

kind: behaviour | serves: in-01 | given: br-C02 | status: settled

When a string literal in scanned code holds a test ID without its br- prefix, and the ledger lists that test, then the checker warns that the test is not counted.

`#tests`

**Tests**

- C10.1 — Given the ledger lists C01.1 and code has `test("C01.1 a colon cites")`. When the checker runs. Then it warns that the test needs the br- prefix.
- C10.2 — Given code has `"X99.1"` in a string and the ledger has no test X99.1. When the checker runs. Then it does not warn.

> Fails if a test the ledger lists is named without its prefix and the checker says nothing.

**Source**

- 2026-10-22, observed: `ledger-check.ts` scanCode() unprefixed, and main(). Implements br-M13.
- 2026-10-25, intent review. Intended, confirmed with the citation, test and results rules: these definitions are what make enforcement computed rather than claimed.

---

## br-C11

kind: invariant | serves: in-02 | status: settled

The index has one row per rule except the authoring rules, retired rules included: the master's rules first, then each area file's in registry order. Every cell but Enforcement comes from the rule's entry.

`#index`

**Tests**

- C11.1 — Given a rule whose statement has changed. When the checker runs with --write. Then the rule's row shows the new statement.
- C11.2 — Given a master with rule D01 and an area file with rule B01. When the checker runs with --write. Then D01's row comes before B01's.
- C11.3 — Given a retired rule. When the checker runs with --write. Then the index has its row, with `—` as enforcement.

> Fails if the index drops, duplicates or reorders a rule, or shows a value the rule's entry does not hold.

**Source**

- 2026-10-22, observed: `ledger-check.ts` renderIndex(). Implements br-M09 and br-M29.
- 2026-10-25, intent review. Intended, confirmed with the index rules: the index is only worth trusting if it is built, verified and rewritten exactly this way.

---

## br-C12

kind: behaviour | serves: in-02 | given: br-C11 | status: settled

When the checker runs with --verify and the index's cells differ from what --write would build, then it exits 1 and names each row that differs. Spacing and padding do not count as differences.

`#index` `#ci`

**Tests**

- C12.1 — Given an index row with an old statement. When the checker runs with --verify. Then it exits 1 and names that row.
- C12.2 — Given an index whose cells match but whose columns are padded. When the checker runs with --verify. Then it exits 0.
- C12.3 — Given an index row for a rule with no entry. When the checker runs with --verify. Then it exits 1 and names that row.

> Fails if a stale index passes --verify, or a current index padded by a formatter fails it.

**Source**

- 2026-10-22, observed: `ledger-check.ts` main(), sameTable and rowKey().
- 2026-10-25, intent review. Intended, confirmed with the index rules: the index is only worth trusting if it is built, verified and rewritten exactly this way.

---

## br-C13

kind: behaviour | serves: in-02 | given: br-C11 | status: settled

When the checker runs with --write and the index differs, then it rewrites the index table and leaves every other line of the master unchanged.

`#index`

**Tests**

- C13.1 — Given a stale index. When the checker runs with --write. Then the table matches the entries and no other line of the master changed.
- C13.2 — Given a current index. When the checker runs with --write. Then the master is not written.
- C13.3 — Given an Index section with no table. When the checker runs with --write. Then the table is added after the section's introduction.

> Fails if --write changes anything outside the index table, or leaves a stale table in place.

**Source**

- 2026-10-22, observed: `ledger-check.ts` main(), the WRITE branch.
- 2026-10-25, intent review. Intended, confirmed with the index rules: the index is only worth trusting if it is built, verified and rewritten exactly this way.

---

## br-C14

kind: behaviour | serves: in-01 | given: br-C03 | status: settled

When the checker runs with --require at a level, then it exits 1 if any settled rule's enforcement is below that level. The level is named with hyphens (tests-pass) or by its name before 2.10.0 (passing).

`#enforcement` `#ci`

**Tests**

- C14.1 — Given a settled rule at tests written. When the checker runs with --require=tests-pass. Then it exits 1 and names the rule.
- C14.2 — Given every settled rule at tests pass. When the checker runs with --require=tests-pass. Then it exits 0.
- C14.3 — Given an open rule at unlinked and every settled rule at tests pass. When the checker runs with --require=tests-written. Then it exits 0.
- C14.4 — Given a settled rule at tests written, then at tests pass. When the checker runs with --require=passing. Then it exits 1, then 0.
- C14.5 — Given any ledger. When the checker runs with --require=done. Then it exits 2 and lists the four levels.

> Fails if a settled rule below the required level passes the run, or a rule that is not settled fails it.

**Source**

- 2026-10-22, observed: `ledger-check.ts` main(), REQUIRE. suspect: a rule with a gap counts at its level, so `passing, gap` meets --require=passing.
- 2026-10-23, intent review. Intended: --require counts the level, and a gap does not lower it. The gap stays visible under Known gaps, and br-L15 warns when a rule passes with one. The README says so where it explains --require.
- 2026-10-25, conversation. The levels are renamed unlinked, linked, tests written and tests pass: in the report, "0 none" read as a count of failures, and "tested" sounded as if the tests had run. The old names are still read (br-C04, br-C14).

---

## br-C15

kind: behaviour | serves: in-03 | status: settled

When the ledger has waiting entries, then the report lists them oldest first: an observed entry dated by its oldest source line, an open rule by its newest. It shows the 10 oldest unless --waiting is given.

`#waiting`

**Examples**

| Test | Waiting entries | Flag | Listed |
| --- | --- | --- | --- |
| C15.1 | 10 | — | all 10, and no "more" line |
| C15.2 | 11 | — | the 10 oldest, then "… and 1 more" |
| C15.3 | 11 | --waiting | all 11 |

**Tests**

- C15.4 — Given an observed rule with sources dated 2026-10-01 and 2026-10-10. When the checker reports. Then the rule waits since 2026-10-01.
- C15.5 — Given an open rule with sources dated 2026-10-01 and 2026-10-10. When the checker reports. Then the rule waits since 2026-10-10.

> Fails if a waiting entry is missing from the list, out of age order, or dated from the wrong source line.

**Source**

- 2026-10-22, observed: `ledger-check.ts` main(), the waiting list. suspect: 10 is a hard-coded number (WAITING_SHOWN) with no config. Ages count from the local date.
- 2026-10-25, intent review. Intended: 10 fits a terminal and --waiting lists the rest. It needs no setting.

---

## br-C16

kind: definition | serves: in-01, in-06 | status: settled

Scanned code is every file under the repo root with a code extension, shell scripts included, except in dependency and build folders, the ledger itself, and any file named ledger-check.ts.

`#scan`

**Tests**

- C16.1 — Given a citation in node_modules/x/index.ts. When the checker runs. Then the citation is not counted.
- C16.2 — Given a citation in tools/ledger-check.ts. When the checker runs. Then the citation is not counted.
- C16.3 — Given a citation in scripts/build.sh. When the checker runs. Then the citation is counted.
- C16.4 — Given a citation in .github/workflows/ci.yml. When the checker runs. Then the citation is not counted.

> Fails if a file outside that set is read, or a code file inside it is not.

**Source**

- 2026-10-22, observed: `ledger-check.ts` walk(), CODE_EXT and SKIP_DIRS. Copies of the checker are skipped so its own text never counts as a citation. suspect: shell scripts, YAML, HTML, CSS, C and C++ are not read, so this repo's `scripts/check.sh` cannot cite a rule. suspect: the folder list is fixed in code.
- 2026-10-23, intent review. Partly an accident: shell scripts can hold business logic, so .sh and .bash are now read. YAML stays out, because a quoted CI step name would count as a test name. The fixed folder list is answered by Ignore: and Scan: (br-C17, br-C18).

---

## br-C17

kind: behaviour | serves: in-06 | given: br-C16 | status: settled

When the master's header has an `Ignore:` line, then the checker reads no code and no document under those paths, even where `Scan:` names them.

`#scan`

**Tests**

- C17.1 — Given `Ignore: examples/` and a citation of a missing rule in examples/a/src/x.ts. When the checker runs. Then it reports nothing about it.
- C17.2 — Given `Ignore: tools/` and `Scan: tools/`. When the checker runs. Then nothing under tools/ is read.

> Fails if anything under an ignored path is read.

**Source**

- 2026-10-22, conversation. The owner asked for an ignore setting inside the ledger, so the examples in this repo, which have ledgers of their own, stop counting as its code.

---

## br-C18

kind: behaviour | serves: in-06 | given: br-C16 | status: settled

When the master's header has a `Scan:` line, then the checker also reads code under those paths that it skips by default. Inside a skipped folder only the named paths are read, and a copy of the checker only when the line names its file.

`#scan`

**Tests**

- C18.1 — Given `Scan: tools/ledger-check.ts` and a citation in tools/ledger-check.ts. When the checker runs. Then the citation counts.
- C18.2 — Given `Scan: dist/keep/` and citations in dist/keep/k.ts and dist/other/o.ts. When the checker runs. Then only the one in dist/keep counts.
- C18.3 — Given `Scan: tools/` and a citation in tools/ledger-check.ts. When the checker runs. Then the citation is not counted.

> Fails if a path named by `Scan:` is skipped, or a skipped folder is read beyond the named path.

**Source**

- 2026-10-22, conversation. The owner chose a `Scan:` line over citing rules only in tests, so this repo can cite its rules where its checker enforces them.
- 2026-10-25, conversation of 2026-10-23. The shipped checker now cites this ledger's rules. A project whose own area C scanned the folder holding its copy would have counted those citations as its own, so a copy of the checker is read only when `Scan:` names its file.

---

## br-C19

kind: behaviour | serves: in-06 | status: settled

When a path in an `Ignore:` or `Scan:` line does not exist, then the checker warns and names it.

`#scan`

**Tests**

- C19.1 — Given `Ignore: nope/` and no nope folder. When the checker runs. Then it warns that nope does not exist.

> Fails if a path that does not exist is accepted silently.

**Source**

- 2026-10-22, conversation. A typo in either line would otherwise widen or narrow the scan without anyone noticing.

---

## br-C20

kind: behaviour | serves: in-05 | status: settled

When the checker runs with --area, then the report shows only those areas' rules and the messages about them, and counts the rest. The exit code follows what is shown.

`#scale` `#area`

**Tests**

- C20.1 — Given an error about a rule in area U. When the checker runs with --area=B. Then it exits 0 and says there is 1 error elsewhere.
- C20.2 — Given an error about a rule in area U. When the checker runs with --area=U. Then it shows the error and exits 1.
- C20.3 — Given no area X. When the checker runs with --area=X. Then it exits 2 and lists the areas.

> Fails if another area's rule or message is shown, or an area's own error does not fail the run.

**Source**

- 2026-10-22, observed: `ledger-check.ts` areaLetters(), aboutArea() and main(). Built in PR #7, 2026-10-21.
- 2026-10-25, intent review. Intended: the exit code follows what is shown, so each area can be gated on its own. The full run without --area still fails on any error, and CI runs that one.

---

## br-C21

kind: behaviour | serves: in-05 | status: settled

When the checker runs with --rule and a rule ID, then it prints that rule instead of the report: its statement, status, enforcement, where its entry is, its citations, and its test names with where they are.

`#scale`

**Tests**

- C21.1 — Given rule br-C01 cited in two places. When the checker runs with --rule C01. Then it prints the entry's file and line and both citations.
- C21.2 — Given no rule br-C99. When the checker runs with --rule br-C99. Then it exits 1.
- C21.3 — Given no ID after --rule. When the checker runs. Then it exits 2 and says --rule needs an ID.

> Fails if --rule prints the full report, misses a citation or test of the rule, or exits 0 for a rule that does not exist.

**Source**

- 2026-10-22, observed: `ledger-check.ts` main(), ONE_RULE. Built in 2.7.2.
- 2026-10-25, intent review. Intended, confirmed with the rules for reading less: each lets a reader load one rule or one area instead of the whole ledger.

---

## br-C22

kind: behaviour | serves: in-05 | given: br-C11 | status: settled

When the checker runs with --index, then it prints the index as --write would build it, instead of the report. With --area, it prints only those areas' rows.

`#scale` `#index`

**Tests**

- C22.1 — Given a current index. When the checker runs with --index. Then it prints exactly the index table in the master.
- C22.2 — Given rules in areas B and U. When the checker runs with --index --area=U. Then it prints the header and only U's rows.

> Fails if --index prints anything but the index, or a row from an area it was not asked for.

**Source**

- 2026-10-22, observed: `ledger-check.ts` main(), PRINT_INDEX. Built in PR #7, 2026-10-21.
- 2026-10-25, intent review. Intended, confirmed with the rules for reading less: each lets a reader load one rule or one area instead of the whole ledger.

---

## br-C23

kind: behaviour | serves: in-01 | given: br-C03 | status: settled

When the report counts anything, then it gives the total first, lists statuses most decided first and levels highest first, and leaves out any count of zero. When one part covers the total it says all, and every count uses a real plural.

`#enforcement` `#report`

**Examples**

| Test | Counted | Report line |
| --- | --- | --- |
| C23.1 | 2 at tests pass | Settled rules: 2, all tests pass. |
| C23.2 | 1 at tests pass, 1 at tests written, 1 at unlinked | Settled rules: 3 — 1 tests pass, 1 tests written, 1 unlinked. |
| C23.3 | 2 rules and 1 intent, all settled | Rules: 2, all settled. Intents: 1, all settled. |
| C23.4 | rules 1 settled, 1 open, 1 observed, 1 retired; intents 1 settled, 1 observed | Rules: 3 — 1 settled, 1 open, 1 observed; 1 retired. Intents: 2 — 1 settled, 1 observed. |
| C23.5 | 1 mention, 1 other document | 1 mention of a rule in code is not a citation …; Checked 1 other document … |
| C23.6 | 2 mentions, 2 other documents | 2 mentions of rules in code are not citations …; Checked 2 other documents … |
| C23.7 | --area, with 0 errors and 1 warning | The ledger has 1 warning. |
| C23.8 | --tag, a tag on 1 rule and no intent | core: 1 rule |

> Fails if a count of zero is shown, a total comes after its parts, statuses or levels come in another order, or a count reads "(s)".

**Source**

- 2026-10-25, conversation. The report said "Settled enforcement: 0 none, 0 cited, 0 tested, 37 passing", and the owner read the zeros as counts of failures. Leading with the total and leaving out empty levels removes the misreading.
- 2026-10-26, conversation. The owner asked to read "Rules: 38 active (0 observed, 0 open, 38 settled), 0 retired." again, and asked that every count in the report follow the same approach, so the report reads one way throughout.

---

## br-C24

kind: behaviour | serves: in-01 | given: br-C04 | status: settled

When the checker runs without a results file, then the settled count says where tests pass came from: carried over from the last run that had results, or out of reach.

`#enforcement` `#report`

**Tests**

- C24.1 — Given a rule the index shows at tests pass, with its tests in code. When the checker runs with no results file. Then the count ends "Without --results, tests pass is carried over from the last run that had them."
- C24.2 — Given no rule at tests pass in the index. When the checker runs with no results file. Then the count ends "Without --results, no rule can reach tests pass."

> Fails if a run without results shows tests pass with no word on where it came from.

**Source**

- 2026-10-26, conversation. "Settled rules: 38, all tests pass. (no --results given)" read as a contradiction: how can tests pass with no results? Saying the level was carried over (br-C04) removes it.

---

## br-L01

kind: behaviour | serves: in-04 | status: settled

When a rule's status is not observed, open, settled or retired, then the checker reports an error.

`#lint`

**Tests**

- L01.1 — Given a rule with `status: done`. When the checker runs. Then it reports an error naming the four statuses.
- L01.2 — Given a rule with no status. When the checker runs. Then it reports an error.

> Fails if a rule with any other status, or none, passes without an error.

**Source**

- 2026-10-22, observed: `ledger-check.ts` main(), the per-rule checks. Implements br-M10.
- 2026-10-25, intent review. Intended, confirmed with the lint rules: each catches a malformed or dangling entry before anyone relies on it.

---

## br-L02

kind: behaviour | serves: in-04 | status: settled

When an active rule has no statement, no Fails if line, or a kind other than definition, invariant or behaviour, then the checker reports an error.

`#lint`

**Tests**

- L02.1 — Given an active rule with no Fails if line. When the checker runs. Then it reports an error.
- L02.2 — Given an active rule with `kind: behavior`. When the checker runs. Then it reports an error naming the three kinds.
- L02.3 — Given a retired rule with no Fails if line. When the checker runs. Then it reports no error about it.

> Fails if an active rule missing a required part passes, or a retired rule is held to them.

**Source**

- 2026-10-22, observed: `ledger-check.ts` main(), the per-rule checks. Implements br-M04 and br-M17.
- 2026-10-25, intent review. Intended, confirmed with the lint rules: each catches a malformed or dangling entry before anyone relies on it.

---

## br-L03

kind: behaviour | serves: in-04 | status: settled

When a rule's `serves:` names something that is not an intent, or its `given:` names something that is not a rule, then the checker reports an error.

`#lint`

**Tests**

- L03.1 — Given a rule that serves in-09 and no intent in-09. When the checker runs. Then it reports an error.
- L03.2 — Given a rule with given br-C99 and no rule br-C99. When the checker runs. Then it reports an error.

> Fails if a rule points at an intent or rule that does not exist, and the checker says nothing.

**Source**

- 2026-10-22, observed: `ledger-check.ts` main(), the per-rule checks. Implements br-M18 and br-M20.
- 2026-10-25, intent review. Intended, confirmed with the lint rules: each catches a malformed or dangling entry before anyone relies on it.

---

## br-L04

kind: behaviour | serves: in-04 | status: settled

When an active rule serves no intent, lists no tests or has no tags, then the checker warns.

`#lint`

**Tests**

- L04.1 — Given an active rule with no `serves:`. When the checker runs. Then it warns.
- L04.2 — Given an active rule with no tests. When the checker runs. Then it warns.
- L04.3 — Given an active rule with no tags. When the checker runs. Then it warns.

> Fails if an active rule missing an intent, tests or tags passes without a warning.

**Source**

- 2026-10-22, observed: `ledger-check.ts` main(), the per-rule checks. Implements br-M08 and br-M20.
- 2026-10-25, intent review. Intended, confirmed with the lint rules: each catches a malformed or dangling entry before anyone relies on it.

---

## br-L05

kind: behaviour | serves: in-04 | status: settled

When a rule's or an intent's tag is not lowercase letters, digits and hyphens starting with a letter, then the checker warns.

`#lint` `#tags`

**Examples**

| Test | Tag | Warns? |
| --- | --- | --- |
| L05.1 | `#allergen-2` | no |
| L05.2 | `#Allergen` | yes |
| L05.3 | `#2fa` | yes |
| L05.4 | `#cut_off` | yes |

> Fails if a malformed tag passes, or a well-formed one is warned about.

**Source**

- 2026-10-22, observed: `ledger-check.ts` TAG_OK. Implements br-M08.
- 2026-10-25, intent review. Intended, confirmed with the lint rules: each catches a malformed or dangling entry before anyone relies on it.

---

## br-L06

kind: behaviour | serves: in-04 | status: settled

When an active rule's statement is over two sentences and the rule has no `compound:` line, then the checker warns.

`#lint` `#size`

**Examples**

| Test | Statement | compound: | Warns? |
| --- | --- | --- | --- |
| L06.1 | "A holds. B holds." | — | no |
| L06.2 | "A holds. B holds. C holds." | — | yes |
| L06.3 | "A holds. B holds. C holds." | yes | no |
| L06.4 | "Use e.g. the 2.5 rate. Round down." | — | no |

> Fails if a statement over two sentences passes with no compound reason, or abbreviations and decimals are counted as sentence ends.

**Source**

- 2026-10-22, observed: `ledger-check.ts` sentences(). Implements br-M07.
- 2026-10-25, intent review. Intended, confirmed with the lint rules: each catches a malformed or dangling entry before anyone relies on it.

---

## br-L07

kind: behaviour | serves: in-04 | status: settled

When a behaviour does not start with When, or a definition or invariant does, then the checker warns.

`#lint` `#kind`

**Tests**

- L07.1 — Given a behaviour that starts "A refund is". When the checker runs. Then it warns.
- L07.2 — Given an invariant that starts "When a refund". When the checker runs. Then it warns, asking whether the condition can ever be false.

> Fails if a rule framed against its kind passes without a warning.

**Source**

- 2026-10-22, observed: `ledger-check.ts` main(), the per-rule checks. Implements br-M04.
- 2026-10-25, intent review. Intended, confirmed with the lint rules: each catches a malformed or dangling entry before anyone relies on it.

---

## br-L08

kind: behaviour | serves: in-03, in-04 | status: settled

When a settled rule still has open questions, or an open rule lists none, then the checker warns.

`#lint` `#waiting`

**Tests**

- L08.1 — Given a settled rule with an Open questions section. When the checker runs. Then it warns.
- L08.2 — Given an open rule with no Open questions section. When the checker runs. Then it warns.

> Fails if a rule's status and its open questions disagree and the checker says nothing.

**Source**

- 2026-10-22, observed: `ledger-check.ts` main(), the per-rule checks. Implements br-M10.
- 2026-10-25, intent review. Intended, confirmed with the lint rules: each catches a malformed or dangling entry before anyone relies on it.

---

## br-L09

kind: behaviour | serves: in-04 | status: settled

When an observed rule has a `gap:` line, then the checker warns.

`#lint`

**Tests**

- L09.1 — Given an observed rule with a `gap:` line. When the checker runs. Then it warns, suggesting a `suspect:` note instead.
- L09.2 — Given an open rule with a `gap:` line. When the checker runs. Then it does not warn about the gap.

> Fails if an observed rule carries a gap without a warning, or a decided rule's gap is warned about.

**Source**

- 2026-10-22, observed: `ledger-check.ts` main(), the per-rule checks. Implements br-M28.
- 2026-10-25, intent review. Intended, confirmed with the lint rules: each catches a malformed or dangling entry before anyone relies on it.

---

## br-L10

kind: behaviour | serves: in-04 | status: settled

When at least 6 rules are active and more than a third of them are attended, then the checker warns.

`#lint` `#attended`

**Examples**

| Test | Active rules | Attended | Warns? |
| --- | --- | --- | --- |
| L10.1 | 6 | 2 | no |
| L10.2 | 6 | 3 | yes |
| L10.3 | 5 | 5 | no |

> Fails if over a third of 6 or more active rules are attended without a warning, or a third or fewer trigger one.

**Source**

- 2026-10-22, observed: `ledger-check.ts` main(), attendedCount. Implements br-M19. suspect: the minimum of 6 is a hard-coded number with no comment.
- 2026-10-25, intent review. Intended: below 6 rules a third is one or two, so a new ledger would warn at once. The code now says so in a comment.

---

## br-L11

kind: behaviour | serves: in-04, in-05 | status: settled

When an area file the registry names is missing, a rule sits in a file the registry does not give its area, or a rule ID is defined twice, then the checker reports an error.

`#lint` `#area`

**Tests**

- L11.1 — Given a registry naming rules/billing.md and no such file. When the checker runs. Then it reports an error naming the file.
- L11.2 — Given the registry puts area B in rules/business.md and br-B01 is in the master. When the checker runs. Then it reports an error naming both places.
- L11.3 — Given br-B01 defined in the master and in an area file. When the checker runs. Then it reports an error with both lines.

> Fails if a missing area file, a misplaced rule or a duplicate ID passes without an error.

**Source**

- 2026-10-22, observed: `ledger-check.ts` main(), the area-file checks. Built in 2.8.0.
- 2026-10-25, intent review. Intended, confirmed with the rules for reading less: each lets a reader load one rule or one area instead of the whole ledger.

---

## br-L12

kind: behaviour | serves: in-05 | status: settled

When more than 150 active rules sit in the master, then the checker warns that areas should move to area files.

`#lint` `#area` `#scale`

**Examples**

| Test | Active rules in the master | Warns? |
| --- | --- | --- |
| L12.1 | 150 | no |
| L12.2 | 151 | yes |
| L12.3 | 151, with 51 of them in area files | no |

> Fails if a master holding over 150 active rules passes without a warning, or one holding 150 or fewer warns.

**Source**

- 2026-10-22, observed: `ledger-check.ts` main(), inMaster. Built in 2.8.0.
- 2026-10-25, intent review. Intended, confirmed with the rules for reading less: each lets a reader load one rule or one area instead of the whole ledger.

---

## br-L13

kind: behaviour | serves: in-04 | status: settled

When an intent has no statement, the checker reports an error. When it has no `broken when:` line, or no rule serves it, the checker warns.

`#lint` `#intents`

**Tests**

- L13.1 — Given an intent with no `broken when:` line. When the checker runs. Then it warns.
- L13.2 — Given an intent no rule serves. When the checker runs. Then it warns.

> Fails if an intent with no statement passes without an error, or one with no broken when or no serving rule passes without a warning.

**Source**

- 2026-10-22, observed: `ledger-check.ts` main(), the intent checks. Implements br-M20.
- 2026-10-25, intent review. Intended, confirmed with the lint rules: each catches a malformed or dangling entry before anyone relies on it.

---

## br-L14

kind: behaviour | serves: in-04 | status: settled

When a document beside the ledger names a rule or intent that does not exist, then the checker warns on that line. Documents that name no intent share one warning, unless marked `<!-- ledger: not a spec -->`.

`#lint` `#docs`

**Tests**

- L14.1 — Given specs/notes.md naming br-C99 and no such rule. When the checker runs. Then it warns with the file and line.
- L14.2 — Given two documents beside the ledger that name no intent. When the checker runs. Then one warning lists both.
- L14.3 — Given a document that names no intent and carries the not-a-spec marker. When the checker runs. Then it is not listed.

> Fails if a dangling ID in a document passes silently, or documents naming no intent get a warning each.

**Source**

- 2026-10-22, observed: `ledger-check.ts` checkDocs(). Implements br-M30. Built in 2.7.0, one warning since 2.7.1.
- 2026-10-25, intent review. Intended, confirmed with the lint rules: each catches a malformed or dangling entry before anyone relies on it.

---

## br-L15

kind: behaviour | serves: in-01, in-04 | given: br-C03 | status: settled

When a rule with a gap is open or settled and every one of its tests passed in the results, then the checker warns.

`#lint` `#enforcement`

**Tests**

- L15.1 — Given a settled rule with a gap: line whose tests all passed in the results. When the checker runs. Then it warns that the gap is stale or the tests miss it.
- L15.2 — Given a settled rule with a gap: line at tests written, with no results file. When the checker runs. Then it does not warn.
- L15.3 — Given a settled rule with no gap whose tests all passed. When the checker runs. Then it does not warn.

> Fails if a rule passes with a gap and nothing is said, or a rule without a passing result is warned.

**Source**

- 2026-10-23, intent review of br-C14. A gap says the code breaks the rule, so tests that all pass contradict it: either the gap is stale or the tests do not cover it. --require still counts the level (br-C14), so this is a warning, not a failure.
