/** The longest a browser may reuse a page before checking with the server again. */
export const MAX_AGE_SECONDS = 300;

const DAY_SECONDS = 86_400;

/**
 * The cache-control header for an HTML response. The web framework adds an ETag to every page
 * and answers a matching If-None-Match with 304, so a re-check only resends a page that changed.
 * @see br-A01 A browser may reuse a page for at most five minutes, and never past UTC midnight.
 */
export function pageCacheControl(status: number, url: URL, now: Date): string {
  if (status !== 200 || url.searchParams.get("new_quote") === "true") return "no-store";
  const untilMidnight = DAY_SECONDS - (Math.floor(now.getTime() / 1000) % DAY_SECONDS);
  return `public, max-age=${Math.min(MAX_AGE_SECONDS, untilMidnight)}`;
}
