// How far each rule is enforced, from citations, test names and test results.
import { describe, expect, test } from "vitest";
import { LEDGER, P, intent, ledger, level, repo, rule, run, testLine, vitestResults } from "./fixture";

const cite = "// br_B01: here";
const passedJson = (...ids: string[]) => vitestResults(ids.map((id) => [`${P}${id} holds`, "passed"]));

describe("enforcement levels", () => {
  const two = [rule("B01", { tests: ["B01.1", "B01.2"] })];

  test("br-C03.1 no test names and no citation is none", () => {
    expect(level(repo({ [LEDGER]: ledger({ rules: two }), "src/a.ts": testLine("B01.1") }), "B01")).toBe("unlinked");
  });

  test("br-C03.2 a citation without every test is cited", () => {
    const dir = repo({ [LEDGER]: ledger({ rules: two }), "src/a.ts": `${cite}\n${testLine("B01.1")}` });
    expect(level(dir, "B01")).toBe("linked");
  });

  test("br-C03.3 every test named, no results, is tested", () => {
    const dir = repo({ [LEDGER]: ledger({ rules: two }), "src/a.test.ts": [testLine("B01.1"), testLine("B01.2")].join("\n") });
    expect(level(dir, "B01")).toBe("tests written");
  });

  test("br-C03.4 every test named and passed is passing", () => {
    const dir = repo({
      [LEDGER]: ledger({ rules: two }),
      "src/a.ts": cite,
      "src/a.test.ts": [testLine("B01.1"), testLine("B01.2")].join("\n"),
      "r.json": passedJson("B01.1", "B01.2"),
    });
    expect(level(dir, "B01", "--results=r.json")).toBe("tests pass");
  });

  test("br-C03.5 one failed test keeps the rule at tested", () => {
    const dir = repo({
      [LEDGER]: ledger({ rules: two }),
      "src/a.ts": cite,
      "src/a.test.ts": [testLine("B01.1"), testLine("B01.2")].join("\n"),
      "r.json": vitestResults([[`${P}B01.1 holds`, "passed"], [`${P}B01.2 holds`, "failed"]]),
    });
    expect(level(dir, "B01", "--results=r.json")).toBe("tests written");
  });

  test("br-C03.6 a cited rule that lists no tests is cited", () => {
    const dir = repo({ [LEDGER]: ledger({ rules: [rule("B01", { tests: [] })] }), "src/a.ts": cite });
    expect(level(dir, "B01")).toBe("linked");
  });
});

describe("tests pass without results", () => {
  const indexRow = (level: string) => [`| ${P}B01 | When it happens, then it holds. | in-01 | \`core\` | settled | ${level} |`];
  const indexPassing = indexRow("tests pass");
  const rules = [rule("B01", { tests: ["B01.1", "B01.2"] })];

  test("br-C04.1 a passing rule stays passing while its test names exist", () => {
    const dir = repo({
      [LEDGER]: ledger({ rules, index: indexPassing }),
      "src/a.test.ts": [testLine("B01.1"), testLine("B01.2")].join("\n"),
    });
    expect(level(dir, "B01")).toBe("tests pass");
  });

  test("br-C04.2 a passing rule drops when a test name is gone", () => {
    const dir = repo({ [LEDGER]: ledger({ rules, index: indexPassing }), "src/a.test.ts": testLine("B01.1") });
    expect(level(dir, "B01")).not.toBe("tests pass");
  });

  test("br-C04.3 an index from before 2.10.0 still reads passing as tests pass", () => {
    const dir = repo({
      [LEDGER]: ledger({ rules, index: indexRow("passing") }),
      "src/a.test.ts": [testLine("B01.1"), testLine("B01.2")].join("\n"),
    });
    expect(level(dir, "B01")).toBe("tests pass");
  });
});

describe("reading results", () => {
  const named = (files: Record<string, string>) =>
    repo({ [LEDGER]: ledger(), "src/a.ts": cite, "src/a.test.ts": testLine("B01.1"), ...files });

  test("br-C05.1 one failure among several results fails the test", () => {
    const dir = named({ "r.json": vitestResults([[`${P}B01.1 holds`, "passed"], [`${P}B01.1 holds`, "failed"]]) });
    expect(level(dir, "B01", "--results=r.json")).toBe("tests written");
  });

  test("br-C05.2 a skipped test has not passed", () => {
    const dir = named({ "r.json": vitestResults([[`${P}B01.1 holds`, "skipped"]]) });
    expect(level(dir, "B01", "--results=r.json")).toBe("tests written");
  });

  test("br-C06.1 reads TRX", () => {
    const trx = `<TestRun><Results><UnitTestResult testName="${P}B01.1 holds" outcome="Passed" /></Results></TestRun>`;
    expect(level(named({ "r.trx": trx }), "B01", "--results=r.trx")).toBe("tests pass");
  });

  test("br-C06.2 reads JUnit XML", () => {
    const xml = `<testsuite><testcase classname="suite" name="${P}B01.1 holds" /></testsuite>`;
    expect(level(named({ "r.xml": xml }), "B01", "--results=r.xml")).toBe("tests pass");
  });

  test("br-C06.3 a directory is read by content, other JSON ignored", () => {
    const dir = named({ "results/vitest.json": passedJson("B01.1"), "results/package.json": '{ "name": "x" }' });
    expect(level(dir, "B01", "--results=results")).toBe("tests pass");
    expect(run(dir, "--results=results").out).not.toContain("package.json");
  });

  test("br-C07.1 results with no br- test IDs are a warning naming the file", () => {
    const xml = `<testsuite>${["a", "b", "c"].map((n) => `<testcase classname="Suite" name="${n}" />`).join("")}</testsuite>`;
    const out = run(named({ "junit.xml": xml }), "--results=junit.xml").out;
    expect(out).toContain("junit.xml: 3 results, none named with a br- test ID.");
    expect(out).toContain("use --logger trx for .NET");
  });

  test("br-C07.2 results with one br- test ID are not a warning", () => {
    const out = run(named({ "r.json": passedJson("B01.1") }), "--results=r.json").out;
    expect(out).not.toContain("none named with a br- test ID");
  });
});

describe("--require", () => {
  const passingRepo = (rules = [rule("B01")]) =>
    repo({ [LEDGER]: ledger({ rules }), "src/a.ts": cite, "src/a.test.ts": testLine("B01.1"), "r.json": passedJson("B01.1") });

  test("br-C14.1 a settled rule below the level fails the run and is named", () => {
    const r = run(passingRepo(), "--require=tests-pass");
    expect(r.code).toBe(1);
    expect(r.out).toContain(`1 settled rule below "tests pass": ${P}B01`);
  });

  test("br-C14.2 every settled rule at the level passes the run", () => {
    expect(run(passingRepo(), "--results=r.json", "--require=tests-pass").code).toBe(0);
  });

  test("br-C14.3 rules that are not settled do not count", () => {
    const open = rule("B02", { status: "open", tests: [], questions: ["Which way?"] });
    expect(run(passingRepo([rule("B01"), open]), "--results=r.json", "--require=tests-written").code).toBe(0);
  });

  test("br-C14.4 the names before 2.10.0 still work", () => {
    expect(run(passingRepo(), "--require=passing").code).toBe(1);
    expect(run(passingRepo(), "--results=r.json", "--require=passing").code).toBe(0);
  });

  test("br-C14.5 an unknown level exits 2 and lists the four", () => {
    const r = run(passingRepo(), "--require=done");
    expect(r.code).toBe(2);
    expect(r.out).toContain("--require must be one of: unlinked, linked, tests-written, tests-pass");
  });
});

describe("a gap on a passing rule", () => {
  const withGap = (gap: string | undefined, results: boolean) =>
    repo({
      [LEDGER]: ledger({ rules: [rule("B01", { gap })] }),
      "src/a.ts": cite,
      "src/a.test.ts": testLine("B01.1"),
      ...(results ? { "r.json": passedJson("B01.1") } : {}),
    });
  const warning = "tests pass with a gap";

  test("br-L15.1 a settled rule whose tests pass with a gap is a warning", () => {
    expect(run(withGap("the code does less.", true), "--results=r.json").out).toContain(`${P}B01: ${warning}`);
  });

  test("br-L15.2 a rule with a gap at tested is not warned", () => {
    expect(run(withGap("the code does less.", false)).out).not.toContain(warning);
  });

  test("br-L15.3 a passing rule with no gap is not warned", () => {
    expect(run(withGap(undefined, true), "--results=r.json").out).not.toContain(warning);
  });
});

describe("counts in the report", () => {
  test("br-C23.1 when every settled rule's tests pass, it says so", () => {
    const dir = repo({
      [LEDGER]: ledger({ rules: [rule("B01"), rule("B02")] }),
      "src/a.ts": "// br_B01, br_B02: here",
      "src/a.test.ts": [testLine("B01.1"), testLine("B02.1")].join("\n"),
      "r.json": passedJson("B01.1", "B02.1"),
    });
    expect(run(dir, "--results=r.json").out).toContain("Settled rules: 2, all tests pass.\n");
  });

  test("br-C23.2 otherwise the highest level comes first and empty levels are left out", () => {
    const dir = repo({
      [LEDGER]: ledger({ rules: [rule("B01"), rule("B02"), rule("B03")] }),
      "src/a.ts": "// br_B01: here",
      "src/a.test.ts": [testLine("B01.1"), testLine("B02.1")].join("\n"),
      "r.json": passedJson("B01.1"),
    });
    expect(run(dir, "--results=r.json").out).toContain("Settled rules: 3 — 1 tests pass, 1 tests written, 1 unlinked.\n");
  });

  test("br-C23.3 when every rule and intent is settled, the counts say so", () => {
    const out = run(repo({ [LEDGER]: ledger({ rules: [rule("B01"), rule("B02")] }) })).out;
    expect(out).toContain("Rules: 2, all settled. Intents: 1, all settled.\n");
  });

  test("br-C23.4 statuses are listed most decided first, with retired rules after", () => {
    const dir = repo({
      [LEDGER]: ledger({
        intents: [intent("in-01"), intent("in-02", { status: "observed" })],
        rules: [
          rule("B01", { status: "observed" }),
          rule("B02", { status: "open", questions: ["Which way?"] }),
          rule("B03", { serves: "in-01, in-02" }),
          rule("B04", { status: "retired" }),
        ],
      }),
    });
    expect(run(dir).out).toContain("Rules: 3 — 1 settled, 1 open, 1 observed; 1 retired. Intents: 2 — 1 settled, 1 observed.\n");
  });

  test("br-C23.5 one mention and one document read in the singular", () => {
    const dir = repo({ [LEDGER]: ledger(), "src/a.ts": "// see br_B01", "specs/notes.md": "# Notes\n\nServes in-01.\n" });
    const out = run(dir).out;
    expect(out).toContain("1 mention of a rule in code is not a citation (no colon or @see), so it does not count.");
    expect(out).toContain("Checked 1 other document beside the ledger for rule and intent IDs.");
  });

  test("br-C23.6 several mentions and documents read in the plural", () => {
    const dir = repo({
      [LEDGER]: ledger(),
      "src/a.ts": "// see br_B01\n// and br_B01 again",
      "specs/a.md": "# A\n\nServes in-01.\n",
      "specs/b.md": "# B\n\nServes in-01.\n",
    });
    const out = run(dir).out;
    expect(out).toContain("2 mentions of rules in code are not citations (no colon or @see), so they do not count.");
    expect(out).toContain("Checked 2 other documents beside the ledger for rule and intent IDs.");
  });

  test("br-C23.7 the area list names only the kinds of message there are", () => {
    const dir = repo({ [LEDGER]: ledger({ registry: [["B", "Business", "—"]], rules: [rule("B01", { tags: [] })] }) });
    expect(run(dir, "--area").out).toContain("The ledger has 1 warning. Run without --area for the details.");
  });

  test("br-C23.8 tag counts leave out zero", () => {
    const out = run(repo({ [LEDGER]: ledger() }), "--tag").out;
    expect(out.trim().split("\n")).toContain("core: 1 rule");
  });
});

describe("a run without results", () => {
  const indexRow = [`| ${P}B01 | When it happens, then it holds. | in-01 | \`core\` | settled | tests pass |`];

  test("br-C24.1 tests pass carried over from the index is said to be", () => {
    const dir = repo({ [LEDGER]: ledger({ index: indexRow }), "src/a.ts": "// br_B01: here", "src/a.test.ts": testLine("B01.1") });
    expect(run(dir).out).toContain(
      "Settled rules: 1, all tests pass. Without --results, tests pass is carried over from the last run that had them.",
    );
  });

  test("br-C24.2 with nothing carried over, it says no rule can reach tests pass", () => {
    const dir = repo({ [LEDGER]: ledger(), "src/a.test.ts": testLine("B01.1") });
    expect(run(dir).out).toContain("Settled rules: 1, all tests written. Without --results, no rule can reach tests pass.");
  });
});
