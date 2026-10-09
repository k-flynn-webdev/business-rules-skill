#!/usr/bin/env tsx
/**
 * Checks a business rules ledger against the codebase, lints it, and computes each rule's enforcement.
 * Version 2.5.0 — ships with the business-rules-ledger skill. Reinstall from the skill to update.
 *
 * Usage:
 *   npx tsx scripts/ledger-check.ts                         report only
 *   npx tsx scripts/ledger-check.ts --write                 also rebuild the index from the rule entries
 *   npx tsx scripts/ledger-check.ts --results=results.json  test results decide "passing": Jest/Vitest JSON,
 *                                                            TRX (dotnet test --logger trx) or JUnit XML.
 *                                                            Files or directories, comma-separated.
 *   npx tsx scripts/ledger-check.ts --require=tested        exit 1 if a settled rule is below this level
 *   npx tsx scripts/ledger-check.ts --verify                exit 1 if the index is out of date
 *   npx tsx scripts/ledger-check.ts --tag                   list every tag with how many rules and intents carry it
 *   npx tsx scripts/ledger-check.ts --tag=boilerplate       list the rules and intents carrying that tag
 *   npx tsx scripts/ledger-check.ts [ledger] --root=.       ledger defaults to specs/BUSINESS-RULES.md
 *
 * Without --results, a rule already marked passing stays passing while its tests still exist.
 */

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  existsSync,
} from "fs";
import { join, relative, resolve, extname, dirname } from "path";

const LEVELS = ["none", "cited", "tested", "passing"] as const;
type Level = (typeof LEVELS)[number];
const KINDS = ["definition", "invariant", "behaviour"];
const STATUSES = ["observed", "open", "settled", "retired"];
const RULE_FIELDS = [
  "kind",
  "serves",
  "given",
  "status",
  "attended",
  "gap",
  "compound",
];
const INTENT_FIELDS = ["for", "broken when", "non-goal", "status"];
// A line of backticked #tags, under a rule's or an intent's statement.
const TAG_LINE = /^(`#[^`]*`\s*)+$/;
const TAG_OK = /^[a-z][a-z0-9-]*$/;
const tagsOf = (line: string) =>
  [...line.matchAll(/`#([^`]*)`/g)].map((m) => m[1]);

const CODE_EXT = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".mts",
  ".cts",
  ".vue",
  ".svelte",
  ".astro",
  ".py",
  ".go",
  ".rb",
  ".java",
  ".kt",
  ".swift",
  ".rs",
  ".cs",
  ".php",
  ".ex",
  ".exs",
  ".sql",
]);
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".nuxt",
  ".output",
  ".next",
  ".svelte-kit",
  "dist",
  "build",
  "coverage",
  "vendor",
  ".venv",
  "venv",
  "target",
  "__pycache__",
  ".turbo",
  ".cache",
]);

const args = process.argv.slice(2);
const flag = (name: string) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.slice(name.length + 3) : undefined;
};
const ROOT = resolve(flag("root") ?? process.cwd());
const LEDGER = resolve(
  args.find((a) => !a.startsWith("--")) ??
    join(ROOT, "specs/BUSINESS-RULES.md"),
);
const SELF = resolve(process.argv[1] ?? "");
const RESULTS = flag("results");
const REQUIRE = flag("require") as Level | undefined;
const WRITE = args.includes("--write");
const VERIFY = args.includes("--verify");

if (REQUIRE && !LEVELS.includes(REQUIRE)) {
  console.error(`--require must be one of: ${LEVELS.join(", ")}`);
  process.exit(2);
}

interface Rule {
  id: string;
  fields: Record<string, string>;
  statement: string;
  tests: string[];
  hasFailsIf: boolean;
  hasOpenQuestions: boolean;
  tags: string[];
}

interface Intent {
  id: string;
  statement: string;
  fields: Record<string, string>;
  tags: string[];
}

const errors: string[] = [];
const warnings: string[] = [];

function fieldLine(line: string, names: string[]): [string, string] | null {
  const m = line.match(/^([a-z][a-z -]*):\s*(.*)$/);
  return m && names.includes(m[1]) ? [m[1], m[2].trim()] : null;
}

// Fields may share a line, separated by " | ": "kind: behaviour | serves: in-01 | status: settled".
// The line splits only where a known field name follows, so a "|" inside a value stays put.
function fieldLines(line: string, names: string[]): [string, string][] | null {
  const parts = line.split(new RegExp(`\\s+\\|\\s+(?=(?:${names.join("|")}):)`));
  const out = parts.map((p) => fieldLine(p, names));
  return out.every(Boolean) ? (out as [string, string][]) : null;
}

function parseLedger(content: string) {
  const rules: Rule[] = [];
  const intents: Intent[] = [];
  let rule: Rule | null = null;
  let intent: Intent | null = null;
  let inStatement = false;
  let statementDone = false;

  const close = () => {
    if (rule) rules.push(rule);
    if (intent) intents.push(intent);
    rule = null;
    intent = null;
    inStatement = false;
    statementDone = false;
  };

  for (const raw of content.split("\n")) {
    const line = raw.trim();
    const ruleHead = raw.match(/^## (br-[A-Z]\d{2})\s*$/);
    const intentHead = raw.match(/^#{2,3} (in-\d{2})\s*$/);

    if (ruleHead) {
      close();
      rule = {
        id: ruleHead[1],
        fields: {},
        statement: "",
        tests: [],
        hasFailsIf: false,
        hasOpenQuestions: false,
        tags: [],
      };
      continue;
    }
    if (intentHead) {
      close();
      intent = { id: intentHead[1], statement: "", fields: {}, tags: [] };
      continue;
    }
    if (/^#{1,3} /.test(raw)) {
      close();
      continue;
    }

    if (intent) {
      if (TAG_LINE.test(line)) {
        intent.tags = tagsOf(line);
        continue;
      }
      const fs = fieldLines(line, INTENT_FIELDS);
      if (fs)
        for (const f of fs)
          intent.fields[f[0]] = intent.fields[f[0]]
            ? `${intent.fields[f[0]]}; ${f[1]}`
            : f[1];
      else if (
        !intent.statement &&
        line &&
        !line.startsWith("**") &&
        line !== "---"
      )
        intent.statement = line;
      continue;
    }
    if (!rule) continue;
    const r: Rule = rule;

    if (!statementDone) {
      const fs = !inStatement ? fieldLines(line, RULE_FIELDS) : null;
      if (fs) {
        for (const f of fs) r.fields[f[0]] = f[1];
        continue;
      }
      if (!line) {
        if (inStatement) statementDone = true;
        continue;
      }
      if (/^(`#|\*\*|>|-|\|)/.test(line)) {
        statementDone = true;
      } else {
        inStatement = true;
        r.statement += (r.statement ? " " : "") + line;
        continue;
      }
    }

    if (TAG_LINE.test(line)) r.tags = tagsOf(line);
    if (/^\*\*Open questions\*\*/.test(line)) r.hasOpenQuestions = true;
    if (/^> Fails if /.test(line)) r.hasFailsIf = true;
    // A test is a bullet ("- B07.1 — Given …") or a row of an examples or decision table ("| B07.1 | …").
    const t = line.match(/^(?:-\s+|\|\s*)([A-Z]\d{2}\.\d+)\b/);
    if (t) r.tests.push(t[1]);
  }
  close();
  return { rules, intents };
}

function section(lines: string[], title: RegExp): [number, number] | null {
  const start = lines.findIndex((l) => title.test(l));
  if (start < 0) return null;
  let end = lines.findIndex((l, i) => i > start && /^## /.test(l));
  if (end < 0) end = lines.length;
  return [start, end];
}

const cells = (row: string) =>
  row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

function walk(dir: string, out: string[]) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (
      CODE_EXT.has(extname(name)) &&
      p !== LEDGER &&
      p !== SELF &&
      name !== "ledger-check.ts"
    )
      out.push(p);
  }
  return out;
}

// Spans of single-line string literals, so a test ID counts only when it is part of a test name.
function stringSpans(text: string): [number, number][] {
  const spans: [number, number][] = [];
  for (const m of text.matchAll(/(["'`])(?:\\.|(?!\1)[^\\])*\1/g))
    spans.push([m.index!, m.index! + m[0].length]);
  return spans;
}

// An ID followed by a colon, or after @see, cites the rule (authoring rule M12). Any other
// mention does not. A list ending in a colon cites every ID in it: "br-[X][NN], br-[Y][NN]: ...".
function isCitation(text: string, at: number, length: number) {
  return (
    /^(\s*,\s*br-[A-Z]\d{2})*\s*:/.test(text.slice(at + length)) ||
    /@see\s+$/.test(text.slice(0, at))
  );
}

function scanCode() {
  const citations = new Map<string, string[]>();
  const mentions = new Map<string, string[]>();
  const tests = new Map<string, Set<string>>();
  const unprefixed: string[] = [];
  const re = /\bbr-([A-Z]\d{2})(\.\d+)?\b/g;
  const bareRe = /(?<![\w-])([A-Z]\d{2}\.\d+)\b/g;
  for (const file of walk(ROOT, [])) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((text, i) => {
      const where = `${relative(ROOT, file)}:${i + 1}`;
      const spans = stringSpans(text);
      const inString = (at: number) => spans.some(([a, b]) => at > a && at < b);
      for (const m of text.matchAll(re)) {
        // Authoring rules (M) are about writing the ledger; code never enforces them.
        if (m[1][0] === "M") continue;
        if (m[2] && inString(m.index!)) {
          if (!tests.has(m[1])) tests.set(m[1], new Set());
          tests.get(m[1])!.add(`${m[1]}${m[2]}`);
        } else {
          const into = isCitation(text, m.index!, m[0].length)
            ? citations
            : mentions;
          if (!into.has(m[1])) into.set(m[1], []);
          into.get(m[1])!.push(where);
        }
      }
      for (const m of text.matchAll(bareRe)) {
        if (inString(m.index!)) unprefixed.push(`${m[1]} at ${where}`);
      }
    });
  }
  return { citations, mentions, tests, unprefixed };
}

// Test IDs in result names. Tolerates Go's subtest names, where spaces become underscores.
const RESULT_ID = /(?<![A-Za-z0-9-])br-([A-Z]\d{2}\.\d+)(?!\d)/g;

function decodeXml(s: string) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCodePoint(parseInt(h, 16)),
    )
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function xmlAttrs(tag: string) {
  const out: Record<string, string> = {};
  for (const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g))
    out[m[1]] = decodeXml(m[2] ?? m[3] ?? "");
  return out;
}

// One outcome per test result: true passed, false failed, null skipped or not run.
type Outcome = { name: string; ok: boolean | null };

function jestOutcomes(json: any): Outcome[] {
  const out: Outcome[] = [];
  for (const file of json.testResults ?? []) {
    for (const a of file.assertionResults ?? []) {
      const ok =
        a.status === "passed" ? true : a.status === "failed" ? false : null;
      out.push({ name: `${a.fullName ?? ""} ${a.title ?? ""}`, ok });
    }
  }
  return out;
}

// Visual Studio TRX, as written by `dotnet test --logger trx` (xUnit, NUnit, MSTest).
function trxOutcomes(xml: string): Outcome[] {
  const out: Outcome[] = [];
  for (const m of xml.matchAll(/<UnitTestResult\b[^>]*>/g)) {
    const a = xmlAttrs(m[0]);
    const o = a.outcome ?? "";
    out.push({
      name: a.testName ?? "",
      ok:
        o === "Passed"
          ? true
          : ["NotExecuted", "Inconclusive", "Pending"].includes(o)
            ? null
            : false,
    });
  }
  return out;
}

// JUnit XML (pytest --junitxml, gotestsum, JunitXml.TestLogger, most CI tools).
function junitOutcomes(xml: string): Outcome[] {
  const out: Outcome[] = [];
  for (const m of xml.matchAll(
    /<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/g,
  )) {
    const a = xmlAttrs(m[1]);
    const body = m[2] ?? "";
    const ok = /<(failure|error)\b/.test(body)
      ? false
      : /<skipped\b/.test(body)
        ? null
        : true;
    out.push({ name: `${a.classname ?? ""} ${a.name ?? ""}`, ok });
  }
  return out;
}

function resultFiles(path: string, out: string[]): string[] {
  if (!statSync(path).isDirectory()) {
    out.push(path);
    return out;
  }
  for (const name of readdirSync(path)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(path, name);
    if (statSync(p).isDirectory()) resultFiles(p, out);
    else if ([".trx", ".xml", ".json"].includes(extname(name).toLowerCase()))
      out.push(p);
  }
  return out;
}

// --results takes files or directories, comma-separated. Formats are detected from content.
function readResults(spec: string) {
  const passed = new Set<string>();
  const failed = new Set<string>();
  const files = spec
    .split(",")
    .filter(Boolean)
    .flatMap((p) => resultFiles(resolve(p), []));
  if (files.length === 0)
    warnings.push(`--results=${spec}: no result files found.`);
  for (const file of files) {
    const text = readFileSync(file, "utf8").replace(/^\uFEFF/, "");
    let outcomes: Outcome[];
    let format: string;
    if (/<TestRun\b/.test(text)) {
      outcomes = trxOutcomes(text);
      format = "trx";
    } else if (/<testsuites?\b/.test(text)) {
      outcomes = junitOutcomes(text);
      format = "junit";
    } else if (/^\s*[{[]/.test(text)) {
      try {
        outcomes = jestOutcomes(JSON.parse(text));
        format = "json";
      } catch {
        continue;
      }
      if (outcomes.length === 0) continue; // some other JSON file in the directory
    } else continue;

    let ids = 0;
    for (const o of outcomes) {
      for (const m of o.name.matchAll(RESULT_ID)) {
        ids++;
        if (o.ok === true) passed.add(m[1]);
        else if (o.ok === false) failed.add(m[1]);
      }
    }
    if (outcomes.length > 0 && ids === 0) {
      const hint =
        format === "junit"
          ? " The .NET JUnit logger writes method names, not display names; use --logger trx for .NET."
          : "";
      warnings.push(
        `${relative(ROOT, file)}: ${outcomes.length} results, none named with a br- test ID.${hint}`,
      );
    }
  }
  // A test ID fails if any of its results failed, e.g. one row of a data-driven test.
  for (const id of failed) passed.delete(id);
  return passed;
}

function sentences(text: string) {
  const cleaned = text
    .replace(/`[^`]*`/g, "x")
    .replace(/\b(e\.g|i\.e|etc|vs|approx)\./gi, "x")
    .replace(/\d\.\d/g, "x");
  return (cleaned.match(/[.!?](?=\s|$)/g) ?? []).length || 1;
}

// --tag lists every tag with its counts; --tag=name lists what carries it. Reads the ledger only.
function listTags(rules: Rule[], intents: Intent[]): never {
  const live = rules.filter(
    (r) => !r.id.startsWith("br-M") && r.fields.status !== "retired",
  );
  const wanted = flag("tag");
  const line = (text: string) => (text.length > 140 ? `${text.slice(0, 139)}…` : text);
  const out: string[] = [];
  if (!wanted) {
    const counts = new Map<string, { rules: number; intents: number }>();
    const bump = (tags: string[], key: "rules" | "intents") => {
      for (const t of new Set(tags)) {
        const c = counts.get(t) ?? { rules: 0, intents: 0 };
        c[key]++;
        counts.set(t, c);
      }
    };
    for (const r of live) bump(r.tags, "rules");
    for (const i of intents) bump(i.tags, "intents");
    if (counts.size === 0) out.push("No tags in this ledger.");
    for (const [t, c] of [...counts].sort(
      (a, b) => b[1].rules + b[1].intents - (a[1].rules + a[1].intents) || a[0].localeCompare(b[0]),
    ))
      out.push(`${t}: ${c.rules} rule(s), ${c.intents} intent(s)`);
  } else {
    const name = wanted.replace(/^#/, "");
    const is = intents.filter((i) => i.tags.includes(name));
    const rs = live.filter((r) => r.tags.includes(name));
    out.push(`Tag: ${name} — ${rs.length} rule(s), ${is.length} intent(s)`);
    if (is.length) out.push("", "Intents:", ...is.map((i) => `  ${i.id}  ${line(i.statement)}`));
    if (rs.length)
      out.push("", "Rules:", ...rs.map((r) => `  ${r.id}  ${line(r.statement)}`));
    if (!is.length && !rs.length) out.push("", "Nothing carries that tag.");
  }
  console.log(out.join("\n"));
  process.exit(0);
}

// The index, rebuilt from the rule entries in document order. Every cell comes from the rule, so
// nothing in it is edited by hand. Padded like a formatter would, so a formatter changes nothing.
function renderIndex(rules: Rule[], enforcement: (r: Rule) => string): string[] {
  const esc = (s: string) => s.replace(/\|/g, "\\|");
  const rows = rules.map((r) => {
    const status =
      (r.fields.status ?? "") + (r.fields.attended?.startsWith("required") ? ", attended" : "");
    return [
      r.id,
      esc(r.statement),
      (r.fields.serves ?? "—").split(/[,\s]+/).filter(Boolean).join(" ") || "—",
      r.tags.map((x) => `\`${x}\``).join(" ") || "—",
      status,
      enforcement(r),
    ];
  });
  const head = ["ID", "Rule", "Serves", "Tags", "Status", "Enforcement"];
  const width = head.map((h, i) => Math.max(3, h.length, ...rows.map((r) => r[i].length)));
  const line = (r: string[]) => `| ${r.map((c, i) => c.padEnd(width[i])).join(" | ")} |`;
  return [line(head), `| ${width.map((w) => "-".repeat(w)).join(" | ")} |`, ...rows.map(line)];
}

function main() {
  const content = readFileSync(LEDGER, "utf8");
  const lines = content.split("\n");
  const { rules, intents } = parseLedger(content);
  if (args.some((a) => a === "--tag" || a.startsWith("--tag="))) listTags(rules, intents);
  const ruleIds = new Set(rules.map((r) => r.id));
  const intentIds = new Set(intents.map((i) => i.id));

  const format = content.match(/Format: business-rules-ledger (\d+)\.\d+\.\d+/);
  if (!format || Number(format[1]) < 2) {
    warnings.push(
      "Ledger format is older than 2.0.0. Upgrade it for intents, kinds and enforcement.",
    );
  }
  if (content.includes("LEDGER-AUTHORING.md")) {
    warnings.push(
      "The ledger links LEDGER-AUTHORING.md, renamed BUSINESS-RULES-AUTHORING.md in 2.5.0. Reinstall it from the skill under the new name and update the links.",
    );
  } else if (
    content.includes("BUSINESS-RULES-AUTHORING.md") &&
    !existsSync(join(dirname(LEDGER), "BUSINESS-RULES-AUTHORING.md"))
  ) {
    warnings.push(
      "The ledger links BUSINESS-RULES-AUTHORING.md but it is not next to the ledger. Install it from the skill.",
    );
  }

  const { citations, mentions, tests: codeTests, unprefixed } = scanCode();
  const ledgerTests = new Set(rules.flatMap((r) => r.tests));
  for (const u of unprefixed) {
    const id = u.split(" ")[0];
    if (ledgerTests.has(id))
      warnings.push(
        `${u}: test named ${id} without the br- prefix, so it is not counted. Rename it br-${id} (br-M13).`,
      );
  }
  const passed = RESULTS ? readResults(RESULTS) : null;

  // The index is generated from the rule entries (--write). The old one is read only for the
  // previous enforcement, so a rule stays passing between runs that supply no test results.
  const idx = section(lines, /^## Index\s*$/);
  const previousEnforcement = new Map<string, string>();
  let tableAt: [number, number] | null = null;
  if (idx) {
    let header: string[] = [];
    for (let i = idx[0]; i < idx[1]; i++) {
      if (!lines[i].trim().startsWith("|")) continue;
      if (!tableAt) tableAt = [i, i + 1];
      else if (tableAt[1] === i) tableAt[1] = i + 1;
      if (/^\|\s*ID\s*\|/.test(lines[i])) header = cells(lines[i]);
      const m = lines[i].match(/^\|\s*(br-[A-Z]\d{2})\s*\|/);
      const enf = header.findIndex((h) => h.toLowerCase() === "enforcement");
      if (m && enf >= 0) previousEnforcement.set(m[1], cells(lines[i])[enf] ?? "");
    }
  } else errors.push('No "## Index" section.');

  const levels = new Map<string, Level>();
  const missingTests = new Map<string, string[]>();

  for (const r of rules) {
    if (r.id.startsWith("br-M")) continue;
    const f = r.fields;
    const status = f.status ?? "";
    const retired = status === "retired";

    if (!STATUSES.includes(status))
      errors.push(
        `${r.id}: status "${status}" is not one of ${STATUSES.join(", ")}.`,
      );
    if (!retired) {
      if (!f.kind) errors.push(`${r.id}: no kind.`);
      else if (!KINDS.includes(f.kind))
        errors.push(
          `${r.id}: kind "${f.kind}" is not one of ${KINDS.join(", ")}.`,
        );
      if (!f.serves) warnings.push(`${r.id}: serves no intent.`);
      if (!r.hasFailsIf) errors.push(`${r.id}: no "> Fails if" line.`);
      if (!r.statement) errors.push(`${r.id}: no statement.`);
      if (r.tests.length === 0) warnings.push(`${r.id}: no tests.`);
      if (r.tags.length === 0) warnings.push(`${r.id}: no tags (br-M08).`);
      if (sentences(r.statement) > 2 && !f.compound) {
        warnings.push(
          `${r.id}: statement is ${sentences(r.statement)} sentences with no compound: reason.`,
        );
      }
      const startsWhen = /^when\b/i.test(r.statement);
      if (f.kind === "behaviour" && !startsWhen)
        warnings.push(`${r.id}: behaviour does not start with When.`);
      if ((f.kind === "definition" || f.kind === "invariant") && startsWhen) {
        warnings.push(
          `${r.id}: ${f.kind} is written as When/Then. Can its condition ever be false?`,
        );
      }
      if (status === "settled" && r.hasOpenQuestions)
        warnings.push(`${r.id}: settled but still has open questions.`);
      if (status === "open" && !r.hasOpenQuestions)
        warnings.push(`${r.id}: open but lists no open questions.`);
    }
    for (const s of (f.serves ?? "").split(/[,\s]+/).filter(Boolean)) {
      if (!intentIds.has(s))
        errors.push(`${r.id}: serves ${s}, which is not an intent.`);
    }
    for (const g of (f.given ?? "").split(/[,\s]+/).filter(Boolean)) {
      if (!ruleIds.has(g))
        errors.push(`${r.id}: given ${g}, which is not a rule.`);
    }

    const bare = r.id.slice(3);
    const inCode = codeTests.get(bare) ?? new Set<string>();
    const missing = r.tests.filter((t) => !inCode.has(t));
    for (const t of inCode)
      if (!r.tests.includes(t))
        warnings.push(
          `${r.id}: code has a test named br-${t}, which the ledger does not list.`,
        );
    missingTests.set(r.id, missing);

    let level: Level = "none";
    const allTested = r.tests.length > 0 && missing.length === 0;
    if (allTested && passed && r.tests.every((t) => passed.has(t)))
      level = "passing";
    else if (allTested) level = "tested";
    else if (citations.has(bare)) level = "cited";
    if (allTested && !citations.has(bare) && !retired)
      warnings.push(`${r.id}: tested, but no code cites it.`);
    levels.set(r.id, level);

    for (const t of r.tags)
      if (!TAG_OK.test(t))
        warnings.push(
          `${r.id}: tag "${t}" should be lowercase letters, digits and hyphens.`,
        );

  }


  for (const [bare, where] of citations) {
    if (!ruleIds.has(`br-${bare}`) && bare[0] !== "M")
      errors.push(
        `br-${bare}: cited in code but no rule exists (${where.join(", ")}).`,
      );
  }
  for (const [bare, where] of mentions) {
    if (!ruleIds.has(`br-${bare}`) && bare[0] !== "M")
      errors.push(
        `br-${bare}: mentioned in code but no rule exists (${where.join(", ")}).`,
      );
  }
  for (const [bare] of codeTests) {
    if (!ruleIds.has(`br-${bare}`) && bare[0] !== "M")
      errors.push(`br-${bare}: tests exist in code but no rule exists.`);
  }

  for (const i of intents) {
    if (!i.statement) errors.push(`${i.id}: no statement.`);
    for (const t of i.tags)
      if (!TAG_OK.test(t))
        warnings.push(
          `${i.id}: tag "${t}" should be lowercase letters, digits and hyphens.`,
        );
    if (!i.fields["broken when"])
      warnings.push(`${i.id}: no "broken when:" line.`);
    const served = rules.some((r) =>
      (r.fields.serves ?? "").split(/[,\s]+/).includes(i.id),
    );
    if (!served) warnings.push(`${i.id}: no rule serves this intent.`);
  }

  if (section(lines, /^## Recent changes\s*$/))
    warnings.push(
      "Recent changes is no longer part of the format (2.5.0). History lives in each rule's source lines and in git; remove the section.",
    );

  const cellFor = (r: Rule): string => {
    if (r.fields.status === "retired") return "—";
    let level = levels.get(r.id)!;
    const previous = previousEnforcement.get(r.id) ?? "";
    if (!passed && level === "tested" && previous.startsWith("passing"))
      level = "passing";
    return r.fields.gap ? `${level}, gap` : level;
  };

  const generated = renderIndex(
    rules.filter((r) => !r.id.startsWith("br-M")),
    cellFor,
  );
  const current = tableAt ? lines.slice(tableAt[0], tableAt[1]) : [];
  const sameTable =
    current.length === generated.length &&
    current.every((l, i) => cells(l).join("|") === cells(generated[i]).join("|"));

  const stale: string[] = [];
  if (VERIFY && !WRITE && idx && !sameTable) {
    const before = new Map(current.map((l) => [cells(l)[0], cells(l).join("|")]));
    for (const row of generated.slice(2)) {
      const id = cells(row)[0];
      if (before.get(id) !== cells(row).join("|")) stale.push(`${id}: index row differs from the rule entry.`);
    }
    for (const id of before.keys())
      if (/^br-[A-Z]\d{2}$/.test(id) && !ruleIds.has(id)) stale.push(`${id}: in the index but has no entry.`);
    if (!stale.length) stale.push("the index table's header or order differs.");
  }

  let changed = false;
  if (WRITE && idx && !sameTable) {
    if (tableAt) lines.splice(tableAt[0], tableAt[1] - tableAt[0], ...generated);
    else {
      // No table yet: put it after the section's heading and introduction.
      let at = idx[0] + 1;
      while (at < idx[1] && !lines[at].trim()) at++;
      if (at < idx[1] && lines[at] !== "---") while (at < idx[1] && lines[at].trim()) at++;
      lines.splice(at, 0, "", ...generated);
    }
    writeFileSync(LEDGER, lines.join("\n"), "utf8");
    changed = true;
  }

  const active = rules.filter(
    (r) => !r.id.startsWith("br-M") && r.fields.status !== "retired",
  );
  const settled = active.filter((r) => r.fields.status === "settled");
  const counts = Object.fromEntries(
    LEVELS.map((l) => [
      l,
      settled.filter((r) => cellFor(r).startsWith(l)).length,
    ]),
  );
  const byStatus = Object.fromEntries(
    STATUSES.map((s) => [s, rules.filter((r) => r.fields.status === s).length]),
  );

  const out: string[] = [];
  out.push(`Ledger: ${relative(ROOT, LEDGER)}`);
  out.push(
    `Rules: ${active.length} active (${STATUSES.filter((s) => s !== "retired")
      .map((s) => `${byStatus[s]} ${s}`)
      .join(", ")}), ${byStatus.retired} retired. Intents: ${intents.length}.`,
  );
  out.push(
    `Settled enforcement: ${LEVELS.map((l) => `${counts[l]} ${l}`).join(", ")}.${passed ? "" : " (no --results given)"}`,
  );
  if (counts.passing > 0)
    out.push(
      "Passing means the named tests passed, not that they check the rule. Review the tests of attended rules.",
    );
  const mentionCount = [...mentions.values()].reduce((n, w) => n + w.length, 0);
  if (mentionCount > 0)
    out.push(
      `${mentionCount} rule mention(s) in code not counted as citations (no colon or @see).`,
    );

  const todo = settled.filter((r) => !cellFor(r).startsWith("passing"));
  if (todo.length) {
    out.push("", "Settled rules not yet passing:");
    const byIntent = new Map<string, Rule[]>();
    for (const r of todo) {
      const key =
        (r.fields.serves ?? "").split(/[,\s]+/).filter(Boolean)[0] ??
        "no intent";
      if (!byIntent.has(key)) byIntent.set(key, []);
      byIntent.get(key)!.push(r);
    }
    for (const [key, list] of byIntent) {
      out.push(`  ${key}`);
      for (const r of list) {
        const missing = missingTests.get(r.id) ?? [];
        const detail = missing.length
          ? ` — missing tests: ${missing.join(", ")}`
          : "";
        out.push(`    ${r.id}  ${cellFor(r)}${detail}`);
      }
    }
  }

  const gaps = active.filter((r) => r.fields.gap);
  if (gaps.length) {
    out.push("", "Known gaps:");
    for (const r of gaps) out.push(`  ${r.id}  ${r.fields.gap}`);
  }
  if (errors.length)
    out.push("", `Errors (${errors.length}):`, ...errors.map((e) => `  ${e}`));
  if (warnings.length)
    out.push(
      "",
      `Warnings (${warnings.length}):`,
      ...warnings.map((w) => `  ${w}`),
    );
  if (WRITE && idx)
    out.push("", changed ? "Index rebuilt from the rule entries." : "Index already up to date.");

  console.log(out.join("\n"));

  let exit = errors.length ? 1 : 0;
  if (stale.length) {
    console.log(
      `\nIndex out of date (${stale.length}). It is generated; run with --write locally and commit:\n${stale.map((s) => `  ${s}`).join("\n")}`,
    );
    exit = 1;
  }
  if (REQUIRE) {
    const floor = LEVELS.indexOf(REQUIRE);
    const below = settled.filter(
      (r) => LEVELS.indexOf(cellFor(r).split(",")[0] as Level) < floor,
    );
    if (below.length) {
      console.log(
        `\n${below.length} settled rule(s) below "${REQUIRE}": ${below.map((r) => r.id).join(", ")}`,
      );
      exit = 1;
    }
  }
  process.exit(exit);
}

main();
