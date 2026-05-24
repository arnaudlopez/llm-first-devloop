import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { buildReadyModeArtifacts } from "./goalbuddy-ready-mode.mjs";
import { runDevLoopLoop } from "./llm-first-devloop-loop.mjs";

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "devloop-loop-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function writeState(dir, stateYaml) {
  const statePath = join(dir, "state.yaml");
  writeFileSync(statePath, stateYaml);
  return statePath;
}

test("loop returns a safe Scout handoff with receipt template", () => {
  withTempDir((dir) => {
    const statePath = writeState(
      dir,
      buildReadyModeArtifacts({
        goalText: "Build saved searches.",
        oracleSignal: "Acceptance tests prove saved searches work.",
        date: "2026-05-24",
      }).stateYaml,
    );

    const result = runDevLoopLoop({ statePath, allowOutsideRepo: true });

    assert.equal(result.ok, true, result.errors?.join("\n"));
    assert.equal(result.loopMode, "guided");
    assert.equal(result.status, "loop_ready");
    assert.equal(result.activeTask.id, "T001");
    assert.match(result.safeAction, /Scout/i);
    assert.match(result.receiptTemplate, /design_concept/);
    assert.match(result.boardUrl, /goalbuddy\.localhost/);
    assert.ok(result.stopRules.length > 0);
  });
});

test("loop returns a red-test Worker receipt template", () => {
  withTempDir((dir) => {
    const state = buildReadyModeArtifacts({
      goalText: "Build saved searches.",
      oracleSignal: "Acceptance tests prove saved searches work.",
      date: "2026-05-24",
    }).stateYaml
      .replace("active_task: T001", "active_task: T003")
      .replace(/(\s+- id: T001[\s\S]*?status:) active/, "$1 done")
      .replace(/(\s+- id: T002[\s\S]*?status:) queued/, "$1 done")
      .replace(/(\s+- id: T003[\s\S]*?status:) queued/, "$1 active")
      .replace(
        /\n    receipt: null\n\n  - id: T002/,
        `\n    receipt:
      result: done
      summary: "Mapped the existing repo before Worker work."
      impact_assessment:
        db_schema_migrations: none
        data_backfill: none
        env_secrets: none
        auth_permissions: none
        api_contract: none
        ui_routes: none
        background_jobs: none
        external_services: none
        deploy_rollback: none
        observability: none
        docs: none
  - id: T002`,
      )
      .replace("allowed_files: []", "allowed_files:\n      - tests/saved-search.test.mjs")
      .replace("verify: []", "verify:\n      - npm test -- saved-search");
    const statePath = writeState(dir, state);

    const result = runDevLoopLoop({ statePath, allowOutsideRepo: true });

    assert.equal(result.ok, true, result.errors?.join("\n"));
    assert.equal(result.activeTask.id, "T003");
    assert.match(result.safeAction, /failing tests|red/i);
    assert.match(result.receiptTemplate, /red_evidence/);
  });
});

test("loop blocks invalid boards without inventing continuation", () => {
  withTempDir((dir) => {
    const statePath = writeState(dir, "goal:\n  status: active\n");
    const result = runDevLoopLoop({ statePath, allowOutsideRepo: true });

    assert.equal(result.ok, false);
    assert.equal(result.status, "loop_blocked");
    assert.match(result.errors.join("\n"), /version: 2|missing goal oracle/);
    assert.equal(result.receiptTemplate, "");
  });
});

test("loop can create a board from mature notes", () => {
  withTempDir((dir) => {
    const notesPath = join(dir, "notes.md");
    const outDir = join(dir, "goal");
    writeFileSync(
      notesPath,
      `# Loop Created Board

## Intent
Create a board and return a loop handoff.

## Non-Goals
- Do not implement product code.

## Proposed Oracle
Loop returns a safe Scout handoff.

## Acceptance
- Board exists.
- Loop handoff exists.`,
    );

    const result = runDevLoopLoop({
      fromPath: notesPath,
      outDir,
      oracle: "Loop returns a safe Scout handoff.",
    });

    assert.equal(result.ok, true, result.errors?.join("\n"));
    assert.equal(existsSync(join(outDir, "state.yaml")), true);
    assert.equal(result.activeTask.id, "T001");
    assert.match(result.boardUrl, /loop-created-board/);
  });
});

test("loop CLI text includes safe action and receipt template", () => {
  withTempDir((dir) => {
    const statePath = writeState(
      dir,
      buildReadyModeArtifacts({
        goalText: "Build saved searches.",
        oracleSignal: "Acceptance tests prove saved searches work.",
        date: "2026-05-24",
      }).stateYaml,
    );
    const result = spawnSync(
      process.execPath,
      ["scripts/llm-first-devloop-loop.mjs", "--state", statePath, "--allow-outside-repo"],
      { encoding: "utf8" },
    );

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /LOOP_READY/);
    assert.match(result.stdout, /Safe action:/);
    assert.match(result.stdout, /Receipt template:/);
  });
});

test("dispatcher exposes loop", () => {
  withTempDir((dir) => {
    const statePath = writeState(
      dir,
      buildReadyModeArtifacts({
        goalText: "Build saved searches.",
        oracleSignal: "Acceptance tests prove saved searches work.",
        date: "2026-05-24",
      }).stateYaml,
    );
    const result = spawnSync(
      process.execPath,
      ["scripts/llm-first-devloop.mjs", "loop", "--state", statePath, "--allow-outside-repo", "--json"],
      { encoding: "utf8" },
    );

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.equal(JSON.parse(result.stdout).loopMode, "guided");
  });
});
