// What --rule says about a rule's history in git.
import { describe, expect, test } from "vitest";
import { LEDGER, P, commit, ledger, repo, run } from "./fixture";

/**
 * A repo with the fixture ledger, committed once with a message that names no rule. Adding the
 * ledger adds lines naming the rule, so that commit is always the oldest one listed.
 */
function history(header: string[] = []) {
  const dir = repo({ [LEDGER]: ledger({ header }) });
  commit(dir, "Start the ledger");
  return dir;
}
/** The lines under Commits: in --rule B01, or undefined when it has none. */
function commits(dir: string): string[] | undefined {
  const out = run(dir, "--rule", "B01").out;
  const at = out.indexOf("\nCommits:\n");
  if (at < 0) return undefined;
  return out.slice(at + "\nCommits:\n".length).trimEnd().split("\n");
}

const START = /^ {2}[0-9a-f]+ \d{4}-\d{2}-\d{2} Start the ledger {2}\(diff only\)$/;

describe("commits", () => {
  test("br-C25.1 a commit whose message names the rule is listed", () => {
    const dir = history();
    commit(dir, "Shorten the window\n\nRules: br_B01", { "src/a.ts": "export const days = 14;" });
    expect(commits(dir)).toEqual([
      expect.stringMatching(/^ {2}[0-9a-f]+ \d{4}-\d{2}-\d{2} Shorten the window$/),
      expect.stringMatching(START),
    ]);
  });

  test("br-C25.2 a commit changing a line that names the rule is listed as diff only", () => {
    const dir = history();
    commit(dir, "Enforce the window", { "src/a.ts": "// br_B01: the window" });
    expect(commits(dir)).toEqual([
      expect.stringMatching(/ Enforce the window {2}\(diff only\)$/),
      expect.stringMatching(START),
    ]);
  });

  test("br-C25.3 a commit naming one of the rule's tests is listed", () => {
    const dir = history();
    commit(dir, "Fix the boundary test\n\nRules: br_B01.1", { "src/a.test.ts": "// the boundary" });
    expect(commits(dir)?.[0]).toMatch(/ Fix the boundary test$/);
  });

  test("br-C25.4 a change in an ignored path is not listed", () => {
    const dir = history(["Ignore: examples/"]);
    commit(dir, "Add an example", { "examples/x/a.ts": "// br_B01: the example's own rule" });
    expect(commits(dir)).toEqual([expect.stringMatching(START)]);
  });

  test("br-C25.5 a commit touching only an ignored path is not listed, even if its message names the rule", () => {
    const dir = history(["Ignore: examples/"]);
    commit(dir, "Update the example\n\nRules: br_B01", { "examples/x/a.ts": "export {};" });
    expect(commits(dir)).toEqual([expect.stringMatching(START)]);
  });

  test("br-C25.6 a change in a copy of the checker is not listed", () => {
    const dir = history();
    commit(dir, "Update the checker", { "scripts/ledger-check.ts": "// br_B01: the skill's own rule" });
    expect(commits(dir)).toEqual([expect.stringMatching(START)]);
  });

  test("br-C25.7 ten commits are all listed", () => {
    const dir = history();
    for (let i = 1; i <= 9; i++) commit(dir, `Change ${i}\n\nRules: br_B01`, { "src/a.ts": `// ${i}` });
    const lines = commits(dir)!;
    expect(lines).toHaveLength(10);
    expect(lines.join("\n")).not.toContain("more commit");
  });

  test("br-C25.8 eleven commits show the newest ten and count the rest", () => {
    const dir = history();
    for (let i = 1; i <= 10; i++) commit(dir, `Change ${i}\n\nRules: br_B01`, { "src/a.ts": `// ${i}` });
    const lines = commits(dir)!;
    expect(lines).toHaveLength(11);
    expect(lines[0]).toMatch(/ Change 10$/);
    expect(lines[9]).toMatch(/ Change 1$/);
    expect(lines[10]).toBe("  …and 1 more commit.");
  });

  test("br-C25.9 outside a git repository there is no Commits section", () => {
    const dir = repo({ [LEDGER]: ledger() });
    const r = run(dir, "--rule", "B01");
    expect(r.code).toBe(0);
    expect(r.out).not.toContain("Commits:");
  });
});
