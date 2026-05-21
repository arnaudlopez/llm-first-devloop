import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { runDevLoopEntry } from "./goalbuddy-run.mjs";
import { buildReadyModeArtifacts } from "./goalbuddy-ready-mode.mjs";

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

    const result = runDevLoopEntry({ statePath });

    assert.equal(result.ok, true, result.errors?.join("\n"));
    assert.equal(result.status, "handoff_ready");
    assert.equal(result.mode, "existing_board");
    assert.equal(result.statePath, statePath);
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
    assert.equal(existsSync(join(outDir, "goal.md")), true);
    assert.match(result.prompt, /Active task: T001/);
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
    assert.match(readFileSync(join(outDir, "needs-clarification.md"), "utf8"), /What observable proof/);
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
