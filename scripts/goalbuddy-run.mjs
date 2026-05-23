#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { analyzeInterview } from "./goalbuddy-interview.mjs";
import { analyzeNextStep } from "./goalbuddy-next.mjs";
import { repairStateText } from "./goalbuddy-board-repair.mjs";
import { checkStateFile } from "./goalbuddy-quality-check.mjs";
import { slugify, writeReadyModeArtifacts } from "./goalbuddy-ready-mode.mjs";

const LOCAL_BOARD_BASE_URL = "http://goalbuddy.localhost:41737";

export function runDevLoopEntry(options = {}) {
  if (options.statePath && options.fromPath) {
    return blocked("ambiguous_input", ["Provide either --state or --from, not both."]);
  }
  if (options.statePath) return runExistingBoard(options);
  if (options.fromPath) return runFromNotes(options);
  return blocked("missing_input", ["Provide either --state or --from."]);
}

function runExistingBoard(options) {
  const statePath = resolveString(options.statePath);
  const repo = repoContext(statePath, options);
  if (!existsSync(statePath)) {
    return blocked("state_file_not_found", [`state file not found: ${statePath}`], {
      mode: "existing_board",
      statePath,
      ...repo,
    });
  }
  if (repo.outsideRepo && !options.allowOutsideRepo) {
    return blocked("state_outside_repo", [`state.yaml is outside current repo: ${statePath}`], {
      mode: "existing_board",
      statePath,
      ...repo,
    });
  }

  const original = readFileSync(statePath, "utf8");
  const repaired = repairStateText(original);
  if (repaired !== original) writeFileSync(statePath, repaired);

  const check = checkStateFile(statePath);
  if (!check.ok) {
    return blocked("quality_check_failed", check.errors, {
      mode: "existing_board",
      statePath,
      check,
      ...repo,
    });
  }

  return handoffFromState({
    mode: "existing_board",
    statePath,
    repaired: repaired !== original,
    check,
    ...repo,
  });
}

function runFromNotes(options) {
  const fromPath = resolveString(options.fromPath);
  const outDir = resolveString(options.outDir);
  const force = Boolean(options.force);
  const repo = repoContext(outDir || fromPath, options);

  if (!outDir) {
    return blocked("missing_output_dir", ["--out is required when using --from."], {
      mode: "notes_entry",
      fromPath,
      ...repo,
    });
  }
  if (!existsSync(fromPath)) {
    return blocked("source_file_not_found", [`source file not found: ${fromPath}`], {
      mode: "notes_entry",
      fromPath,
      outDir,
      ...repo,
    });
  }
  if (existsSync(join(outDir, "state.yaml")) && !force) {
    return blocked("output_exists", [`state.yaml already exists in ${outDir}. Use --force to overwrite generated files.`], {
      mode: "notes_entry",
      fromPath,
      outDir,
      ...repo,
    });
  }

  const sourceText = readFileSync(fromPath, "utf8");
  const interview = analyzeInterview({
    sourceText,
    sourceLabel: fromPath,
    oracle: options.oracle,
    mode: options.mode,
    title: options.title,
    outPath: join(outDir, "brief.md"),
  });

  mkdirSync(outDir, { recursive: true });
  if (interview.status === "needs_clarification") {
    const clarificationPath = join(outDir, "needs-clarification.md");
    if (existsSync(clarificationPath) && !force) {
      return blocked("clarification_exists", [`clarification file already exists: ${clarificationPath}. Use --force to overwrite it.`], {
        mode: "notes_entry",
        fromPath,
        outDir,
      });
    }
    writeFileSync(clarificationPath, interview.content);
    return {
      ok: false,
      mode: "notes_entry",
      status: "needs_clarification",
      reason: "interview_needs_clarification",
      fromPath,
      outDir,
      clarificationPath,
      missing: interview.missing,
      questions: interview.questions,
      errors: [`needs clarification: ${interview.missing.join(", ")}`],
      summary: `Needs clarification written to ${clarificationPath}`,
      prompt: "",
      ...repo,
    };
  }

  const briefPath = join(outDir, "brief.md");
  writeFileSync(briefPath, interview.content);
  const ready = writeReadyModeArtifacts({
    goalText: interview.content,
    interpretedOutcome: `Run the prepared LLM-first workflow for ${interview.title}.`,
    oracleSignal: options.oracle || interview.oracle,
    mode: options.mode || interview.mode || "implementation",
    title: options.title || interview.title,
    outDir,
    force: true,
  });

  const statePath = ready.files["state.yaml"];
  const check = checkStateFile(statePath);
  if (!check.ok) {
    return blocked("quality_check_failed", check.errors, {
      mode: "notes_entry",
      fromPath,
      outDir,
      briefPath,
      statePath,
      check,
      ...repo,
    });
  }

  return handoffFromState({
    mode: "notes_entry",
    fromPath,
    outDir,
    briefPath,
    statePath,
    repaired: false,
    check,
    ...repo,
  });
}

function handoffFromState(context) {
  const next = analyzeNextStep({ statePath: context.statePath });
  if (!next.ok) {
    return blocked("next_failed", next.errors, {
      ...context,
      next,
    });
  }

  return {
    ok: true,
    mode: context.mode,
    status: "handoff_ready",
    reason: "entry_workflow_complete",
    fromPath: context.fromPath,
    outDir: context.outDir,
    briefPath: context.briefPath,
    statePath: context.statePath,
    repoRoot: context.repoRoot,
    outsideRepo: context.outsideRepo,
    boardUrl: boardUrlForState(context.statePath),
    boardCommand: boardCommandForState(context.statePath),
    repaired: context.repaired,
    check: context.check,
    activeTask: next.activeTask,
    prompt: next.prompt,
    summary: `DevLoop handoff ready for ${context.statePath}`,
  };
}

function blocked(reason, errors, extra = {}) {
  return {
    ok: false,
    status: "blocked",
    reason,
    errors,
    prompt: "",
    ...extra,
  };
}

function resolveString(value) {
  return value ? resolve(String(value)) : "";
}

function repoContext(targetPath, options = {}) {
  const repoRoot = resolveString(options.repoRoot) || currentGitRoot(process.cwd());
  const realTarget = realPathBestEffort(targetPath);
  return {
    repoRoot,
    outsideRepo: Boolean(repoRoot && realTarget && !isPathInside(realTarget, repoRoot)),
  };
}

function currentGitRoot(cwd) {
  const result = spawnSync("git", ["rev-parse", "--show-toplevel"], {
    cwd,
    encoding: "utf8",
  });
  if (result.status !== 0) return "";
  return result.stdout.trim();
}

function realPathBestEffort(value) {
  const target = resolveString(value);
  if (!target) return "";
  try {
    return realpathSync(target);
  } catch {
    return target;
  }
}

function isPathInside(targetPath, rootPath) {
  const target = realPathBestEffort(targetPath);
  const root = realPathBestEffort(rootPath);
  return target === root || target.startsWith(`${root}/`);
}

function boardUrlForState(statePath) {
  return `${LOCAL_BOARD_BASE_URL}/${boardSlugForState(statePath)}/`;
}

function boardCommandForState(statePath) {
  return `npx goalbuddy board ${shellQuote(dirname(resolveString(statePath)))}`;
}

function boardSlugForState(statePath) {
  const stateText = existsSync(statePath) ? readFileSync(statePath, "utf8") : "";
  const match = stateText.match(/^\s*slug:\s*["']?([^"'\n]+)["']?/m);
  return slugify(match?.[1] || dirname(resolveString(statePath)).split("/").filter(Boolean).pop() || "goal");
}

function shellQuote(value) {
  const stringValue = String(value);
  if (/^[A-Za-z0-9_./:-]+$/.test(stringValue)) return stringValue;
  return `'${stringValue.replaceAll("'", "'\\''")}'`;
}

const HELP_TEXT = `Usage:
  goalbuddy-run --state docs/goals/<slug>/state.yaml [--json]
  goalbuddy-run --from notes.md --out docs/goals/<slug> --oracle "Observable proof" [--force]
  llm-first-devloop run --state docs/goals/<slug>/state.yaml

Automate DevLoop entry: interview/ready or existing board, then repair, check, next handoff.
This command does not execute native /goal.

Options:
  --state <file>      Existing GoalBuddy state.yaml to continue.
  --from <file>       Notes, PRD, or transcript to interview and turn into a board.
  --out <dir>         Goal output directory when using --from.
  --oracle <text>     Observable proof for Ready Mode.
  --mode <mode>       Ready Mode policy hint. Default: implementation.
  --title <text>      Override generated title.
  --force             Overwrite generated files.
  --allow-outside-repo
                      Allow --state outside the current git repository.
  --json              Print machine-readable output.
  -h, --help          Show this help.
`;

function parseArgs(argv) {
  const args = { force: false, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "-h" || arg === "--help") args.help = true;
    else if (arg === "--force") args.force = true;
    else if (arg === "--allow-outside-repo") args.allowOutsideRepo = true;
    else if (arg === "--json") args.json = true;
    else if (arg === "--state") args.statePath = argv[++index];
    else if (arg === "--from") args.fromPath = argv[++index];
    else if (arg === "--out") args.outDir = argv[++index];
    else if (arg === "--oracle") args.oracle = argv[++index];
    else if (arg === "--mode") args.mode = argv[++index];
    else if (arg === "--title") args.title = argv[++index];
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

  const result = runDevLoopEntry(args);
  if (args.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else if (!result.ok) {
    process.stdout.write(`${result.status.toUpperCase()} ${result.reason}\n`);
    for (const error of result.errors || []) process.stdout.write(`ERROR ${error}\n`);
    if (result.clarificationPath) process.stdout.write(`Clarification: ${result.clarificationPath}\n`);
  } else {
    process.stdout.write(`HANDOFF_READY ${result.statePath}\n`);
    if (result.repoRoot) process.stdout.write(`Repo: ${result.repoRoot}\n`);
    if (result.boardUrl) process.stdout.write(`Board: ${result.boardUrl}\n`);
    if (result.boardCommand) process.stdout.write(`Board command: ${result.boardCommand}\n`);
    if (result.briefPath) process.stdout.write(`Brief: ${result.briefPath}\n`);
    process.stdout.write(`Check: ${result.check?.ok ? "PASS" : "FAIL"}\n`);
    if (result.activeTask) process.stdout.write(`Active task: ${result.activeTask.id}\n`);
    process.stdout.write("\nPrompt:\n");
    process.stdout.write(result.prompt);
  }
  process.exitCode = result.ok ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
