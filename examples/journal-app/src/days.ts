/** A calendar date as `YYYY-MM-DD`. */
export type Day = string;

/**
 * The calendar date of an instant in a time zone.
 * @see br-D03 a track's day is the user's calendar date when it was created.
 */
export function localDateOf(instant: Date, timeZone: string): Day {
    // en-CA formats dates as YYYY-MM-DD.
    return new Intl.DateTimeFormat("en-CA", { timeZone }).format(instant);
}

/** The day `n` days after `day` (negative for before). */
export function addDays(day: Day, n: number): Day {
    const [y, m, d] = day.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Whole days from `a` to `b`. */
export function daysBetween(a: Day, b: Day): number {
    const t = (day: Day) => Date.parse(`${day}T00:00:00Z`);
    return Math.round((t(b) - t(a)) / 86_400_000);
}
