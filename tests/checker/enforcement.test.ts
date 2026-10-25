// How far each rule is enforced, from citations, test names and test results.
import { describe, expect, test } from "vitest";
import { LEDGER, P, ledger, level, repo, rule, run, testLine, vitestResults } from "./fixture";

const cite = "// br_B01: here";
const passedJson = (...ids: string[]) => vitestResults(ids.map((id) => [`${P}${id} holds`, "passed"]));

describe("enforcement levels", () => {
  const two = [rule("B01", { tests: ["B01.1", "B01.2"] })];

  test("br-C03.1 no test names and no citation is none", () => {
    expect(level(repo({ [LEDGER]: ledger({ rules: two }), "src/a.ts": testLine("B01.1") }), "B01")).toBe("none");
  });

  test("br-C03.2 a citation without every test is cited", () => {
    const dir = repo({ [LEDGER]: ledger({ rules: two }), "src/a.ts": `${cite}\n${testLine("B01.1")}` });
    expect(level(dir, "B01")).toBe("cited");
  });

  test("br-C03.3 every test named, no results, is tested", () => {
    const dir = repo({ [LEDGER]: ledger({ rules: two }), "src/a.test.ts": [testLine("B01.1"), testLine("B01.2")].join("\n") });
    expect(level(dir, "B01")).toBe("tested");
  });

  test("br-C03.4 every test named and passed is passing", () => {
    const dir = repo({
      [LEDGER]: ledger({ rules: two }),
      "src/a.ts": cite,
      "src/a.test.ts": [testLine("B01.1"), testLine("B01.2")].join("\n"),
      "r.json": passedJson("B01.1", "B01.2"),
    });
    expect(level(dir, "B01", "--results=r.json")).toBe("passing");
  });

  test("br-C03.5 one failed test keeps the rule at tested", () => {
    const dir = repo({
      [LEDGER]: ledger({ rules: two }),
      "src/a.ts": cite,
      "src/a.test.ts": [testLine("B01.1"), testLine("B01.2")].join("\n"),
      "r.json": vitestResults([[`${P}B01.1 holds`, "passed"], [`${P}B01.2 holds`, "failed"]]),
    });
    expect(level(dir, "B01", "--results=r.json")).toBe("tested");
  });

  test("br-C03.6 a cited rule that lists no tests is cited", () => {
    const dir = repo({ [LEDGER]: ledger({ rules: [rule("B01", { tests: [] })] }), "src/a.ts": cite });
    expect(level(dir, "B01")).toBe("cited");
  });
});

describe("passing without results", () => {
  const indexPassing = [`| ${P}B01 | When it happens, then it holds. | in-01 | \`core\` | settled | passing |`];
  const rules = [rule("B01", { tests: ["B01.1", "B01.2"] })];

  test("br-C04.1 a passing rule stays passing while its test names exist", () => {
    const dir = repo({
      [LEDGER]: ledger({ rules, index: indexPassing }),
      "src/a.test.ts": [testLine("B01.1"), testLine("B01.2")].join("\n"),
    });
    expect(level(dir, "B01")).toBe("passing");
  });

  test("br-C04.2 a passing rule drops when a test name is gone", () => {
    const dir = repo({ [LEDGER]: ledger({ rules, index: indexPassing }), "src/a.test.ts": testLine("B01.1") });
    expect(level(dir, "B01")).not.toBe("passing");
  });
});

describe("reading results", () => {
  const named = (files: Record<string, string>) =>
    repo({ [LEDGER]: ledger(), "src/a.ts": cite, "src/a.test.ts": testLine("B01.1"), ...files });

  test("br-C05.1 one failure among several results fails the test", () => {
    const dir = named({ "r.json": vitestResults([[`${P}B01.1 holds`, "passed"], [`${P}B01.1 holds`, "failed"]]) });
    expect(level(dir, "B01", "--results=r.json")).toBe("tested");
  });

  test("br-C05.2 a skipped test has not passed", () => {
    const dir = named({ "r.json": vitestResults([[`${P}B01.1 holds`, "skipped"]]) });
    expect(level(dir, "B01", "--results=r.json")).toBe("tested");
  });

  test("br-C06.1 reads TRX", () => {
    const trx = `<TestRun><Results><UnitTestResult testName="${P}B01.1 holds" outcome="Passed" /></Results></TestRun>`;
    expect(level(named({ "r.trx": trx }), "B01", "--results=r.trx")).toBe("passing");
  });

  test("br-C06.2 reads JUnit XML", () => {
    const xml = `<testsuite><testcase classname="suite" name="${P}B01.1 holds" /></testsuite>`;
    expect(level(named({ "r.xml": xml }), "B01", "--results=r.xml")).toBe("passing");
  });

  test("br-C06.3 a directory is read by content, other JSON ignored", () => {
    const dir = named({ "results/vitest.json": passedJson("B01.1"), "results/package.json": '{ "name": "x" }' });
    expect(level(dir, "B01", "--results=results")).toBe("passing");
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
    const r = run(passingRepo(), "--require=passing");
    expect(r.code).toBe(1);
    expect(r.out).toContain(`settled rule(s) below "passing": ${P}B01`);
  });

  test("br-C14.2 every settled rule at the level passes the run", () => {
    expect(run(passingRepo(), "--results=r.json", "--require=passing").code).toBe(0);
  });

  test("br-C14.3 rules that are not settled do not count", () => {
    const open = rule("B02", { status: "open", tests: [], questions: ["Which way?"] });
    expect(run(passingRepo([rule("B01"), open]), "--results=r.json", "--require=tested").code).toBe(0);
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
  const warning = "passing with a gap";

  test("br-L15.1 a settled rule passing with a gap is a warning", () => {
    expect(run(withGap("the code does less.", true), "--results=r.json").out).toContain(`${P}B01: ${warning}`);
  });

  test("br-L15.2 a rule with a gap at tested is not warned", () => {
    expect(run(withGap("the code does less.", false)).out).not.toContain(warning);
  });

  test("br-L15.3 a passing rule with no gap is not warned", () => {
    expect(run(withGap(undefined, true), "--results=r.json").out).not.toContain(warning);
  });
});

