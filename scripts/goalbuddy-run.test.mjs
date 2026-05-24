import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { runDevLoopEntry } from "./goalbuddy-run.mjs";
import { buildReadyModeArtifacts } from "./goalbuddy-ready-mode.mjs";

const here = dirname(fileURLToPath(import.meta.url));

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "goalbuddy-run-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("runDevLoopEntry continues from an existing state.yaml and returns a handoff", () => {
  withTempDir((dir) => {
    const statePath = join(dir, "state.yaml");
    const stateYaml = buildReadyModeArtifacts({
      goalText: "Implement SuperMemory T4.",
      oracleSignal: "A checker-clean SuperMemory T4 board reaches an active-task handoff.",
      date: "2026-05-21",
    }).stateYaml;
    writeFileSync(statePath, stateYaml);

    const result = runDevLoopEntry({ statePath, allowOutsideRepo: true });

    assert.equal(result.ok, true, result.errors?.join("\n"));
    assert.equal(result.status, "handoff_ready");
    assert.equal(result.mode, "existing_board");
    assert.equal(result.statePath, statePath);
    assert.match(result.repoRoot, /llm-first-devloop$/);
    assert.equal(result.boardUrl, "http://goalbuddy.localhost:41737/implement-supermemory-t4/");
    assert.match(result.boardCommand, /^npx goalbuddy board /);
    assert.match(result.boardCommand, /goalbuddy-run-/);
    assert.equal(result.outsideRepo, true);
    assert.match(result.prompt, /Active task: T001/);
    assert.match(result.summary, /handoff ready/i);
  });
});

test("runDevLoopEntry creates a board from mature notes and returns a handoff", () => {
  withTempDir((dir) => {
    const notesPath = join(dir, "notes.md");
    const outDir = join(dir, "goal");
    writeFileSync(
      notesPath,
      `# SuperMemory T4

## Intent
Implement the T4 tranche from the approved LLM-first spec.

## Non-Goals
- Do not mutate production data.

## Proposed Oracle
A checker-clean SuperMemory T4 board reaches an active-task handoff.

## Acceptance
- Board passes check.
- Handoff is returned.`,
    );

    const result = runDevLoopEntry({
      fromPath: notesPath,
      outDir,
      oracle: "A checker-clean SuperMemory T4 board reaches an active-task handoff.",
    });

    assert.equal(result.ok, true, result.errors?.join("\n"));
    assert.equal(result.mode, "notes_entry");
    assert.equal(result.status, "handoff_ready");
    assert.equal(result.statePath, join(outDir, "state.yaml"));
    assert.match(result.repoRoot, /llm-first-devloop$/);
    assert.equal(result.boardUrl, "http://goalbuddy.localhost:41737/supermemory-t4/");
    assert.match(result.boardCommand, /^npx goalbuddy board /);
    assert.match(result.boardCommand, /goal/);
    assert.equal(existsSync(join(outDir, "goal.md")), true);
    assert.match(result.prompt, /Active task: T001/);
  });
});

test("runDevLoopEntry normalizes board URLs from special-character slugs", () => {
  withTempDir((dir) => {
    const notesPath = join(dir, "notes.md");
    const outDir = join(dir, "Goal With Spaces");
    writeFileSync(
      notesPath,
      `# Board URL & Repo Guard!

## Intent
Expose the board URL.

## Non-Goals
- Do not start a server.

## Proposed Oracle
Board URL and repo root are returned.

## Acceptance
- Board URL exists.
- Repo root exists.`,
    );

    const result = runDevLoopEntry({
      fromPath: notesPath,
      outDir,
      oracle: "Board URL and repo root are returned.",
      title: "Board URL & Repo Guard!",
    });

    assert.equal(result.ok, true, result.errors?.join("\n"));
    assert.equal(result.boardUrl, "http://goalbuddy.localhost:41737/board-url-repo-guard/");
  });
});

test("runDevLoopEntry blocks existing state outside current repo unless allowed", () => {
  withTempDir((dir) => {
    const statePath = join(dir, "state.yaml");
    const stateYaml = buildReadyModeArtifacts({
      goalText: "Implement outside repo guard.",
      oracleSignal: "Outside repo guard blocks accidental cross-repo state.",
      date: "2026-05-21",
    }).stateYaml;
    writeFileSync(statePath, stateYaml);

    const blocked = runDevLoopEntry({ statePath });
    assert.equal(blocked.ok, false);
    assert.equal(blocked.reason, "state_outside_repo");
    assert.match(blocked.errors.join("\n"), /outside current repo/);

    const allowed = runDevLoopEntry({ statePath, allowOutsideRepo: true });
    assert.equal(allowed.ok, true, allowed.errors?.join("\n"));
    assert.equal(allowed.outsideRepo, true);
  });
});

test("goalbuddy-run text output includes repo and board lines", () => {
  withTempDir((dir) => {
    const notesPath = join(dir, "notes.md");
    const outDir = join(dir, "goal");
    writeFileSync(
      notesPath,
      `# CLI Board Output

## Intent
Print board and repo lines.

## Non-Goals
- Do not start a server.

## Proposed Oracle
CLI output includes Board and Repo lines.

## Acceptance
- Board line exists.
- Repo line exists.`,
    );

    const result = spawnSync(
      process.execPath,
      [
        join(here, "goalbuddy-run.mjs"),
        "--from",
        notesPath,
        "--out",
        outDir,
        "--oracle",
        "CLI output includes Board and Repo lines.",
      ],
      { encoding: "utf8" },
    );

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /Repo: .*llm-first-devloop/);
    assert.match(result.stdout, /Board: http:\/\/goalbuddy\.localhost:41737\/cli-board-output\//);
    assert.match(result.stdout, /Board command: npx goalbuddy board /);
  });
});

test("runDevLoopEntry stops on immature notes with clarification output", () => {
  withTempDir((dir) => {
    const notesPath = join(dir, "notes.md");
    const outDir = join(dir, "goal");
    writeFileSync(notesPath, "# Maybe T4\n\nMake it better somehow.");

    const result = runDevLoopEntry({ fromPath: notesPath, outDir });

    assert.equal(result.ok, false);
    assert.equal(result.status, "needs_clarification");
    assert.equal(result.mode, "notes_entry");
    assert.equal(existsSync(join(outDir, "needs-clarification.md")), true);
    const clarification = readFileSync(join(outDir, "needs-clarification.md"), "utf8");
    assert.match(clarification, /What observable proof/);
    assert.match(clarification, /## Likely Misfire/);
    assert.match(clarification, /## Proposed Amended Spec/);
    assert.match(clarification, /## Minimal Oracle Before Ready Mode/);
    assert.equal(existsSync(join(outDir, "state.yaml")), false);
  });
});

test("runDevLoopEntry blocks invalid or missing inputs clearly", () => {
  withTempDir((dir) => {
    const missing = runDevLoopEntry({ statePath: join(dir, "missing-state.yaml") });
    assert.equal(missing.ok, false);
    assert.equal(missing.status, "blocked");
    assert.match(missing.errors.join("\n"), /state file not found/);

    const noMode = runDevLoopEntry({});
    assert.equal(noMode.ok, false);
    assert.match(noMode.errors.join("\n"), /Provide either --state or --from/);
  });
});
