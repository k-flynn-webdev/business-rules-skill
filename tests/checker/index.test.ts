// The index: built from the entries, rewritten by --write, compared by --verify, printed by --index.
import { statSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { INDEX_HEAD, LEDGER, P, ledger, read, repo, rule, run } from "./fixture";

const rowOf = (text: string, id: string) => text.split("\n").find((l) => l.startsWith(`| ${P}${id} |`));
const tableOf = (text: string) => {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => l.startsWith("| ID |"));
  let end = start;
  while (lines[end]?.startsWith("|")) end++;
  return lines.slice(start, end);
};
const write = (dir: string, text: string) => writeFileSync(join(dir, LEDGER), text);
const current = (dir: string) => {
  run(dir, "--write");
  return read(dir);
};

describe("the index", () => {
  test("br-C11.1 a row shows the entry's current statement", () => {
    const old = `| ${P}B01 | When it used to happen, then it held. | in-01 | \`core\` | settled | none |`;
    const dir = repo({ [LEDGER]: ledger({ index: [old] }) });
    expect(rowOf(current(dir), "B01")).toContain("| When it happens, then it holds. |");
  });

  test("br-C11.2 the master's rules come before an area file's", () => {
    const dir = repo({
      [LEDGER]: ledger({ registry: [["B", "Business", "rules/business.md"]], rules: [rule("D01")] }),
      "specs/rules/business.md": `# Business\n\n${rule("B01")}`,
    });
    const ids = tableOf(current(dir)).slice(2).map((l) => l.split("|")[1].trim());
    expect(ids).toEqual([`${P}D01`, `${P}B01`]);
  });

  test("br-C11.3 a retired rule keeps its row, with no enforcement", () => {
    const dir = repo({ [LEDGER]: ledger({ rules: [rule("B01", { status: "retired" })] }) });
    expect(rowOf(current(dir), "B01")).toMatch(/\| retired \| — \|$/);
  });
});

describe("--verify", () => {
  test("br-C12.1 a row that differs from its entry fails and is named", () => {
    const old = `| ${P}B01 | When it used to happen, then it held. | in-01 | \`core\` | settled | none |`;
    const r = run(repo({ [LEDGER]: ledger({ index: [old] }) }), "--verify");
    expect(r.code).toBe(1);
    expect(r.out).toContain(`${P}B01: index row differs from the rule entry.`);
  });

  test("br-C12.2 padding is not a difference", () => {
    const dir = repo({ [LEDGER]: ledger() });
    const text = current(dir);
    const padded = text.replace(/^\|.*\|$/gm, (row) => row.replace(/ \| /g, "   |   "));
    write(dir, padded);
    expect(padded).not.toBe(text);
    expect(run(dir, "--verify").code).toBe(0);
  });

  test("br-C12.3 a row for a rule with no entry fails and is named", () => {
    const dir = repo({ [LEDGER]: ledger() });
    const row = rowOf(current(dir), "B01")!;
    write(dir, read(dir).replace(row, `${row}\n| ${P}B07 | When it went, then it held. | in-01 | \`core\` | settled | none |`));
    const r = run(dir, "--verify");
    expect(r.code).toBe(1);
    expect(r.out).toContain(`${P}B07: in the index but has no entry.`);
  });
});

describe("--write", () => {
  test("br-C13.1 only the index table changes", () => {
    const old = `| ${P}B01 | When it used to happen, then it held. | in-01 | \`core\` | settled | none |`;
    const dir = repo({ [LEDGER]: ledger({ index: [old] }) });
    const before = read(dir);
    const after = current(dir);
    const outside = (t: string) => t.split("\n").filter((l) => !l.startsWith("|"));
    expect(outside(after)).toEqual(outside(before));
    expect(run(dir, "--verify").code).toBe(0);
  });

  test("br-C13.2 a current index is not written", () => {
    const dir = repo({ [LEDGER]: ledger() });
    run(dir, "--write");
    const path = join(dir, LEDGER);
    const longAgo = new Date("2026-01-01T00:00:00Z");
    utimesSync(path, longAgo, longAgo);
    const r = run(dir, "--write");
    expect(r.out).toContain("Index already up to date.");
    expect(statSync(path).mtime.getTime()).toBe(longAgo.getTime());
  });

  test("br-C13.3 an Index section with no table gets one after its introduction", () => {
    const dir = repo({ [LEDGER]: ledger({ indexBody: ["Every rule. Built by the checker."] }) });
    const lines = current(dir).split("\n");
    const intro = lines.indexOf("Every rule. Built by the checker.");
    expect(lines.slice(intro + 1, intro + 4)).toEqual(["", INDEX_HEAD[0], INDEX_HEAD[1]]);
  });
});

describe("--index", () => {
  test("br-C22.1 prints exactly the master's index table", () => {
    const dir = repo({ [LEDGER]: ledger({ rules: [rule("B01"), rule("B02")] }) });
    const table = tableOf(current(dir));
    expect(run(dir, "--index").out.trimEnd().split("\n")).toEqual(table);
  });

  test("br-C22.2 with --area, prints the header and only that area's rows", () => {
    const dir = repo({
      [LEDGER]: ledger({
        registry: [["B", "Business", "—"], ["U", "Interface", "—"]],
        rules: [rule("B01"), rule("U01"), rule("U02")],
      }),
    });
    const lines = run(dir, "--index", "--area=U").out.trimEnd().split("\n");
    expect(lines.slice(0, 2)).toEqual(INDEX_HEAD);
    expect(lines.slice(2).map((l) => l.split("|")[1].trim())).toEqual([`${P}U01`, `${P}U02`]);
  });
});
