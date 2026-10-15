# Lite spec — Streaks

Serves: in-04 (rewarded for consistency without being punished mid-day).

A lite spec is the readable overview of one area: how its parts fit and what to look at first.
It decides nothing. Every decision it mentions cites the rule that holds it in
[`BUSINESS-RULES.md`](BUSINESS-RULES.md), and when the two disagree, the ledger wins.

## The idea in one paragraph

A streak rewards writing on consecutive days. It is defined from the tracks themselves (br-B06),
not kept as a counter that something has to remember to update. Days are the user's own
calendar dates (br-D03), so a user in Sydney and a user in London both see their streak roll over
at their own midnight. The current streak survives until the end of tomorrow (br-B07), which is
what stops the app punishing someone at 9am for not having written yet.

## The parts

| Part                    | What it is                                           | Rule   |
| ----------------------- | ---------------------------------------------------- | ------ |
| `streaksOf(tracks)`     | Every streak, oldest first                           | br-B06 |
| `currentStreak(…)`      | The open streak's length, or 0                       | br-B07 |
| `bestStreak(tracks)`    | The longest streak                                   | br-B09 |
| `shouldNotify(…)`       | Whether creating a track shows the notification      | br-B08 |
| Stored streaks (future) | A cached copy for fast reads                         | br-B16 |

Start with `src/streaks.ts` and its tests in `src/streaks.test.ts`. Every test is named after a
test ID in the ledger, so `git grep -n "br-B07"` shows the rule, its code and its tests together.

## Storage (design detail for br-B16)

Today streaks are computed on every read. They are cheap to compute for a journal's few hundred
days. When reads need to be faster, streaks will be stored per user and rebuilt from scratch on
every track create and delete, not patched incrementally. Rebuilding is what makes br-B16 easy to
keep: the stored copy is, by construction, br-B06 applied to the tracks.

The test for br-B16 generates random histories of creates and deletes and compares the stored
streaks with a fresh recomputation. It is listed in the ledger and not written yet, which is why
the checker reports br-B16 as `none`.

## Why it is shaped like this

The first version stored a streak record and opened or closed it as tracks arrived, in UTC
(br-B11, now retired). It broke in two ways: users east of London lost their streak every
morning, and deleting a track left the stored streak wrong. Moving to a definition plus one
consistency invariant replaced a page of lifecycle rules and fixed both. The ledger keeps br-B11
with its reason, so nobody reintroduces it.
