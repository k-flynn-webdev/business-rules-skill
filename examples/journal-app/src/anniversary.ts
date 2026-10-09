import { daysBetween, type Day } from "./days";
import type { Track } from "./tracks";

export const WINDOW_DAYS = 3;
export const MAX_SHOWN = 2;

/**
 * The same month and day, `years` years before `today`. 29 February falls back to 28 February.
 * @see br-B10 the anniversary date.
 */
export function anniversaryDate(today: Day, years = 1): Day {
    const [y, m, d] = today.split("-").map(Number);
    const year = y - years;
    // br-B10: a year without 29 February uses the 28th.
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const day = m === 2 && d === 29 && !leap ? 28 : d;
    return `${year}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * The tracks the anniversary card shows for an anniversary date.
 * @see br-B10 up to 2 tracks within ±3 days of the anniversary date, closest first.
 */
export function anniversaryTracks(tracks: Track[], date: Day): Track[] {
    return (
        tracks
            .filter((t) => !t.deletedAt)
            .map((t) => ({ t, away: Math.abs(daysBetween(date, t.localDate)) }))
            // br-B10: within the window, closest first, ties to the track created first.
            .filter(({ away }) => away <= WINDOW_DAYS)
            .sort((a, b) => a.away - b.away || a.t.createdAt.getTime() - b.t.createdAt.getTime())
            .slice(0, MAX_SHOWN)
            .map(({ t }) => t)
    );
}
