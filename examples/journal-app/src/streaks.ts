import { addDays, daysBetween, type Day } from "./days";
import type { Track } from "./tracks";

/** A run of consecutive days. */
export interface Streak {
    start: Day;
    end: Day;
    length: number;
}

/** The streak notification shows at or above this length. Tunable: `STREAK_NOTICE_THRESHOLD`. */
export const STREAK_NOTICE_THRESHOLD = Number(process.env.STREAK_NOTICE_THRESHOLD ?? 7);

/**
 * Every streak in a user's tracks, oldest first.
 * @see br-B06 a streak is a run of consecutive days, each with at least one non-deleted track.
 */
export function streaksOf(tracks: Track[]): Streak[] {
    // br-B06: deleted tracks never count, and many tracks on one day count as one day.
    const days = [...new Set(tracks.filter((t) => !t.deletedAt).map((t) => t.localDate))].sort();
    const streaks: Streak[] = [];
    for (const day of days) {
        const last = streaks.at(-1);
        if (last && addDays(last.end, 1) === day) {
            last.end = day;
            last.length++;
        } else streaks.push({ start: day, end: day, length: 1 });
    }
    return streaks;
}

/**
 * The length of the open streak, or 0.
 * @see br-B07 the current streak stays open while the latest track is from today or yesterday.
 */
export function currentStreak(tracks: Track[], today: Day): number {
    const latest = streaksOf(tracks).at(-1);
    // br-B07: open while its last day is today or yesterday; ended otherwise.
    if (!latest || daysBetween(latest.end, today) > 1) return 0;
    return latest.length;
}

/**
 * The length of the longest streak.
 * @see br-B09 the best streak is the longest streak in the user's non-deleted tracks.
 */
export function bestStreak(tracks: Track[]): number {
    return Math.max(0, ...streaksOf(tracks).map((s) => s.length));
}

/**
 * Whether creating a track should show the streak notification.
 * @see br-B08 when the streak counting the new track is at or above the threshold, show it.
 */
export function shouldNotify(currentAfterCreate: number, threshold = STREAK_NOTICE_THRESHOLD): boolean {
    return currentAfterCreate >= threshold;
}
