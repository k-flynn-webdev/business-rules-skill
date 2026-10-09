import type { Day } from "./days";
import type { Track } from "./tracks";

let next = 0;

/** A track on a local date, for tests. `created` orders tracks on the same day. */
export function track(localDate: Day, options: { deleted?: boolean; created?: number } = {}): Track {
    next++;
    return {
        id: `t${next}`,
        userId: "u1",
        text: "A thought.",
        createdAt: new Date(Date.parse(`${localDate}T12:00:00Z`) + (options.created ?? next) * 1000),
        localDate,
        deletedAt: options.deleted ? new Date() : null,
    };
}

/** Tracks on each of the given days. */
export const on = (...days: Day[]) => days.map((d) => track(d));
