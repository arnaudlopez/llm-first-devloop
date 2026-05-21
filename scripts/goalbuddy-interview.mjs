#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { compileBrief } from "./goalbuddy-brief.mjs";

export function analyzeInterview(options = {}) {
  const sourceText = requiredString(options.sourceText, "sourceText");
  const title = normalizeString(options.title) || extractTitle(sourceText) || "LLM First Interview";
  const mode = normalizeString(options.mode) || extractSection(sourceText, "Suggested Mode") || "implementation";
  const oracle = normalizeString(options.oracle) || extractSection(sourceText, "Proposed Oracle") || extractSection(sourceText, "Oracle");
  const checks = [
    {
      key: "intent",
      ok: hasUsefulText(extractSection(sourceText, "Intent")) || hasUsefulText(firstUsefulParagraph(sourceText)),
      question: "What exact owner-visible outcome should be true at the end?",
    },
    {
      key: "non_goals",
      ok: hasAnyText(extractSection(sourceText, "Non-Goals")) || hasAnyText(extractSection(sourceText, "Non Goals")),
      question: "What should explicitly stay out of scope?",
    },
    {
      key: "oracle",
      ok: hasUsefulText(oracle),
      question: "What observable proof will show the outcome is real?",
    },
    {
      key: "acceptance_evidence",
      ok:
        hasUsefulText(extractSection(sourceText, "Acceptance Hints")) ||
        hasUsefulText(extractSection(sourceText, "Acceptance")) ||
        hasUsefulText(extractSection(sourceText, "Acceptance Criteria")),
      question: "Which user paths, edge cases, or checks should become first tests/evidence?",
    },
  ];
  const missing = checks.filter((check) => !check.ok);

  if (missing.length > 0) {
    return {
      status: "needs_clarification",
      title,
      mode,
      oracle: oracle || null,
      missing: missing.map((item) => item.key),
      questions: missing.map((item) => item.question),
      content: renderClarification({ title, mode, oracle, missing: missing.map((item) => item.key), sourceText }),
    };
  }

  const content = compileBrief({
    sourceText,
    title,
    oracle,
    mode,
    sourceLabel: normalizeString(options.sourceLabel) || "LLM-first interview input",
    outPath: options.outPath,
  });

  return {
    status: "ready",
    title,
    mode,
    oracle,
    missing: [],
    questions: [],
    content,
  };
}

export function writeInterview(options = {}) {
  const outPath = resolve(requiredString(options.outPath, "outPath"));
  const force = Boolean(options.force);
  const analysis = analyzeInterview(options);
  const targetPath =
    analysis.status === "ready"
      ? outPath
      : resolve(normalizeString(options.clarificationOutPath) || join(dirname(outPath), "needs-clarification.md"));

  if (existsSync(targetPath) && !force) {
    throw new Error(`output file already exists: ${targetPath}. Use --force to overwrite it.`);
  }

  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, analysis.content);
  return { ...analysis, outPath: targetPath };
}

function renderClarification({ title, mode, oracle, missing, sourceText }) {
  const questions = missing.map((item) => `- ${questionFor(item)}`).join("\n");
  return `# ${title} Needs Clarification

This LLM-first input is not ready for Ready Mode yet.

## Missing Inputs

${missing.map((item) => `- ${item}`).join("\n")}

## Questions To Resolve

${questions}

## Current Mode Hint

${mode}

## Current Oracle Hint

${oracle || "TODO: define observable proof before Ready Mode."}

## Next Step

Answer the questions above in the LLM conversation, then rerun:

\`\`\`bash
llm-first-devloop interview --from notes.md --out brief.md
\`\`\`

## Source Notes

${sourceText
  .trim()
  .split(/\r?\n/)
  .map((line) => `> ${line}`)
  .join("\n")}
`;
}

function questionFor(key) {
  const questions = {
    intent: "What exact owner-visible outcome should be true at the end?",
    non_goals: "What should explicitly stay out of scope?",
    oracle: "What observable proof will show the outcome is real?",
    acceptance_evidence: "Which user paths, edge cases, or checks should become first tests/evidence?",
  };
  return questions[key] || `Clarify ${key}.`;
}

function extractTitle(text) {
  return normalizeString(text.match(/^#\s+(.+?)\s*$/m)?.[1]);
}

function extractSection(text, heading) {
  const re = new RegExp(`^#{1,6}\\s+${escapeRegExp(heading)}\\s*\\n([\\s\\S]*?)(?=\\n#{1,6}\\s+|\\s*$)`, "im");
  return normalizeString(text.match(re)?.[1]);
}

function firstUsefulParagraph(text) {
  return normalizeString(
    text
      .replace(/^#\s+.+$/m, "")
      .split(/\n\s*\n/)
      .map((part) => part.trim())
      .find((part) => part && !part.startsWith("#") && !part.startsWith("```")),
  );
}

function hasUsefulText(value) {
  const normalized = normalizeString(value).replace(/^TODO:\s*/i, "");
  return normalized.length >= 12;
}

function hasAnyText(value) {
  const normalized = normalizeString(value).replace(/^TODO:\s*/i, "");
  return normalized.length > 0;
}

function requiredString(value, name) {
  const normalized = normalizeString(value);
  if (!normalized) throw new Error(`${name} is required`);
  return normalized;
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const HELP_TEXT = `Usage:
  goalbuddy-interview --from notes.md --out brief.md [options]
  llm-first-devloop interview --from notes.md --out brief.md

Check whether LLM-first notes are mature enough for Ready Mode.
If required intent/proof inputs are missing, write needs-clarification.md instead of a brief.

Options:
  --from <file>                Source notes, PRD, or transcript.
  --out <file>                 Brief file to write when ready.
  --clarification-out <file>   Clarification file to write when not ready.
  --title <text>               Override title.
  --oracle <text>              Observable proof.
  --mode <mode>                Ready Mode policy hint. Default: implementation.
  --force                      Overwrite output.
  --dry-run                    Print result instead of writing.
  --json                       Print machine-readable output.
  -h, --help                   Show this help.
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
    else if (arg === "--clarification-out") args.clarificationOutPath = argv[++index];
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
  const payload = { ...args, sourceText, sourceLabel: sourcePath };
  const result = args.dryRun ? analyzeInterview(payload) : writeInterview(payload);

  if (args.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  else if (args.dryRun) process.stdout.write(result.content);
  else process.stdout.write(`${result.status === "ready" ? "Brief" : "Clarification"} written to ${result.outPath}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
