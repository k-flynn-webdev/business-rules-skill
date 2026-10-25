---
name: "business-rules-ledger"
description: Capture product intents, business rules and their tests in a business rules ledger — a living, grep-able source of truth that code and tests conform to, with each rule's enforcement computed from the code. Use whenever the user wants to write down a rule, decision, invariant or intent ("add a rule", "write this down", "how should this behave", "what's the rule for X"); describes what the system should or shouldn't do while working on tickets, bugs or features; asks for a spec, requirements or acceptance criteria; wants a ledger built from a codebase; or mentions a rules ledger, intents, br- IDs or rule-driven development. Also use for "grill me" or settling open rules; "intent review" or confirming observed rules; "fresh eyes" or reviewing the ledger; asking which rules are enforced, what's left, or to check the ledger against the code; and "read me the rules", "audio" or "listen". Prefer this over a prose spec.
metadata:
  version: "2.10.0"
---

# Business Rules Ledger

Version 2.10.0. See the changelog at the end.

A ledger of intents and the numbered rules that serve them. An intent says what a user should be
able to do and what would feel broken. A rule is one decision, stated in one or two sentences,
with tests that prove it and a cited source that explains why it exists. Code and tests conform
to the ledger, not the other way round.

This replaces the spec as the place where decisions live. A spec describes a system in prose that
nobody can falsify, and once the system is built nobody re-reads it. A ledger makes many small
claims that each pass or fail on their own. The code cites them, and a checker reports which ones
the code actually enforces. Disagreement resolves against a test instead of an interpretation.
Drift shows up as a state change in the index, not as a surprise in production. A spec can still
sit alongside the ledger as the readable overview of an area — see _Specs alongside the ledger_.

Assets:

- `assets/ledger-template.md` — the empty document. Copy it when starting a new ledger.
- `assets/business-rules-authoring.md` — how to read the ledger, how to cite it in code, and the
  authoring rules (br-M). Installs as `BUSINESS-RULES-AUTHORING.md` in the same folder as the
  ledger, usually `specs/`.
- `assets/ledger-check.ts` — the enforcement checker and linter. Installs as `scripts/ledger-check.ts`.
- `assets/audio-ledger.ts` — the listening script. Installs as `scripts/audio-ledger.ts`.
- `assets/lite-spec-template.md` — the shape of a lite spec. Copy it as `lite-spec-<area>.md` next to
  the ledger when an area needs explaining (br-M33).

## The layers

1. **Intents** (`in-01`) — what a user should be able to do, who they are, what broken looks
   like, and what we deliberately do not do. Written first. Change rarely.
2. **Glossary** — every domain term, defined once.
3. **Rules** (`br-B03`) — decisions that serve intents. Each has a kind: definition, invariant,
   or behaviour.
4. **Design notes** — mechanism, attached to the rule it implements. Not rules. Not tested as rules.
5. **Enforcement** — computed from the code by the checker. The checker builds the index from the
   rules, so nothing in it is written twice.

Intents answer _why_. Rules answer _what_. Design notes answer _how_. Enforcement answers _is it
true yet_. Keep each question in its own layer.

## The authoring rules

These govern every rule written. They ship as `assets/business-rules-authoring.md`. Install that file
word for word as `BUSINESS-RULES-AUTHORING.md` next to the ledger, so any reader — person or agent, with
or without this skill — can find the standard in the repo.

Do not copy the authoring rules into the ledger, and do not list them in its index. The same file
holds _How to read the ledger_ and _Citing rules in code_, which are the same for every ledger.
The ledger keeps only what is its own (intents, glossary, index, registry and rules) and links the
file in its header line, so every token a reader spends on the ledger is about this product.

- **br-M01** — Record one decision per rule. Split the rule where the parts can be falsified separately. A part that fails for its own reason is its own rule.
- **br-M02** — Use the terms the domain uses. Use a technical term when it is the correct name for the thing.
- **br-M03** — Write plain technical English. Short sentences. Active voice.
- **br-M04** — Give each rule a kind. A definition says what a concept is, as a function of stored facts. An invariant says what is always true. A behaviour says what happens on an event. Write definitions and invariants as plain assertions. Write behaviours as When [condition], then [outcome], with the condition first.
- **br-M05** — Give one instruction per step.
- **br-M06** — Cite the source of every rule and every change. Name the conversation, ticket, or URL.
- **br-M07** — Keep each rule to two sentences. A rule that needs more is more than one rule. When it genuinely cannot split, write a compound: line saying why.
- **br-M08** — Tag each rule, and each intent where it helps. Tags cross the areas that IDs do not.
- **br-M09** — Write each rule's statement, serves, tags and status once, in its entry. The checker builds the index from the entries: every rule except the authoring rules (br-M), never dropping one. Never edit the index by hand.
- **br-M10** — Mark a rule observed when it was read from existing code and the owner has not confirmed it. Mark it open while any question about it is unanswered, and write the questions under the rule. Mark it settled only when every question has an answer. Mark it retired when it no longer applies, and keep the entry. An observed rule may carry open questions; intent review makes it open or settled.
- **br-M11** — Write tests for an open rule. Expect them to change. Do not treat an open rule as a decision.
- **br-M12** — Cite the rule wherever the code enforces it, as the ID followed by a colon (`br-B03:`) or after `@see`. Use the language's documentation comment when the code is a function or a type. Mention a rule anywhere else without the colon; only citations count as enforcement.
- **br-M13** — Name each test in code after its test ID, with the br- prefix: br-B03.1. The ID goes in the test name, not in a comment.
- **br-M14** — Cite the rule, not the document. Write br-B03. Do not write "see the rules doc".
- **br-M15** — _Retired in 2.5.0._ Previously: record every change in a table at the head of the document. A rule's history lives in its source lines, and the document's in git.
- **br-M16** — _Retired in 2.5.0._ Previously: keep the twenty most recent changes at the head. Retired with br-M15.
- **br-M17** — Write each test as three sentences. Given [starting state]. When [event]. Then [outcome]. When a rule has an examples or decision table, each row is a test: give it the test ID in the first column, and do not write it again as a sentence. End each rule's tests with one Fails if line, written as a blockquote (`> Fails if …`) to distinguish it visually from the numbered tests.
- **br-M18** — Write only rule IDs in a rule's given line. Write only a state in a test's Given. When a test needs a rule as its state, write Given br-B03 holds.
- **br-M19** — Mark a rule attended: required when an agent must not implement or change it without the owner present: money, deletion, security, customer data. Omit the field otherwise, and do not apply it while building a ledger from code; propose it in intent review. Give the reason in the source.
- **br-M20** — Write the intents before the rules. Give every rule a serves: line naming the intents it protects. A rule that serves no intent is missing an intent or should not exist.
- **br-M21** — Write a non-goal on an intent when a reasonable person might build the opposite. Non-goals settle arguments as quickly as goals.
- **br-M22** — Keep mechanism out of rules. If a user or product owner would not notice the change, write it as a design note under the rule it implements. When another document owns the detail, such as a visual or technical spec, the design note points at it and does not restate it, so a change there needs no ledger edit.
- **br-M23** — When a derived value is stored, write its definition as one rule and the stored value's agreement with it as one invariant. Test the invariant by recomputing from scratch.
- **br-M24** — Define each domain term once in the glossary. Use it exactly as defined. Do not use a synonym.
- **br-M25** — Use a decision table when the outcome depends on more than two conditions. Every row is a test, with its test ID in the first column (br-M17).
- **br-M26** — Give worked examples for any rule involving dates, counts, or arithmetic. Each example is an input and its exact output, and a test with its own ID (br-M17).
- **br-M27** — Test every threshold just below, at, and just above it.
- **br-M28** — Record a known divergence between a decided rule (open or settled) and the code in a gap: line, and delete it when the code conforms. An observed rule describes the code, so it has no gap; write a concern as suspect: in its source.
- **br-M29** — Never hand-write the index. The checker builds it from the rule entries, with enforcement computed from the code.
- **br-M30** — Let a spec describe, never decide. A spec names the intents it serves, and every decision it states cites the rule that holds it. A decision with no rule ID is a missing rule.
- **br-M31** — When a rule's number is a setting the owner may tune, state the default in the rule, name the config key in a design note, and state the number in the tests. A wrong config change then fails a test instead of quietly changing the rule.
- **br-M32** — Write a test only where it can fail for a reason the rule's other tests cannot: the main path, each threshold (br-M27), each edge a reader would ask about. Do not repeat the statement, the Fails if line, or another rule's test; take that rule as a given.
- **br-M33** — Give an area a lite spec when its rules need explaining together: a flow, a reason that spans rules, or mechanism worth more than a line. The lite spec explains and decides nothing (br-M30); each rule keeps its statement, tests, Fails if, open questions and a one-line source.

## IDs

Rules: `br-` + area letter + two digits. `br-B03`. Tests take `B03.1`, `B03.2` in the ledger, and
`br-B03.1`, `br-B03.2` in the test name in code (br-M13). The prefix is what the checker and grep find.
Intents: `in-` + two digits. `in-02`.

Default areas: **M** how to write rules, **B** business, **U** interface, **A** API, **D** data.
Add a letter when a rule needs it, not in anticipation. Keep the registry table current: each
area's letter, name, file (`—` while its rules live in the ledger) and owner. A product with many
rules uses more letters, one per area a team would name: billing, accounts, notifications. At 99
rules an area is usually two areas.

Retire an ID. Never reuse one — rule or intent. A reused ID makes every earlier commit and
conversation lie.

## Intents

An intent is the outcome a group of rules protects, stated from the user's side. It is the part of
the ledger that tells a future reader whether a rule still earns its place.

The parts of an intent:

1. **The statement.** One sentence. "A user can …" or "A [role] never …". An outcome a user
   would notice, not a feature and not a rule in disguise. "Streaks reset at midnight UTC" is a
   rule. "A user is rewarded for consistency without being punished mid-day" is an intent.
2. **for:** who it is for. A role or a kind of user, not a persona essay.
3. **broken when:** one concrete moment where the user would feel it is broken. This is the
   intent's Fails if. If you cannot write it, the intent is too vague.
4. **non-goal:** optional, repeatable. Something a reasonable person might build that we
   deliberately do not (br-M21).
5. **status:** `observed` when drafted from code and unconfirmed, otherwise `settled`.
6. **Source.** As for rules.

A product usually has three to ten intents. Twenty is a sign that rules are being written as
intents. One is a sign that the intents are too broad to say no to anything.

**When an intent changes**, list every rule that serves it and ask whether each still holds —
exactly as for a changed given. **When an intent is retired**, every rule serving only it is a
candidate for retirement. Ask; do not retire automatically.

**When a rule serves no intent**, do not invent one to fill the field. Ask: which user outcome
breaks if this rule is wrong? If the answer is none, the rule is mechanism (br-M22) or should not
exist. If the answer is real but unwritten, write the intent.

## Capturing a rule

Work from what the user has already said before asking. They are usually describing behaviour
while looking at a ticket or a screen, not answering an interview. Draft the rule from their
words, show it, and ask only about what is genuinely missing.

Before writing, run three quick checks:

- **The intent check.** Which intent does this serve? If none fits, stop and settle that first.
- **The notice check.** Would a user or product owner notice if this changed? If not, it is a
  design note, not a rule (br-M22).
- **The glossary check.** Is every domain term in the glossary, used exactly as defined? Add or
  reuse before writing. Undefined terms are where two readers draw different conclusions.

The parts of a rule:

1. **kind.** `definition`, `invariant`, or `behaviour` (br-M04). Ask for a When/Then: can this
   condition ever be false in a valid system state? If another rule already makes it always true,
   the rule is an invariant, not a behaviour.
2. **The statement.** One or two sentences (br-M07). If it needs "and", check whether the halves
   can fail for different reasons — if so, it is two rules.
3. **Area and ID.** Put the ID where the rule is _enforced_. When a business rule shows up in
   three places, the business rule holds the truth and the others take it as a given.
4. **serves.** The intent IDs it protects. Usually one.
5. **given.** The rules this one assumes are true. Children point at parents, never the reverse.
   If a given stops holding, this rule's tests are suspect.
6. **Tags.** Lowercase letters, digits and hyphens; no other punctuation. Tags cut across areas —
   `liability` may pull rules from B, U and D, which is the view someone wants during an incident.
   Write them on the line under the statement as `` `#liability` ``; the checker copies them into
   the index. An intent carries tags the same way, on the line
   under its statement. A tag can also mark what should leave the project: tag the rules and
   intents that a template or another product ought to keep with one shared tag, such as
   `boilerplate`, and `npx tsx scripts/ledger-check.ts --tag=boilerplate` lists them.
7. **Examples or decision table.** Required for dates, counts and arithmetic (br-M26) and for
   more than two conditions (br-M25). See _Complex areas_. Each row is a test: its first column
   is the test ID (`B07.1`), and it is not written again under Tests (br-M17).
8. **Tests.** Given [starting state]. When [event]. Then [outcome]. Write here only the tests
   that are not already a row of the examples table. The rule's `given:` line
   holds rule IDs only; a test's Given holds a state in words. Every threshold gets tests just
   below, at, and just above (br-M27). End with one Fails if blockquote — the condition that
   proves the rule broken. Without it tests drift into describing the implementation.
9. **Design notes.** Optional. The mechanism that implements the rule, when it is worth
   recording. Design notes can change without a ledger change to the rule. When another document
   owns the detail (a visual spec, an API spec), point at it rather than restate it, so a change
   to how something looks or is built needs no ledger edit at all (br-M22).
10. **Source.** A date and a citation. Ask for the date the decision was _made_, not today's.
11. **Status.** `observed`, `open`, `settled`, or `retired` (br-M10).
12. **Optional fields.** `attended: required` for risk (see _Attended rules_). `gap:` for a known
    divergence (br-M28). `compound:` when a rule cannot split (br-M07).

### The smallest complete rule

Most rules need far less than the list above. Write this, and add the rest only when the rule calls
for it:

```markdown
## br-B20

kind: behaviour | serves: in-01 | given: br-B02 | status: settled

When an address asks for a sign-in code less than 15 minutes after its last one, then no code is sent.

`#auth` `#security`

**Tests**

- B20.1 — Given a code sent 14 minutes 59 seconds ago. When the address asks again. Then no code is sent.
- B20.2 — Given a code sent 15 minutes ago. When the address asks again. Then a new code is sent.
- B20.3 — Given a code sent 15 minutes 1 second ago. When the address asks again. Then a new code is sent.

> Fails if one address is sent two codes less than 15 minutes apart, or is refused a code 15 minutes or more after its last one.

**Source**

- 2026-10-08, owner decision. Without a limit anyone can flood a person's inbox.
```

Statement, kind, serves, tags, tests, Fails if and a one-line source. Open questions only while
something is undecided. Design notes only when the mechanism is worth a line; anything longer, or
anything that explains several rules together, goes in a lite spec (br-M33). Show the draft to the
owner in this shape before writing it into the ledger.

### Which tests to write

A test earns its ID when it can fail for a reason the rule's other tests cannot (br-M32):

- **The main path.** One test that the rule does what it says.
- **Each threshold**, just below, at and just above (br-M27). These are the tests that catch
  off-by-one changes.
- **Each edge a reader would ask about.** Blank input, a deleted record, the same thing twice.

Leave out a test that only restates the statement or the Fails if line, and a test that another
rule already holds: take that rule as a `given:` instead. Two to four tests is typical. A rule
that needs eight is usually two rules, or wants an examples table.

## Complex areas

Long rules are where the bugs hide. A paragraph-length rule usually mixes a definition, a
lifecycle and a few behaviours, and the contradictions sit between them. Use this pattern for any
area where rules keep growing: streaks, pricing, availability, eligibility, scheduling.

1. **Find the concept and define it once.** Write a `definition` rule that says what the concept
   is as a pure function of stored facts. Not how it is updated — what it is.
   > A streak is a maximal run of consecutive UTC days, each with at least one non-deleted track.
2. **Pin the definition with worked examples.** A small table of inputs and exact outputs. This
   ends off-by-one arguments before they start.

   | Test  | Days with tracks                    | Streaks                 |
   | ----- | ----------------------------------- | ----------------------- |
   | B06.1 | 1, 2, 3, 5                          | 1–3 (3 days), 5 (1 day) |
   | B06.2 | 1, 2, 3; day 2's only track deleted | 1 (1 day), 3 (1 day)    |

   Each row is a test, so the rule does not repeat these as Given/When/Then lines (br-M17).

3. **State the properties as invariants.** Things that must always hold, independent of how the
   value is computed. "Deleting a track never lengthens any streak." "Two tracks on one day count
   as one day." Invariants make the best generated tests.
4. **If the value is stored, write one consistency invariant** (br-M23): the stored records equal
   the definition recomputed from scratch. The update steps — when records open, close, split —
   become design notes under this invariant. Test it by generating random histories of creates
   and deletes and comparing the stored result to a fresh recomputation. One invariant replaces a
   page of lifecycle rules and catches the cases they missed.
5. **Behaviours reference the concept through given.** "When a track is created and the current
   streak is at least the threshold, then …" takes the definition as a given and restates nothing.
6. **Branching output becomes a decision table** (br-M25). Each row is a test. Writing the table
   exposes the rows nobody decided.

   | Test  | Exact match? | Tracks within ±3 days | Shown           |
   | ----- | ------------ | --------------------- | --------------- |
   | B10.1 | yes          | any                   | the exact track |
   | B10.2 | no           | 0                     | bar hidden      |
   | B10.3 | no           | 1–2                   | those tracks    |
   | B10.4 | no           | 3 or more             | the 2 closest   |

When reviewing or capturing, treat these as the smell: a rule over two sentences, a formula
restated in two rules, a term like "length" or "active" used without a glossary entry, or tests
that describe steps rather than outcomes. Each one says the area has not been split into
definition, invariants and behaviours yet.

## Specs alongside the ledger

A spec is welcome alongside the ledger, as long as it integrates with it. Some areas read best as
prose first — a feature with several moving parts, a flow across screens, a migration plan. The
spec gives the overview: what the area is for, how its parts fit, what a reader should look at
first. The intents and rules underneath hold every decision, so nothing in the spec can be read
two ways (br-M30).

A spec integrates well when:

- **It names the intents it serves**, at the top. If no intent fits, write the intent first.
- **Every decision it states cites the rule that holds it.** "Streaks count UTC days (br-B06)."
  Explanation, context and diagrams need no citation; decisions do.
- **It restates nothing.** Cite the rule rather than copying its wording, so an amendment
  happens in one place.
- **It defers on conflict.** When a spec and the ledger disagree, the ledger wins and the spec
  is fixed in the same change.

When the user asks for a spec, write it in that shape. Capture each decision as a rule first,
then cite it from the spec. A spec sentence that decides something and has no rule ID is a
missing rule or an ambiguity: capture the rule, or cut the sentence. Keep specs in the same
folder as the ledger.

### Lite specs

A lite spec is the short, standard form of a spec: one area, one page, named
`lite-spec-<area>.md` beside the ledger. Start from `assets/lite-spec-template.md`. It keeps the
rules short, because explanation has somewhere else to go (br-M33).

| Stays on the rule                                  | Moves to the lite spec                                     |
| -------------------------------------------------- | ---------------------------------------------------------- |
| Statement, kind, serves, tags, status              | The idea of the area in one paragraph                      |
| Tests, examples table and the Fails if line        | How the parts fit: a flow, or a table of parts and rules   |
| Open questions                                     | Reasoning that spans rules ("these three only work together") |
| A one-line source: date, citation, the reason      | Mechanism longer than a line; the rule's design note points here |
| `gap:` and `suspect:`                              | A narrative of how the area got here                       |
|                                                    | Look and feel: layout, styling, components, the design guide |

UI and visual design are not rules. How a screen looks — layout, spacing, colour, type,
component choice — goes in the area's lite spec, or in a design guide the lite spec points at.
What the user can rely on stays a rule: that an error is shown, what it says when the wording is
a decision, when a button is disabled. Ask whether the product would behave differently, not
only look different; if only the look changes, it belongs in the lite spec.

**Offer one** when an area passes about eight rules, when a design note or source grows past a
few lines, when the same explanation appears under two rules, or when the user asks for a spec.
Offer once, in a line; do not write it unasked.

A lite spec is checked like any spec: it names its intents, cites a rule for every decision, and
loses to the ledger on conflict (br-M30).

## Asking for the source

A rule without a source is folklore within a year. If the user has not given one, ask directly:
which ticket, which conversation, which page. If there is genuinely no source, write the date
and `no prior source` rather than leaving it blank — the absence is itself worth recording.

## Writing the why

The source line carries the reason. State what went wrong without the rule, in domain terms.

Weak: `2026-08-02, TICK-118. Changed to 48 hours.`
Strong: `2026-08-02, TICK-118. Venues were cancelling on the Friday and the kitchen had no time to reorder.`

When amending a rule, record why the _previous_ version was wrong, not only what the new one
says. That is what tells a future reader whether the rule still applies under changed
circumstances.

Keep each source line to the reason, in a sentence or two. When the why takes a paragraph, or
explains several rules at once, write it in the area's lite spec and keep a one-line source that
points there.

## Amending a rule

Rewrite the statement in place so the rule reads as current truth. Add a dated line to the
source. Never leave two contradictory statements in one entry.

Read every existing source line for claims the amendment makes wrong. A source that records the
old reasoning is fine; a source that asserts the opposite of the current rule is misleading.
Rewrite it as history — "Previously: server local time. Superseded 2026-09-23." — in the same edit.

If a rule changes, every rule that takes it as a given may now be wrong. Name those rules to the
user and ask whether each still holds. Do the same for any rule restating the same formula or
term. This is the failure mode the whole scheme exists to prevent, so do not skip it because the
change looked small.

## Building a ledger from a codebase

Code tells you what the system does, not what anyone intended. Some of it is decision, some is
accident, some is a framework default nobody chose. A ledger built from code must not launder
accidents into rules.

1. **Agree the scope first.** Ask which areas to cover, roughly how many rules the owner wants to
   read (ten to twenty per area is plenty to start), and whether a shared tag such as
   `boilerplate` marks a subset. A first pass that captures everything is a ledger nobody reads.
2. **Apply the notice check while capturing**, not only in intent review. A behaviour no user or
   owner would notice is a design note or nothing. Mechanism worth keeping goes in a lite spec.
3. Capture each rule as `status: observed`. Source: today's date, then `observed: [file]
   [function]` and what the code does. The date is when it was read, so the checker can say how
   long the rule has waited for the owner. An observed rule describes the code, so it never carries `gap:`; a concern goes in
   a `suspect:` note (br-M28). Do not mark rules attended yet; propose that in intent review (br-M19).
4. Draft candidate intents from the rules, also `observed`. Do not settle them yourself.
5. Flag likely accidents on each observed rule with a `suspect:` note in the source:
   - enforced only on the client, or only in one of several code paths
   - two code paths that disagree
   - a hard-coded number with no comment or config
   - behaviour that simply matches a framework or library default
   - implicit timezone, locale, sort order or rounding
   - a TODO, FIXME or "temporary" near the code
6. Note goals the code does not meet yet, if the owner wants them recorded, as `open` rules with
   their questions and a `gap:`. Keep them few and clearly separate from the observed ones.
7. Hand over to _Intent review_. Do not present an observed ledger as finished.

## Building code against the ledger

When the ledger is ahead of the code, for a new feature or a rebuild on a new stack, the rules are
the acceptance list. Build in small pieces, each citing its rules and naming its tests by ID.

- **Ask, do not invent.** When building a rule forces a question the ledger does not answer
  (trim or not, 404 or 403, which page size, does a deleted record count), stop and ask. Record
  the answer as a dated amendment or a new rule before writing the code. Otherwise the decision
  is made silently, in code, by whoever happened to write it.
- **Attended rules are checkpoints.** With the owner present, propose the approach for an
  attended rule and wait for an OK before building it (see _Attended rules_).
- **When code and a rule disagree,** a named test fails. Ask which is true. If the owner says the
  code is right, amend the rule on purpose (statement, tests and source) and name the rules that
  take it as a given. Never edit a test just to make it pass.
- **Who else touches this data?** Before building a rule that protects data from being changed or
  removed, find every other writer: scheduled jobs, database cascades, admin tools, migrations,
  imports. A rule can be broken by code that never mentions it.
- **Cite only where enforced.** `br-B07:` marks code that enforces the rule. Explaining a rule
  elsewhere, write it without the colon, so the index never claims enforcement that is not there.
- **Rebuilds.** On a rewrite, `gap:` lines still describe the old code. Leave each one until the
  feature it describes is rebuilt, then delete it or rewrite it for the new code. Enforcement
  starts at `unlinked` on the new code; that is the honest starting point.
- **Tunable numbers** (br-M31). The rule states the default, a design note names the config key,
  and the tests state the number themselves.

## Intent review mode

Use after building from a codebase, or when the user says "intent review", "confirm the observed
rules", or asks what the code does by accident.

1. Confirm the intents first. For each observed intent: keep, rewrite, merge, or drop. Every
   intent needs a `broken when:`.
2. Then take each observed rule, suspect ones first, one at a time or in numbered batches (see
   _Batch answers_). Show the rule, the evidence, and any suspect flags. Propose `attended:
   required` where the rule touches money, deletion, security or customer data. Ask the owner to
   pick one:
   - **Intended** — set `settled` (or `open` if questions remain), add `serves:`, and write the
     real reason in the source. The code is evidence; the reason is not.
   - **Accident** — rewrite the rule to the intended behaviour and add a `gap:` describing what
     the code does now. Or mark it `open` with the question that decides it.
   - **Doesn't matter** — delete the entry. Not every behaviour needs a rule. Trimming is part of
     the value. An observed rule that was never confirmed has no ID history worth keeping, so it
     is deleted rather than retired.
3. Add a source line to each: today's date, `intent review`, the decision in one sentence.
4. Report how many were intended, accidents, and dropped.

## Grill mode

Use when the user says "grill me", or asks to settle or work through the open rules.

The goal: every open rule ends with a testable result. Ones and zeros.

1. Start with intents that lack a `broken when:` and rules that lack `serves:`. A rule cannot be
   settled well against an unclear intent.
2. List the open rules and how many questions each carries. Ask where to start, or start with
   the rule most other rules take as a given.
3. Ask one question at a time, or in a numbered batch if the owner prefers (see _Batch
   answers_). Wait for the answer. Do not stack questions inside one item.
4. Judge each answer: could a test prove it right or wrong?
   - **Yes** — accept it and move on.
   - **No** — do not accept it. Ask again, narrower. Offer two or three concrete options.
5. When a quality is not naturally binary ("looks subordinate", "feels random", "quickly"), ask
   for the threshold that makes it binary. Then write the three boundary tests.
6. When the answer branches, draw the decision table and ask about the empty rows.
7. When the answer involves dates or counts, write two worked examples and ask the user to
   confirm the exact outputs.
8. Raise new questions as they appear. An answer often exposes a case nobody considered.
9. When every question on a rule has a testable answer, rewrite the rule and its tests, show
   them, and ask the user to confirm. The user settles the rule, not the skill.
10. Add a source line: today's date, `grill session`, and the reason in one sentence.
11. If the user skips a question, leave it on the rule. The rule stays open.

When finished, report what settled and what is still open.

Unfalsifiable answers to push back on:

- "It should handle it sensibly." — Handle it how? Name the behaviour.
- "Whatever is standard." — Which standard? Write down what it says.
- "We'll see." — Then the rule stays open, with the question recorded.

## Batch answers

Some owners prefer to answer a list in one message: "4. yes. 5. good fix. 17. it is a warning."
Offer the choice at the start of any session with more than five items: grill, intent review or
review. In a batch:

- Number every item, and keep the numbers stable across messages, so "items 4 to 10" means the
  same thing later.
- Give each item one sentence of problem, the quoted text, and the proposed answer, so a bare
  "yes" is a complete answer.
- Group items by kind (wrong statements, false gaps, splits), most important first.
- Record each answer exactly as if it had come alone: its own source line, its own test changes.
- Read back any answer that is not testable and ask it again, narrower, as an item of its own.

## Review mode

Use when the user says "fresh eyes", "review the ledger", "check the rules", or asks whether the
ledger is consistent. Grill mode settles open rules. Review mode finds rot in settled ones.

If `scripts/ledger-check.ts` is installed, run it first and fix what it reports. It catches the
mechanical problems so review can spend its attention on meaning.

Then work through every rule and check:

1. **Kind and framing.** Does the kind match the statement? A When/Then whose condition can never
   be false in a valid state is an invariant written as a behaviour.
2. **Stale source claims.** Does any source line assert the opposite of the current rule?
3. **Terminology.** Is every domain term in the glossary and used exactly as defined? Watch
   "visit", "session", "load", "active", "live", "length", "optional", "present".
4. **Intent fit.** Does the rule still serve the intent it names — or has it drifted into
   protecting an implementation? Does any rule contradict an intent's non-goal?
5. **Size and mechanism.** Over two sentences without a `compound:` reason? Describing update
   steps instead of an outcome? Propose the split using the _Complex areas_ pattern.
6. **Test fit.** For attended rules at least, does each named test in code check the rule's
   Fails if condition, or does it only exist? A hollow test reaches `tests pass` all the same.
7. **Cross-rule agreement.** Do rules, examples and tests that touch the same concept agree?
   Recompute every worked example and every number in a test against the definition. A formula
   restated in two places is a contradiction waiting to happen.
8. **Cross-document agreement.** Start from the checker's warnings about documents beside the
   ledger. Then read the project's other specs and briefs — feature specs, the
   product brief, architecture notes, the README. Flag any claim that contradicts a settled rule
   or an intent's non-goal, and any decision stated without a rule ID (br-M30). Propose the fix:
   amend the document, or capture the missing rule.
9. **Other writers.** For every rule that protects data from being changed or removed, list what
    else writes or deletes that data: scheduled jobs, database cascades, admin tools, migrations.
    Does each one respect the rule? A cleanup job or a cascade can break it without citing it.
10. **Duplicate tests.** Do two rules test the same starting state and event, in different
    words? Keep the test in the rule that owns the decision, and make the other take it as a
    given (br-M32).
11. **Gaps that are not gaps.** Does each `gap:` describe code that breaks the rule as written?
    A concern the rule does not cover is an open question; on an observed rule it is a `suspect:`
    note (br-M28).

For each issue: state it in one sentence, quote the specific text, and propose the fix. Do not
rewrite without confirming with the user.

When finished, report how many issues were found, fixed, and deferred.

## Enforcement

Enforcement says whether the code has caught up with the ledger. It is computed, never written by
hand (br-M29), and it lives in the Enforcement column of the generated index.

| Level           | Meaning                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------- |
| `unlinked`      | No code cites the rule.                                                                   |
| `linked`        | Code cites the rule, but not every ledger test has a named test in code.                  |
| `tests written` | Every ledger test (`B07.1`, `B07.2` …) has a test named `br-B07.1`, `br-B07.2` … in code. |
| `tests pass`    | Those tests all passed in the supplied test results.                                      |

Before 2.10.0 the levels were `none`, `cited`, `tested` and `passing`. The checker still reads
those names, in `--require` and in an index it has not rewritten yet.

`, gap` is appended when the rule has a `gap:` line. Retired rules show `—`.

The index then doubles as the work list: every settled rule not at `tests pass` is work left,
and every `gap` is a known lie in the code.

`tests pass` means the named tests exist and passed. It does not prove they test the rule: a test
named `br-B07.1` that asserts nothing still passes. Say so when reporting enforcement, and in
review mode read the tests of any `attended: required` rule against its Fails if line.

`scripts/ledger-check.ts` does the computing. It:

- scans the repository's code files. `br-B07:` (the ID followed by a colon) and `@see br-B07`
  are citations: code that enforces the rule. Any other mention, such as "(br-B07)" in an
  explanation, is not counted, so explaining a rule never makes it look enforced; the checker
  reports how many such mentions it saw. `br-B07.1` inside a string literal is a test name. A test
  named with a bare `B07.1` is reported as a likely missing prefix. An ID in code that matches no
  rule is an error, cited or mentioned
- skips dependency and build folders and copies of itself. Two optional lines under the master's
  `Format:` line change what it reads, with paths relative to the repo root, comma-separated:
  `Ignore: examples/` reads nothing there, code or documents, for examples or packages with
  ledgers of their own; `Scan: dist/shared/` reads code it would otherwise skip, and a copy of the
  checker only when the line names its file. Ignore wins where both apply, and a path that does not exist is a warning. The report names both on its
  second line
- reads test results when given `--results=` to decide `tests pass`: Jest or Vitest JSON, TRX
  (`dotnet test --logger trx`) or JUnit XML (pytest, Go via gotestsum, most CI tools). It takes
  files or directories, comma-separated, and detects each format from its content. A test ID with
  any failing result, such as one row of a data-driven test, does not pass
- lists what is waiting on the owner: observed intents, observed rules and open rules, oldest
  first, with their counts and each one's number of open questions. An observed entry is dated
  from its oldest source line (when it was read), an open rule from its newest. It shows the 10
  oldest; `--waiting` lists them all
- checks the other Markdown files in the ledger's folder (specs, briefs, notes): an ID that names
  no rule or intent is a warning on its line. Documents that name no intent are listed together
  in one warning (br-M30). A document that is not a product spec, such as a component or style
  guide, opts out with `<!-- ledger: not a spec -->`
- lints the ledger: missing kinds, `serves:` and `given:` pointing at nothing, rules over two
  sentences without `compound:`, missing Fails if lines, cited IDs with no rule, an observed rule
  with a `gap:` (br-M28), attended on more than a third of the rules (br-M19), and a leftover
  Recent changes section
- reads a rule's tests from its numbered Tests lines and from the first column of its examples or
  decision table
- reads tags on rules and intents, and warns about a rule with no tags (br-M08) or a tag that is
  not lowercase letters, digits and hyphens
- with `--tag`, lists every tag with how many rules and intents carry it; with `--tag=name`, lists
  the rules and intents that carry it, then exits without checking anything else
- with `--rule=br-B02` (or `--rule br-B02`, or `B02`), prints one rule instead of the report: its
  statement, status and enforcement, the ledger line of its entry, every citation and every test
  with file and line, and mentions that are not citations. Use it to answer "what does br-B02
  say, and where is it enforced?" without reading the whole report
- with `--area`, lists the areas instead of the report: each one's file, owner, and counts of
  active and settled rules, rules whose tests pass, and waiting rules. With `--area=B` (or `--area B`, `B,U`, the area's
  name, or its area file's path), the report covers only those areas: their counts, the settled
  rules whose tests do not pass yet, their waiting list (intents are left out), gaps, and the errors and
  warnings about their rules, plus anything about the ledger as a whole. Messages about other
  areas and intents are only counted. The exit code follows what is shown, so `--require` gates
  one area. Every rule is still read and checked, and `--write` still builds the whole index
- with `--index`, prints the index as `--write` would build it, instead of the report; with
  `--area=B`, only that area's rows. An agent working in one area of a large ledger reads that
  instead of the whole index
- reads the registry and every area file it names, and reports a missing file, a rule in a file
  the registry does not give its area, and an ID that appears twice. It warns when more than 150
  active rules sit in the master, and when the ledger still carries _How to read this ledger_ or
  _Citing rules in code_ (moved to the authoring file in 2.8.0)
- with `--write`, rebuilds the whole index from the rule entries: ID, statement, serves, tags,
  status (with `, attended`) and enforcement; the master's rules, then each area file's, in
  document order. Rows are unpadded to stay cheap to read; the checker compares cells, so a
  formatter that pads the table changes nothing
- with `--verify`, exits non-zero when the index differs from what `--write` would build
- with `--require=tests-written` (or any level: `unlinked`, `linked`, `tests-written`,
  `tests-pass`), exits non-zero when a settled rule is below it
- counts the settled rules by level, highest first, leaving out empty levels:
  `Settled rules: 37 — 30 tests pass, 4 tests written, 2 linked, 1 unlinked.`

It is a local script, like the audio script. It runs on the developer's machine and in the
conversation. Nothing is hooked up unless the user chooses to.

**When the user asks what's left, which rules are enforced, or to check the ledger against the
code:**

1. Check whether `scripts/ledger-check.ts` exists in the project.
   - **Yes** — run `npx tsx scripts/ledger-check.ts --write` and report settled rules below
     `tests pass` grouped by intent, the gaps, what is waiting on the owner, and any stale citations.
   - **No** — offer to install it (see below), then run it.
2. If the project's test runner can write results in a supported format, offer to run the tests
   with that output and rerun the checker with `--results=` so `tests pass` is real. See _Test names
   by stack_ for the command.

**Installing the script into a project:**

Offer to install whenever the script is missing and the user asks about enforcement, or whenever
the user says "install the checker" or "set it up so I can run it outside Claude".

1. Copy `assets/ledger-check.ts` to `scripts/ledger-check.ts` in the project.
2. If `package.json` exists, add `"ledger:check": "tsx scripts/ledger-check.ts --write"` and
   `"rule": "tsx scripts/ledger-check.ts --rule"` to the `scripts` block — only if `tsx` is
   already a dependency. Once the ledger has area files, add
   `"area": "tsx scripts/ledger-check.ts --area"` too.
3. Confirm: "Installed. Run `npx tsx scripts/ledger-check.ts --write` (or `npm run
ledger:check`) any time to refresh the index, and `npm run rule br-B02` to look up one rule."
4. Then recommend wiring it in — once, in a few lines, without doing it (see below).

**Wiring it in (recommend, do not do):**

Running the checker by hand keeps the index honest only while someone remembers to. Tell the
user it can be wired in, tailored to what the repo already has, and leave the choice with them.
Do not create or edit workflow files, git hooks or CI config unless the user asks — they are
shared infrastructure.

Look at the repo first so the recommendation is concrete: which CI system, which hook manager,
which test runner and where it runs from. Then suggest:

- **Pre-commit hook** — `npx tsx scripts/ledger-check.ts`. No test run, so it is fast. Catches
  broken references and citations of rules that do not exist before they are committed.
- **CI step** — run the tests with JSON output, then
  `npx tsx scripts/ledger-check.ts --results=<results> --verify --require=tests-written`.
  `--verify` fails when someone forgot to refresh the index. `--require` fails when a settled
  rule has lost its tests. CI never uses `--write` — it must not commit to the branch.

Name the exact files and commands for their setup, for example: "Vitest runs from `nuxt/`, so
results would be `--results=nuxt/test-results.json`," or "`dotnet test` writes one TRX per test
project, so pass the folder: `--results=TestResults`." The checker needs Node; in a .NET-only CI
image, add a Node setup step before it. If they say yes, write them and show the
diff.

**After any ledger change**, if the checker is installed, offer in one line to run it with
`--write`. After any code change that touches cited rules, do the same.

This skill does not fix the code to close gaps unless asked. It reports them.

### Test names by stack

The test ID goes in whatever the framework reports as the test's name, because that is what the
results file carries. Method names cannot hold a hyphen, so use the display name.

| Stack        | Test name                                           | Results for `--results=`                                                                                                                                                                                         |
| ------------ | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Jest, Vitest | `test("br-B03.1 …")`                                | `--json --outputFile=results.json` (Jest), `--reporter=json --outputFile=results.json` (Vitest)                                                                                                                  |
| xUnit        | `[Fact(DisplayName = "br-B03.1 …")]`                | VSTest: `dotnet test --logger trx`. Microsoft.Testing.Platform (xUnit v3): `dotnet test --results-directory TestResults --report-xunit-trx --report-xunit-trx-filename results.trx`. Then the TestResults folder |
| NUnit        | `[TestCase(TestName = "br-B03.1 …")]`               | as xUnit                                                                                                                                                                                                         |
| MSTest       | `[TestMethod("br-B03.1 …")]`                        | as xUnit                                                                                                                                                                                                         |
| pytest       | `@pytest.mark.parametrize(..., ids=["br-B03.1 …"])` | `pytest --junitxml=results.xml`                                                                                                                                                                                  |
| Go           | `t.Run("br-B03.1 …", …)`                            | `gotestsum --junitfile results.xml`                                                                                                                                                                              |

Check which runner the project uses before suggesting a command: with `"test": { "runner":
"Microsoft.Testing.Platform" }` in `global.json`, `--logger trx` fails with exit code 5.

For .NET use TRX, not the JUnit logger: JunitXml.TestLogger writes method names and drops display
names, so no test IDs survive. The checker warns when a results file has no br- test IDs.

In .NET, `[Trait("Rule", "br-B03")]` (xUnit) or `[Category("br-B03")]` (NUnit) also lets
`dotnet test --filter` run every test for one rule. Suggest it; it does not affect enforcement.

## Audio script

Use when the user says "read me the rules", "audio", "listen", or asks for an audio version.

`assets/audio-ledger.ts` generates a listening-friendly script. It reads each intent — statement,
who it is for, what broken looks like, the non-goals and the intent's tags — then the rules that
serve it: ID, tags, statement and Fails if. No tests, sources or metadata. M rules and retired rules are skipped.
Rules with no intent are read last. A 1.x ledger with no intents falls back to grouping by area.
With `--area=B` (or a name, an area file, or `B,U`), it reads only those areas' rules, and only the
intents they serve.
You hear the why before the what, which is where listening beats reading.

1. Check whether `scripts/audio-ledger.ts` exists in the project.
   - **Yes** — run `npx tsx scripts/audio-ledger.ts` and return the output.
   - **No** — offer to install it, then run it.
2. Offer to save it: `npx tsx scripts/audio-ledger.ts --out=rules-audio.txt`. On macOS,
   `--speak` reads it aloud. When the ledger has area files and the listener owns one area, offer
   `--area=` for just that area.

**Installing:** copy `assets/audio-ledger.ts` to `scripts/audio-ledger.ts`. If `tsx` is a
dependency, add `"audio:ledger": "tsx scripts/audio-ledger.ts"` to `package.json`.

After any ledger change, if the script exists, offer in one line to regenerate it.

### Decision briefs

When the owner is listening rather than reading, or asks for an audio version of a proposal,
write the proposal itself for the ear: prose, no tables or code, short sentences, numbers spelled
the way they are spoken. Say what the change does in order, then the trade-off, and end with the
decisions as plain questions, one per sentence. The decisions go last so they are what the
listener remembers.

## Attended rules

`attended: required` is a risk marker, not a difficulty rating. Difficulty goes stale once a rule
is built. Risk does not. Ask about it when capturing a rule that touches money, liability,
deletion, security or customer data, but never apply it by default — a ledger where every rule
is attended gives an agent nothing to do.

In a ledger built from code, propose attended in intent review, not while capturing (br-M19).
The checker warns when more than a third of the active rules are attended.

An agent working unattended skips attended rules and lists them for the owner. It does not
implement them, change them, or change code that cites them.

With the owner present, an attended rule is a checkpoint. Propose how it will be built, including
anything it touches beyond the rule's own code, and wait for an OK before writing it. The
proposal is where hidden risks surface: a job, a cascade or an admin tool that would break the
rule.

## Older ledgers

The document header states the format version. When opening a ledger with an older version or
no version, say so and offer to upgrade it. Do not upgrade without asking. List the changes the
upgrade would make before making them.

Upgrading 2.x to 2.10.0 is mechanical; no rule changes:

1. Set `Format: business-rules-ledger 2.10.0`.
2. Install `assets/business-rules-authoring.md` as `BUSINESS-RULES-AUTHORING.md` next to the ledger.
3. Delete the `How to write rules (br-M)` section, and point the header line at
   `BUSINESS-RULES-AUTHORING.md` as the template does.
4. Remove the br-M rows from the index. Note the file in the registry's M row.
5. Reinstall both scripts from the skill and run the checker.
6. From 2.3.0 or earlier: only `br-B07:` and `@see br-B07` count as citations now. Run the
   checker; it reports uncounted mentions. Add the colon where the code enforces the rule.
7. From 2.3.5 or earlier: reinstall both scripts. The checker now reads tags. It warns about a rule
   with no tags or a malformed tag; fix those. Tagging intents is optional. No rule changes.
8. From 2.4.0 or earlier: rename `LEDGER-AUTHORING.md` to `BUSINESS-RULES-AUTHORING.md`, reinstall it
   from the skill, and update the two links in the ledger and the registry's M row. Delete the
   Recent changes section; history lives in source lines and git.
   Replace the index's introduction line with the template's, then run the checker with `--write`
   to rebuild the index from the rules. Review the diff: where a hand-written index line said
   something the rule statement does not, the statement is what to fix. Then, rule by rule and
   only where it applies, number the rows of examples tables as tests and delete the
   Given/When/Then lines they repeat, and cut design notes that restate another document down to
   a pointer. Ask before those last two; they touch rule content. Optionally join each rule's
   short fields onto one line (see _Document structure_); the scripts read either form.
9. From 2.5.0 or earlier: reinstall the authoring file and both scripts. The format is unchanged.
   Fix the two new warnings: an observed rule with a `gap:` (move the concern to a `suspect:`
   note, or decide the rule as `open` or `settled`), and attended on over a third of the rules
   (ask the owner which to keep). Offer a lite spec for any area over about eight rules.
10. From 2.6.0 or earlier: reinstall the checker. The format is unchanged. The checker now lists
    what waits on the owner, dated by each entry's latest source line, and checks the other
    Markdown beside the ledger. Give an observed rule a dated source line if it has none. Fix or
    retire documents the checker says name nothing, and recommend running the checker in CI if
    nothing runs it.
11. From 2.7.0: reinstall the checker. The format is unchanged. The waiting list shows the 10
    oldest (`--waiting` for all) and dates observed entries from when they were read. Documents
    that name no intent come as one warning; mark any that are not product specs with
    `<!-- ledger: not a spec -->` rather than leaving the warning standing.
12. From 2.7.1: reinstall the checker. The format is unchanged. `--rule br-B02` prints one rule
    with its citations and tests; offer to add the `rule` script to `package.json` (see
    _Installing the script_). Offer to move any look-and-feel detail in rules or design notes
    into the area's lite spec.
13. From 2.7.2: reinstall the authoring file and both scripts. Delete the ledger's _How to read
    this ledger_ and _Citing rules in code_ sections (they now live in the authoring file) and
    point the header line at it as the template does. Add `File` and `Owner` columns to the
    registry, with `—` for every area. To get the shorter, unpadded index, delete the index
    table's rows and run `--write`. Over about 100 rules, offer to split areas into area files
    (see _Area files_); do not split unasked.
14. From 2.8.0: reinstall the authoring file and both scripts. The format is unchanged. `--area`
    lists the areas, `--area=B` narrows the report to one, `--index --area=B` prints its index rows,
    and the audio script takes `--area=` too; offer the `area` script if the ledger has area files.
15. From 2.9.0: reinstall the authoring file and the checker. The format is unchanged. If the
    checker reports errors for IDs in folders that hold other projects (examples, packages with
    ledgers of their own), offer an `Ignore:` line under `Format:` naming them.
16. From 2.9.3 or earlier: reinstall the checker. The enforcement levels are renamed: `none` is
    `unlinked`, `cited` is `linked`, `tested` is `tests written`, `passing` is `tests pass`. Run
    the checker with `--write` to rewrite the index; until then it reads the old names. Change
    `--require=` in CI and hooks to `tests-written` or `tests-pass`; the old names still work.

Upgrading 1.x to 2.10.0, in stages the user can stop between:

1. Set `Format: business-rules-ledger 2.10.0`. Do steps 2 to 4, 6 and 8 to 16 of the 2.x upgrade above.
2. Add the Intents and Glossary sections. Draft intents from the existing rules and their
   sources, mark them `observed`, and confirm them with the user one at a time.
3. Add `kind:` and `serves:` to every rule. Propose both; ask only where unclear.
4. Offer to mark rules whose only source is a code review as `observed`, and run intent review.
5. Add `gap:` lines where sources already admit the code diverges ("currently client-side
   only", "must be corrected in the migration").
6. Install the checker and run it with `--write`; it rebuilds the index with every column.
7. Offer a review-mode pass for rules over two sentences, using the _Complex areas_ pattern.

## Open rules

Mark a rule `open` whenever a question about it is unanswered — including questions the user has
not noticed. Raising them is a large part of the value here; a rule that sounds complete usually
is not.

Write the questions under the rule, one per line, in domain terms. Keep asking the awkward ones:
what happens when it is too late, who gets told, what if the person has left, which of two rules
wins when they conflict.

When opening an existing ledger, report the observed and open entries before doing anything else,
and the enforcement summary if the checker is installed. Nothing else in the document forces
them to close.

- **Run the checker first when it is installed.** Its _Waiting on the owner_ list is the report:
  observed intents and rules, and open rules, oldest first with their age. Observed intents
  count. Every rule that serves one rests on a guess until the owner confirms it.
- **Offer one next step, not a menu.** Observed entries: offer an intent review. Open rules:
  offer a grill session. Say how long the oldest has waited. A week is long enough to raise it
  unprompted.
- **Name documents the ledger contradicts.** When the checker warns that documents beside the
  ledger name no intent, say which. A plan or brief written before the ledger usually describes
  an older system, and it sits next to a file that calls itself the source of truth. Ask the owner
  for each: fix it to cite the ledger, move it out, or, if it is not a product spec at all (a
  component or style guide), mark it `<!-- ledger: not a spec -->`. Do not add the marker to
  silence a spec that disagrees with the ledger.
- **Check whether the checker is wired in.** If no CI step or hook runs it, recommend it once, as
  in _Wiring it in_. Enforcement that relies on someone remembering it decays first.

## Area files

A ledger stays one file while it is small. Past about 100 rules, offer to move areas into area
files; past 150, the checker warns on every run. The aim is that a reader, person or agent, loads
the master and only the areas the work touches.

```
specs/BUSINESS-RULES.md      the master: intents, glossary, the index of every rule, registry,
                             and any area still kept here
specs/rules/billing.md       an area file: that area's rule entries, nothing else
specs/rules/accounts.md
```

- **The registry decides where an area lives.** Its `File` column names the area file, relative
  to the master; `—` keeps the area in the master. Split one area at a time.
- **IDs do not change.** A rule keeps its ID when it moves, so code, tests, tickets and specs that
  cite it stay right. `--rule` and `git grep` find it wherever it is.
- **The index stays in the master, and lists every rule.** `--write` builds it from the master and
  every area file; `--verify` fails when it is out of date. A reader scans the index to find the
  rules a task touches, then opens their area files or runs `--rule`. Working in one area,
  `--index --area=B` prints just its rows.
- **Intents and the glossary stay in the master.** Every area serves the same intents and uses the
  same terms. An area file starts with a heading, a line linking the master and the authoring
  file, and then its rule entries.
- **Owners settle their areas.** The `Owner` column says who answers that area's open rules and
  observed entries. Ask that person, not the product owner, in intent review and grill sessions.
- **Report by area.** `--area` shows every area with its owner and what is waiting; `--area=B`
  gives that area's report alone. Use it when working in one area or talking to its owner. An
  area's CI job can run `--area=B --require=tests-written`, but keep one full run as well: intent
  problems appear only there.

The checker reports an error when a registered file is missing, when a rule sits in a file the
registry does not give its area, and when an ID appears twice.

**Reading a split ledger:** read the master's header, intents and index first. Open an area file
only for the rules the task touches. Never load every area file to answer a question about one.

**Splitting:** move each chosen area's entries, unchanged, into its file under a short heading,
set the registry's `File` and `Owner`, run `--write`, and check that the summary counts match the
run before the split.

## History

The ledger keeps no change log. A rule's history lives in its own source lines, dated and with the
reason; the document's history lives in git. When one change touches several rules for one
reason, give each a source line with the same date and reason, so any one of them explains itself.

## The index

The index is built, not written. `scripts/ledger-check.ts --write` reads every rule entry except
the authoring rules, in the master and in every area file, and writes one row per rule, retired ones included: its ID, its statement, the
intents it serves, its tags, its status and its enforcement. The statement, serves, tags and
status are written once, in the entry (br-M09). Never edit a row; amend the entry and rebuild.
`--verify` fails when someone forgot to.

A long statement makes a long row. That is a hint the rule wants splitting (br-M07), not a reason
to write a shorter version somewhere else.

## Document structure

Use this order exactly:

```markdown
# Business Rules Ledger — [project]

Source of truth. Code and tests conform to this document.
How to read it, cite it in code and write it: [`BUSINESS-RULES-AUTHORING.md`](BUSINESS-RULES-AUTHORING.md).
Format: business-rules-ledger 2.10.0
Ignore: [paths the checker never reads — optional]
Scan: [paths it reads although it skips them by default — optional]

## Intents

[### in-NN entries]

## Glossary

[table: Term | Meaning | Defined by]

## Index

[built by the checker: ID | Rule | Serves | Tags | Status | Enforcement — every rule, in this
document or an area file; no br-M rows]

## Registry

[table: Letter | Area | File | Owner]

## br-[X][NN]

[rule entries of the areas kept here, grouped by area, in ID order]
```

An area file holds only rule entries, under a heading and one line linking the master and
`BUSINESS-RULES-AUTHORING.md` (see _Area files_).

Intent entry:

```markdown
### in-02

A user is rewarded for consistency without being punished mid-day.

for: people building a daily habit
broken when: the streak shows 0 at 9am before the day's first entry.
non-goal: shaming a missed day.
status: settled

**Source**

- 2026-09-23, grill session. Users open the app in the morning; a broken streak there felt like failure.
```

Glossary row:

```markdown
| live | An active streak whose most recent track was today or yesterday in UTC. | br-B07 |
```

Rule entry:

```markdown
## br-B03

kind: behaviour | serves: in-01 | given: br-B01 | status: open | attended: required
gap: acknowledgement is not checked before confirmation; confirmEvent() skips it.

When a guest names a requirement, then a named person at the venue must acknowledge it before the event is confirmed.

`#allergen` `#liability` `#audit`

**Open questions**

- Who acknowledges when the named person has left the venue?

**Tests**

- B03.1 — Given an event with an unacknowledged requirement. When the venue confirms the event. Then the event stays unconfirmed.
- B03.2 — Given an unacknowledged requirement. When a venue user acknowledges it. Then the event stores their name and the time.

> Fails if an acknowledgement is recorded without a person.

**Design notes**

- Acknowledgement is a row in requirement_ack, not a flag, so the history survives edits.

**Source**

- 2026-07-14, planning conversation. Venues buy protection from liability.
```

A rule with examples numbers them as its tests and writes only the rest under Tests:

```markdown
**Examples**

Today is 8 Oct.

| Test  | Days with tracks | Days carrying the streak line |
| ----- | ---------------- | ----------------------------- |
| U10.1 | 8, 7, 6 Oct      | 8, 7, 6 Oct                   |
| U10.2 | 6, 5 Oct         | none                          |

> Fails if a day outside the open streak carries the streak line, or a day of the open streak does not.
```

Field order: kind, serves, given, status, attended, gap, compound. Write the short fields (kind
to attended) on one line, separated by ` | `, and `gap:` and `compound:` each on a line of their
own, since they hold sentences. One field per line also parses, for older ledgers. Omit `given` when the rule
stands alone. Omit `attended`, `gap` and `compound` unless they apply. Omit `Open questions` when
the rule is settled, `Examples` and `Design notes` when there are none, and `Tests` when every test
is a row of the examples table. Examples or a decision table go between the tags and the open
questions, under an `**Examples**` heading.

## Judgement calls

**How far to split.** Split where parts fail for their own reasons. Not every test deserves an
ID. Two tests that both fail because the same thing broke belong to one rule.

**Rule or design note.** Apply the notice check. The exception is br-M23: when stored state must
agree with a definition, that agreement is a rule, even though the storage itself is a design note.

**Rule or intent.** If it names a mechanism, number, or screen, it is a rule. If it names an
outcome a user would describe in their own words, it is an intent.

**When the user is vague.** Do not write a vague rule to be agreeable. A rule that cannot be
falsified is worse than no rule, because it looks like coverage. Write it `open` with the
question that would settle it.

**When they contradict an existing rule or a non-goal.** Say which, quote it, and ask which one
is now true. Do not write the new one and leave both standing.

---

## Changelog

- **2.10.0** — 2026-10-25 — The enforcement levels are renamed so each says what is true: `none` is `unlinked`, `cited` is `linked`, `tested` is `tests written` (the tests exist; "tested" sounded as if they had run), and `passing` is `tests pass`. `--require` takes them hyphenated (`--require=tests-pass`), and the old names still work there and in an index not yet rewritten. The report counts settled rules highest level first and leaves out empty levels — `Settled rules: 37 — 30 tests pass, 4 tests written, 2 linked, 1 unlinked.`, or `Settled rules: 37, all tests pass.` — because "0 none, 0 cited, 0 tested" read as counts of failures. `--area` heads its column _Tests pass_. Upgrade step 16: run `--write` once and update `--require=` in CI.
- **2.9.3** — 2026-10-25 — `Scan:` reads a copy of the checker only when it names that file, not its folder, so a project that scans the folder holding its copy never counts the checker's own citations. Those citations are new: the checker now cites the skill's own rules where it enforces them, and its header says they belong to the skill's ledger, not yours. In the skill's repo, every rule of that ledger is tested by name and passing, and it has a lite spec. Format unchanged.
- **2.9.2** — 2026-10-25 — The skill's own ledger is through intent review: every intent and rule is settled. Two answers change the checker. It reads shell scripts (`.sh`, `.bash`), which can hold business logic; YAML stays out, so a quoted CI step name never counts as a test name. And a rule with a `gap:` whose tests all passed gets a warning, since either the gap is stale or the tests miss it; `--require` still counts the level, so `passing, gap` meets `--require=passing`, which the READMEs now say. Format unchanged.
- **2.9.1** — 2026-10-22 — The skill keeps a ledger of its own (`specs/BUSINESS-RULES.md` in its repo: the checker's and the linter's rules, observed and waiting for intent review). Building it showed that a repo with examples could not scope the scan, so the master gains two optional header lines: `Ignore:` (paths never read, code or documents) and `Scan:` (paths read although skipped by default, such as copies of the checker). Ignore wins where both apply; a path that does not exist is a warning; the report names both. The checker's usage text uses `br-C01` as its example. Format unchanged.
- **2.9.0** — 2026-10-21 — Reports by area. `--area` lists the areas with each one's file, owner and counts of active, settled, passing and waiting rules. `--area=B` (also a name, an area file's path, or `B,U`) narrows the report to those areas: counts, rules not yet passing, waiting list, gaps, and their errors and warnings, with the rest counted under _Elsewhere in the ledger_. The exit code follows what is shown, so `--require` can gate one area; the whole ledger is still checked and the index stays whole. `--tag` respects `--area`. `--index` prints the index instead of the report, and `--index --area=B` only that area's rows, so an agent on a large ledger reads its slice. The audio script takes `--area=` and reads only those areas' rules and the intents they serve. The authoring file points readers at `--index --area`. A `—` owner reads as none. Format unchanged.
- **2.8.0** — 2026-10-20 — Room for a large product. A ledger can keep areas in area files: the registry gains `File` and `Owner` columns, the checker reads every area file it names and reports a missing file, a rule in the wrong file and a duplicate ID, and the one index stays in the master, listing every rule. New _Area files_ section; the checker warns past 150 rules in the master. _How to read this ledger_ and _Citing rules in code_ move into `BUSINESS-RULES-AUTHORING.md`, so the ledger holds only its own content. The index is unpadded. `--rule` and the audio script read area files. Upgrade step 13.
- **2.7.2** — 2026-10-19 — UI and visual design belong in lite specs, not the ledger: if the product would behave differently it is a rule, if it would only look different it is not. _Lite specs_ gains a look-and-feel row and paragraph, and the template a _Look and feel_ section. The checker's `--rule br-B02` prints one rule: statement, status, enforcement, entry line, citations, tests with file and line, and mentions that are not citations; installing the checker adds a `rule` script to `package.json`. Docs search rule IDs with `git grep`, which skips ignored files such as test results and `node_modules`. Upgrade step 12.
- **2.7.1** — 2026-10-12 — The 2.7.0 report, tuned on a 54-rule ledger built from code. _Waiting on the owner_ shows the 10 oldest entries with counts by kind (`--waiting` lists all), instead of 60 lines on every run. An observed entry is dated from its oldest source line, when it was read, so an amendment no longer resets its age; an open rule still dates from its newest. Ages use the local date, as ledger dates do. Documents that name no intent come as one warning, and a document that is not a product spec opts out with `<!-- ledger: not a spec -->`. Upgrade step 11. The smallest-complete-rule example (br-B20) says "less than 15 minutes" instead of "within", so its statement and Fails if agree with its test at exactly 15 minutes.
- **2.7.0** — 2026-10-11 — Nothing waits silently. The checker lists what is waiting on the owner (observed intents, observed and open rules) oldest first, with the date of each entry's latest source line and its open-question count, and counts intents by status in the summary. It checks the other Markdown beside the ledger: an ID that names nothing is a warning, and so is a document that names no intent (br-M30). An observed rule's source starts with the date it was read. _Open rules_ says what to do on opening a ledger: run the checker, offer one next step, name contradicting documents, and recommend wiring the checker in if nothing runs it. No ledger change needed; reinstall the checker.
- **2.6.0** — 2026-10-09 — Easier rule creation, shorter rules. New _The smallest complete rule_ and _Which tests to write_ under _Capturing a rule_: a test earns its ID only when it can fail for its own reason (new br-M32). Lite specs are defined (new br-M33, new asset `assets/lite-spec-template.md`): one page per area, holding the flow, cross-rule reasoning and mechanism, so rules keep only what decides. New _Batch answers_: grill, intent review and review can take numbered answers in one message. _Building a ledger from a codebase_ now agrees scope first and applies the notice check while capturing. br-M10 amended: an observed rule may carry open questions. br-M19 amended: attended is proposed in intent review, not while building from code. br-M28 amended: an observed rule has no gap; a concern is a `suspect:` note. Review mode checks duplicate tests and gaps that are not gaps. The checker warns about an observed rule with a gap and about attended on more than a third of rules. Upgrade step 9. Lessons from building a 54-rule ledger from a template app.
- **2.5.0** — 2026-10-08 — Less to write twice. The checker builds the whole index from the rule entries (`--write`), so a rule's statement, serves, tags and status are written once (br-M09, br-M29 amended); `--verify` compares the whole index, and the index-agreement lints are gone. Recent changes is removed: history lives in source lines and git (br-M15, br-M16 retired); the checker warns if the section is left. Rows of an examples or decision table are tests, with the test ID in the first column, and are not repeated as Given/When/Then lines (br-M17, M25, M26 amended); the checker reads test IDs from table rows. A design note points at a document that owns the detail instead of restating it (br-M22 amended). New _History_ and _The index_ sections replace _Recording changes_ and _Maintaining the index_. The authoring file is renamed `BUSINESS-RULES-AUTHORING.md` (asset `assets/business-rules-authoring.md`), so it sorts beside `BUSINESS-RULES.md`; the checker warns when a ledger still links the old name. A rule's short fields share one line, separated by ` | ` (`kind: behaviour | serves: in-01 | status: settled`); `gap:` and `compound:` keep their own lines. Both scripts read either form. Upgrade step 8.
- **2.4.0** — 2026-10-06 — Tags are checked and can be queried. An intent can carry tags like a rule (br-M08 amended): a line of backticked #tags under its statement. The checker reads tags on rules and intents; it warns about a rule with no tags, a malformed tag, and index tags that differ from the tags under the rule; `--tag` lists every tag with counts and `--tag=name` lists the rules and intents that carry it. The audio script reads an intent's tags. New guidance for a shared tag such as `boilerplate`, to mark what a template or another product should keep. The template shows the intent tag line. Existing ledgers need no change except fixing any new tag warnings.
- **2.3.5** — 2026-10-02 — Lessons from building code against a ledger. Citations are the ID with a colon or after `@see` (br-M12 amended); other mentions no longer count as enforcement, and the checker reports them. Authoring rule IDs (br-M) in code are ignored. Row lengths ignore table padding. Tunable numbers: default in the rule, config key in a design note, number in the tests (br-M31). New _Building code against the ledger_: ask rather than invent, attended rules as checkpoints, code-versus-rule disagreements, other writers of protected data, gaps during a rebuild. Review mode checks other writers. Decision briefs for audio. xUnit v3 TRX command fixed.
- **2.3.0** — 2026-10-02 — Authoring rules move out of the ledger into `LEDGER-AUTHORING.md` (new asset, installed next to the ledger); the ledger carries a short _How to read this ledger_ section instead, and br-M rows leave the index (br-M09 amended). Added _Specs alongside the ledger_: a spec is a welcome overview when it names its intents and cites rules for every decision (br-M30). Review mode gains a cross-document agreement check. Checker warns when the linked authoring file is missing, and skips every copy of itself when scanning, not only the one running. Added the 2.x upgrade path.
- **2.2.1** — 2026-09-25 — Checker skips its own file when scanning; an example comment in it counted as a citation of br-B03 once installed in a project.
- **2.2.0** — 2026-09-24 — Checker reads TRX and JUnit XML results as well as Jest/Vitest JSON; --results takes files or directories, comma-separated; warns on results with no test IDs. Added Test names by stack (Jest, Vitest, xUnit, NUnit, MSTest, pytest, Go). Verified against real dotnet test output.
- **2.1.2** — 2026-09-24 — Amended br-M13: tests in code are named br-B03.1; the skill now says so where it named bare B03.1. Checker counts a test ID only inside a string literal (test name), warns on unprefixed test names, and says what passing does not prove. Review mode gains a test-fit check.
- **2.1.1** — 2026-09-24 — Template and format lines match the skill version. Both scripts carry a version comment. Description trimmed under 1024 characters.
- **2.1.0** — 2026-09-24 — Checker installs and runs locally like the audio script. Added --verify (index out of date). Hooks and CI are recommended, tailored to the repo, never set up without asking.
- **2.0.0** — 2026-09-24 — Intents layer (in-NN, serves:, non-goals). Glossary. Rule kinds. Statuses observed and retired. Enforcement computed by the new checker (assets/ledger-check.ts) and written into the index; gap: field. Complex-areas pattern: definitions, worked examples, decision tables, consistency invariants, boundary tests; mechanism moves to design notes. Two-sentence limit with compound:. Building from a codebase, and intent review mode. Review mode gains intent fit, size, and cross-rule checks. Audio groups by intent. Amended br-M04 M07 M09 M10; added br-M20 to M29.
- **1.5.5** — 2026-09-23 — Audio script: uppercase IDs, tags inline, Fails if on own line, full stops, section heading includes rule count.
- **1.5.0** — 2026-09-23 — Added audio script mode. Ships assets/audio-ledger.ts; offers to install it into any project so it runs outside Claude. Triggers on "read me the rules", "audio", "listen".
- **1.4.0** — 2026-09-22 — Added review mode (fresh-eyes pass for settled rules). Added conditional framing check to capturing a rule. Added stale source clause audit to amending a rule.
- **1.3.0** — 2026-09-22 — Amended br-M04: plain-assertion form for invariants and definitions alongside When/Then. Amended br-M17: Fails if written as a blockquote.
- **1.2.0** — 2026-09-22 — Added the optional attended field, br-M19.
- **1.1.0** — 2026-09-22 — Added grill mode. Added format version to the ledger header, and an offer to upgrade older ledgers.
- **1.0.0** — 2026-09-22 — First version. Given / When / Then tests, open and settled status, index, recent changes, br-M01 to br-M18.
