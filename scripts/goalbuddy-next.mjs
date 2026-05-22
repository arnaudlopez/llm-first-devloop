#!/usr/bin/env node

import { existsSync, readFileSync, realpathSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { checkStateFile } from "./goalbuddy-quality-check.mjs";

export function analyzeNextStep(options = {}) {
  const statePath = resolve(required(options.statePath, "statePath"));
  if (!existsSync(statePath)) {
    return {
      ok: false,
      statePath,
      status: "blocked",
      reason: "state_file_not_found",
      errors: [`state file not found: ${statePath}`],
      prompt: "",
    };
  }

  const text = readFileSync(statePath, "utf8");
  const tasks = parseTasks(text);
  const activeTaskId = scalarTopLevel(text, "active_task");
  const activeTask =
    tasks.find((task) => task.id === activeTaskId) ||
    tasks.find((task) => task.status === "active") ||
    null;
  const goalStatus = scalarAtIndent(text, "goal", "status") || scalarTopLevel(text, "status") || "unknown";
  const finalMode = goalStatus === "done" || activeTask?.id === "T999";
  const check = checkStateFile(statePath, { final: finalMode });
  const oracle = scalarAtIndent(text, "goal", "goal_oracle") || scalarAtIndent(text, "oracle", "signal");
  const missingOracle = !oracle || /^null$/i.test(oracle);
  const errors = [...check.errors];

  if (missingOracle) errors.unshift("missing goal oracle");
  if (errors.length > 0) {
    return {
      ok: false,
      statePath,
      status: "blocked",
      reason: "quality_check_failed",
      check,
      activeTask,
      errors,
      prompt: "",
    };
  }

  if (!activeTask) {
    return {
      ok: true,
      statePath,
      status: "ready_for_final_review",
      reason: "no_active_task",
      check,
      activeTask: null,
      prompt: finalReviewPrompt(statePath),
    };
  }

  return {
    ok: true,
    statePath,
    status: "ready",
    reason: "active_task_ready",
    check,
    activeTask,
    prompt: promptForTask(statePath, activeTask),
  };
}

function promptForTask(statePath, task) {
  const role = roleLabel(task);
  const objective = task.objective || "Follow the active task in the board.";
  const constraints = listForKey(task.raw, "constraints");
  const expected = listForKey(task.raw, "expected_output");

  return `Follow ${statePath}.

Active task: ${task.id} (${role})
Objective: ${objective}

Instructions:
- Keep the original LLM-first intent and oracle visible.
- Work only on the active task.
- Do not skip required evidence, receipts, tests, or final audit gates.
- If a boundary is missing, stop and record the blocker instead of guessing.
${constraints.length ? `\nTask constraints:\n${constraints.map((item) => `- ${item}`).join("\n")}` : ""}
${expected.length ? `\nExpected receipt/output:\n${expected.map((item) => `- ${item}`).join("\n")}` : ""}
`;
}

function finalReviewPrompt(statePath) {
  return `Follow ${statePath}.

No active task was found. Run the final GoalBuddy quality check, inspect all receipts, and decide whether the oracle is actually satisfied. Do not mark complete without required shipping proof or explicit blocker.`;
}

function roleLabel(task) {
  if (task.type === "scout") return "Scout read-only mapping";
  if (task.type === "judge") return "Judge review/decision";
  if (task.type === "worker") {
    const kind = clean(task.raw.match(/\bworker_kind:\s*([^\s#]+)/)?.[1]);
    if (kind === "red_test") return "Worker red tests only";
    if (kind === "implementation") return "Worker implementation";
    if (kind === "verification") return "Worker verification";
    return "Worker";
  }
  if (task.type === "pm") return "PM shipping";
  return task.type || "task";
}

function parseTasks(text) {
  const lines = text.split(/\r?\n/);
  const starts = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (/^\s{2}- id:\s*/.test(lines[i])) starts.push(i);
  }
  return starts.map((start, index) => {
    const end = starts[index + 1] ?? lines.length;
    const raw = lines.slice(start, end).join("\n");
    return {
      id: clean(raw.match(/^\s{2}- id:\s*([^\s#]+)/m)?.[1]),
      type: clean(raw.match(/^\s{4}type:\s*([^\s#]+)/m)?.[1]),
      status: clean(raw.match(/^\s{4}status:\s*([^\s#]+)/m)?.[1]),
      objective: clean(raw.match(/^\s{4}objective:\s*(.*)$/m)?.[1]),
      raw,
    };
  });
}

function listForKey(raw, key) {
  const lines = raw.split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^\\s{4}${key}:\\s*$`).test(line));
  if (start === -1) return [];
  const values = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^ {4}\S/m.test(lines[i])) break;
    const item = lines[i].match(/^\s*-\s*(.*)$/);
    if (item) values.push(clean(item[1]));
  }
  return values.filter(Boolean);
}

function scalarTopLevel(text, key) {
  return clean(text.match(new RegExp(`^${key}:\\s*([^#]+)`, "m"))?.[1]);
}

function scalarAtIndent(text, parent, key) {
  const lines = text.split(/\r?\n/);
  const parentIndex = lines.findIndex((line) => line === `${parent}:` || line.match(new RegExp(`^\\s{2}${parent}:\\s*$`)));
  if (parentIndex === -1) return null;
  const parentIndent = lines[parentIndex].match(/^(\s*)/)?.[1].length ?? 0;
  for (let i = parentIndex + 1; i < lines.length; i += 1) {
    const indent = lines[i].match(/^(\s*)/)?.[1].length ?? 0;
    if (lines[i].trim() && indent <= parentIndent) return null;
    const match = lines[i].match(new RegExp(`^\\s{${parentIndent + 2}}${key}:\\s*([^#]+)`));
    if (match) return clean(match[1]);
  }
  return null;
}

function clean(value) {
  if (!value) return "";
  return String(value).trim().replace(/^["']|["']$/g, "").trim();
}

function required(value, name) {
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const HELP_TEXT = `Usage:
  goalbuddy-next docs/goals/<slug>/state.yaml [--json]
  llm-first-devloop next docs/goals/<slug>/state.yaml

Inspect a GoalBuddy board, run the quality check, and print the exact next prompt.
This command does not modify state.yaml.

Options:
  --json        Print machine-readable output.
  -h, --help    Show this help.
`;

function parseArgs(argv) {
  return {
    help: argv.includes("--help") || argv.includes("-h"),
    json: argv.includes("--json"),
    statePath: argv.find((arg) => !arg.startsWith("-")),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(HELP_TEXT);
    return;
  }
  if (!args.statePath) throw new Error("state path is required");

  const result = analyzeNextStep({ statePath: args.statePath });
  if (args.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else if (!result.ok) {
    process.stdout.write(`BLOCKED ${result.statePath}\n`);
    for (const error of result.errors) process.stdout.write(`ERROR ${error}\n`);
  } else {
    process.stdout.write(`${result.status.toUpperCase()} ${result.statePath}\n`);
    if (result.activeTask) {
      process.stdout.write(`Active task: ${result.activeTask.id} (${roleLabel(result.activeTask)})\n`);
    }
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
