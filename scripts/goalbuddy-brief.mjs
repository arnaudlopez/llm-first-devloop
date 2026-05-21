#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const SECTION_ALIASES = {
  intent: ["intent", "goal", "objectif", "outcome", "request", "problem", "besoin"],
  nonGoals: ["non-goals", "non goals", "non-objectifs", "out of scope", "hors scope"],
  acceptanceHints: ["acceptance", "acceptance hints", "acceptance criteria", "tests", "test cases", "preuves"],
  risks: ["risks", "risques", "blockers", "unknowns", "open questions", "edge cases"],
  constraints: ["constraints", "contraintes", "requirements", "must preserve", "do not do"],
};

const DEFAULT_ORACLE = "Acceptance tests or equivalent evidence prove the requested outcome matches this brief.";

export function compileBrief(options = {}) {
  const sourceText = normalizeRequiredString(options.sourceText, "sourceText");
  const title = normalizeString(options.title) || extractTitle(sourceText) || "Ready Mode Brief";
  const oracle = normalizeString(options.oracle) || extractOracle(sourceText) || DEFAULT_ORACLE;
  const mode = normalizeString(options.mode) || "implementation";
  const sourceLabel = normalizeString(options.sourceLabel) || "conversation notes / PRD";
  const extracted = extractSections(sourceText);
  const fallbackIntent = firstUsefulParagraph(sourceText);

  return `# ${title}

## Intent

${sectionOrTodo(extracted.intent, fallbackIntent || "State the owner outcome in one sentence.")}

## Non-Goals

${listOrTodo(extracted.nonGoals, "Name what this goal must not change.")}

## Proposed Oracle

${oracle}

## Suggested Mode

${mode}

## Acceptance Hints

${listOrTodo(extracted.acceptanceHints, "Describe the main path, edge cases, and evidence that should become tests.")}

## Risks And Open Questions

${listOrTodo(extracted.risks, "List ambiguity, missing credentials, operational risks, or decisions needed before implementation.")}

## Constraints

${listOrTodo(extracted.constraints, "Capture constraints, must-preserve behavior, boundaries, or forbidden changes.")}

## Ready Mode Command

\`\`\`bash
npm run ready -- --from ${shellPathPlaceholder(options.outPath || "brief.md")} --mode ${mode} --oracle "${escapeShell(oracle)}" --out docs/goals/${slugify(title)}
\`\`\`

## Source Notes

Compiled from: ${sourceLabel}

${quoteSource(sourceText)}
`;
}

export function writeBrief(options = {}) {
  const outPath = resolve(normalizeRequiredString(options.outPath, "outPath"));
  const force = Boolean(options.force);
  if (existsSync(outPath) && !force) {
    throw new Error(`output file already exists: ${outPath}. Use --force to overwrite it.`);
  }

  const brief = compileBrief({ ...options, outPath });
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, brief);
  return { outPath, brief };
}

function extractSections(text) {
  const sections = {};
  const headingRe = /^#{1,6}\s+(.+?)\s*$/gm;
  const headings = [];
  let match;
  while ((match = headingRe.exec(text))) {
    headings.push({ title: normalizeHeading(match[1]), start: match.index, bodyStart: headingRe.lastIndex });
  }

  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    const end = headings[index + 1]?.start ?? text.length;
    const body = text.slice(heading.bodyStart, end).trim();
    const key = sectionKeyForHeading(heading.title);
    if (key && body) sections[key] = mergeSection(sections[key], body);
  }
  return sections;
}

function sectionKeyForHeading(heading) {
  for (const [key, aliases] of Object.entries(SECTION_ALIASES)) {
    if (aliases.some((alias) => heading === alias || heading.includes(alias))) return key;
  }
  return null;
}

function extractTitle(text) {
  const title = text.match(/^#\s+(.+?)\s*$/m)?.[1];
  if (title) return title.trim();
  return "";
}

function extractOracle(text) {
  const oracleSection = text.match(/^#{1,6}\s+(oracle|observable oracle|completion proof|proof)\s*\n([\s\S]*?)(?=\n#{1,6}\s+|\s*$)/im)?.[2];
  return normalizeString(oracleSection)?.replace(/\s+/g, " ");
}

function firstUsefulParagraph(text) {
  const withoutTitle = text.replace(/^#\s+.+$/m, "").trim();
  const paragraph = withoutTitle
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .find((part) => part && !part.startsWith("#") && !part.startsWith("```"));
  if (!paragraph) return "";
  return paragraph.replace(/\s+/g, " ");
}

function sectionOrTodo(value, fallback) {
  const normalized = normalizeString(value);
  if (normalized) return normalized;
  return `TODO: ${fallback}`;
}

function listOrTodo(value, fallback) {
  const items = listItems(value);
  if (items.length > 0) return items.map((item) => `- ${item}`).join("\n");
  const normalized = normalizeString(value);
  if (normalized) return normalized;
  return `- TODO: ${fallback}`;
}

function listItems(value) {
  return normalizeString(value)
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-*]\s+/, "").replace(/^\d+[.)]\s+/, ""))
    .filter(Boolean);
}

function quoteSource(text) {
  return text
    .trim()
    .split(/\r?\n/)
    .map((line) => `> ${line}`)
    .join("\n");
}

function mergeSection(left, right) {
  return [left, right].filter(Boolean).join("\n\n");
}

function normalizeHeading(value) {
  return normalizeString(value).toLowerCase().replace(/[:#]+$/g, "").trim();
}

function slugify(value) {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72) || "ready-mode-goal"
  );
}

function shellPathPlaceholder(value) {
  const normalized = String(value).replace(process.cwd(), ".").replace(/\\/g, "/");
  return normalized.includes(" ") ? `"${normalized}"` : normalized;
}

function escapeShell(value) {
  return String(value).replace(/"/g, '\\"');
}

function normalizeRequiredString(value, name) {
  const normalized = normalizeString(value);
  if (!normalized) throw new Error(`${name} is required`);
  return normalized;
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

const HELP_TEXT = `Usage:
  goalbuddy-brief --from notes.md --out briefs/my-feature.md [options]
  npm run brief -- --from notes.md --out briefs/my-feature.md

Compile a mature LLM conversation, PRD, or transcript into a Ready Mode brief.

Options:
  --from <file>       Source notes, PRD, transcript, or conversation export.
  --out <file>        Brief file to write.
  --title <text>      Override the brief title.
  --oracle <text>     Proposed observable completion proof.
  --mode <mode>       Ready Mode policy hint. Default: implementation.
  --force             Overwrite an existing output file.
  --dry-run           Print the brief instead of writing it.
  --json              Print JSON output.
  -h, --help          Show this help.

Example:
  goalbuddy-brief --from examples/conversation-notes.md --out briefs/saved-search.md --oracle "Acceptance tests prove saved searches can be created, listed, and reused."
`;

function parseArgs(argv) {
  const args = { force: false, dryRun: false, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "-h" || arg === "--help") args.help = true;
    else if (arg === "--force") args.force = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--json") args.json = true;
    else if (arg === "--from") args.from = argv[++index];
    else if (arg === "--out") args.outPath = argv[++index];
    else if (arg === "--title") args.title = argv[++index];
    else if (arg === "--oracle") args.oracle = argv[++index];
    else if (arg === "--mode") args.mode = argv[++index];
    else throw new Error(`unknown argument: ${arg}`);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(HELP_TEXT);
    return;
  }
  if (!args.from) throw new Error("--from is required");
  if (!args.outPath && !args.dryRun) throw new Error("--out is required unless --dry-run is used");

  const sourcePath = resolve(args.from);
  const sourceText = readFileSync(sourcePath, "utf8");
  const payload = {
    sourceText,
    sourceLabel: sourcePath,
    outPath: args.outPath,
    title: args.title,
    oracle: args.oracle,
    mode: args.mode,
    force: args.force,
  };
  const result = args.dryRun ? { brief: compileBrief(payload), outPath: args.outPath || null } : writeBrief(payload);

  if (args.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  else if (args.dryRun) process.stdout.write(result.brief);
  else process.stdout.write(`Brief written to ${result.outPath}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
