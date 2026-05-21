import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { analyzeNextStep } from "./goalbuddy-next.mjs";
import { buildReadyModeArtifacts } from "./goalbuddy-ready-mode.mjs";

function withState(text, fn) {
  const dir = mkdtempSync(join(tmpdir(), "goalbuddy-next-"));
  try {
    const path = join(dir, "state.yaml");
    writeFileSync(path, text);
    return fn(path);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("analyzeNextStep proposes Scout for a valid T001 board", () => {
  const state = buildReadyModeArtifacts({
    goalText: "Build saved searches.",
    oracleSignal: "Acceptance tests prove saved searches work.",
    date: "2026-05-21",
  }).stateYaml;

  withState(state, (statePath) => {
    const result = analyzeNextStep({ statePath });
    assert.equal(result.ok, true, result.errors?.join("\n"));
    assert.equal(result.activeTask.id, "T001");
    assert.match(result.prompt, /Active task: T001/);
    assert.match(result.prompt, /Keep the original LLM-first intent and oracle visible/);
  });
});

test("analyzeNextStep blocks invalid boards", () => {
  withState("goal:\n  status: active\n", (statePath) => {
    const result = analyzeNextStep({ statePath });
    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /version: 2|missing goal oracle/);
  });
});

test("analyzeNextStep blocks active Workers without test shape", () => {
  const state = buildReadyModeArtifacts({
    goalText: "Build saved searches.",
    oracleSignal: "Acceptance tests prove saved searches work.",
    date: "2026-05-21",
  }).stateYaml
    .replace("active_task: T001", "active_task: T004")
    .replace("status: active", "status: active")
    .replace(/(\s+- id: T004[\s\S]*?status:) queued/, "$1 active");

  withState(state, (statePath) => {
    const result = analyzeNextStep({ statePath });
    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /active Worker T004/);
  });
});

test("analyzeNextStep blocks final implementation state without T998", () => {
  const state = buildReadyModeArtifacts({
    goalText: "Build saved searches.",
    oracleSignal: "Acceptance tests prove saved searches work.",
    date: "2026-05-21",
  }).stateYaml
    .replace("status: active", "status: done")
    .replace(/\n  - id: T998\n[\s\S]*?(?=\n  - id: T999\n)/, "\n");

  withState(state, (statePath) => {
    const result = analyzeNextStep({ statePath });
    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /missing mandatory T998/);
  });
});

test("analyzeNextStep accepts read-only audit boards without TDD or shipping", () => {
  const state = buildReadyModeArtifacts({
    goalText: "Audit publication without changing files.",
    mode: "audit_read_only",
    date: "2026-05-21",
  }).stateYaml;

  withState(state, (statePath) => {
    const result = analyzeNextStep({ statePath });
    assert.equal(result.ok, true, result.errors?.join("\n"));
    assert.equal(result.activeTask.id, "T001");
    assert.doesNotMatch(result.prompt, /red tests/);
  });
});
