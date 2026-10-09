import { describe, expect, it } from "vitest";
import { anniversaryDate, anniversaryTracks } from "./anniversary";
import { track } from "./helpers.test-utils";

const DATE = "2025-09-25"; // the anniversary date when today is 25 September 2026
const days = (shown: ReturnType<typeof anniversaryTracks>) => shown.map((t) => t.localDate);

describe("anniversary card, anniversary date 25 Sep 2025", () => {
    it("br-B10.1 a track on 25 Sep is shown", () => {
        expect(days(anniversaryTracks([track("2025-09-25")], DATE))).toEqual(["2025-09-25"]);
    });

    it("br-B10.2 tracks on 24 and 26 Sep tie; the one created first is shown first", () => {
        const tracks = [track("2025-09-26", { created: 2 }), track("2025-09-24", { created: 1 })];
        expect(days(anniversaryTracks(tracks, DATE))).toEqual(["2025-09-24", "2025-09-26"]);
    });

    it("br-B10.3 a track on 22 Sep, 3 days away, is shown", () => {
        expect(days(anniversaryTracks([track("2025-09-22")], DATE))).toEqual(["2025-09-22"]);
    });

    it("br-B10.4 a track on 21 Sep, 4 days away, is not shown", () => {
        expect(anniversaryTracks([track("2025-09-21")], DATE)).toEqual([]);
    });

    it("br-B10.5 of three tracks on 25 Sep, the two created first are shown", () => {
        const [a, b, c] = [1, 2, 3].map((n) => track("2025-09-25", { created: n }));
        expect(anniversaryTracks([c, a, b], DATE)).toEqual([a, b]);
    });

    it("br-B10.6 today 29 February 2028: the anniversary date is 28 February 2027", () => {
        expect(anniversaryDate("2028-02-29")).toBe("2027-02-28");
    });
});
