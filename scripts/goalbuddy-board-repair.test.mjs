import assert from "node:assert/strict";
import { test } from "node:test";

import { repairStateText } from "./goalbuddy-board-repair.mjs";
import { checkStateText } from "./goalbuddy-quality-check.mjs";

test("repairs an implementation board missing policy, rules, shipping, and final audit detail", () => {
  const repaired = repairStateText(incompleteImplementationBoard());
  const result = checkStateText(repaired);

  assert.match(repaired, /^rules:\s*$/m);
  assert.match(repaired, /^goal_policy:\s*$/m);
  assert.match(repaired, /^\s{2}mode: implementation\s*$/m);
  assert.match(repaired, /workflow_safeguards:/);
  assert.match(repaired, /requires_design_concept: true/);
  assert.match(repaired, /requires_ubiquitous_language: true/);
  assert.match(repaired, /requires_feedback_policy: true/);
  assert.match(repaired, /requires_test_strategy: true/);
  assert.match(repaired, /requires_module_map: true/);
  assert.match(repaired, /requires_interface_contract: true/);
  assert.match(repaired, /requires_architecture_review: true/);
  assert.match(repaired, /requires_design_delta: true/);
  assert.match(repaired, /^\s{2}- id: T998\s*$/m);
  assert.match(repaired, /^\s{4}type: pm\s*$/m);
  assert.match(repaired, /^\s{4}assignee: PM\s*$/m);
  assert.match(repaired, /Unrelated dirty files left untouched/);
  assert.match(repaired, /Quality checker final output/);
  assert.match(repaired, /impact_assessment_ref:/);
  assert.equal(result.ok, true, result.errors.join("\n"));
});

test("repairs a test-only board as verification without adding shipping", () => {
  const repaired = repairStateText(incompleteVerificationBoard());
  const result = checkStateText(repaired);

  assert.match(repaired, /^\s{2}mode: verification\s*$/m);
  assert.match(repaired, /requires_design_concept: false/);
  assert.match(repaired, /requires_architecture_review: false/);
  assert.doesNotMatch(repaired, /^\s{2}- id: T998\s*$/m);
  assert.match(repaired, /For verification goals/);
  assert.equal(result.ok, true, result.errors.join("\n"));
});

test("normalizes an existing shipping Worker into a PM task", () => {
  const repaired = repairStateText(implementationBoardWithWorkerShipping());
  const result = checkStateText(repaired);

  assert.match(repaired, /^\s{2}- id:\s*T998\s*[\s\S]*?^\s{4}type:\s*pm\s*$/m);
  assert.match(repaired, /^\s{2}- id:\s*T998\s*[\s\S]*?^\s{4}assignee:\s*PM\s*$/m);
  assert.match(repaired, /Committed files/);
  assert.match(repaired, /Unrelated dirty files left untouched/);
  assert.equal(result.ok, true, result.errors.join("\n"));
});

function incompleteImplementationBoard() {
  return `version: 2

goal:
  title: "Executable Narrative Skeleton"
  slug: "executable-narrative-skeleton"
  status: active
  kind: specific
  original_request: "Passer le mode S'inspirer d'un post à un vrai squelette narratif exécutable."
  proof_type:
    - source_backed_answer
    - test

agents:
  scout: bundled_not_installed
  worker: bundled_not_installed
  judge: bundled_not_installed

active_task: T001

tasks:
  - id: T001
    type: scout
    assignee: Scout
    status: active
    objective: "Map the current implementation."
    expected_output:
      - "Current data flow."
    receipt: null
  - id: T003
    type: judge
    assignee: Judge
    status: queued
    objective: "Define the contract and first implementation slice."
    receipt: null
  - id: T004
    type: worker
    assignee: Worker
    status: queued
    objective: "Implement the first approved robust skeleton slice."
    allowed_files:
      - "src/app/api/generate/**"
      - "src/__tests__/**"
    verify:
      - "npm test -- narrative-frame"
    stop_if:
      - "The approved slice requires DB schema changes."
    receipt: null
  - id: T999
    type: judge
    assignee: Judge
    status: queued
`;
}

function incompleteVerificationBoard() {
  return `version: 2

goal:
  title: "Calendar And Publication Tests"
  slug: "calendar-publication-tests"
  status: active
  kind: specific
  intake:
    proof_type: test
  tranche: "Tester le calendrier et la publication sans modifier le code."

rules:
  require_quality_checker: false

active_task: T001

tasks:
  - id: T001
    type: scout
    assignee: Scout
    status: active
    objective: "Map calendar and publication code."
    expected_output:
      - "Safe verification commands to run"
    receipt: null
  - id: T003
    type: worker
    assignee: Worker
    status: queued
    objective: "Run targeted browser or E2E checks without editing files."
    verify:
      - "npm test -- calendar"
    stop_if:
      - "The check would publish externally."
    receipt: null
  - id: T999
    type: judge
    assignee: Judge
    status: queued
`;
}

function implementationBoardWithWorkerShipping() {
  return incompleteImplementationBoard().replace(
    "  - id: T999",
    `  - id: T998
    type: worker
    assignee: Worker
    status: queued
    objective: "Ship verified implementation."
    allowed_files:
      - "src/**"
    verify:
      - "git diff --check"
    receipt: null
  - id: T999`,
  );
}
