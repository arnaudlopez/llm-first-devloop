import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { advanceBoard } from "./goalbuddy-advance.mjs";
import { buildReadyModeArtifacts } from "./goalbuddy-ready-mode.mjs";

function withState(text, fn) {
  const dir = mkdtempSync(join(tmpdir(), "goalbuddy-advance-"));
  try {
    const statePath = join(dir, "state.yaml");
    writeFileSync(statePath, text);
    return fn(statePath);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("advanceBoard records a receipt and activates the next queued task", () => {
  const state = buildReadyModeArtifacts({
    goalText: "Build priority filtering.",
    oracleSignal: "Acceptance tests prove priority filtering works.",
    date: "2026-05-21",
  }).stateYaml;

  withState(state, (statePath) => {
    const result = advanceBoard({
      statePath,
      receipt: {
        result: "done",
        summary: "Scout mapped the store and tests.",
        evidence: ["src/tasks.js", "test/tasks.test.js"],
      },
    });

    assert.equal(result.ok, true, result.errors?.join("\n"));
    assert.equal(result.activeTask.id, "T001");
    assert.equal(result.activeTask.status, "done");
    assert.equal(result.nextTask.id, "T002");

    const updated = readFileSync(statePath, "utf8");
    assert.match(updated, /active_task: T002/);
    assert.match(updated, /id: T001[\s\S]*status: done/);
    assert.match(updated, /summary: "Scout mapped the store and tests\."/);
    assert.match(updated, /id: T002[\s\S]*status: active/);
  });
});

test("advanceBoard can block the active task and avoid activating a next task", () => {
  const state = buildReadyModeArtifacts({
    goalText: "Build priority filtering.",
    oracleSignal: "Acceptance tests prove priority filtering works.",
    date: "2026-05-21",
  }).stateYaml;

  withState(state, (statePath) => {
    const result = advanceBoard({
      statePath,
      nextTaskId: null,
      receipt: {
        result: "blocked",
        summary: "Need owner decision.",
      },
    });

    assert.equal(result.ok, true, result.errors?.join("\n"));
    assert.equal(result.activeTask.status, "blocked");
    assert.equal(result.nextTask, null);
    const updated = readFileSync(statePath, "utf8");
    assert.match(updated, /active_task: null/);
    assert.match(updated, /id: T001[\s\S]*status: blocked/);
  });
});

test("advanceBoard refuses to advance a non-active task", () => {
  const state = buildReadyModeArtifacts({
    goalText: "Build priority filtering.",
    oracleSignal: "Acceptance tests prove priority filtering works.",
    date: "2026-05-21",
  }).stateYaml;

  withState(state, (statePath) => {
    const result = advanceBoard({
      statePath,
      taskId: "T002",
      receipt: { result: "done", summary: "Wrong task." },
    });

    assert.equal(result.ok, false);
    assert.equal(result.reason, "task_not_active");
    assert.match(result.errors.join("\n"), /T002 is queued/);
  });
});

test("advanceBoard validates the requested next task", () => {
  const state = buildReadyModeArtifacts({
    goalText: "Build priority filtering.",
    oracleSignal: "Acceptance tests prove priority filtering works.",
    date: "2026-05-21",
  }).stateYaml;

  withState(state, (statePath) => {
    const result = advanceBoard({
      statePath,
      nextTaskId: "T999",
      receipt: { result: "done", summary: "Scout done." },
    });

    assert.equal(result.ok, true, result.errors?.join("\n"));
    assert.equal(result.nextTask.id, "T999");
  });
});

test("advanceBoard marks the goal complete when final audit finishes", () => {
  const state = `version: 2
goal:
  status: active

goal_policy:
  mode: docs
  requires_shipping: false

rules:
  require_quality_checker: true

active_task: T999
tasks:
  - id: T999
    type: judge
    assignee: Judge
    status: active
    objective: "Audit whether the outcome is complete."
    receipt: null
`;

  withState(state, (statePath) => {
    const result = advanceBoard({
      statePath,
      nextTaskId: null,
      receipt: {
        result: "done",
        complete: "complete",
        full_outcome_complete: true,
        summary: "Final audit passed.",
      },
    });

    assert.equal(result.ok, true, result.errors?.join("\n"));
    const updated = readFileSync(statePath, "utf8");
    assert.match(updated, /goal:\n  status: complete/);
    assert.match(updated, /active_task: null/);
    assert.match(updated, /id: T999[\s\S]*status: done/);
  });
});

test("advanceBoard applies structured Judge updates to queued future tasks", () => {
  const state = `version: 2
goal:
  status: active

goal_policy:
  mode: docs
  requires_shipping: false

rules:
  require_quality_checker: true

active_task: T002
tasks:
  - id: T002
    type: judge
    assignee: Judge
    status: active
    objective: "Approve the first Worker package."
    receipt: null
  - id: T003
    type: worker
    assignee: Worker
    status: queued
    objective: "Execute the approved package."
    allowed_files: []
    verify: []
    stop_if:
      - "Need files outside allowed_files."
    receipt: null
  - id: T999
    type: judge
    assignee: Judge
    status: queued
    objective: "Audit whether the outcome is complete."
    receipt: null
`;

  withState(state, (statePath) => {
    const result = advanceBoard({
      statePath,
      receipt: {
        result: "done",
        decision: "approved",
        task_updates: {
          T003: {
            allowed_files: ["docs/example.md"],
            verify: ["npm test"],
            stop_if: ["Need files outside allowed_files.", "Verification fails twice."],
            impact_assessment_ref: "not_required_for_docs_mode",
          },
        },
      },
    });

    assert.equal(result.ok, true, result.errors?.join("\n"));
    assert.deepEqual(result.taskUpdates, ["T003"]);
    const updated = readFileSync(statePath, "utf8");
    assert.match(updated, /active_task: T003/);
    assert.match(updated, /id: T003[\s\S]*status: active/);
    assert.match(updated, /allowed_files:\n      - docs\/example\.md/);
    assert.match(updated, /verify:\n      - "npm test"/);
    assert.doesNotMatch(updated, /allowed_files: \[\]\n\s+-/);
  });
});

test("advanceBoard rejects unsafe task update fields", () => {
  const state = `version: 2
goal:
  status: active

goal_policy:
  mode: docs
  requires_shipping: false

rules:
  require_quality_checker: true

active_task: T002
tasks:
  - id: T002
    type: judge
    assignee: Judge
    status: active
    objective: "Approve the first Worker package."
    receipt: null
  - id: T003
    type: worker
    assignee: Worker
    status: queued
    objective: "Execute the approved package."
    allowed_files: []
    verify: []
    receipt: null
  - id: T999
    type: judge
    assignee: Judge
    status: queued
    objective: "Audit whether the outcome is complete."
    receipt: null
`;

  withState(state, (statePath) => {
    const result = advanceBoard({
      statePath,
      receipt: {
        result: "done",
        task_updates: {
          T003: {
            status: "done",
          },
        },
      },
    });

    assert.equal(result.ok, false);
    assert.equal(result.reason, "invalid_task_updates");
    assert.match(result.errors.join("\n"), /status is not an allowed task update field/);
  });
});
