// What the checker reads in code: citations, test names and mentions, and which files it reads.
import { rmSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { LEDGER, P, ledger, level, repo, rule, run, testLine } from "./fixture";

const withCode = (code: string, rules = [rule("B01"), rule("B02")], header: string[] = []) =>
  repo({ [LEDGER]: ledger({ rules, header }), "src/a.ts": code });

describe("citations", () => {
  test("br-C01.1 an ID followed by a colon cites the rule", () => {
    expect(level(withCode("// br_B01: a colon cites"), "B01")).toBe("cited");
  });

  test("br-C01.2 an ID after @see cites the rule", () => {
    expect(level(withCode("/** @see br_B01 */"), "B01")).toBe("cited");
  });

  test("br-C01.3 a list ending in a colon cites every ID in it", () => {
    const dir = withCode("// br_B01, br_B02: both");
    expect(level(dir, "B01")).toBe("cited");
    expect(level(dir, "B02")).toBe("cited");
  });

  test("br-C01.4 an ID with no colon or @see is only a mention", () => {
    const dir = withCode("// explained in br_B01");
    expect(level(dir, "B01")).toBe("none");
    expect(run(dir, "--rule", `${P}B01`).out).toContain("Mentioned, not cited:\n  src/a.ts:1");
  });
});

describe("test names", () => {
  test("br-C02.1 a test ID in a double-quoted string is a test name", () => {
    const dir = withCode('test("br_B01.1 a colon cites", () => {});');
    expect(run(dir, "--rule", `${P}B01`).out).toContain("Tests (1 of 1 in code)");
  });

  test("br-C02.2 a test ID in a single-quoted string is a test name", () => {
    const dir = withCode("it('br_B01.1 a colon cites', () => {});");
    expect(run(dir, "--rule", `${P}B01`).out).toContain("Tests (1 of 1 in code)");
  });

  test("br-C02.3 a test ID in a comment is a mention, not a test name", () => {
    const out = run(withCode("// br_B01.1 covers this"), "--rule", `${P}B01`).out;
    expect(out).toContain("Tests (0 of 1 in code)");
    expect(out).toContain("Mentioned, not cited:");
  });
});

describe("IDs that name no rule", () => {
  test("br-C08.1 a citation of a missing rule is an error with its file and line", () => {
    const r = run(withCode("\n// br_B09: no such rule"));
    expect(r.out).toContain(`${P}B09: cited in code but no rule exists (src/a.ts:2)`);
    expect(r.code).toBe(1);
  });

  test("br-C08.2 a mention of a missing rule is an error", () => {
    const r = run(withCode("// see br_B09"));
    expect(r.out).toContain(`${P}B09: mentioned in code but no rule exists`);
    expect(r.code).toBe(1);
  });

  test("br-C08.3 a test named after a missing rule is an error", () => {
    const r = run(withCode(testLine("B09.1")));
    expect(r.out).toContain(`${P}B09: tests exist in code but no rule exists`);
    expect(r.code).toBe(1);
  });

  test("br-C08.4 authoring rule IDs in code are exempt", () => {
    const r = run(withCode("// br_M12: authoring rules are never enforced in code"));
    expect(r.out).not.toMatch(/M12/);
    expect(r.code).toBe(0);
  });
});

describe("test names the ledger does not list", () => {
  test("br-C09.1 a test name the rule's entry does not list is a warning", () => {
    const rules = [rule("B01", { tests: ["B01.1", "B01.2"] })];
    const dir = withCode(["B01.1", "B01.2", "B01.3"].map(testLine).join("\n"), rules);
    expect(run(dir).out).toContain(`${P}B01: code has a test named ${P}B01.3, which the ledger does not list.`);
  });

  test("br-C10.1 a listed test ID without the prefix is a warning", () => {
    const out = run(withCode('test("B01.1 a colon cites", () => {});')).out;
    expect(out).toContain("test named B01.1 without the br- prefix, so it is not counted");
  });

  test("br-C10.2 an unprefixed ID the ledger does not list is not a warning", () => {
    expect(run(withCode('const version = "X99.1";')).out).not.toContain("without the br- prefix");
  });
});

describe("which files are read", () => {
  const citedIn = (path: string, header: string[] = []) =>
    repo({ [LEDGER]: ledger({ header }), [path]: path.endsWith(".ts") ? "// br_B01: here" : "# br_B01: here" });

  test("br-C16.1 dependency folders are not read", () => {
    expect(level(citedIn("node_modules/x/index.ts"), "B01")).toBe("none");
  });

  test("br-C16.2 a copy of the checker is not read", () => {
    expect(level(citedIn("tools/ledger-check.ts"), "B01")).toBe("none");
  });

  test("br-C16.3 shell scripts are read", () => {
    expect(level(citedIn("scripts/build.sh"), "B01")).toBe("cited");
  });

  test("br-C16.4 YAML is not read", () => {
    expect(level(citedIn(".github/workflows/ci.yml"), "B01")).toBe("none");
  });

  test("br-C17.1 an ignored path is never read", () => {
    const dir = repo({
      [LEDGER]: ledger({ header: ["Ignore: examples/"] }),
      "examples/a/src/x.ts": "// br_B09: an example's own rule",
    });
    const r = run(dir);
    expect(r.out).not.toContain("B09");
    expect(r.code).toBe(0);
  });

  test("br-C17.2 Ignore wins over Scan", () => {
    const dir = repo({
      [LEDGER]: ledger({ header: ["Ignore: tools/", "Scan: tools/"] }),
      "tools/x.ts": "// br_B01: here",
      "tools/ledger-check.ts": "// br_B01: here",
    });
    expect(level(dir, "B01")).toBe("none");
  });

  test("br-C18.1 Scan naming a copy of the checker reads it", () => {
    expect(level(citedIn("tools/ledger-check.ts", ["Scan: tools/ledger-check.ts"]), "B01")).toBe("cited");
  });

  test("br-C18.2 inside a skipped folder only the scanned path is read", () => {
    const dir = repo({
      [LEDGER]: ledger({ header: ["Scan: dist/keep/"], rules: [rule("B01"), rule("B02")] }),
      "dist/keep/k.ts": "// br_B01: kept",
      "dist/other/o.ts": "// br_B02: built",
    });
    expect(level(dir, "B01")).toBe("cited");
    expect(level(dir, "B02")).toBe("none");
  });

  test("br-C18.3 Scan naming the folder does not read a copy of the checker in it", () => {
    expect(level(citedIn("tools/ledger-check.ts", ["Scan: tools/"]), "B01")).toBe("none");
  });

  test("br-C19.1 a setting naming a path that does not exist is a warning", () => {
    const dir = repo({ [LEDGER]: ledger({ header: ["Ignore: nope/"] }) });
    rmSync(`${dir}/nope`, { recursive: true, force: true });
    expect(run(dir).out).toContain("Ignore: nope does not exist.");
  });
});
