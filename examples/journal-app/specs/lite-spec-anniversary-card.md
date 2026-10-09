# Lite spec — Anniversary card

Serves: in-05 (rediscover what you wrote on this day in past years).

The readable overview of the anniversary card. Decisions live in
[`BUSINESS-RULES.md`](BUSINESS-RULES.md); this page explains how the card fits together and owns
its look, which br-B10's design note points here for.

## What the user sees

Above the write box, a small card titled "This day last year" shows what the user wrote around
the same date a year ago. Which tracks appear is br-B10: up to two, within three days, closest
first. The anniversary date for 29 February is also br-B10.

## Look and arrival

- The card sits above the write box, joined to it by a short branch line, so it reads as a side
  track off the main line rather than part of the feed.
- Each track shows its date and its text, as plain text (br-U05).
- The card loads after the page and grows in over 0.4s, pushing the write box down, so nothing
  jumps. With reduced motion it appears without animating.

None of this changes what br-B10 decides, so changing it needs no ledger edit.

## The parts

| Part                         | What it is                                  | Rule   |
| ---------------------------- | ------------------------------------------- | ------ |
| `anniversaryDate(today)`     | The same month and day a year back          | br-B10 |
| `anniversaryTracks(…)`       | The tracks the card shows                   | br-B10 |

Start with `src/anniversary.ts`. Its tests in `src/anniversary.test.ts` are the rows of br-B10's
decision table, one test per row.
