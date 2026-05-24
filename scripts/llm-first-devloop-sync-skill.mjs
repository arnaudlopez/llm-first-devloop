#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const sourcePath = join(repoRoot, "skills", "llm-first-devloop", "SKILL.md");

export function syncCodexSkill(options = {}) {
  const codexHome = resolveString(options.codexHome || process.env.CODEX_HOME || join(homedir(), ".codex"));
  const targetPath = join(codexHome, "skills", "llm-first-devloop", "SKILL.md");
  const dryRun = Boolean(options.dryRun);

  if (!existsSync(sourcePath)) {
    return {
      ok: false,
      reason: "source_skill_missing",
      sourcePath,
      targetPath,
      dryRun,
      changed: false,
      upToDate: false,
      errors: [`source skill not found: ${sourcePath}`],
    };
  }

  const source = readFileSync(sourcePath, "utf8");
  const current = existsSync(targetPath) ? readFileSync(targetPath, "utf8") : null;
  const changed = current !== source;

  if (changed && !dryRun) {
    mkdirSync(dirname(targetPath), { recursive: true });
    writeFileSync(targetPath, source);
  }

  return {
    ok: true,
    sourcePath,
    targetPath,
    codexHome,
    dryRun,
    changed,
    upToDate: !changed,
    action: changed ? (dryRun ? "would_copy" : "copied") : "unchanged",
  };
}

function resolveString(value) {
  return resolve(String(value));
}

const HELP_TEXT = `Usage:
  llm-first-devloop sync-skill [--codex-home <path>] [--dry-run] [--json]
  llm-first-devloop-sync-skill [--codex-home <path>] [--dry-run] [--json]

Install or update the Codex llm-first-devloop skill from this repository.

Options:
  --codex-home <path>  Target Codex home. Defaults to CODEX_HOME or ~/.codex.
  --dry-run            Report what would change without writing.
  --json               Print machine-readable output.
  -h, --help           Show this help.
`;

function parseArgs(argv) {
  const args = { dryRun: false, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "-h" || arg === "--help") args.help = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--json") args.json = true;
    else if (arg === "--codex-home") args.codexHome = argv[++index];
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

  const result = syncCodexSkill(args);
  if (args.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else if (!result.ok) {
    process.stdout.write(`BLOCKED ${result.reason}\n`);
    for (const error of result.errors || []) process.stdout.write(`ERROR ${error}\n`);
  } else {
    process.stdout.write(`SYNC_SKILL ${result.action}\n`);
    process.stdout.write(`Source: ${result.sourcePath}\n`);
    process.stdout.write(`Target: ${result.targetPath}\n`);
  }
  process.exitCode = result.ok ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
