# Ledger authoring rules (br-M)

The rules for writing and amending the business rules ledger in this folder.
Format: business-rules-ledger 2.6.0

Read these before adding or changing any rule, intent or glossary entry. To read the ledger, the
_How to read this ledger_ section in the ledger itself is enough.

These rules ship with the business-rules-ledger skill. Reinstall from the skill to update; do not
edit them per project.

---

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
