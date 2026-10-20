# Business Rules Ledger — [project]

Source of truth. Code and tests conform to this document.
How to read it, cite it in code and write it: [`BUSINESS-RULES-AUTHORING.md`](BUSINESS-RULES-AUTHORING.md).
Format: business-rules-ledger 2.8.0

---

## Intents

What a user should be able to do, and what would feel broken. Every rule serves at least one.

### in-01

[A user can … — one sentence, an outcome a user would notice.]

`#tag` _(optional on an intent; delete this line when there is nothing to tag)_

for: [who]
broken when: [one concrete moment the user would feel it is broken.]
non-goal: [something a reasonable person might build that we deliberately do not.]
status: settled

**Source**

- [YYYY-MM-DD], [conversation, ticket ID, or URL]. [Why this outcome matters.]

---

## Glossary

Each domain term, defined once. Rules use these terms exactly.

| Term   | Meaning         | Defined by |
| ------ | --------------- | ---------- |
| [term] | [One sentence.] | br-[X][NN] |

---

## Index

Every rule, in this document or an area file. Built by `scripts/ledger-check.ts --write`. Do not edit it by hand.

| ID     | Rule                                             | Serves | Tags        | Status  | Enforcement |
| ------ | ------------------------------------------------ | ------ | ----------- | ------- | ----------- |
| br-A01 | The rule's statement, copied from its entry.     | in-01  | `tag` `tag` | settled | none        |
| br-A02 | A rule with unanswered questions attached to it. | in-01  | `tag`       | open    | none        |

---

## Registry

| Letter | Area | File | Owner |
| --- | --- | --- | --- |
| M | How to write rules | BUSINESS-RULES-AUTHORING.md | — |
| B | Business | — | — |
| U | Interface | — | — |
| A | API | — | — |
| D | Data | — | — |

Add a letter when a rule needs it. Not before. `File` is `—` while an area's rules live in this
document. When an area outgrows it, move its rules to an area file such as `rules/billing.md` and
name the file here; the checker reads it and keeps every rule in the index above. `Owner` is who
settles that area's open rules.

Retire an ID. Never reuse one — rule or intent.

---

## br-[X][NN]

kind: [definition, invariant or behaviour] | serves: in-[NN] | given: br-[X][NN] | status: [observed, open, settled or retired] | attended: required
gap: [what the code does today instead] _(omit when the code conforms)_
compound: [why this rule cannot split] _(omit unless over two sentences)_

_(On the first line, omit `given:` when the rule stands alone; it takes rule IDs only. Omit `attended:` unless an agent must not work on the rule alone.)_

When [condition], then [outcome]. _(behaviour; a plain assertion for a definition or invariant)_

`#tag` `#tag`

**Examples** _(dates, counts, arithmetic, or more than two conditions; omit otherwise. Each row is a test.)_

| Test       | Input         | Output         |
| ---------- | ------------- | -------------- |
| [X][NN].1  | [exact input] | [exact output] |

**Open questions** _(omit when the rule is settled)_

- [What is unanswered. One question per line.]

**Tests** _(only those not already a row of the examples table)_

- [X][NN].2 — Given [starting state]. When [event]. Then [outcome].
- [X][NN].3 — Given [starting state]. When [event]. Then [outcome].

> Fails if [the condition that proves the rule broken].

**Design notes** _(mechanism; omit when there is none)_

- [How the code implements this. Can change without a rule change. When another document owns the detail, point at it instead of restating it.]

**Source**

- [YYYY-MM-DD], [conversation, ticket ID, or URL]. [Why the rule exists. What went wrong without it.]
- [YYYY-MM-DD], [source]. [What changed and why the previous version was wrong.]
