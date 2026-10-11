# SPEC: Architecture

The blueprint for the Daily Dose core architecture, and the contract for the build.

## 1. Technical context

- **Objective**: a minimalist, high-performance app built around a daily quote ritual for founders.
- **Stack**:
  - **Frontend**: Next.js, mobile-first.
  - **Logic**: seeded PRNG for quote selection, based on the user's local date.
  - **Content**: static Markdown parsing (`data/QUOTES.md`).
  - **Generation**: server-side "Social Receipt" PNG of the daily quote, to share.
- **Infrastructure**: Docker on a VPS, behind a reverse proxy.

## 2. Robustness

- Handle a missing `QUOTES.md` with a fallback quote.
- Client-side hydration checks, so the local-time quote matches the server render where possible.
- Zero user tracking. No cookies or local storage for the core experience.

## 3. Out of scope

- User accounts or authentication.
- Search or archives: only the current daily quote is visible.
- Third-party social APIs. Sharing is by PNG download only.

## 4. Tasks

| Task     | Target file              | Outcome                                           |
| -------- | ------------------------ | ------------------------------------------------- |
| ARCH-001 | `package.json`           | Initialise the Next.js project.                   |
| ARCH-004 | `lib/quotes.ts`          | Markdown parser and daily selection logic.        |
| ARCH-006 | `app/api/share/route.ts` | PNG generation endpoint for the Social Receipt.   |
