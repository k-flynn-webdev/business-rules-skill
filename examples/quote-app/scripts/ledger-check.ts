#!/usr/bin/env tsx
/**
 * Checks a business rules ledger against the codebase, lints it, and computes each rule's enforcement.
 * Version 2.9.1 — ships with the business-rules-ledger skill. Reinstall from the skill to update.
 *
 * Usage:
 *   npx tsx scripts/ledger-check.ts                         report only
 *   npx tsx scripts/ledger-check.ts --write                 also rebuild the index from the rule entries
 *   npx tsx scripts/ledger-check.ts --results=results.json  test results decide "passing": Jest/Vitest JSON,
 *                                                            TRX (dotnet test --logger trx) or JUnit XML.
 *                                                            Files or directories, comma-separated.
 *   npx tsx scripts/ledger-check.ts --require=tested        exit 1 if a settled rule is below this level
 *   npx tsx scripts/ledger-check.ts --verify                exit 1 if the index is out of date
 *   npx tsx scripts/ledger-check.ts --waiting               list everything waiting on the owner, not only the oldest 10
 *   npx tsx scripts/ledger-check.ts --tag                   list every tag with how many rules and intents carry it
 *   npx tsx scripts/ledger-check.ts --tag=boilerplate       list the rules and intents carrying that tag
 *   npx tsx scripts/ledger-check.ts --rule=br-C01           one rule: its entry, enforcement, citations and tests
 *                                                            (--rule br-C01 and --rule C01 work too)
 *   npx tsx scripts/ledger-check.ts --area                  list the areas: file, owner, rules, settled, passing, waiting
 *   npx tsx scripts/ledger-check.ts --area=B                the report for one area (or B,U; a name; an area file).
 *                                                            Works with --waiting and --require; the index stays whole.
 *   npx tsx scripts/ledger-check.ts --index                 print the index as built from the rules (--area=B: its rows only)
 *   npx tsx scripts/ledger-check.ts [ledger] --root=.       ledger defaults to specs/BUSINESS-RULES.md
 *
 * The ledger is the master. When its registry names a file for an area, that area's rules live in
 * that file (an area file) and the checker reads it too. The one index stays in the master.
 *
 * Two optional lines under the master's Format: line say what code is read. Paths are relative to
 * the repo root and comma-separated.
 *   Ignore: examples/                    never read these, such as examples with their own ledgers
 *   Scan: business-rules-ledger/assets/  read these although they are skipped by default
 *                                        (copies of this checker, dist/, build/ and the like)
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
import { join, relative, resolve, extname, dirname, sep } from "path";

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
  ".sh",
  ".bash",
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
// --rule also takes its ID as the next argument, so `npm run rule br-C01` works.
const ruleAt = args.indexOf("--rule");
const ruleArg = ruleAt >= 0 ? args[ruleAt + 1] : undefined;
// --area too: --area B, --area=B,U, --area=Business or --area=specs/rules/business.md.
// A bare --area lists the areas instead of the report.
const areaAt = args.indexOf("--area");
const areaNext = areaAt >= 0 && args[areaAt + 1] && !args[areaAt + 1].startsWith("--") ? areaAt + 1 : -1;
const AREA_ARG = flag("area") ?? (areaNext >= 0 ? args[areaNext] : undefined);
const LIST_AREAS = areaAt >= 0 && areaNext < 0;
// --index prints the index instead of the report, so a reader on one area reads only its rows.
const PRINT_INDEX = args.includes("--index");
const ROOT = resolve(flag("root") ?? process.cwd());
const LEDGER = resolve(
  args.find(
    (a, i) => !a.startsWith("--") && !(ruleAt >= 0 && i === ruleAt + 1) && i !== areaNext,
  ) ?? join(ROOT, "specs/BUSINESS-RULES.md"),
);
const SELF = resolve(process.argv[1] ?? "");
const RESULTS = flag("results");
const REQUIRE = flag("require") as Level | undefined;
const WRITE = args.includes("--write");
const VERIFY = args.includes("--verify");
const ALL_WAITING = args.includes("--waiting");
// --rule=br-C01 (or C01) prints one rule instead of the report.
const ONE_RULE = (flag("rule") ?? ruleArg)?.toUpperCase().replace(/^(BR-)?/, "br-");
// How many waiting entries the report shows before "and N more".
const WAITING_SHOWN = 10;
// A document beside the ledger that is not a product spec (a component or style guide, say)
// carries this marker, so the checker does not ask it to name an intent.
const NOT_A_SPEC = /<!--\s*ledger:\s*not a spec\s*-->/i;

if (ruleAt >= 0 && !ruleArg) {
  console.error("--rule needs a rule ID: --rule br-C01");
  process.exit(2);
}
if (REQUIRE && !LEVELS.includes(REQUIRE)) {
  console.error(`--require must be one of: ${LEVELS.join(", ")}`);
  process.exit(2);
}

interface Rule {
  id: string;
  // Where the entry is: the master or an area file, and the line of its heading.
  file: string;
  line: number;
  fields: Record<string, string>;
  statement: string;
  tests: string[];
  hasFailsIf: boolean;
  hasOpenQuestions: boolean;
  openQuestions: number;
  tags: string[];
  // The oldest and newest dates in the entry's source lines. An observed entry has waited since
  // it was read (the oldest); an open rule since its latest change (the newest).
  firstSource: string;
  lastSource: string;
}

interface Intent {
  id: string;
  statement: string;
  fields: Record<string, string>;
  tags: string[];
  firstSource: string;
  lastSource: string;
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

// A source line starts with its date: "- 2026-09-24, grill session. …".
const SOURCE_DATE = /^-\s+(\d{4}-\d{2}-\d{2})\b/;
const newer = (a: string, b: string) => (b > a ? b : a);
const older = (a: string, b: string) => (!a || b < a ? b : a);

function parseLedger(content: string, file: string) {
  const rules: Rule[] = [];
  const intents: Intent[] = [];
  let rule: Rule | null = null;
  let intent: Intent | null = null;
  let inStatement = false;
  let statementDone = false;
  let inQuestions = false;

  const close = () => {
    if (rule) rules.push(rule);
    if (intent) intents.push(intent);
    rule = null;
    intent = null;
    inStatement = false;
    statementDone = false;
    inQuestions = false;
  };

  content.split("\n").forEach((raw, at) => step(raw, at + 1));
  close();
  return { rules, intents };

  function step(raw: string, lineNo: number) {
    const line = raw.trim();
    const ruleHead = raw.match(/^## (br-[A-Z]\d{2})\s*$/);
    const intentHead = raw.match(/^#{2,3} (in-\d{2})\s*$/);

    if (ruleHead) {
      close();
      rule = {
        id: ruleHead[1],
        file,
        line: lineNo,
        fields: {},
        statement: "",
        tests: [],
        hasFailsIf: false,
        hasOpenQuestions: false,
        openQuestions: 0,
        tags: [],
        firstSource: "",
        lastSource: "",
      };
      return;
    }
    if (intentHead) {
      close();
      intent = { id: intentHead[1], statement: "", fields: {}, tags: [], firstSource: "", lastSource: "" };
      return;
    }
    if (/^#{1,3} /.test(raw)) {
      close();
      return;
    }

    if (intent) {
      const date = line.match(SOURCE_DATE);
      if (date) {
        intent.firstSource = older(intent.firstSource, date[1]);
        intent.lastSource = newer(intent.lastSource, date[1]);
        return;
      }
      if (TAG_LINE.test(line)) {
        intent.tags = tagsOf(line);
        return;
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
      return;
    }
    if (!rule) return;
    const r: Rule = rule;

    if (!statementDone) {
      const fs = !inStatement ? fieldLines(line, RULE_FIELDS) : null;
      if (fs) {
        for (const f of fs) r.fields[f[0]] = f[1];
        return;
      }
      if (!line) {
        if (inStatement) statementDone = true;
        return;
      }
      if (/^(`#|\*\*|>|-|\|)/.test(line)) {
        statementDone = true;
      } else {
        inStatement = true;
        r.statement += (r.statement ? " " : "") + line;
        return;
      }
    }

    if (TAG_LINE.test(line)) r.tags = tagsOf(line);
    const date = line.match(SOURCE_DATE);
    if (date) {
      r.firstSource = older(r.firstSource, date[1]);
      r.lastSource = newer(r.lastSource, date[1]);
    }
    if (/^\*\*/.test(line)) inQuestions = false;
    if (/^\*\*Open questions\*\*/.test(line)) {
      r.hasOpenQuestions = true;
      inQuestions = true;
    } else if (inQuestions && /^-\s/.test(line)) r.openQuestions++;
    if (/^> Fails if /.test(line)) r.hasFailsIf = true;
    // A test is a bullet ("- B07.1 — Given …") or a row of an examples or decision table ("| B07.1 | …").
    const t = line.match(/^(?:-\s+|\|\s*)([A-Z]\d{2}\.\d+)\b/);
    if (t) r.tests.push(t[1]);
  }
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

// The registry maps each area letter to its name, and optionally to an area file and an owner:
// | Letter | Area | File | Owner |. An area with no file keeps its rules in the master.
interface Area {
  letter: string;
  name: string;
  file: string | null;
  owner: string;
}

function readRegistry(lines: string[]): Area[] {
  const reg = section(lines, /^## Registry\s*$/);
  if (!reg) return [];
  const areas: Area[] = [];
  let header: string[] = [];
  for (let i = reg[0]; i < reg[1]; i++) {
    if (!lines[i].trim().startsWith("|") || /^\|\s*-/.test(lines[i].trim())) continue;
    const row = cells(lines[i]);
    if (!header.length) {
      header = row.map((h) => h.toLowerCase());
      continue;
    }
    const col = (name: string) => row[header.indexOf(name)] ?? "";
    const letter = col("letter");
    // M names the authoring file, which holds no ledger rules.
    if (!/^[A-Z]$/.test(letter) || letter === "M") continue;
    // A file may be written plainly, in backticks, or as a link: [rules/billing.md](rules/billing.md).
    const raw = col("file").replace(/^\[[^\]]*\]\(([^)]*)\)$/, "$1").replace(/`/g, "").trim();
    const file = raw && !/^[—–-]$/.test(raw) ? resolve(dirname(LEDGER), raw) : null;
    areas.push({ letter, name: col("area"), file, owner: col("owner").replace(/^[—–-]$/, "") });
  }
  return areas;
}

// A table row compared by its cells, ignoring padding; a separator row is the same at any width.
const rowKey = (row: string) =>
  cells(row)
    .map((c) => (/^:?-+:?$/.test(c) ? "---" : c))
    .join("|");

// The master's Ignore: and Scan: lines, as absolute paths. Ignore wins where both apply.
let IGNORE: string[] = [];
let SCAN: string[] = [];
const within = (p: string, dirs: string[]) => dirs.some((d) => p === d || p.startsWith(d + sep));

// Code files under dir. Copies of this checker are skipped, so its own text never counts as a
// citation; Scan: reads them anyway, for a repo whose product is the checker. Inside a skipped
// directory that only leads to a Scan: path, only that path is read (onlyScan).
function walk(dir: string, out: string[], onlyScan = false) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (within(p, IGNORE)) continue;
    const scanned = within(p, SCAN);
    const leadsToScan = SCAN.some((d) => d.startsWith(p + sep));
    if (SKIP_DIRS.has(name) && !scanned && !leadsToScan) continue;
    if (statSync(p).isDirectory()) {
      if (SKIP_DIRS.has(name) && !scanned) walk(p, out, true);
      else walk(p, out, onlyScan && !scanned);
    } else if (
      CODE_EXT.has(extname(name)) &&
      p !== LEDGER &&
      (!onlyScan || scanned) &&
      (scanned || (p !== SELF && name !== "ledger-check.ts"))
    )
      out.push(p);
  }
  return out;
}

// A header setting: "Ignore: examples/, vendor/" → absolute paths. A path that does not exist
// is a warning, since a typo would otherwise widen or narrow the scan silently.
function setting(header: string[], name: string): string[] {
  const values = header
    .flatMap((l) => l.match(new RegExp(`^${name}:\\s*(.*)$`))?.[1].split(",") ?? [])
    .map((v) => v.replace(/`/g, "").trim().replace(/[\\/]+$/, ""))
    .filter(Boolean);
  for (const v of values)
    if (!existsSync(resolve(ROOT, v))) warnings.push(`${name}: ${v} does not exist.`);
  return values.map((v) => resolve(ROOT, v));
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
  const testsAt = new Map<string, string[]>();
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
          const id = `${m[1]}${m[2]}`;
          if (!testsAt.has(id)) testsAt.set(id, []);
          testsAt.get(id)!.push(where);
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
  return { citations, mentions, tests, testsAt, unprefixed };
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

function intentSummary(intents: Intent[]) {
  const by = new Map<string, number>();
  for (const i of intents) by.set(i.fields.status ?? "no status", (by.get(i.fields.status ?? "no status") ?? 0) + 1);
  return by.size ? ` (${[...by].map(([s, n]) => `${n} ${s}`).join(", ")})` : "";
}

// The index, rebuilt from the rule entries: the master's rules, then each area file's, in document
// order. Every cell comes from the rule, so nothing in it is edited by hand. Unpadded, to keep it
// cheap to read; a formatter may pad it, and the checker compares cells, not spacing.
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
  const line = (r: string[]) => `| ${r.join(" | ")} |`;
  return [line(head), `| ${head.map(() => "---").join(" | ")} |`, ...rows.map(line)];
}

// --area: the letters a value names. A letter, an area's name or an area file's path, comma-separated.
function areaLetters(spec: string, areas: Area[], rules: Rule[]): Set<string> {
  const known = new Map(areas.map((a) => [a.letter, a.name]));
  for (const r of rules) if (r.id[3] !== "M" && !known.has(r.id[3])) known.set(r.id[3], "");
  const out = new Set<string>();
  for (const value of spec.split(",").map((v) => v.trim()).filter(Boolean)) {
    const found = [
      ...(known.has(value.toUpperCase()) ? [value.toUpperCase()] : []),
      ...areas.filter((a) => a.name.toLowerCase() === value.toLowerCase()).map((a) => a.letter),
      ...areas
        .filter((a) => a.file && [resolve(ROOT, value), resolve(value)].includes(a.file))
        .map((a) => a.letter),
    ];
    if (!found.length) {
      const names = [...known].map(([l, n]) => (n ? `${l} ${n}` : l)).join(", ");
      console.error(`--area: no area "${value}". Areas: ${names || "none"}.`);
      process.exit(2);
    }
    for (const l of found) out.add(l);
  }
  return out;
}

// What a report line is about: a rule's area letter, "intent", or null for the whole ledger.
// Rule messages start with the rule ID, or with a bare test ID when its br- prefix is missing.
function aboutArea(message: string): string | null {
  if (/^in-\d/.test(message)) return "intent";
  return message.match(/^(?:br-)?([A-Z])\d{2}\b/)?.[1] ?? null;
}

// Markdown beside the ledger: specs, briefs, notes. A spec names the intents it serves and cites
// rules for its decisions (br-M30), so an ID that matches nothing is a broken link, and a spec
// that names no intent is not yet tied to the ledger.
function checkDocs(ruleIds: Set<string>, intentIds: Set<string>, areaFiles: string[]) {
  const skip = new Set([LEDGER, ...areaFiles, ...["BUSINESS-RULES-AUTHORING.md", "LEDGER-AUTHORING.md"].map((n) => join(dirname(LEDGER), n))]);
  const docs: string[] = [];
  const find = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (SKIP_DIRS.has(name) || within(p, IGNORE)) continue;
      if (statSync(p).isDirectory()) find(p);
      else if (extname(name).toLowerCase() === ".md" && !skip.has(p)) docs.push(p);
    }
  };
  find(dirname(LEDGER));
  const unnamed: string[] = [];
  for (const doc of docs) {
    const where = relative(ROOT, doc);
    let intents = 0;
    const body = readFileSync(doc, "utf8");
    body.split("\n").forEach((text, i) => {
      for (const m of text.matchAll(/\b(br-[A-Z]\d{2}|in-\d{2})\b/g)) {
        const id = m[1];
        if (id.startsWith("in-")) {
          intents++;
          if (!intentIds.has(id)) warnings.push(`${where}:${i + 1}: ${id} is not an intent.`);
        } else if (!id.startsWith("br-M") && !ruleIds.has(id))
          warnings.push(`${where}:${i + 1}: ${id} is not a rule.`);
      }
    });
    if (intents === 0 && !NOT_A_SPEC.test(body)) unnamed.push(where);
  }
  // One warning for all of them: a folder of old specs should not bury the rest of the report.
  if (unnamed.length)
    warnings.push(
      `${unnamed.length} document${unnamed.length === 1 ? "" : "s"} beside the ledger name${unnamed.length === 1 ? "s" : ""} no intent: ${unnamed.join(", ")}. A spec names the intents it serves and cites a rule for each decision (br-M30). Fix it, move it, or mark a document that is not a product spec with <!-- ledger: not a spec -->.`,
    );
  return docs.length;
}

function main() {
  const content = readFileSync(LEDGER, "utf8");
  const lines = content.split("\n");
  const master = parseLedger(content, LEDGER);
  const firstSection = lines.findIndex((l) => /^## /.test(l));
  const header = lines.slice(0, firstSection < 0 ? lines.length : firstSection);
  IGNORE = setting(header, "Ignore");
  SCAN = setting(header, "Scan");
  const rules = [...master.rules];
  const intents = [...master.intents];

  // Area files, in registry order. Each holds the rules of the areas the registry gives it.
  const areas = readRegistry(lines);
  const areaFiles = [...new Set(areas.flatMap((a) => (a.file ? [a.file] : [])))];
  const fileOf = new Map(areas.map((a) => [a.letter, a.file]));
  const where = (f: string | null | undefined) => (f ? relative(ROOT, f) : "the master");
  for (const file of areaFiles) {
    const letters = areas.filter((a) => a.file === file).map((a) => a.letter).join(", ");
    if (!existsSync(file)) {
      errors.push(`Registry: area ${letters} is in ${where(file)}, which does not exist.`);
      continue;
    }
    const part = parseLedger(readFileSync(file, "utf8"), file);
    rules.push(...part.rules);
    for (const i of part.intents) {
      warnings.push(`${i.id}: in ${where(file)}. Intents belong in the master, where every area can serve them.`);
      intents.push(i);
    }
  }
  for (const r of rules) {
    const letter = r.id[3];
    if (letter === "M" || !fileOf.has(letter)) continue;
    const expected = fileOf.get(letter) ?? LEDGER;
    if (r.file !== expected)
      errors.push(
        `${r.id}: in ${where(r.file === LEDGER ? null : r.file)}, but the registry puts area ${letter} in ${where(fileOf.get(letter))}.`,
      );
  }
  const seen = new Map<string, Rule>();
  for (const r of rules) {
    const first = seen.get(r.id);
    if (first)
      errors.push(
        `${r.id}: defined twice, at ${relative(ROOT, first.file)}:${first.line} and ${relative(ROOT, r.file)}:${r.line}.`,
      );
    else seen.set(r.id, r);
  }

  // --area narrows what the report shows. Every rule is still read and checked, and the index
  // stays whole, because rules serve shared intents and depend on rules in other areas.
  const AREA = AREA_ARG ? areaLetters(AREA_ARG, areas, rules) : null;
  const inArea = (id: string) => !AREA || AREA.has(id[3]);

  if (args.some((a) => a === "--tag" || a.startsWith("--tag=")))
    listTags(rules.filter((r) => inArea(r.id)), intents);
  const ruleIds = new Set(rules.map((r) => r.id));
  const intentIds = new Set(intents.map((i) => i.id));

  // These sections moved to BUSINESS-RULES-AUTHORING.md in 2.8.0, so every ledger file stays short.
  for (const title of ["How to read this ledger", "Citing rules in code"])
    if (section(lines, new RegExp(`^## ${title}\\s*$`)))
      warnings.push(
        `"${title}" now lives in BUSINESS-RULES-AUTHORING.md (2.8.0). Reinstall that file from the skill and remove the section from the ledger.`,
      );

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

  const { citations, mentions, tests: codeTests, testsAt, unprefixed } = scanCode();
  const docCount = checkDocs(ruleIds, intentIds, areaFiles);
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
      // br-M28: a gap is where the code breaks a decision. An observed rule describes the code,
      // so the code cannot diverge from it.
      if (status === "observed" && f.gap)
        warnings.push(
          `${r.id}: observed with a gap:. An observed rule describes the code. Write the concern as suspect: in its source, or decide the rule (open or settled) and keep the gap.`,
        );
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
    // br-L15: a gap says the code breaks the rule, so tests that all pass contradict it.
    if (level === "passing" && f.gap && status !== "observed")
      warnings.push(
        `${r.id}: passing with a gap. Either the code now conforms (delete the gap) or the tests miss it.`,
      );
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

  if (ONE_RULE) {
    const r = rules.find((x) => x.id === ONE_RULE);
    if (!r) {
      console.error(`${ONE_RULE}: no such rule in ${relative(ROOT, LEDGER)}.`);
      process.exit(1);
    }
    const bare = r.id.slice(3);
    const out: string[] = [];
    out.push(`${r.id}  ${r.fields.status ?? "no status"}, ${cellFor(r)}`);
    out.push(r.statement);
    out.push("");
    out.push(`Entry:     ${relative(ROOT, r.file)}:${r.line}`);
    out.push(`Serves:    ${r.fields.serves ?? "—"}`);
    out.push(`Tags:      ${r.tags.join(", ") || "—"}`);
    if (r.fields.gap) out.push(`Gap:       ${r.fields.gap}`);
    out.push("", "Cited in code:");
    out.push(...(citations.get(bare) ?? ["(none)"]).map((w) => `  ${w}`));
    const missing = missingTests.get(r.id) ?? [];
    out.push("", `Tests (${r.tests.length - missing.length} of ${r.tests.length} in code):`);
    for (const t of r.tests)
      out.push(`  br-${t}  ${(testsAt.get(t) ?? ["missing"]).join(", ")}`);
    const said = mentions.get(bare);
    if (said) out.push("", "Mentioned, not cited:", ...said.map((w) => `  ${w}`));
    console.log(out.join("\n"));
    process.exit(0);
  }

  if (LIST_AREAS) {
    const live = rules.filter((r) => !r.id.startsWith("br-M") && r.fields.status !== "retired");
    const letters = [...new Set([...areas.map((a) => a.letter), ...live.map((r) => r.id[3])])];
    const rows = [["", "Area", "File", "Owner", "Rules", "Settled", "Passing", "Waiting"]];
    for (const l of letters) {
      const a = areas.find((x) => x.letter === l);
      const mine = live.filter((r) => r.id[3] === l);
      const settled = mine.filter((r) => r.fields.status === "settled");
      rows.push([
        l,
        a?.name || "(not in the registry)",
        a ? where(a.file) : "—",
        a?.owner || "—",
        String(mine.length),
        String(settled.length),
        String(settled.filter((r) => cellFor(r).startsWith("passing")).length),
        String(mine.filter((r) => r.fields.status === "observed" || r.fields.status === "open").length),
      ]);
    }
    const width = rows[0].map((_, c) => Math.max(...rows.map((r) => r[c].length)));
    const out = rows.map((r) =>
      r.map((v, c) => (c >= 4 ? v.padStart(width[c]) : v.padEnd(width[c]))).join("  ").trimEnd(),
    );
    const count = (n: number, k: string) => `${n} ${k}${n === 1 ? "" : "s"}`;
    if (errors.length || warnings.length)
      out.push("", `The ledger has ${count(errors.length, "error")} and ${count(warnings.length, "warning")}. Run without --area for the details.`);
    console.log(out.join("\n"));
    process.exit(0);
  }

  const generated = renderIndex(
    rules.filter((r) => !r.id.startsWith("br-M")),
    cellFor,
  );
  if (PRINT_INDEX) {
    const rows = generated.slice(2).filter((row) => inArea(cells(row)[0]));
    console.log([...generated.slice(0, 2), ...rows].join("\n"));
    process.exit(0);
  }
  const current = tableAt ? lines.slice(tableAt[0], tableAt[1]) : [];
  const sameTable =
    current.length === generated.length &&
    current.every((l, i) => rowKey(l) === rowKey(generated[i]));

  const stale: string[] = [];
  if (VERIFY && !WRITE && idx && !sameTable) {
    const before = new Map(current.map((l) => [cells(l)[0], rowKey(l)]));
    for (const row of generated.slice(2)) {
      const id = cells(row)[0];
      if (before.get(id) !== rowKey(row)) stale.push(`${id}: index row differs from the rule entry.`);
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

  const allActive = rules.filter(
    (r) => !r.id.startsWith("br-M") && r.fields.status !== "retired",
  );
  const active = allActive.filter((r) => inArea(r.id));
  // Attended marks risk (br-M19). When most rules carry it, an agent can do little alone.
  // br-L10: from 6 rules. Below that a third is one or two, and a new ledger would warn at once.
  const attendedCount = active.filter((r) => r.fields.attended).length;
  if (active.length >= 6 && attendedCount * 3 > active.length)
    warnings.push(
      `${attendedCount} of ${active.length} active rules are attended (over a third). Keep attended for money, deletion, security and customer data (br-M19).`,
    );
  // One file stays readable to about 150 rules. Past that, an agent reads more than the work needs.
  const inMaster = allActive.filter((r) => r.file === LEDGER).length;
  if (inMaster > 150)
    warnings.push(
      `${inMaster} active rules in the master. Move areas into area files (see the registry's File column) so a reader loads only the areas the work touches.`,
    );
  const settled = active.filter((r) => r.fields.status === "settled");
  const counts = Object.fromEntries(
    LEVELS.map((l) => [
      l,
      settled.filter((r) => cellFor(r).startsWith(l)).length,
    ]),
  );
  const byStatus = Object.fromEntries(
    STATUSES.map((s) => [s, rules.filter((r) => inArea(r.id) && r.fields.status === s).length]),
  );

  const out: string[] = [];
  out.push(
    `Ledger: ${relative(ROOT, LEDGER)}${areaFiles.length ? ` and ${areaFiles.length} area file${areaFiles.length === 1 ? "" : "s"}: ${areaFiles.map((f) => relative(ROOT, f)).join(", ")}` : ""}`,
  );
  const shown = (paths: string[]) => paths.map((p) => relative(ROOT, p) || ".").join(", ");
  if (IGNORE.length || SCAN.length)
    out.push(
      [IGNORE.length && `Ignored: ${shown(IGNORE)}.`, SCAN.length && `Scanned although skipped by default: ${shown(SCAN)}.`]
        .filter(Boolean)
        .join(" "),
    );
  for (const l of AREA ?? []) {
    const a = areas.find((x) => x.letter === l);
    out.push(
      a
        ? `Area: ${l} ${a.name}, in ${where(a.file)}${a.owner ? `, owner ${a.owner}` : ""}.`
        : `Area: ${l}, not in the registry.`,
    );
  }
  out.push(
    `Rules: ${active.length} active (${STATUSES.filter((s) => s !== "retired")
      .map((s) => `${byStatus[s]} ${s}`)
      .join(", ")}), ${byStatus.retired} retired.${AREA ? "" : ` Intents: ${intents.length}${intentSummary(intents)}.`}`,
  );
  out.push(
    `Settled enforcement: ${LEVELS.map((l) => `${counts[l]} ${l}`).join(", ")}.${passed ? "" : " (no --results given)"}`,
  );
  if (docCount > 0)
    out.push(`Other documents beside the ledger: ${docCount} checked for rule and intent IDs.`);
  if (counts.passing > 0)
    out.push(
      "Passing means the named tests passed, not that they check the rule. Review the tests of attended rules.",
    );
  const mentionCount = [...mentions]
    .filter(([bare]) => inArea(`br-${bare}`))
    .reduce((n, [, w]) => n + w.length, 0);
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

  // Observed and open entries close only when the owner answers; nothing else forces them to.
  const waiting = [
    ...(AREA ? [] : intents.filter((i) => i.fields.status === "observed")),
    ...active.filter((r) => r.fields.status === "observed" || r.fields.status === "open"),
  ];
  if (waiting.length) {
    // An observed entry has waited since it was read; an open rule since it last changed.
    const since = (e: Rule | Intent) =>
      e.fields.status === "observed" ? e.firstSource : e.lastSource;
    // Ledger dates are the writer's local dates, so today is local too.
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const age = (d: string) => {
      if (!d) return "no dated source";
      const days = Math.round((Date.parse(today) - Date.parse(d)) / 86_400_000);
      return `since ${d}, ${days} day${days === 1 ? "" : "s"}`;
    };
    const kinds = [
      [AREA ? 0 : intents.filter((i) => i.fields.status === "observed").length, "observed intent"],
      [active.filter((r) => r.fields.status === "observed").length, "observed rule"],
      [active.filter((r) => r.fields.status === "open").length, "open rule"],
    ] as const;
    const breakdown = kinds
      .filter(([n]) => n > 0)
      .map(([n, k]) => `${n} ${k}${n === 1 ? "" : "s"}`)
      .join(", ");
    out.push("", `Waiting on the owner (${breakdown}), oldest first:`);
    const sorted = [...waiting].sort((a, b) => since(a).localeCompare(since(b)));
    const shown = ALL_WAITING ? sorted : sorted.slice(0, WAITING_SHOWN);
    for (const e of shown) {
      const status = e.fields.status;
      const questions =
        "openQuestions" in e && e.openQuestions ? `, ${e.openQuestions} question${e.openQuestions === 1 ? "" : "s"}` : "";
      out.push(`  ${e.id.padEnd(6)}  ${status}${questions} (${age(since(e))})`);
    }
    if (shown.length < sorted.length)
      out.push(`  … and ${sorted.length - shown.length} more. Run with --waiting to list them all.`);
    out.push(
      "  Observed entries close in intent review, open ones in a grill session. Ask the owner which to start.",
    );
  }

  const gaps = active.filter((r) => r.fields.gap);
  if (gaps.length) {
    out.push("", "Known gaps:");
    for (const r of gaps) out.push(`  ${r.id}  ${r.fields.gap}`);
  }
  // With --area, messages about other areas' rules and about intents are counted, not shown.
  const shows = (m: string) => {
    const about = aboutArea(m);
    return !AREA || about === null || AREA.has(about);
  };
  const shownErrors = errors.filter(shows);
  const shownWarnings = warnings.filter(shows);
  if (shownErrors.length)
    out.push("", `Errors (${shownErrors.length}):`, ...shownErrors.map((e) => `  ${e}`));
  if (shownWarnings.length)
    out.push(
      "",
      `Warnings (${shownWarnings.length}):`,
      ...shownWarnings.map((w) => `  ${w}`),
    );
  const hidden = [
    [errors.length - shownErrors.length, "error"],
    [warnings.length - shownWarnings.length, "warning"],
  ].filter(([n]) => n) as [number, string][];
  if (hidden.length)
    out.push(
      "",
      `Elsewhere in the ledger: ${hidden.map(([n, k]) => `${n} ${k}${n === 1 ? "" : "s"}`).join(", ")}. Run without --area for the details.`,
    );
  if (WRITE && idx)
    out.push("", changed ? "Index rebuilt from the rule entries." : "Index already up to date.");

  console.log(out.join("\n"));

  let exit = shownErrors.length ? 1 : 0;
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
