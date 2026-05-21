#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const COMMANDS = {
  brief: "goalbuddy-brief.mjs",
  ready: "goalbuddy-ready-mode.mjs",
  check: "goalbuddy-quality-check.mjs",
  repair: "goalbuddy-board-repair.mjs",
  next: "goalbuddy-next.mjs",
  interview: "goalbuddy-interview.mjs",
  run: "goalbuddy-run.mjs",
};

const HELP_TEXT = `Usage:
  llm-first-devloop <command> [options]

Commands:
  brief     Compile conversation notes, a PRD, or a transcript into a Ready Mode brief.
  ready     Generate goal.md, state.yaml, and acceptance-contract.md.
  check     Validate a GoalBuddy state.yaml.
  repair    Normalize a GoalBuddy board without inventing product details.
  next      Inspect a board and print the exact next prompt without mutation.
  interview Check whether LLM-first notes are ready for Ready Mode.
  run       Automate interview/ready or existing-board entry, then check and print the handoff.

Examples:
  llm-first-devloop brief --from examples/conversation-notes.md --out briefs/saved-search.md
  llm-first-devloop ready --from briefs/saved-search.md --out docs/goals/saved-search
  llm-first-devloop check --final docs/goals/saved-search/state.yaml
  llm-first-devloop next docs/goals/saved-search/state.yaml
  llm-first-devloop run --from notes.md --out docs/goals/saved-search --oracle "Acceptance tests pass"

Run "llm-first-devloop <command> --help" for command-specific help.
`;

function main(argv) {
  const [command, ...rest] = argv;
  if (!command || command === "-h" || command === "--help") {
    process.stdout.write(HELP_TEXT);
    return 0;
  }

  const script = COMMANDS[command];
  if (!script) {
    process.stderr.write(`unknown command: ${command}\n\n${HELP_TEXT}`);
    return 2;
  }

  const result = spawnSync(process.execPath, [join(here, script), ...rest], {
    stdio: "inherit",
  });

  if (result.error) {
    process.stderr.write(`${result.error.message}\n`);
    return 1;
  }
  return result.status ?? 0;
}

process.exitCode = main(process.argv.slice(2));
