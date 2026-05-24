#!/usr/bin/env node

import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";

import { runDevLoopEntry } from "./goalbuddy-run.mjs";

export function runDevLoopLoop(options = {}) {
  const entry = runDevLoopEntry(options);
  if (!entry.ok) {
    return {
      ...entry,
      status: "loop_blocked",
      loopMode: "guided",
      safeAction: "",
      stopRules: [
        "Do not continue until the blocker is resolved.",
        "Do not invent missing oracle, board state, or owner decisions.",
      ],
      receiptTemplate: "",
    };
  }

  const activeTask = entry.activeTask;
  return {
    ...entry,
    status: "loop_ready",
    loopMode: "guided",
    safeAction: safeActionForTask(activeTask),
    stopRules: stopRulesForTask(activeTask),
    receiptTemplate: receiptTemplateForTask(activeTask),
  };
}

function safeActionForTask(task) {
  if (!task) return "Run final quality check, inspect receipts, and perform final audit against the oracle.";
  if (task.type === "scout") return "Perform read-only Scout mapping and produce a receipt with design concept, module map, test strategy, dirty worktree risks, and impact assessment.";
  if (task.type === "judge") return "Review evidence, approve or block the largest safe useful next slice, and update future task boundaries when needed.";
  if (task.type === "pm") return "Verify the working tree, commit only goal-scoped files, push, and record shipping proof.";
  if (task.type === "worker") {
    const raw = task.raw || "";
    if (/\bworker_kind:\s*red_test\b/.test(raw)) return "Write failing tests or equivalent red evidence only, then stop and record expected failure evidence.";
    if (/\bworker_kind:\s*verification\b/.test(raw)) return "Run the approved verification package, capture command results, and stop on unexplained failures.";
    return "Implement only inside approved boundaries to make prior red tests pass, then record green test evidence.";
  }
  return "Execute only the active task boundaries and produce a receipt before advancing.";
}

function stopRulesForTask(task) {
  const base = [
    "Stop if the board quality check fails.",
    "Stop if the active task boundaries are missing or ambiguous.",
    "Stop before credentials, secrets, external mutation, production data, or irreversible actions.",
    "Stop if files outside allowed_files are needed.",
  ];
  if (!task) {
    return [
      ...base,
      "Stop if final audit evidence does not satisfy the oracle.",
      "Stop if required shipping proof is missing.",
    ];
  }
  if (task.type === "worker") {
    return [
      ...base,
      "Stop if no meaningful failing test or equivalent proof can be written.",
      "Stop if verification fails twice without a bounded understood fix.",
    ];
  }
  if (task.type === "pm") {
    return [
      ...base,
      "Stop if unrelated dirty files cannot be separated safely.",
      "Stop if no git repository or GitHub remote exists; record explicit shipping blocker.",
    ];
  }
  return base;
}

function receiptTemplateForTask(task) {
  if (!task) {
    return JSON.stringify(
      {
        result: "done",
        decision: "complete | not_complete",
        full_outcome_complete: false,
        oracle_result: "satisfied | not_satisfied",
        evidence: [],
        missing_evidence: [],
        next_recommendation: "",
      },
      null,
      2,
    );
  }
  if (task.type === "scout") {
    return JSON.stringify(
      {
        result: "done",
        summary: "",
        design_concept: "",
        ubiquitous_language: {},
        module_map: {},
        interface_contract: {},
        test_strategy: {},
        feedback_policy: "",
        dirty_worktree_risk_map: "",
        impact_assessment: {
          db_schema_migrations: "none",
          data_backfill: "none",
          env_secrets: "none",
          auth_permissions: "none",
          api_contract: "none",
          ui_routes: "none",
          background_jobs: "none",
          external_services: "none",
          deploy_rollback: "none",
          observability: "",
          docs: "",
        },
      },
      null,
      2,
    );
  }
  if (task.type === "judge") {
    return JSON.stringify(
      {
        result: "done",
        decision: "approved | blocked | changes_required",
        summary: "",
        architecture_review: "",
        task_updates: {},
      },
      null,
      2,
    );
  }
  if (task.type === "pm") {
    return JSON.stringify(
      {
        result: "done",
        summary: "",
        commit_sha: "",
        remote_branch: "origin/main",
        push_result: "",
        committed_files: [],
        unrelated_dirty_files_left_untouched: [],
        verify: [],
      },
      null,
      2,
    );
  }
  if (task.type === "worker" && /\bworker_kind:\s*red_test\b/.test(task.raw || "")) {
    return JSON.stringify(
      {
        result: "done",
        summary: "",
        changed_files: [],
        red_evidence: {
          command: "",
          result: "failed as expected",
          failure: "",
        },
        verify: [],
      },
      null,
      2,
    );
  }
  if (task.type === "worker") {
    return JSON.stringify(
      {
        result: "done",
        summary: "",
        changed_files: [],
        green_test: {
          command: "",
          result: "pass",
        },
        verify: [],
      },
      null,
      2,
    );
  }
  return JSON.stringify({ result: "done", summary: "" }, null, 2);
}

const HELP_TEXT = `Usage:
  llm-first-devloop loop --state docs/goals/<slug>/state.yaml [--json]
  llm-first-devloop loop --from notes.md --out docs/goals/<slug> --oracle "Observable proof" [--force]

Default guided DevLoop mode. It reuses run, then prints the next safe action,
stop rules, and a receipt template. V0.3 does not execute agent reasoning.

Options:
  --state <file>       Existing GoalBuddy state.yaml to continue.
  --from <file>        Notes, PRD, or transcript to turn into a board.
  --out <dir>          Goal output directory when using --from.
  --oracle <text>      Observable proof for Ready Mode.
  --mode <mode>        Ready Mode policy hint. Default: implementation.
  --title <text>       Override generated title.
  --force              Overwrite generated files.
  --allow-outside-repo Allow --state outside the current git repository.
  --json               Print machine-readable output.
  -h, --help           Show this help.
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

  const result = runDevLoopLoop(args);
  if (args.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else if (!result.ok) {
    process.stdout.write(`LOOP_BLOCKED ${result.statePath || ""}\n`);
    for (const error of result.errors || []) process.stdout.write(`ERROR ${error}\n`);
  } else {
    process.stdout.write(`LOOP_READY ${result.statePath}\n`);
    if (result.repoRoot) process.stdout.write(`Repo: ${result.repoRoot}\n`);
    if (result.boardUrl) process.stdout.write(`Board: ${result.boardUrl}\n`);
    if (result.boardCommand) process.stdout.write(`Board command: ${result.boardCommand}\n`);
    if (result.activeTask) process.stdout.write(`Active task: ${result.activeTask.id}\n`);
    process.stdout.write(`Safe action: ${result.safeAction}\n`);
    process.stdout.write("Stop rules:\n");
    for (const rule of result.stopRules) process.stdout.write(`- ${rule}\n`);
    process.stdout.write("\nReceipt template:\n");
    process.stdout.write(`${result.receiptTemplate}\n`);
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
