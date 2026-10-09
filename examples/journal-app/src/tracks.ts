import { localDateOf, type Day } from "./days";

/**
 * A plain-text entry, owned by one user.
 * @see br-B01 a track is a plain-text entry owned by a single user.
 */
export interface Track {
    id: string;
    userId: string;
    text: string;
    createdAt: Date;
    localDate: Day;
    deletedAt: Date | null;
}

export const MIN_CHARS = 2;
export const MAX_CHARS = 200;

export type TextCheck = { ok: true; text: string } | { ok: false; error: string };

/**
 * Checks track text before it is stored, and returns the text to store.
 * @see br-B21 leading and trailing whitespace is removed; empty text is rejected.
 * @see br-B02 track text is between 2 and 200 characters, counted after trimming.
 */
export function checkTrackText(raw: string): TextCheck {
    // br-B21: trim first, so the length check and the stored text agree.
    const text = raw.trim();
    if (text.length === 0) return { ok: false, error: "Write something first." };
    // br-B02: characters are UTF-16 code units, as the browser counts them. An emoji can be 2.
    if (text.length < MIN_CHARS) return { ok: false, error: `Write at least ${MIN_CHARS} characters.` };
    if (text.length > MAX_CHARS) return { ok: false, error: `Keep it to ${MAX_CHARS} characters.` };
    return { ok: true, text };
}

/**
 * Creates a track for the signed-in user.
 * @see br-B01 the owner comes from the session, never from the request.
 */
export function createTrack(
    sessionUserId: string,
    input: { text: string; timeZone: string },
    now: Date,
    id: string,
): Track | { error: string } {
    const check = checkTrackText(input.text);
    if (!check.ok) return { error: check.error };
    return {
        id,
        userId: sessionUserId,
        text: check.text,
        createdAt: now,
        localDate: localDateOf(now, input.timeZone),
        deletedAt: null,
    };
}

/**
 * Deletes a track by hiding it. The track stays stored.
 * @see br-B05 when a user deletes a track, its deleted_at is set and it stays in the database.
 */
export function deleteTrack(track: Track, now: Date): Track {
    return { ...track, deletedAt: now };
}

// The feed shows 20 tracks per page. Recorded as br-U02 (observed): nobody has confirmed the number.
export const FEED_PAGE_SIZE = 20;
