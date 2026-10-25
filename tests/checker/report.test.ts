// The report: what waits on the owner, one area at a time, and one rule at a time.
import { describe, expect, test } from "vitest";
import { LEDGER, P, ledger, read, repo, rule, run } from "./fixture";

const observed = (n: number) =>
  Array.from({ length: n }, (_, i) => {
    const nn = String(i + 1).padStart(2, "0");
    return rule(`B${nn}`, { status: "observed", sources: [`2026-09-${nn}, observed: fixture.`] });
  });
const listed = (out: string) => out.split("\n").filter((l) => /^ {2}br-B\d{2}\s+(observed|open)/.test(l));

describe("the waiting list", () => {
  test("br-C15.1 ten waiting entries are all listed, with no more line", () => {
    const out = run(repo({ [LEDGER]: ledger({ rules: observed(10) }) })).out;
    expect(listed(out)).toHaveLength(10);
    expect(out).not.toContain("more. Run with --waiting");
  });

  test("br-C15.2 eleven show the ten oldest, then one more", () => {
    const out = run(repo({ [LEDGER]: ledger({ rules: observed(11) }) })).out;
    expect(listed(out)).toHaveLength(10);
    expect(out).not.toContain(`${P}B11 `);
    expect(out).toContain("… and 1 more. Run with --waiting to list them all.");
  });

  test("br-C15.3 --waiting lists all eleven", () => {
    const out = run(repo({ [LEDGER]: ledger({ rules: observed(11) }) }), "--waiting").out;
    expect(listed(out)).toHaveLength(11);
  });

  const dated = ["2026-10-10, second look.", "2026-10-01, first look."];

  test("br-C15.4 an observed rule waits since its oldest source", () => {
    const out = run(repo({ [LEDGER]: ledger({ rules: [rule("B01", { status: "observed", sources: dated })] }) })).out;
    expect(out).toMatch(new RegExp(`${P}B01\\s+observed \\(since 2026-10-01,`));
  });

  test("br-C15.5 an open rule waits since its newest source", () => {
    const open = rule("B01", { status: "open", questions: ["Which way?"], sources: dated });
    const out = run(repo({ [LEDGER]: ledger({ rules: [open] }) })).out;
    expect(out).toMatch(new RegExp(`${P}B01\\s+open, 1 question \\(since 2026-10-10,`));
  });
});

describe("--area", () => {
  const areas = () =>
    repo({
      [LEDGER]: ledger({
        registry: [["B", "Business", "—"], ["U", "Interface", "—"]],
        rules: [rule("B01"), rule("U01", { serves: "in-09" })],
      }),
    });

  test("br-C20.1 an error in another area is counted, and the exit follows what is shown", () => {
    const r = run(areas(), "--area=B");
    expect(r.code).toBe(0);
    expect(r.out).toContain("Elsewhere in the ledger: 1 error.");
    expect(r.out).not.toContain("in-09");
  });

  test("br-C20.2 an error in the area shown fails the run", () => {
    const r = run(areas(), "--area=U");
    expect(r.code).toBe(1);
    expect(r.out).toContain(`${P}U01: serves in-09, which is not an intent.`);
  });

  test("br-C20.3 an unknown area exits 2 and lists the areas", () => {
    const r = run(areas(), "--area=X");
    expect(r.code).toBe(2);
    expect(r.out).toContain('no area "X". Areas: B Business, U Interface');
  });
});

describe("--rule", () => {
  test("br-C21.1 prints the entry's place and every citation", () => {
    const dir = repo({
      [LEDGER]: ledger(),
      "src/a.ts": "// br_B01: here",
      "src/b.ts": "\n\n// br_B01: and here",
    });
    const line = read(dir).split("\n").indexOf(`## ${P}B01`) + 1;
    const out = run(dir, "--rule", "B01").out;
    expect(out).toContain(`Entry:     ${LEDGER}:${line}`);
    expect(out).toContain("Cited in code:\n  src/a.ts:1\n  src/b.ts:3");
  });

  test("br-C21.2 an unknown rule exits 1", () => {
    expect(run(repo({ [LEDGER]: ledger() }), "--rule", `${P}B99`).code).toBe(1);
  });

  test("br-C21.3 --rule with no ID exits 2", () => {
    const r = run(repo({ [LEDGER]: ledger() }), "--rule");
    expect(r.code).toBe(2);
    expect(r.out).toContain("--rule needs a rule ID");
  });
});
