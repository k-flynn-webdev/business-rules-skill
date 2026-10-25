// Small throwaway repos for running the checker against. Each test builds one, runs the shipped
// checker in it, and reads what it prints.
//
// Fixture text writes a rule ID with an underscore after br, and repo() writes it to disk with a
// hyphen. Code builds IDs from P. Either way this source never spells one out, so the checker that
// scans this repo never counts a fixture's rule as one of its own. Fixtures use areas other than
// C and L for the same reason.

import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const HERE = dirname(new URL(import.meta.url).pathname);
export const CHECKER = resolve(HERE, "../../business-rules-ledger/assets/ledger-check.ts");
const TSX = resolve(HERE, "../../node_modules/.bin/tsx");

/** The prefix of a rule ID, kept apart from the ID so this source never names a rule. */
export const P = "br-";

export const LEDGER = "specs/BUSINESS-RULES.md";

/** Writes files into a new temporary directory and returns its path. */
export function repo(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "ledger-check-"));
  for (const [path, text] of Object.entries(files)) {
    const p = join(dir, path);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, text.replace(/\bbr_/g, P));
  }
  return dir;
}

export interface Run {
  code: number;
  out: string;
}

/** Runs the checker in dir with these arguments. out is stdout and stderr together. */
export function run(dir: string, ...args: string[]): Run {
  const r = spawnSync(TSX, [CHECKER, ...args], { cwd: dir, encoding: "utf8" });
  return { code: r.status ?? -1, out: `${r.stdout}${r.stderr}` };
}

/** A rule's enforcement as --rule prints it: "passing", "tested, gap", "—". */
export function level(dir: string, id: string, ...args: string[]): string {
  const r = run(dir, "--rule", `${P}${id}`, ...args);
  const first = r.out.split("\n")[0];
  const m = first.match(/^br-[A-Z]\d{2}\s+\S+, (.*)$/);
  if (!m) throw new Error(`no level for ${id}:\n${r.out}`);
  return m[1];
}

export const read = (dir: string, path = LEDGER) => readFileSync(join(dir, path), "utf8");

export interface RuleOptions {
  kind?: string | null;
  status?: string | null;
  serves?: string | null;
  given?: string;
  gap?: string;
  attended?: boolean;
  compound?: string;
  statement?: string;
  tags?: string[];
  /** Test IDs listed as bullets. Defaults to one test, [id].1. */
  tests?: string[];
  /** Markdown lines inserted before the tests, such as an examples table. */
  table?: string[];
  failsIf?: boolean;
  questions?: string[];
  sources?: string[];
}

/** One rule entry. Every part can be changed or left out to make it malformed. */
export function rule(id: string, o: RuleOptions = {}): string {
  const kind = o.kind === undefined ? "behaviour" : o.kind;
  const statement =
    o.statement ??
    (kind === "behaviour" ? "When it happens, then it holds." : "It holds.");
  const head = [
    kind !== null && `kind: ${kind}`,
    o.serves !== null && `serves: ${o.serves ?? "in-01"}`,
    o.given && `given: ${o.given}`,
    o.status !== null && `status: ${o.status ?? "settled"}`,
    o.attended && "attended: required",
  ].filter(Boolean);
  const tests = o.tests ?? [`${id}.1`];
  const out = [`## ${P}${id}`, "", head.join(" | ")];
  if (o.gap) out.push(`gap: ${o.gap}`);
  if (o.compound) out.push(`compound: ${o.compound}`);
  out.push("", statement, "");
  const tags = o.tags ?? ["#core"];
  if (tags.length) out.push(tags.map((t) => `\`${t}\``).join(" "), "");
  if (o.table) out.push(...o.table, "");
  if (o.questions) out.push("**Open questions**", "", ...o.questions.map((q) => `- ${q}`), "");
  if (tests.length)
    out.push("**Tests**", "", ...tests.map((t) => `- ${t} — Given a state. When it runs. Then it holds.`), "");
  if (o.failsIf !== false) out.push("> Fails if it does not hold.", "");
  out.push("**Source**", "", ...(o.sources ?? ["2026-10-01, fixture."]).map((s) => `- ${s}`), "");
  return out.join("\n");
}

export interface IntentOptions {
  brokenWhen?: string | null;
  status?: string;
  sources?: string[];
}

export function intent(id: string, o: IntentOptions = {}): string {
  const out = [`### ${id}`, "", "A user can rely on the thing.", "", "for: users"];
  if (o.brokenWhen !== null) out.push(`broken when: ${o.brokenWhen ?? "the thing fails."}`);
  out.push(`status: ${o.status ?? "settled"}`, "", "**Source**", "");
  out.push(...(o.sources ?? ["2026-10-01, fixture."]).map((s) => `- ${s}`), "");
  return out.join("\n");
}

export interface LedgerOptions {
  /** Lines under Format:, such as "Ignore: examples/". */
  header?: string[];
  intents?: string[];
  /** Index rows, written as given. Defaults to none, which only matters to --verify. */
  index?: string[];
  /** Replaces the Index section's body, table and all. */
  indexBody?: string[];
  /** Registry rows: [letter, area, file]. */
  registry?: [string, string, string][];
  rules?: string[];
}

export const INDEX_HEAD = [
  "| ID | Rule | Serves | Tags | Status | Enforcement |",
  "| --- | --- | --- | --- | --- | --- |",
];

/** A master ledger. With no rules given it holds br_B01, settled, with one test. */
export function ledger(o: LedgerOptions = {}): string {
  const out = ["# Business Rules Ledger — fixture", "", "Format: business-rules-ledger 2.9.3"];
  out.push(...(o.header ?? []), "", "---", "", "## Intents", "");
  out.push(...(o.intents ?? [intent("in-01")]), "---", "", "## Index", "");
  out.push(...(o.indexBody ?? [...INDEX_HEAD, ...(o.index ?? [])]), "", "---", "");
  if (o.registry) {
    out.push("## Registry", "", "| Letter | Area | File | Owner |", "| --- | --- | --- | --- |");
    for (const [l, a, f] of o.registry) out.push(`| ${l} | ${a} | ${f} | — |`);
    out.push("", "---", "");
  }
  out.push(...(o.rules ?? [rule("B01")]).flatMap((r) => [r, "---", ""]));
  return out.join("\n");
}

/** Vitest JSON results: each test name with its status, "passed", "failed" or "skipped". */
export function vitestResults(results: [string, string][]): string {
  return JSON.stringify({
    testResults: [
      {
        assertionResults: results.map(([name, status]) => ({ fullName: name, title: name, status })),
      },
    ],
  });
}

/** A line of test code naming a test after its test ID. */
export const testLine = (testId: string) => `test("${P}${testId} holds", () => {});`;
