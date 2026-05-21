import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { buildReadyModeArtifacts, slugify, writeReadyModeArtifacts } from "./goalbuddy-ready-mode.mjs";
import { checkStateText } from "./goalbuddy-quality-check.mjs";

test("slugify creates stable ascii slugs", () => {
  assert.equal(slugify("Créer l'écran d'accueil V2 !!!"), "creer-l-ecran-d-accueil-v2");
  assert.equal(slugify(""), "ready-mode-goal");
});

test("buildReadyModeArtifacts creates a checker-clean TDD board", () => {
  const artifacts = buildReadyModeArtifacts({
    goalText: "Build a saved-search feature after clarifying the spec.",
    title: "Saved Search Feature",
    slug: "saved-search-feature",
    date: "2026-05-21",
  });

  const check = checkStateText(artifacts.stateYaml);
  assert.equal(check.ok, true, check.errors.join("\n"));
  assert.match(artifacts.stateYaml, /goal_oracle:/);
  assert.match(artifacts.stateYaml, /worker_kind: red_test/);
  assert.match(artifacts.stateYaml, /worker_kind: implementation/);
  assert.match(artifacts.stateYaml, /T998 has a commit SHA and successful push result/);
  assert.match(artifacts.acceptanceContract, /LLM First Context/);
  assert.match(artifacts.acceptanceContract, /Acceptance Or Evidence Draft/);
});

test("buildReadyModeArtifacts accepts explicit oracle and frontend visual policy", () => {
  const artifacts = buildReadyModeArtifacts({
    goalText: "Build the onboarding screen from the validated spec.",
    oracleSignal: "Playwright proves the happy path and mobile layout match the approved screenshots.",
    mode: "frontend",
    date: "2026-05-21",
  });

  const check = checkStateText(artifacts.stateYaml);
  assert.equal(check.ok, true, check.errors.join("\n"));
  assert.match(artifacts.stateYaml, /mode: frontend/);
  assert.match(artifacts.stateYaml, /requires_visual_verification: true/);
  assert.match(artifacts.goalMd, /LLM first principle/);
});

test("buildReadyModeArtifacts preserves read-only audit intent without Worker tasks", () => {
  const artifacts = buildReadyModeArtifacts({
    goalText: "Audit the publication flow and report risks without changing files.",
    mode: "audit_read_only",
    date: "2026-05-21",
  });

  const check = checkStateText(artifacts.stateYaml);
  assert.equal(check.ok, true, check.errors.join("\n"));
  assert.match(artifacts.stateYaml, /mode: audit_read_only/);
  assert.doesNotMatch(artifacts.stateYaml, /type: worker/);
  assert.doesNotMatch(artifacts.stateYaml, /id: T998/);
});

test("writeReadyModeArtifacts writes the three expected files", () => {
  const dir = mkdtempSync(join(tmpdir(), "goalbuddy-ready-mode-"));
  try {
    const outDir = join(dir, "goal");
    const result = writeReadyModeArtifacts({
      goalText: "Create billing export with acceptance tests.",
      outDir,
      force: false,
      date: "2026-05-21",
    });

    assert.equal(result.outDir, outDir);
    assert.match(readFileSync(join(outDir, "goal.md"), "utf8"), /Ready Mode Instruction/);
    assert.match(readFileSync(join(outDir, "acceptance-contract.md"), "utf8"), /Observable Oracle/);
    assert.equal(checkStateText(readFileSync(join(outDir, "state.yaml"), "utf8")).ok, true);
    assert.throws(() => writeReadyModeArtifacts({ goalText: "Again", outDir }), /already exists/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
