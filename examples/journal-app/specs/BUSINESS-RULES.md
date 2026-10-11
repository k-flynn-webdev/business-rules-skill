# Business Rules Ledger — Journal app (example)

Source of truth. Code and tests conform to this document.
Written under the authoring rules in [`BUSINESS-RULES-AUTHORING.md`](BUSINESS-RULES-AUTHORING.md).
Format: business-rules-ledger 2.6.0

---

## Intents

What a user should be able to do, and what would feel broken. Every rule serves at least one.

### in-01

A user can capture a short thought.

for: anyone keeping a quick journal
broken when: a thought is lost or cut short without the user being told.
non-goal: the fastest possible save. A short delay while saving is kept on purpose, for a nicer feel.
status: settled

**Source**

- 2026-09-24, kickoff conversation. Over-long text is blocked with a message, never silently cut off.

### in-02

A user's entries are private to them.

`#privacy`

for: anyone writing personal thoughts
broken when: a user sees, or can reach, another user's entry.
non-goal: public entries or share links.
status: settled

**Source**

- 2026-09-25, kickoff conversation. Tracks are for the person who wrote them. The developer has database access but does not read entries.

### in-03

A user's journal is a faithful record: nothing they wrote is lost, altered, or reordered.

for: anyone keeping a journal
broken when: an entry disappears, changes without the user editing it, or jumps position in the feed.
status: settled

**Source**

- 2026-09-25, kickoff conversation. Deleting a track hides it and keeps it. Permanent erasure happens only when the user asks for it.

### in-04

A user is rewarded for consistency without being punished mid-day.

`#streak`

for: people building a daily habit
broken when: a user who wrote on every day of their own calendar sees their streak break.
non-goal: shaming a missed day.
status: settled

**Source**

- 2026-09-23, grill session. A user mid-day should not see their streak broken.
- 2026-09-25, grill session. Days are the user's own calendar dates, not UTC. Flying east can skip a date; accepted as rare.

### in-05

A user rediscovers what they wrote on this day in past years.

`#anniversary`

for: anyone keeping a journal over time
broken when: a user who wrote around this date a year ago doesn't see it, or sees an entry from weeks away.
status: settled

**Source**

- 2026-09-23, grill session. Default one year back, ±3 days.

---

## Glossary

Each domain term, defined once. Rules use these terms exactly.

| Term               | Meaning                                                                                                   | Defined by |
| ------------------ | --------------------------------------------------------------------------------------------------------- | ---------- |
| track              | A plain-text entry, owned by one user.                                                                    | br-B01     |
| entry, thought     | User-facing words for a track, used in intents. Rules say track.                                          | br-B01     |
| deleted track      | A track with deleted_at set. Hidden from the user, kept in the database unless the user asks for erasure. | br-B05     |
| character          | One UTF-16 code unit, as the browser's text length counts it. An emoji can be 2.                          | br-B02     |
| local_date         | The calendar date in the user's time zone when a track was created. Fixed at creation.                    | br-D03     |
| day                | A local_date.                                                                                             | br-D03     |
| streak             | A run of consecutive days, each with at least one non-deleted track.                                      | br-B06     |
| open streak        | A streak whose most recent day is today or yesterday.                                                     | br-B07     |
| current streak     | The length of the open streak, or 0 when none is open.                                                    | br-B07     |
| best streak        | The length of the longest streak in the user's non-deleted tracks.                                        | br-B09     |
| anniversary date   | The same month and day, a whole number of years before today. 29 February falls back to 28 February.      | br-B10     |
| anniversary window | The ±3 days around an anniversary date.                                                                   | br-B10     |
| erasure            | Permanent removal of a user's account and tracks, deleted ones too, on the user's request.                | br-B14     |

---

## Index

Built by `scripts/ledger-check.ts --write` from the rule entries below. Do not edit it by hand.

| ID     | Rule                                                                                                                                          | Serves      | Tags                    | Status            | Enforcement |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------- | ----------------- | ----------- |
| br-B01 | A track is a plain-text entry owned by a single user. The owner is the signed-in user who created it.                                         | in-02       | `track` `core`          | settled           | passing     |
| br-B02 | Track text is between 2 and 200 characters, counted after trimming.                                                                           | in-01       | `track` `validation`    | settled           | passing     |
| br-B05 | When a user deletes a track, then its deleted_at is set and the track stays in the database.                                                  | in-03       | `track` `delete`        | settled, attended | passing     |
| br-B06 | A streak is a run of consecutive days, each with at least one non-deleted track. Its length is the number of days in the run.                 | in-04       | `streak`                | settled           | passing     |
| br-B07 | The current streak is the length of the open streak, or 0. A streak stays open while its most recent day is today or yesterday.               | in-04       | `streak`                | settled           | cited       |
| br-B08 | When a track is created and the current streak counting it is at least 7, then the streak notification shows.                                 | in-04       | `streak` `notification` | settled           | passing     |
| br-B09 | The best streak is the length of the longest streak in the user's non-deleted tracks. A deletion can lower it.                                | in-04       | `streak`                | settled           | passing     |
| br-B10 | The anniversary card shows up to 2 non-deleted tracks within ±3 days of the anniversary date, closest first, ties to the track created first. | in-05       | `anniversary`           | settled           | passing     |
| br-B11 | When a track is created and no active Streak exists, then open a new Streak with start_date = today UTC.                                      | in-04       | `streak`                | retired           | —           |
| br-B14 | When a user emails asking for erasure, then their account and every track, deleted ones too, are removed within one month.                    | in-03       | `delete` `privacy`      | settled, attended | none, gap   |
| br-B16 | Stored streak data always equals br-B06 recomputed from the user's non-deleted tracks.                                                        | in-04       | `streak` `data`         | settled           | none        |
| br-B21 | When a track is created or edited, then leading and trailing whitespace is removed; empty text is rejected.                                   | in-01       | `track` `validation`    | settled           | passing     |
| br-B22 | When a user deletes a track by mistake, then they can restore it.                                                                             | in-03       | `track` `delete`        | open              | none        |
| br-U02 | The feed shows 20 tracks per page.                                                                                                            | in-03       | `feed`                  | observed          | none        |
| br-U05 | Track text is always displayed as plain text, never rendered as HTML.                                                                         | in-02 in-03 | `track` `security`      | settled           | none        |
| br-A04 | The API identifies the user only from their session, never from ids sent in the request.                                                      | in-02       | `api` `security` `auth` | settled, attended | none        |
| br-D03 | A track's day is its local_date: the user's calendar date, in their time zone, when the track was created. It never changes.                  | in-04 in-05 | `data` `time`           | settled           | passing     |
| br-D05 | No log, error report or admin screen shows track text.                                                                                        | in-02       | `privacy` `security`    | settled           | none, gap   |

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

| Letter | Area                                                |
| ------ | --------------------------------------------------- |
| M      | How to write rules (in BUSINESS-RULES-AUTHORING.md) |
| B      | Business                                            |
| U      | Interface                                           |
| A      | API                                                 |
| D      | Data                                                |

Add a letter when a rule needs it. Not before.

Retire an ID. Never reuse one — rule or intent.

---

## br-B01

kind: definition | serves: in-02 | status: settled

A track is a plain-text entry owned by a single user. The owner is the signed-in user who created it.

`#track` `#core`

**Tests**

- B01.1 — Given a create request that names another user. When the track is created. Then its owner is the signed-in user.

> Fails if a track's owner can be set from anything but the session.

**Source**

- 2026-09-24, kickoff conversation. Every entry belongs to exactly one person; there are no shared journals.

---

## br-B02

kind: invariant | serves: in-01 | given: br-B21 | status: settled

Track text is between 2 and 200 characters, counted after trimming.

`#track` `#validation`

**Examples**

| Test  | Text, after trimming | Characters | Result   |
| ----- | -------------------- | ---------- | -------- |
| B02.1 | `x`                  | 1          | rejected |
| B02.2 | `xx`                 | 2          | allowed  |
| B02.3 | `xxx`                | 3          | allowed  |
| B02.4 | 199 × `x`            | 199        | allowed  |
| B02.5 | 200 × `x`            | 200        | allowed  |
| B02.6 | 201 × `x`            | 201        | rejected |
| B02.7 | 100 × 👋             | 200        | allowed  |
| B02.8 | 101 × 👋             | 202        | rejected |

> Fails if a track under 2 or over 200 characters is stored, or one from 2 to 200 is refused.

**Source**

- 2026-09-22, kickoff conversation. Long enough to say something, short enough to stay a thought.
- 2026-09-24, review. Characters are UTF-16 code units, as the browser counts them, so the counter and the server agree. Previously: "characters", undefined, and an emoji counted as 1 on one side and 2 on the other.

---

## br-B05

kind: behaviour | serves: in-03 | status: settled | attended: required

When a user deletes a track, then its deleted_at is set and the track stays in the database.

`#track` `#delete`

**Tests**

- B05.1 — Given a track. When the user deletes it. Then deleted_at is set and the track is still stored, unchanged otherwise.

> Fails if deleting a track removes any of its data.

**Source**

- 2026-09-25, kickoff conversation. Attended: deletion is where data is lost for good, and in-03 promises it is not. Only erasure (br-B14) removes a track.

---

## br-B06

kind: definition | serves: in-04 | given: br-D03 | status: settled

A streak is a run of consecutive days, each with at least one non-deleted track. Its length is the number of days in the run.

`#streak`

**Examples**

| Test  | Days with tracks                        | Streaks                       |
| ----- | --------------------------------------- | ----------------------------- |
| B06.1 | Fri, Sat, Sun, Tue                      | Fri–Sun (3 days), Tue (1 day) |
| B06.2 | Mon, five tracks                        | Mon (1 day)                   |
| B06.3 | Fri, Sat, Sun; Sat's only track deleted | Fri (1 day), Sun (1 day)      |

> Fails if a day without a non-deleted track joins a streak, or two tracks on one day count as two days.

**Source**

- 2026-09-23, grill session. Previously the streak was a stored record opened and closed as tracks arrived (br-B11, br-B12). Defined from the tracks instead, so a deletion or a time zone cannot leave it wrong.

---

## br-B07

kind: definition | serves: in-04 | given: br-B06 | status: settled

The current streak is the length of the open streak, or 0. A streak stays open while its most recent day is today or yesterday.

`#streak`

**Examples**

Today is Wednesday in the user's time zone.

| Test  | Days with tracks | Most recent day | Streak | Current streak |
| ----- | ---------------- | --------------- | ------ | -------------- |
| B07.1 | Mon, Tue, Wed    | today           | open   | 3              |
| B07.2 | Mon, Tue         | yesterday       | open   | 2              |
| B07.3 | Mon              | 2 days ago      | ended  | 0              |
| B07.4 | none             | —               | none   | 0              |

**Tests**

- B07.5 — Given a track written on Tuesday in Sydney. When the user reads their streak on Wednesday from London. Then today is Wednesday in London and the current streak is 1.

> Fails if a user who wrote yesterday sees 0 before writing today.

**Source**

- 2026-09-23, grill session. A user mid-day should not see their streak broken (in-04).
- 2026-09-25, grill session. "Today" is the user's calendar date. Previously: UTC, which broke streaks for anyone east of London every morning.

---

## br-B08

kind: behaviour | serves: in-04 | given: br-B07 | status: settled

When a track is created and the current streak counting it is at least 7, then the streak notification shows.

`#streak` `#notification`

**Examples**

The threshold is 7. Today is Thursday.

| Test  | Before the new track                 | Current streak counting it | Notification |
| ----- | ------------------------------------ | -------------------------- | ------------ |
| B08.1 | 5-day streak ending yesterday        | 6                          | no           |
| B08.2 | 6-day streak ending yesterday        | 7                          | yes          |
| B08.3 | 7-day streak ending yesterday        | 8                          | yes          |
| B08.4 | 7-day streak already including today | 7                          | yes, again   |
| B08.5 | 6-day streak that ended two days ago | 1                          | no           |

> Fails if the notification shows below the threshold, or not at it.

**Design notes**

- The threshold is the `STREAK_NOTICE_THRESHOLD` setting, default 7 (br-M31). The tests state 7 themselves, so a wrong config change fails a test instead of quietly changing the rule.

**Source**

- 2026-09-23, grill session. A week is the first streak worth celebrating. B08.4 asked and answered: a second track on the same day shows it again; the owner preferred that to tracking "already shown".

---

## br-B09

kind: definition | serves: in-04 | given: br-B06 | status: settled

The best streak is the length of the longest streak in the user's non-deleted tracks. A deletion can lower it.

`#streak`

**Examples**

| Test  | Days with tracks                            | Best streak |
| ----- | ------------------------------------------- | ----------- |
| B09.1 | Mon–Sun                                     | 7           |
| B09.2 | Mon–Sun, then Thursday's only track deleted | 3           |
| B09.3 | none                                        | 0           |

> Fails if the best streak counts a deleted track, or is lower than any streak in the tracks.

**Source**

- 2026-09-23, grill session. Considered keeping a "best ever" that deletions cannot lower; rejected, because a number that disagrees with the visible tracks looks like a bug.

---

## br-B10

kind: invariant | serves: in-05 | given: br-D03 | status: settled

The anniversary card shows up to 2 non-deleted tracks within ±3 days of the anniversary date, closest first, ties to the track created first.

`#anniversary`

**Examples**

The anniversary date is 25 September 2025.

| Test  | Tracks on local dates             | Shown                 |
| ----- | --------------------------------- | --------------------- |
| B10.1 | 25 Sep                            | 25 Sep                |
| B10.2 | 26 Sep, then 24 Sep created first | 24 Sep, then 26 Sep   |
| B10.3 | 22 Sep                            | 22 Sep — 3 days away  |
| B10.4 | 21 Sep                            | nothing — 4 days away |
| B10.5 | three tracks on 25 Sep            | the two created first |

**Tests**

- B10.6 — Given today is 29 February 2028. When the anniversary date is worked out. Then it is 28 February 2027.

> Fails if a track more than 3 days from the anniversary date is shown, or more than 2 are shown.

**Design notes**

- How the card looks and arrives is in `specs/lite-spec-anniversary-card.md`.

**Source**

- 2026-09-23, grill session. Exact-date matches are rare; ±3 days finds something most years without reaching into another season.

---

## br-B11

kind: behaviour | serves: in-04 | status: retired

When a track is created and no active Streak exists, then open a new Streak with start_date = today UTC.

`#streak`

> Fails if a track is created without an open Streak.

**Source**

- 2026-09-20, first build. Streaks were stored records, opened here and closed by br-B12.
- 2026-09-23, grill session. Retired. A stored streak opened in UTC broke streaks for users east of London and went stale when a track was deleted. Replaced by the definition br-B06 and the invariant br-B16.

---

## br-B14

kind: behaviour | serves: in-03 | status: settled | attended: required
gap: no erasure script exists; requests would be handled by hand.

When a user emails asking for erasure, then their account and every track, deleted ones too, are removed within one month.

`#delete` `#privacy`

**Tests**

- B14.1 — Given a user with tracks, some deleted. When their erasure is carried out. Then no track or account row of theirs remains.
- B14.2 — Given two users. When one is erased. Then the other's data is untouched.

> Fails if any of an erased user's data remains, or another user's data changes.

**Source**

- 2026-09-25, kickoff conversation. Attended: irreversible, and the one-month limit is a legal promise (GDPR Article 12). Self-serve erasure in the app is a non-goal for now.

---

## br-B16

kind: invariant | serves: in-04 | given: br-B06 | status: settled

Stored streak data always equals br-B06 recomputed from the user's non-deleted tracks.

`#streak` `#data`

**Tests**

- B16.1 — Given a random history of track creates and deletes. When the stored streaks are compared with br-B06 computed from scratch. Then they are equal.

> Fails if any sequence of creates and deletes leaves stored streaks that differ from the recomputed ones.

**Design notes**

- When streaks are stored and how they are rebuilt is in `specs/lite-spec-streaks.md`.

**Source**

- 2026-09-23, grill session. Streaks are read on every page, so they will be stored; this invariant is what keeps the stored copy honest (br-M23). Not built yet: streaks are computed on read today.

---

## br-B21

kind: behaviour | serves: in-01 | status: settled

When a track is created or edited, then leading and trailing whitespace is removed; empty text is rejected.

`#track` `#validation`

**Tests**

- B21.1 — Given text with spaces around it. When the track is created. Then the stored text has none.
- B21.2 — Given text of only spaces. When the track is created. Then it is rejected as empty.
- B21.3 — Given one character padded with spaces. When the track is created. Then br-B02 rejects it.

> Fails if stored text starts or ends with whitespace, or empty text is stored.

**Source**

- 2026-09-30, building the create endpoint. The ledger did not say whether to trim, so the build stopped and asked. Answer: trim, then check, so " a " is 1 character, not 5.

---

## br-B22

kind: behaviour | serves: in-03 | given: br-B05 | status: open

When a user deletes a track by mistake, then they can restore it.

`#track` `#delete`

**Open questions**

- For how long can a deleted track be restored? Forever, or a fixed number of days?
- Where does the user find deleted tracks: a bin, or an undo right after deleting?
- Does a restored track count towards streaks for the day it was written (br-B06)?

**Tests**

- B22.1 — Given a track deleted a minute ago. When the user restores it. Then it is back in the feed with its text and date unchanged.

> Fails if a restored track differs in any way from before it was deleted.

**Source**

- 2026-10-02, support email. A user deleted the wrong entry and asked for it back. The data was kept (br-B05), but there was no way to restore it.

---

## br-U02

kind: invariant | serves: in-03 | status: observed

The feed shows 20 tracks per page.

`#feed`

**Tests**

- U02.1 — Given 21 tracks. When the feed's first page loads. Then it shows 20.

> Fails if a page of the feed shows more or fewer than 20 tracks while more exist.

**Source**

- 2026-09-25, observed: src/tracks.ts FEED_PAGE_SIZE. suspect: a hard-coded number with no comment or config. Confirm in intent review whether 20 was chosen.

---

## br-U05

kind: invariant | serves: in-02, in-03 | status: settled

Track text is always displayed as plain text, never rendered as HTML.

`#track` `#security`

**Tests**

- U05.1 — Given a track whose text is `<b>hi</b>`. When it is shown. Then the page shows the tags as typed, and no bold text.

> Fails if any markup in track text changes how the page renders.

**Source**

- 2026-09-24, kickoff conversation. A journal is not a document editor; rendering markup also opens the door to script injection.

---

## br-A04

kind: invariant | serves: in-02 | status: settled | attended: required

The API identifies the user only from their session, never from ids sent in the request.

`#api` `#security` `#auth`

**Tests**

- A04.1 — Given a signed-in user. When they request another user's track by its id. Then the API answers 404, as for a track that does not exist.

> Fails if any request can read or change another user's data.

**Source**

- 2026-09-24, kickoff conversation. Attended: this is the line between private and public (in-02). Answering 404 rather than 403 avoids confirming that the id exists.

---

## br-D03

kind: definition | serves: in-04, in-05 | status: settled

A track's day is its local_date: the user's calendar date, in their time zone, when the track was created. It never changes.

`#data` `#time`

**Examples**

| Test  | Created in                   | created_at (UTC) | local_date |
| ----- | ---------------------------- | ---------------- | ---------- |
| D03.1 | Australia/Sydney, Mon 9:30am | Sun 22:30        | Mon        |
| D03.2 | Europe/London, Fri 9pm       | Fri 20:00        | Fri        |

> Fails if a track's day differs from the calendar date the user saw when writing it.

**Source**

- 2026-09-25, grill session. Fixed at creation so travelling later never moves an old entry to another day.

---

## br-D05

kind: invariant | serves: in-02 | status: settled
gap: the admin track browser shows track text.

No log, error report or admin screen shows track text.

`#privacy` `#security`

**Tests**

- D05.1 — Given a track is created. When the log entries are read. Then none contains its text.
- D05.2 — Given the admin screens. When an admin views a user. Then counts and dates are shown, and no track text.

> Fails if track text appears anywhere but the owner's own screens.

**Source**

- 2026-09-25, kickoff conversation. "The developer does not read entries" (in-02) becomes testable: nothing the developer looks at contains them.
