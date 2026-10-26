// Ledger lint: malformed and dangling entries are reported before anyone relies on them.
import { describe, expect, test } from "vitest";
import { LEDGER, P, intent, ledger, repo, rule, run } from "./fixture";

const report = (rules: string[], files: Record<string, string> = {}, intents?: string[]) =>
  run(repo({ [LEDGER]: ledger({ rules, intents }), ...files })).out;

describe("status, kind and the required parts", () => {
  test("br-L01.1 an unknown status is an error naming the four", () => {
    expect(report([rule("B01", { status: "done" })])).toContain(
      `${P}B01: status "done" is not one of observed, open, settled, retired.`,
    );
  });

  test("br-L01.2 a missing status is an error", () => {
    expect(report([rule("B01", { status: null })])).toContain(`${P}B01: status "" is not one of`);
  });

  test("br-L02.1 an active rule with no Fails if line is an error", () => {
    expect(report([rule("B01", { failsIf: false })])).toContain(`${P}B01: no "> Fails if" line.`);
  });

  test("br-L02.2 an unknown kind is an error naming the three", () => {
    expect(report([rule("B01", { kind: "behavior" })])).toContain(
      `${P}B01: kind "behavior" is not one of definition, invariant, behaviour.`,
    );
  });

  test("br-L02.3 a retired rule needs no Fails if line", () => {
    expect(report([rule("B01", { status: "retired", failsIf: false })])).not.toContain("Fails if");
  });
});

describe("references", () => {
  test("br-L03.1 serving an intent that does not exist is an error", () => {
    expect(report([rule("B01", { serves: "in-09" })])).toContain(`${P}B01: serves in-09, which is not an intent.`);
  });

  test("br-L03.2 a given rule that does not exist is an error", () => {
    expect(report([rule("B01", { given: `${P}B99` })])).toContain(`${P}B01: given ${P}B99, which is not a rule.`);
  });

  test("br-L04.1 a rule that serves no intent is a warning", () => {
    expect(report([rule("B01", { serves: null })])).toContain(`${P}B01: serves no intent.`);
  });

  test("br-L04.2 a rule with no tests is a warning", () => {
    expect(report([rule("B01", { tests: [] })])).toContain(`${P}B01: no tests.`);
  });

  test("br-L04.3 a rule with no tags is a warning", () => {
    expect(report([rule("B01", { tags: [] })])).toContain(`${P}B01: no tags`);
  });
});

describe("tags", () => {
  const warns = (tag: string) => report([rule("B01", { tags: [tag] })]).includes("should be lowercase letters");

  test("br-L05.1 lowercase letters, digits and hyphens pass", () => expect(warns("#allergen-2")).toBe(false));
  test("br-L05.2 a capital letter is a warning", () => expect(warns("#Allergen")).toBe(true));
  test("br-L05.3 a leading digit is a warning", () => expect(warns("#2fa")).toBe(true));
  test("br-L05.4 an underscore is a warning", () => expect(warns("#cut_off")).toBe(true));
});

describe("statements", () => {
  const long = (statement: string, compound?: string) =>
    report([rule("B01", { kind: "invariant", statement, compound })]).includes("sentences with no compound: reason");

  test("br-L06.1 two sentences pass", () => expect(long("A holds. B holds.")).toBe(false));
  test("br-L06.2 three sentences are a warning", () => expect(long("A holds. B holds. C holds.")).toBe(true));
  test("br-L06.3 three sentences with a compound reason pass", () =>
    expect(long("A holds. B holds. C holds.", "they only hold together.")).toBe(false));
  test("br-L06.4 abbreviations and decimals do not end a sentence", () =>
    expect(long("Use e.g. the 2.5 rate. Round down.")).toBe(false));

  test("br-L07.1 a behaviour that does not start with When is a warning", () => {
    expect(report([rule("B01", { statement: "A refund is final." })])).toContain(
      `${P}B01: behaviour does not start with When.`,
    );
  });

  test("br-L07.2 an invariant written as When is a warning", () => {
    const out = report([rule("B01", { kind: "invariant", statement: "When a refund is made, then it is final." })]);
    expect(out).toContain(`${P}B01: invariant is written as When/Then. Can its condition ever be false?`);
  });
});

describe("status and its parts agree", () => {
  test("br-L08.1 a settled rule with open questions is a warning", () => {
    expect(report([rule("B01", { questions: ["Which way?"] })])).toContain(`${P}B01: settled but still has open questions.`);
  });

  test("br-L08.2 an open rule with no open questions is a warning", () => {
    expect(report([rule("B01", { status: "open" })])).toContain(`${P}B01: open but lists no open questions.`);
  });

  test("br-L09.1 an observed rule with a gap is a warning pointing at suspect", () => {
    const out = report([rule("B01", { status: "observed", gap: "the code does less." })]);
    expect(out).toContain(`${P}B01: observed with a gap:.`);
    expect(out).toContain("Write the concern as suspect:");
  });

  test("br-L09.2 an open rule with a gap is not warned about it", () => {
    const out = report([rule("B01", { status: "open", gap: "the code does less.", questions: ["Which way?"] })]);
    expect(out).not.toContain("with a gap");
  });
});

describe("attended rules", () => {
  const rules = (n: number, attended: number) =>
    Array.from({ length: n }, (_, i) => rule(`B0${i + 1}`, { attended: i < attended }));
  const warns = (n: number, attended: number) => report(rules(n, attended)).includes("attended (over a third)");

  test("br-L10.1 two of six attended pass", () => expect(warns(6, 2)).toBe(false));
  test("br-L10.2 three of six attended are a warning", () => expect(warns(6, 3)).toBe(true));
  test("br-L10.3 under six rules never warn", () => expect(warns(5, 5)).toBe(false));
});

describe("area files", () => {
  const withArea = (rules: string[], areaFile?: string) =>
    run(
      repo({
        [LEDGER]: ledger({ registry: [["B", "Business", "rules/business.md"]], rules }),
        ...(areaFile === undefined ? {} : { "specs/rules/business.md": areaFile }),
      }),
    );

  test("br-L11.1 an area file the registry names must exist", () => {
    const r = run(repo({ [LEDGER]: ledger({ registry: [["B", "Business", "rules/billing.md"]], rules: [rule("D01")] }) }));
    expect(r.out).toContain("Registry: area B is in specs/rules/billing.md, which does not exist.");
    expect(r.code).toBe(1);
  });

  test("br-L11.2 a rule outside its area's file is an error naming both places", () => {
    const r = withArea([rule("B01")], "# Business\n");
    expect(r.out).toContain(`${P}B01: in the master, but the registry puts area B in specs/rules/business.md.`);
  });

  test("br-L11.3 a rule defined twice is an error with both lines", () => {
    const r = withArea([rule("B01")], `# Business\n\n${rule("B01")}`);
    expect(r.out).toMatch(new RegExp(`${P}B01: defined twice, at ${LEDGER}:\\d+ and specs/rules/business\\.md:3\\.`));
  });

  const many = (letter: string, n: number) =>
    Array.from({ length: n }, (_, i) => rule(`${letter}${String(i).padStart(2, "0")}`));
  const crowded = "active rules in the master";

  test("br-L12.1 150 rules in the master pass", () => {
    expect(report([...many("B", 100), ...many("D", 50)])).not.toContain(crowded);
  });

  test("br-L12.2 151 rules in the master are a warning", () => {
    expect(report([...many("B", 100), ...many("D", 51)])).toContain(`151 ${crowded}`);
  });

  test("br-L12.3 151 rules with 51 in an area file pass", () => {
    const dir = repo({
      [LEDGER]: ledger({ registry: [["D", "Data", "rules/data.md"]], rules: many("B", 100) }),
      "specs/rules/data.md": `# Data\n\n${many("D", 51).join("\n---\n\n")}`,
    });
    const out = run(dir).out;
    expect(out).toContain("Rules: 151, all settled.");
    expect(out).not.toContain(crowded);
  });
});

describe("intents", () => {
  test("br-L13.1 an intent with no broken when line is a warning", () => {
    expect(report([rule("B01")], {}, [intent("in-01", { brokenWhen: null })])).toContain('in-01: no "broken when:" line.');
  });

  test("br-L13.2 an intent no rule serves is a warning", () => {
    expect(report([rule("B01")], {}, [intent("in-01"), intent("in-02")])).toContain("in-02: no rule serves this intent.");
  });
});

describe("documents beside the ledger", () => {
  test("br-L14.1 a document naming a rule that does not exist is a warning on that line", () => {
    const out = report([rule("B01")], { "specs/notes.md": "# Notes\n\nServes in-01. See br_B99.\n" });
    expect(out).toContain(`specs/notes.md:3: ${P}B99 is not a rule.`);
  });

  test("br-L14.2 documents that name no intent share one warning", () => {
    const out = report([rule("B01")], { "specs/a.md": "# A\n", "specs/b.md": "# B\n" });
    expect(out).toContain("2 documents beside the ledger name no intent: specs/a.md, specs/b.md.");
    expect(out.match(/name(s)? no intent/g)).toHaveLength(1);
  });

  test("br-L14.3 a document marked not a spec is not listed", () => {
    const out = report([rule("B01")], { "specs/style.md": "# Style\n\n<!-- ledger: not a spec -->\n" });
    expect(out).not.toContain("no intent");
  });
});

