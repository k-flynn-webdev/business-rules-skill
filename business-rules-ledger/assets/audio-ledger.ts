#!/usr/bin/env tsx
/**
 * Generates a listening-friendly script from the business rules ledger: each intent, then the rules that serve it.
 * Version 2.8.0 — ships with the business-rules-ledger skill. Reinstall from the skill to update.
 *
 * Usage:
 *   npx tsx scripts/audio-ledger.ts              — print to stdout
 *   npx tsx scripts/audio-ledger.ts --out=rules.txt
 *   npx tsx scripts/audio-ledger.ts --speak       — pipe to macOS say
 *   npx tsx scripts/audio-ledger.ts [path] [flags]
 */

import { readFileSync, writeFileSync, mkdtempSync } from "fs";
import { join, dirname, resolve } from "path";
import { execSync } from "child_process";
import { tmpdir } from "os";

const args = process.argv.slice(2);
const LEDGER =
  args.find((a) => !a.startsWith("--")) ??
  join(process.cwd(), "specs/BUSINESS-RULES.md");
const SPEAK = args.includes("--speak");
const OUT = args.find((a) => a.startsWith("--out="))?.slice(6);

const AREA_NAMES: Record<string, string> = {
  B: "Business",
  D: "Data",
  U: "Interface",
  A: "API",
};

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

interface Rule {
  id: string;
  tags: string[];
  serves: string[];
  status: string;
  statement: string;
  failsIf: string;
}

interface Intent {
  id: string;
  statement: string;
  forWhom: string;
  brokenWhen: string;
  nonGoals: string[];
  tags: string[];
}

function clean(text: string): string {
  return text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .trim()
    .replace(/[.:;,]?$/, ".");
}

function field(line: string, names: string[]): [string, string] | null {
  const m = line.match(/^([a-z][a-z -]*):\s*(.*)$/);
  return m && names.includes(m[1]) ? [m[1], m[2].trim()] : null;
}

// Fields may share a line, separated by " | ": "kind: behaviour | serves: in-01 | status: settled".
function fields(line: string, names: string[]): [string, string][] | null {
  const parts = line.split(new RegExp(`\\s+\\|\\s+(?=(?:${names.join("|")}):)`));
  const out = parts.map((p) => field(p, names));
  return out.every(Boolean) ? (out as [string, string][]) : null;
}

function parse(content: string) {
  const rules: Rule[] = [];
  const intents: Intent[] = [];
  let rule: Rule | null = null;
  let intent: Intent | null = null;
  let inStatement = false;
  let statementDone = false;

  const close = () => {
    if (
      rule &&
      rule.statement &&
      !rule.id.startsWith("br-M") &&
      rule.status !== "retired"
    )
      rules.push(rule);
    if (intent && intent.statement) intents.push(intent);
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
        tags: [],
        serves: [],
        status: "",
        statement: "",
        failsIf: "",
      };
      continue;
    }
    if (intentHead) {
      close();
      intent = {
        id: intentHead[1],
        statement: "",
        forWhom: "",
        brokenWhen: "",
        nonGoals: [],
        tags: [],
      };
      continue;
    }
    if (/^#{1,3} /.test(raw)) {
      close();
      continue;
    }

    if (intent) {
      if (/^(`#[a-z][a-z0-9-]*`\s*)+$/.test(line)) {
        intent.tags = [...line.matchAll(/`#([a-z][a-z0-9-]*)`/g)].map((m) => m[1]);
        continue;
      }
      const fs = fields(line, INTENT_FIELDS);
      for (const f of fs ?? []) {
        if (f[0] === "for") intent.forWhom = f[1];
        else if (f[0] === "broken when") intent.brokenWhen = f[1];
        else if (f[0] === "non-goal") intent.nonGoals.push(f[1]);
      }
      if (
        !fs &&
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

    if (/^(`#[a-z][a-z0-9-]*`\s*)+$/.test(line)) {
      r.tags = [...line.matchAll(/`#([a-z][a-z0-9-]*)`/g)].map((m) => m[1]);
    }

    if (!statementDone) {
      const fs = !inStatement ? fields(line, RULE_FIELDS) : null;
      if (fs) {
        for (const f of fs) {
          if (f[0] === "serves") r.serves = f[1].split(/[,\s]+/).filter(Boolean);
          if (f[0] === "status") r.status = f[1];
        }
        continue;
      }
      if (!line) {
        if (inStatement) statementDone = true;
        continue;
      }
      if (/^(`#|\*\*|>|-|\|)/.test(line)) statementDone = true;
      else {
        inStatement = true;
        r.statement += (r.statement ? " " : "") + line;
        continue;
      }
    }

    const m = line.match(/^> Fails if (.+)/);
    if (m) r.failsIf = m[1];
  }
  close();
  return { rules, intents };
}

function ruleLines(r: Rule): string[] {
  const id = r.id.toUpperCase();
  const header = r.tags.length ? `${id} : ${r.tags.join(", ")}` : id;
  const lines = [header, clean(r.statement)];
  if (r.failsIf) lines.push(`Fails if ${clean(r.failsIf)}`);
  lines.push("");
  return lines;
}

function byArea(rules: Rule[], out: string[]) {
  const groups = new Map<string, Rule[]>();
  for (const r of rules) {
    const area = r.id[3];
    if (!groups.has(area)) groups.set(area, []);
    groups.get(area)!.push(r);
  }
  for (const [area, entries] of groups) {
    out.push(`${AREA_NAMES[area] ?? area} rules (${entries.length}).`, "");
    for (const r of entries) out.push(...ruleLines(r));
  }
}

function buildScript(rules: Rule[], intents: Intent[]): string {
  const out: string[] = [];

  if (intents.length === 0) {
    byArea(rules, out);
    return out.join("\n");
  }

  const known = new Set(intents.map((i) => i.id));
  for (const intent of intents) {
    const serving = rules.filter(
      (r) => r.serves.find((s) => known.has(s)) === intent.id,
    );
    out.push(`Intent ${intent.id.toUpperCase()}.`, clean(intent.statement));
    if (intent.tags.length) out.push(`Tags: ${intent.tags.join(", ")}.`);
    if (intent.forWhom) out.push(`For ${clean(intent.forWhom)}`);
    if (intent.brokenWhen) out.push(`Broken when ${clean(intent.brokenWhen)}`);
    for (const g of intent.nonGoals) out.push(`Not a goal: ${clean(g)}`);
    out.push(
      "",
      `Rules serving ${intent.id.toUpperCase()} (${serving.length}).`,
      "",
    );
    for (const r of serving) out.push(...ruleLines(r));
  }

  const orphans = rules.filter((r) => !r.serves.some((s) => known.has(s)));
  if (orphans.length) {
    out.push(`Rules with no intent (${orphans.length}).`, "");
    for (const r of orphans) out.push(...ruleLines(r));
  }

  return out.join("\n");
}

// The master's registry may give an area its own file: | Letter | Area | File | Owner |.
// Those files hold that area's rules, so the script reads them after the master.
function withAreaFiles(master: string): string {
  const lines = master.split("\n");
  const start = lines.findIndex((l) => /^## Registry\s*$/.test(l));
  if (start < 0) return master;
  const files: string[] = [];
  let header: string[] = [];
  for (let i = start + 1; i < lines.length && !/^## /.test(lines[i]); i++) {
    const row = lines[i].trim();
    if (!row.startsWith("|") || /^\|\s*-/.test(row)) continue;
    const cells = row.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
    if (!header.length) {
      header = cells.map((c) => c.toLowerCase());
      continue;
    }
    const letter = cells[header.indexOf("letter")] ?? "";
    const name = cells[header.indexOf("area")] ?? "";
    if (/^[A-Z]$/.test(letter) && name && !AREA_NAMES[letter]) AREA_NAMES[letter] = name;
    const file = (cells[header.indexOf("file")] ?? "")
      .replace(/^\[[^\]]*\]\(([^)]*)\)$/, "$1")
      .replace(/`/g, "")
      .trim();
    // M names the authoring file, which holds no ledger rules.
    const path =
      file && letter !== "M" && !/^[—–-]$/.test(file) ? resolve(dirname(LEDGER), file) : "";
    if (path && !files.includes(path)) files.push(path);
  }
  return [master, ...files.map((f) => readFileSync(f, "utf8"))].join("\n");
}

function main() {
  const { rules, intents } = parse(withAreaFiles(readFileSync(LEDGER, "utf8")));
  const script = buildScript(rules, intents);

  if (OUT) {
    writeFileSync(OUT, script, "utf8");
    console.log(`Written to ${OUT}`);
  }

  if (SPEAK) {
    const tmp = join(mkdtempSync(join(tmpdir(), "ledger-")), "script.txt");
    writeFileSync(tmp, script, "utf8");
    execSync(`say -f "${tmp}"`, { stdio: "inherit" });
    return;
  }

  if (!OUT) process.stdout.write(script + "\n");
}

main();
