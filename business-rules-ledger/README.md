---
metadata:
  version: "2.9.1"
---

# The Business Rules Ledger

A ledger is a numbered list of the decisions your product has made, each one small enough to be
true or false, each one pointing at the test that proves it.

It sits **alongside** your test suite. It does not replace it, does not change how you write
tests, and does not ask you to restructure anything. It gives your tests something to point at.

---

## Why not just a spec?

A spec is prose. Prose cannot be falsified. "The system should handle refunds gracefully" is not
a claim anyone can check, so nobody checks it. Specs are written once, agreed in a meeting, and
then quietly diverge from the code for the rest of the project's life. Nobody re-reads them,
because everyone knows they're stale.

That doesn't mean specs have no place. A spec still works well as the readable overview of a
feature — how the parts fit, what to look at first — as long as it names the intents it serves
and cites the rule for every decision it mentions. The spec explains; the rules decide.
The skill's short form of this is a **lite spec**: one page per area, beside the ledger, that holds
the flow, the mechanism and the look and feel (layout, styling, the design guide), so each rule
can stay a few lines long and the ledger holds only logic.

## Why not just tests?

Tests are falsifiable — that's the point of them — but they only record _what the code does_, not
_what anyone decided_. A test named `returns_400_when_email_missing` tells you the behaviour. It
doesn't tell you whether that was a considered decision, an accident of the framework, or a
workaround someone added at 2am in 2023. When you want to change it, there's nobody to ask and
nothing to read.

A test also can't tell you what's _missing_. There's no test for the rule nobody wrote.

## Why not the notes file?

The most common thing in practice isn't a spec at all — it's a markdown file of thoughts out
loud. "Here's a great feature." "I reckon we should handle it like this." It's genuinely the
richest of the three for _reasoning_, because nobody's performing a document format: you get the
real trade-offs, the half-considered alternatives, the reason someone was uneasy.

It also has the shortest half-life. Nothing connects it to the code, so nothing tells you when it
stopped being true. Six months on it's archaeology — you can't tell which parts shipped, which
were abandoned, and which quietly changed.

A ledger is the notes file with two things bolted on: an ID per decision, and a checker that
keeps telling you whether the code still agrees.

## What a ledger adds

One numbered claim per decision, with a reason, a status, and a computed record of whether the
code actually enforces it.

```markdown
## br-B03

kind: invariant | serves: in-02 | status: settled

A refund may be issued within 30 days of the original charge date, inclusive.

`#billing` `#refunds`

**Examples**

| Test  | Charge was made | Refundable |
| ----- | --------------- | ---------- |
| B03.1 | 30 days ago     | yes        |
| B03.2 | 31 days ago     | no         |

> Fails if a charge older than 30 days is refunded, or one 30 days old or younger is refused.

**Source**

- 2026-03-14, pricing call. Chose 30 days over 14 to match competitor terms.
```

In the code, the ID followed by a colon marks where the rule is enforced:

```ts
// br-B03: refunds allowed within 30 days of the charge
if (daysSince(charge.date) > 30) return deny("refund_window_expired");
```

And the test is named after the test ID:

```ts
it("br-B03.1 a charge 30 days old is refundable", () => { ... });
```

That's the whole idea. The rule has an ID, the code cites the ID, the test is named after the ID.

## The bit that makes it stick

A checker greps your codebase and works out, for each rule, how far it actually got:

| Level     | Meaning                                                   |
| --------- | --------------------------------------------------------- |
| `none`    | Written down. Nothing in the code mentions it.            |
| `cited`   | Code cites the rule (`br-B03:` or `@see br-B03`).         |
| `tested`  | A test named after the rule exists.                       |
| `passing` | That test ran and passed in the results file you gave it. |

You never write the index by hand — the checker builds it from the rules and computes that column. Run it in
CI with `--verify` and the build fails when the index is stale. Run it with `--require=tested`
and the build fails when a settled rule has no test.

That's the difference in one sentence: **a spec tells you what someone once intended; a ledger
tells you which of those intentions the code is currently keeping.**

## What it looks like day to day

- Someone asks "why does it do that?" — you grep for the rule ID and read the source line.
- Someone changes the refund window — they amend `br-B03`, cite the conversation, and the test
  that now fails tells them exactly what else assumed 30 days.
- A rule gets deleted — its ID is never reused, so the history stays readable.
- You inherit a legacy codebase — you read rules _out of_ the code as `observed`, then sit with
  whoever owns the product and confirm which ones were actually decisions.

## What it costs

Real effort, honestly. Writing rules properly is slower than writing prose, and there are
authoring conventions to learn. It pays off on codebases that live long enough for people to
forget things — small to medium projects and up. On a throwaway prototype it's overhead for its
own sake.

## Getting started

1. Copy `assets/ledger-template.md` into your repo as `specs/BUSINESS-RULES.md`, and
   `assets/business-rules-authoring.md` next to it as `BUSINESS-RULES-AUTHORING.md`.
2. Write your intents first — what a user should be able to do, and what "broken" looks like.
3. Add rules as decisions come up. You don't need a complete ledger on day one. A rule needs
   only a statement, a kind, the intent it serves, tags, a few tests, a Fails if line and a source.
4. When an area grows past about eight rules, add a lite spec from `assets/lite-spec-template.md`.
5. Install the checker and run it. Add it to CI once you have enough rules to care.
6. Past about 100 rules, move areas into area files: the master keeps the intents, glossary and
   the index of every rule, and each area file holds one area's rules.

The full reference — authoring rules, the modes for grilling open rules and reviewing a ledger,
the checker's options, and test naming for each stack — is in `SKILL.md`.
