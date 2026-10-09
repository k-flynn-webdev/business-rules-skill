import { describe, expect, it } from "vitest";
import { bestStreak, currentStreak, shouldNotify, streaksOf } from "./streaks";
import { on, track } from "./helpers.test-utils";

// 2026-10-02 is a Friday.
const FRI = "2026-10-02";
const SAT = "2026-10-03";
const SUN = "2026-10-04";
const MON = "2026-10-05";
const TUE = "2026-10-06";
const WED = "2026-10-07";
const THU = "2026-10-08";

const lengths = (tracks: Parameters<typeof streaksOf>[0]) => streaksOf(tracks).map((s) => s.length);

describe("streaks", () => {
    it("br-B06.1 Fri, Sat, Sun and Tue make two streaks: Fri–Sun (3 days) and Tue (1 day)", () => {
        expect(lengths(on(FRI, SAT, SUN, TUE))).toEqual([3, 1]);
    });

    it("br-B06.2 five tracks on one Monday make one streak of 1 day", () => {
        expect(lengths(on(MON, MON, MON, MON, MON))).toEqual([1]);
    });

    it("br-B06.3 Fri, Sat, Sun with Saturday's only track deleted make two 1-day streaks", () => {
        expect(lengths([track(FRI), track(SAT, { deleted: true }), track(SUN)])).toEqual([1, 1]);
    });
});

describe("current streak, today is Wednesday", () => {
    it.each([
        ["br-B07.1 Mon, Tue, Wed: open, 3", on(MON, TUE, WED), 3],
        ["br-B07.2 Mon, Tue: open, 2", on(MON, TUE), 2],
        ["br-B07.3 Mon only: ended, 0", on(MON), 0],
        ["br-B07.4 no tracks: 0", [], 0],
    ])("%s", (_name, tracks, expected) => {
        expect(currentStreak(tracks, WED)).toBe(expected);
    });
});

describe("streak notification, threshold 7, today is Thursday", () => {
    // br-M31: the threshold is tunable, so the tests state the number themselves.
    const week = (endingOn: string, days: number) =>
        Array.from({ length: days }, (_, i) => {
            const d = new Date(`${endingOn}T00:00:00Z`);
            d.setUTCDate(d.getUTCDate() - i);
            return track(d.toISOString().slice(0, 10));
        });
    const notifiesAfterCreate = (before: ReturnType<typeof week>) =>
        shouldNotify(currentStreak([...before, track(THU)], THU), 7);

    it("br-B08.1 a 5-day streak ending yesterday becomes 6: no notification", () => {
        expect(notifiesAfterCreate(week(WED, 5))).toBe(false);
    });
    it("br-B08.2 a 6-day streak ending yesterday becomes 7: notification", () => {
        expect(notifiesAfterCreate(week(WED, 6))).toBe(true);
    });
    it("br-B08.3 a 7-day streak ending yesterday becomes 8: notification", () => {
        expect(notifiesAfterCreate(week(WED, 7))).toBe(true);
    });
    it("br-B08.4 a 7-day streak already including today stays 7: notification again", () => {
        expect(notifiesAfterCreate(week(THU, 7))).toBe(true);
    });
    it("br-B08.5 a 6-day streak that ended two days ago restarts at 1: no notification", () => {
        expect(notifiesAfterCreate(week(TUE, 6))).toBe(false);
    });
});

describe("best streak", () => {
    const monToSun = ["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", FRI, SAT, SUN];

    it("br-B09.1 Mon–Sun: 7", () => {
        expect(bestStreak(on(...monToSun))).toBe(7);
    });
    it("br-B09.2 Mon–Sun with Thursday's only track deleted: 3", () => {
        const tracks = monToSun.map((d, i) => track(d, { deleted: i === 3 }));
        expect(bestStreak(tracks)).toBe(3);
    });
    it("br-B09.3 no tracks: 0", () => {
        expect(bestStreak([])).toBe(0);
    });
});
