import { describe, expect, test } from "vitest";
import { pageCacheControl } from "./cache";

const home = new URL("https://quotes.example/");
const at = (iso: string) => new Date(iso);

describe("page caching", () => {
  test("br-A01.1 a plain page may be reused for 300 seconds", () => {
    expect(pageCacheControl(200, home, at("2026-10-02T12:00:00Z"))).toBe("public, max-age=300");
  });

  test("br-A01.2 a page is never reused past UTC midnight", () => {
    expect(pageCacheControl(200, home, at("2026-10-02T23:58:00Z"))).toBe("public, max-age=120");
    expect(pageCacheControl(200, home, at("2026-10-02T23:59:59Z"))).toBe("public, max-age=1");
  });

  test("br-A01.3 new_quote=true pages and error pages are not stored", () => {
    expect(pageCacheControl(200, new URL("?new_quote=true", home), at("2026-10-02T12:00:00Z"))).toBe("no-store");
    expect(pageCacheControl(404, home, at("2026-10-02T12:00:00Z"))).toBe("no-store");
  });
});
