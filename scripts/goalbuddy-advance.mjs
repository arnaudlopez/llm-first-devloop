#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { checkStateText } from "./goalbuddy-quality-check.mjs";

export function advanceBoard(options = {}) {
  const statePath = resolveString(required(options.statePath, "statePath"));
  if (!existsSync(statePath)) {
    return blocked("state_file_not_found", [`state file not found: ${statePath}`], { statePath });
  }

  const original = readFileSync(statePath, "utf8");
  const tasks = parseTasks(original);
  const activeTaskId = clean(options.taskId) || scalarTopLevel(original, "active_task") || tasks.find((task) => task.status === "active")?.id;
  const activeTask = tasks.find((task) => task.id === activeTaskId);
  if (!activeTask) {
    return blocked("active_task_not_found", [`active task not found: ${activeTaskId || "(none)"}`], { statePath });
  }
  if (activeTask.status !== "active") {
    return blocked("task_not_active", [`task ${activeTask.id} is ${activeTask.status}, not active`], { statePath, activeTask });
  }

  const receipt = normalizeReceipt(options.receipt);
  if (!receipt) {
    return blocked("missing_receipt", ["receipt is required"], { statePath, activeTask });
  }

  const status = clean(options.status) || statusFromReceipt(receipt);
  if (!["done", "blocked"].includes(status)) {
    return blocked("unsupported_status", [`status must be done or blocked, got: ${status}`], { statePath, activeTask });
  }

  const nextTaskId = normalizeNextTaskId(options.nextTaskId);
  const nextTask =
    nextTaskId === null
      ? null
      : nextTaskId
        ? tasks.find((task) => task.id === nextTaskId)
        : tasks.find((task) => task.status === "queued" && task.id !== activeTask.id);
  if (nextTaskId && !nextTask) {
    return blocked("next_task_not_found", [`next task not found: ${nextTaskId}`], { statePath, activeTask });
  }
  if (nextTask && nextTask.status !== "queued") {
    return blocked("next_task_not_queued", [`next task ${nextTask.id} is ${nextTask.status}, not queued`], {
      statePath,
      activeTask,
      nextTask,
    });
  }

  let nextText = original;
  nextText = replaceTopLevelScalar(nextText, "active_task", nextTask ? nextTask.id : "null");
  nextText = replaceTaskBlock(nextText, activeTask.id, (block) => {
    let next = replaceTaskStatus(block, status);
    next = replaceReceipt(next, receipt);
    return next;
  });
  if (nextTask) {
    nextText = replaceTaskBlock(nextText, nextTask.id, (block) => replaceTaskStatus(block, "active"));
  } else if (status === "done" && activeTask.id === "T999") {
    nextText = replaceGoalStatus(nextText, "complete");
  }

  const check = checkStateText(nextText);
  const result = {
    ok: check.ok,
    status: check.ok ? "advanced" : "blocked",
    reason: check.ok ? "task_advanced" : "quality_check_failed_after_advance",
    statePath,
    activeTask: { id: activeTask.id, status },
    nextTask: nextTask ? { id: nextTask.id, status: "active" } : null,
    check,
    errors: check.errors,
    text: options.includeText ? nextText : undefined,
  };

  if (!check.ok || options.dryRun) return result;
  writeFileSync(statePath, nextText);
  return result;
}

function statusFromReceipt(receipt) {
  return clean(receipt.result) === "blocked" ? "blocked" : "done";
}

function normalizeReceipt(receipt) {
  if (!receipt) return null;
  if (typeof receipt === "string") {
    try {
      return JSON.parse(receipt);
    } catch {
      return { result: "done", summary: receipt };
    }
  }
  return receipt;
}

function normalizeNextTaskId(value) {
  if (value === null || value === false || value === "null" || value === "none" || value === "no-next") return null;
  return clean(value);
}

function parseTasks(text) {
  const lines = text.split(/\r?\n/);
  const starts = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (/^\s{2}- id:\s*/.test(lines[index])) starts.push(index);
  }
  return starts.map((start, index) => {
    const end = starts[index + 1] ?? lines.length;
    const raw = lines.slice(start, end).join("\n");
    return {
      id: clean(raw.match(/^\s{2}- id:\s*([^\s#]+)/m)?.[1]),
      status: clean(raw.match(/^\s{4}status:\s*([^\s#]+)/m)?.[1]),
      raw,
    };
  });
}

function replaceTaskBlock(text, taskId, mapper) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^\\s{2}- id:\\s*${escapeRegExp(taskId)}\\s*$`).test(line));
  if (start === -1) return text;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^\s{2}- id:\s*/.test(lines[index])) {
      end = index;
      break;
    }
  }
  const before = lines.slice(0, start).join("\n");
  const block = lines.slice(start, end).join("\n");
  const after = lines.slice(end).join("\n");
  return `${before ? `${before}\n` : ""}${mapper(block).trimEnd()}${after ? `\n${after}` : ""}`;
}

function replaceTaskStatus(block, status) {
  if (/^\s{4}status:\s*/m.test(block)) {
    return block.replace(/^\s{4}status:\s*[^\n]+/m, `    status: ${status}`);
  }
  return block.replace(/(^\s{4}assignee:.*\n)/m, `$1    status: ${status}\n`);
}

function replaceReceipt(block, receipt) {
  const rendered = renderYamlValue(receipt, 4, "receipt");
  const lines = block.split(/\r?\n/);
  const receiptIndex = lines.findIndex((line) => /^\s{4}receipt:/.test(line));
  if (receiptIndex !== -1) return `${lines.slice(0, receiptIndex).join("\n")}\n${rendered.trimEnd()}\n`;
  return `${block.trimEnd()}\n${rendered}`;
}

function renderYamlValue(value, indent, key = null) {
  const pad = " ".repeat(indent);
  if (key) {
    if (isScalar(value)) return `${pad}${key}: ${formatScalar(value)}\n`;
    return `${pad}${key}:\n${renderYamlValue(value, indent + 2)}`;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return `${pad}[]\n`;
    return value
      .map((item) => (isScalar(item) ? `${pad}- ${formatScalar(item)}\n` : `${pad}-\n${renderYamlValue(item, indent + 2)}`))
      .join("");
  }
  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([entryKey, entryValue]) => renderYamlValue(entryValue, indent, entryKey))
      .join("");
  }
  return `${pad}${formatScalar(value)}\n`;
}

function isScalar(value) {
  return value === null || ["string", "number", "boolean"].includes(typeof value);
}

function formatScalar(value) {
  if (value === null) return "null";
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  const text = String(value);
  if (/^[A-Za-z0-9_./:-]+$/.test(text)) return text;
  return JSON.stringify(text);
}

function scalarTopLevel(text, key) {
  return clean(text.match(new RegExp(`^${key}:\\s*([^#\\n]+)`, "m"))?.[1]);
}

function replaceTopLevelScalar(text, key, value) {
  if (new RegExp(`^${key}:\\s*`, "m").test(text)) {
    return text.replace(new RegExp(`^${key}:\\s*[^\\n]*`, "m"), `${key}: ${value}`);
  }
  return `${key}: ${value}\n${text}`;
}

function replaceGoalStatus(text, status) {
  const lines = text.split(/\r?\n/);
  const goalIndex = lines.findIndex((line) => line === "goal:");
  if (goalIndex === -1) return replaceTopLevelScalar(text, "status", status);

  for (let index = goalIndex + 1; index < lines.length; index += 1) {
    if (/^\S/.test(lines[index])) break;
    if (/^\s{2}status:\s*/.test(lines[index])) {
      lines[index] = `  status: ${status}`;
      return lines.join("\n");
    }
  }

  lines.splice(goalIndex + 1, 0, `  status: ${status}`);
  return lines.join("\n");
}

function blocked(reason, errors, extra = {}) {
  return { ok: false, status: "blocked", reason, errors, ...extra };
}

function required(value, name) {
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function resolveString(value) {
  return resolve(String(value));
}

function clean(value) {
  return value ? String(value).trim().replace(/^["']|["']$/g, "") : "";
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const HELP_TEXT = `Usage:
  goalbuddy-advance --state docs/goals/<slug>/state.yaml --receipt receipt.json [--next T002]
  llm-first-devloop advance --state docs/goals/<slug>/state.yaml --receipt-json '{"result":"done","summary":"..."}'

Apply a receipt to the active task, mark it done or blocked, activate the next queued task, and re-run the quality check.

Options:
  --state <file>          GoalBuddy state.yaml.
  --task <id>             Expected active task id. Defaults to active_task.
  --receipt <file>        JSON receipt file.
  --receipt-json <json>   Inline JSON receipt.
  --status <done|blocked> Override task status. Defaults from receipt.result.
  --next <id>             Task to activate. Defaults to first queued task.
  --no-next               Do not activate another task.
  --dry-run               Print result without writing.
  --json                  Print machine-readable output.
  -h, --help              Show this help.
`;

function parseArgs(argv) {
  const args = { dryRun: false, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "-h" || arg === "--help") args.help = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--json") args.json = true;
    else if (arg === "--no-next") args.nextTaskId = null;
    else if (arg === "--state") args.statePath = argv[++index];
    else if (arg === "--task") args.taskId = argv[++index];
    else if (arg === "--receipt") args.receiptPath = argv[++index];
    else if (arg === "--receipt-json") args.receiptJson = argv[++index];
    else if (arg === "--status") args.status = argv[++index];
    else if (arg === "--next") args.nextTaskId = argv[++index];
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
  if (!args.statePath) throw new Error("--state is required");
  const receipt = args.receiptPath ? readFileSync(resolve(args.receiptPath), "utf8") : args.receiptJson;
  const result = advanceBoard({
    statePath: args.statePath,
    taskId: args.taskId,
    receipt,
    status: args.status,
    nextTaskId: args.nextTaskId,
    dryRun: args.dryRun,
  });

  if (args.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else if (!result.ok) {
    process.stdout.write(`BLOCKED ${result.reason}\n`);
    for (const error of result.errors || []) process.stdout.write(`ERROR ${error}\n`);
  } else {
    process.stdout.write(`ADVANCED ${result.statePath}\n`);
    process.stdout.write(`Task: ${result.activeTask.id} -> ${result.activeTask.status}\n`);
    process.stdout.write(`Next: ${result.nextTask?.id || "none"}\n`);
    process.stdout.write(`Check: ${result.check.ok ? "PASS" : "FAIL"}\n`);
  }
  process.exitCode = result.ok ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
