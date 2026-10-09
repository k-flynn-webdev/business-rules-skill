import { describe, expect, it } from "vitest";
import { localDateOf } from "./days";
import { checkTrackText, createTrack, deleteTrack } from "./tracks";
import { track } from "./helpers.test-utils";

const chars = (n: number) => "x".repeat(n);
const wave = "👋"; // 2 UTF-16 code units

describe("track text", () => {
    // br-B02: each row of the rule's examples table is a test, named by its ID.
    it.each([
        ["br-B02.1 1 character is rejected", chars(1), false],
        ["br-B02.2 2 characters are allowed", chars(2), true],
        ["br-B02.3 3 characters are allowed", chars(3), true],
        ["br-B02.4 199 characters are allowed", chars(199), true],
        ["br-B02.5 200 characters are allowed", chars(200), true],
        ["br-B02.6 201 characters are rejected", chars(201), false],
        ["br-B02.7 100 emoji, 200 characters, are allowed", wave.repeat(100), true],
        ["br-B02.8 101 emoji, 202 characters, are rejected", wave.repeat(101), false],
    ])("%s", (_name, text, ok) => {
        expect(checkTrackText(text).ok).toBe(ok);
    });

    it("br-B21.1 leading and trailing whitespace is removed before storing", () => {
        expect(checkTrackText("  hello  ")).toEqual({ ok: true, text: "hello" });
    });

    it("br-B21.2 text of only spaces is rejected as empty", () => {
        expect(checkTrackText("    ")).toEqual({ ok: false, error: "Write something first." });
    });

    it("br-B21.3 a single character padded with spaces is rejected by br-B02", () => {
        expect(checkTrackText("  a  ").ok).toBe(false);
    });
});

describe("tracks", () => {
    it("br-B01.1 the owner comes from the session, not the request", () => {
        const input = { text: "A thought.", timeZone: "UTC", userId: "someone-else" };
        const created = createTrack("session-user", input, new Date(), "t1");
        expect(created).toMatchObject({ userId: "session-user" });
    });

    it("br-B05.1 deleting a track sets deleted_at and keeps the track", () => {
        const t = track("2026-10-05");
        const deleted = deleteTrack(t, new Date("2026-10-06T00:00:00Z"));
        expect(deleted.deletedAt).not.toBeNull();
        expect(deleted).toMatchObject({ id: t.id, text: t.text, localDate: t.localDate });
    });
});

describe("local_date", () => {
    it("br-D03.1 a track at 9:30am Monday in Sydney, Sunday 22:30 UTC, is on Monday", () => {
        expect(localDateOf(new Date("2026-10-04T22:30:00Z"), "Australia/Sydney")).toBe("2026-10-05");
    });

    it("br-D03.2 a track at 9pm Friday in London, 20:00 UTC, is on Friday", () => {
        expect(localDateOf(new Date("2026-10-09T20:00:00Z"), "Europe/London")).toBe("2026-10-09");
    });
});
