# Lite spec — [Area]

Serves: in-[NN] ([the intent, in a few words]).

A lite spec is the readable overview of one area. It decides nothing: every decision it mentions
cites the rule that holds it in [`BUSINESS-RULES.md`](BUSINESS-RULES.md), and when the two
disagree, the ledger wins (br-M30). Delete any section below that has nothing to say.

## The idea in one paragraph

[What this area is for and the one or two choices that shape it, each with its rule ID. Written
for someone who has never seen the code.]

## How it fits together

[Either a flow, as numbered steps, or a table of parts. Cite a rule for every decision.]

1. **[Step].** [What happens] (br-[X][NN]).
2. **[Step].** [What happens] (br-[X][NN]).

| Part                  | What it is           | Rule        |
| --------------------- | -------------------- | ----------- |
| `[function or file]`  | [one line]           | br-[X][NN]  |

## Why these rules work together

[Reasoning that spans rules and would otherwise be repeated in each one's source. For example:
"br-B05 only limits guesses once br-B19 makes one code work at a time."]

## Mechanism

[How it is built, where that is worth more than a line on the rule. Each rule's design note
points here instead of restating it (br-M22).]

## Look and feel

[Layout, styling, components and visual states for this area, or a link to the design guide that
holds them. Not rules: a decision about behaviour the user relies on, such as when an error
shows, cites its rule instead.]

## Known issues

[Gaps and suspects in this area, by rule ID, and where the work is tracked.]

## History

[Optional. A few dated lines on how the area got here. Each rule's own source line still holds
the reason for that rule.]
