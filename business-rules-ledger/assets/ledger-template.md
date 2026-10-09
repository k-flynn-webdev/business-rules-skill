# Business Rules Ledger — [project]

Source of truth. Code and tests conform to this document.
Written under the authoring rules in [`BUSINESS-RULES-AUTHORING.md`](BUSINESS-RULES-AUTHORING.md).
Format: business-rules-ledger 2.5.0

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

Built by `scripts/ledger-check.ts --write` from the rule entries below. Do not edit it by hand.

| ID     | Rule                                             | Serves | Tags        | Status  | Enforcement |
| ------ | ------------------------------------------------ | ------ | ----------- | ------- | ----------- |
| br-A01 | The rule's statement, copied from its entry.     | in-01  | `tag` `tag` | settled | none        |
| br-A02 | A rule with unanswered questions attached to it. | in-01  | `tag`       | open    | none        |

---

## How to read this ledger

- A rule's ID is `br-` + area letter + two digits: `br-B03`. IDs are never reused. Its tests are `B03.1`, `B03.2` here, and `br-B03.1` in code.
- An intent (`in-01`) is a user outcome. A rule's `serves:` names the intents it protects. `given:` names the rules it assumes are true.
- Status: `observed` (read from code, not confirmed), `open` (questions unanswered), `settled` (decided), `retired` (no longer applies, kept for history). Only settled rules are decisions.
- A rule's tests are the rows of its examples table, by the ID in the first column, and the numbered lines under **Tests**.
- `> Fails if` is the condition that proves a rule broken. `gap:` records where the code does not conform yet.
- The index is built from the rule entries by `scripts/ledger-check.ts`, which also computes enforcement. Never edit it by hand.
- A rule's history is in its **Source** lines. The ledger keeps no change log; git does.
- Specs and other documents may describe an area, but decisions live here. When they disagree with this ledger, this ledger wins.
- Before adding or changing a rule, read the authoring rules (br-M) in [`BUSINESS-RULES-AUTHORING.md`](BUSINESS-RULES-AUTHORING.md).

---

## Citing rules in code

The ID is the link. `grep -r "br-[X][NN]"` returns the rule, its tests, and the code that enforces it.
`scripts/ledger-check.ts` reads the same citations to compute enforcement.

A citation is the ID followed by a colon (`br-B07:`) or after `@see`. Mentioning a rule anywhere
else, such as "(br-B07)" in an explanation, does not count as enforcement.

```js
/**
 * [What the function does.]
 * @see br-[X][NN] [The rule, in one line.]
 */
function doTheThing(...) { ... }
```

```js
// br-[X][NN]: [why this branch exists]
if (condition) throw new SomeError();
```

```js
test("br-[X][NN].1 [the test, in domain terms]", () => {
  // Given [starting state]
  // When [event]
  // Then [outcome]
});
```

```csharp
[Fact(DisplayName = "br-[X][NN].1 [the test, in domain terms]")]  // NUnit: TestCase(TestName = …); MSTest: TestMethod("…")
public void TheTest() { /* Given, When, Then */ }
```

Put the test ID in the test's display name, not the method name. Run .NET tests with
`dotnet test --logger trx` and pass the TestResults folder to the checker's `--results=`.

| Enforcement | Meaning                                                                                 |
| ----------- | --------------------------------------------------------------------------------------- |
| none        | No code cites the rule.                                                                 |
| cited       | Code cites the rule, but not every ledger test has a named test in code.                |
| tested      | Every ledger test has a test named after it in code.                                    |
| passing     | Those tests all passed in the supplied results. This does not prove they test the rule. |

`, gap` means the rule has a known divergence recorded in its `gap:` line.

---

## Registry

| Letter | Area                                        |
| ------ | ------------------------------------------- |
| M      | How to write rules (in BUSINESS-RULES-AUTHORING.md) |
| B      | Business                                    |
| U      | Interface                                   |
| A      | API                                         |
| D      | Data                                        |

Add a letter when a rule needs it. Not before.

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
