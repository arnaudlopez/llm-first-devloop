import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { checkStateFile, checkStateText } from "./goalbuddy-quality-check.mjs";

test("passes a final board with red green TDD evidence and pushed commit", () => {
  const result = checkStateText(validFinalBoard(), { final: true });

  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.deepEqual(result.errors, []);
});

test("fails final completion without TDD evidence and GitHub shipping proof", () => {
  const result = checkStateText(invalidFinalBoard(), { final: true });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /missing red test evidence/);
  assert.match(result.errors.join("\n"), /T998 must be done/);
});

test("passes final completion with explicit no-git shipping blocker", () => {
  const result = checkStateText(finalBoardWithNoGitShippingBlocker(), { final: true });

  assert.equal(result.ok, true, result.errors.join("\n"));
});

test("passes split TDD cycle across red implementation and polish workers", () => {
  const result = checkStateText(splitTddCycleBoard(), { final: true });

  assert.equal(result.ok, true, result.errors.join("\n"));
});

test("accepts human readable origin main successful push proof", () => {
  const result = checkStateText(finalBoardWithPushString(), { final: true });

  assert.equal(result.ok, true, result.errors.join("\n"));
});

test("fails implementation completion without video workflow safeguards", () => {
  const result = checkStateText(finalBoardWithoutWorkflowSafeguards(), { final: true });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /design_concept/);
  assert.match(result.errors.join("\n"), /ubiquitous_language/);
  assert.match(result.errors.join("\n"), /feedback_policy/);
  assert.match(result.errors.join("\n"), /test_strategy/);
  assert.match(result.errors.join("\n"), /module_map/);
  assert.match(result.errors.join("\n"), /interface_contract/);
  assert.match(result.errors.join("\n"), /architecture_review/);
  assert.match(result.errors.join("\n"), /design_delta/);
});

test("fails an active Worker that is not shaped for TDD", () => {
  const board = skeletonBoard().replace("status: queued\n    objective: \"Execute", "status: active\n    objective: \"Execute");
  const result = checkStateText(board);

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /active Worker T003 missing allowed_files/);
  assert.match(result.errors.join("\n"), /active Worker T003 missing verify commands/);
  assert.match(result.errors.join("\n"), /No meaningful failing test can be written/);
  assert.match(result.errors.join("\n"), /impact_assessment/);
});

test("accepts equivalent deterministic-test stop condition wording", () => {
  const board = activeWorkerWithDeterministicStopBoard();
  const result = checkStateText(board);

  assert.equal(result.ok, true, result.errors.join("\n"));
});

test("fails Worker progress before completed impact assessment", () => {
  const board = validFinalBoard()
    .replace(/  - id: T001[\s\S]*?  - id: T003/, "  - id: T003")
    .replace("goal:\n  status: done", "goal:\n  status: active")
    .replace("status: done\n    objective: \"Ship verified", "status: queued\n    objective: \"Ship verified");
  const result = checkStateText(board);

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /Worker work started before a completed impact_assessment receipt/);
});

test("fails impact assessment with missing dimensions", () => {
  const board = validFinalBoard().replace("      docs: required\n", "");
  const result = checkStateText(board, { final: true });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /impact_assessment missing dimensions: docs|final impact_assessment missing dimensions: docs/);
});

test("passes a final read-only audit without TDD impact assessment or GitHub shipping", () => {
  const result = checkStateText(readOnlyAuditBoard(), { final: true });

  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.equal(result.read_only_audit, true);
});

test("does not exempt audits once Worker work starts", () => {
  const result = checkStateText(auditWithWorkerBoard(), { final: true });

  assert.equal(result.ok, false);
  assert.equal(result.read_only_audit, false);
  assert.match(result.errors.join("\n"), /audit_read_only is invalid/);
});

test("passes docs policy with changed docs and shipping but no TDD", () => {
  const result = checkStateText(docsBoard(), { final: true });

  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.equal(result.goal_policy.mode, "docs");
  assert.equal(result.goal_policy.requiresTdd, false);
  assert.equal(result.goal_policy.requiresShipping, true);
});

test("passes verification policy with test and browser evidence but no shipping", () => {
  const result = checkStateText(verificationBoard(), { final: true });

  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.equal(result.goal_policy.mode, "verification");
  assert.equal(result.goal_policy.requiresTdd, false);
  assert.equal(result.goal_policy.requiresShipping, false);
});

test("fails verification policy when a Worker changes files", () => {
  const result = checkStateText(verificationWithChangesBoard(), { final: true });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /verification must not change files/);
});

test("fails data migration policy without migration proof", () => {
  const result = checkStateText(dataMigrationWithoutProofBoard(), { final: true });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /migration_proof/);
});

test("fails frontend policy without visual verification", () => {
  const result = checkStateText(frontendWithoutVisualBoard(), { final: true });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /visual verification/);
});

test("reads state from disk", () => {
  const dir = mkdtempSync(join(tmpdir(), "goalbuddy-quality-"));
  const path = join(dir, "state.yaml");
  writeFileSync(path, validFinalBoard());

  const result = checkStateFile(path, { final: true });

  assert.equal(result.ok, true, result.errors.join("\n"));
});

test("fails inline empty list followed by nested list items", () => {
  const result = checkStateText(skeletonBoard().replace("allowed_files: []", "allowed_files: []\n      - \"test/tasks.test.js\""));

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /inline \[\] cannot also have nested list items/);
});

function skeletonBoard() {
  return `version: 2

goal:
  status: active

rules:
  require_tdd_worker_flow: true
  require_github_ship_task: true
  require_quality_checker: true
  require_impact_assessment: true

tasks:
  - id: T003
    type: worker
    assignee: Worker
    status: queued
    objective: "Execute the first safe implementation task selected by Judge."
    allowed_files: []
    verify: []
    stop_if:
      - "Need files outside allowed_files."
    receipt: null
  - id: T998
    type: pm
    assignee: PM
    status: queued
    objective: "Ship verified work to GitHub before the goal can be marked done."
    constraints:
      - "Commit all goal-related changes with a clear message."
      - "Push the current branch to origin."
    receipt: null
  - id: T999
    type: judge
    assignee: Judge
    status: queued
    objective: "Audit whether the implemented slice satisfies the original user outcome."
    constraints:
      - "Reject completion unless T998 has a commit SHA and successful push result."
    receipt: null
`;
}

function validFinalBoard() {
  return `version: 2

goal:
  status: done

goal_policy:
  mode: implementation

workflow_safeguards:
  requires_design_concept: true
  requires_ubiquitous_language: true
  requires_feedback_policy: true
  requires_test_strategy: true
  requires_module_map: true
  requires_interface_contract: true
  requires_architecture_review: true
  requires_design_delta: true

rules:
  require_tdd_worker_flow: true
  require_github_ship_task: true
  require_quality_checker: true
  require_impact_assessment: true

tasks:
  - id: T001
    type: scout
    assignee: Scout
    status: done
    objective: "Map impact_assessment before implementation."
    receipt:
      result: done
      impact_assessment:
        db_schema_migrations: not_required
        data_backfill: not_required
        env_secrets: not_required
        auth_permissions: not_required
        api_contract: required
        ui_routes: not_required
        background_jobs: not_required
        external_services: not_required
        deploy_rollback: not_required
        observability: not_required
        docs: required
      workflow_safeguards:
        design_concept: "Prevent duplicate swipe events through the existing route behavior without changing persistence."
        ubiquitous_language:
          swipe: "user action to record interest"
          duplicate_swipe: "same user and target repeated"
        feedback_policy: "Run the route regression test immediately after the failing assertion, then run npm test."
        test_strategy: "Behavior-level route test with mocked persistence; no browser or live service."
        module_map:
          - "src/app/api/posts/swipe/route.ts is the API boundary."
          - "src/__tests__/api/swipe-route.test.ts verifies behavior at that boundary."
        interface_contract: "POST route returns duplicate-safe response while preserving existing request/response shape."
        architecture_review: "Keep the change inside the route boundary; no new shallow helper module."
  - id: T003
    type: worker
    assignee: Worker
    status: done
    objective: "Add duplicate swipe protection based on impact_assessment T001."
    allowed_files:
      - src/app/api/posts/swipe/route.ts
      - src/__tests__/api/swipe-route.test.ts
    verify:
      - npm test -- src/__tests__/api/swipe-route.test.ts
      - npm test
    stop_if:
      - "No meaningful failing test can be written."
    receipt:
      result: done
      changed_files:
        - src/app/api/posts/swipe/route.ts
        - src/__tests__/api/swipe-route.test.ts
      commands:
        - cmd: npm test -- src/__tests__/api/swipe-route.test.ts
          status: passed
      red_test:
        command: npm test -- src/__tests__/api/swipe-route.test.ts
        status: failed_as_expected
      green_test:
        command: npm test -- src/__tests__/api/swipe-route.test.ts
        status: passed
      verification:
        command: npm test
        status: passed
      impact_assessment_ref: T001
      design_delta:
        changed: "Duplicate handling is explicit at the route boundary."
        stable: "No public API shape, database schema, or external service contract changed."
  - id: T998
    type: pm
    assignee: PM
    status: done
    objective: "Ship verified work to GitHub before the goal can be marked done."
    constraints:
      - "Commit all goal-related changes with a clear message."
      - "Push the current branch to origin."
    receipt:
      result: done
      commit_sha: abcdef1234567890
      remote_branch: origin/feature/tdd
      push_result: success
  - id: T999
    type: judge
    assignee: Judge
    status: done
    objective: "Audit whether the implemented slice satisfies the original user outcome."
    constraints:
      - "Reject completion unless T998 has a commit SHA and successful push result."
    receipt:
      result: done
      decision: complete
      full_outcome_complete: true
`;
}

function invalidFinalBoard() {
  return validFinalBoard()
    .replace("status: failed_as_expected", "status: skipped")
    .replace("red_test:", "red_missing:")
    .replace("green_test:", "green_missing:")
    .replace("status: done\n    objective: \"Ship verified", "status: queued\n    objective: \"Ship verified");
}

function finalBoardWithNoGitShippingBlocker() {
  return validFinalBoard()
    .replace("status: done\n    objective: \"Ship verified", "status: blocked\n    objective: \"Ship verified")
    .replace(
      /receipt:\n      result: done\n      commit_sha: abcdef1234567890\n      remote_branch: origin\/feature\/tdd\n      push_result: success/,
      `receipt:
      result: blocked
      shipping_blocker: no_git_repository
      commands:
        - cmd: git rev-parse --is-inside-work-tree
          status: failed
          output: "fatal: not a git repository (or any of the parent directories): .git"`,
    );
}

function finalBoardWithPushString() {
  return validFinalBoard().replace(
    "      remote_branch: origin/feature/tdd\n      push_result: success",
    '      push: "origin main successful"',
  );
}

function splitTddCycleBoard() {
  return validFinalBoard()
    .replace("goal:\n  status: done", "goal:\n  status: done")
    .replace(
      /  - id: T003[\s\S]*?  - id: T998/,
      `  - id: T003
    type: worker
    assignee: Worker
    status: done
    worker_kind: red_test
    objective: "Write failing TDD tests for the deductive skeleton contract."
    allowed_files:
      - src/__tests__/narrative-frame.test.ts
      - src/__tests__/master-prompt.test.ts
    verify:
      - npm test -- narrative-frame master-prompt
    stop_if:
      - "No meaningful failing test can be written."
    receipt:
      result: done
      changed_files:
        - src/__tests__/narrative-frame.test.ts
        - src/__tests__/master-prompt.test.ts
      commands:
        - cmd: npm test -- narrative-frame master-prompt
          status: expected_fail
          details: "5 failures: missing inferred_skeleton and loop compliance."
      impact_assessment_ref: T001
  - id: T004
    type: worker
    assignee: Worker
    status: done
    worker_kind: implementation
    objective: "Implement deterministic V2 skeleton inference."
    allowed_files:
      - src/lib/types.ts
      - src/lib/ai/narrative-frame.ts
      - src/lib/ai/master-prompt.ts
      - src/__tests__/narrative-frame.test.ts
      - src/__tests__/master-prompt.test.ts
    verify:
      - npm test -- narrative-frame master-prompt
      - npm run typecheck
    stop_if:
      - "No meaningful failing test can be written."
    receipt:
      result: done
      changed_files:
        - src/lib/types.ts
        - src/lib/ai/narrative-frame.ts
        - src/lib/ai/master-prompt.ts
        - src/__tests__/narrative-frame.test.ts
        - src/__tests__/master-prompt.test.ts
      commands:
        - cmd: npm test -- narrative-frame master-prompt
          status: pass
        - cmd: npm run typecheck
          status: pass
      impact_assessment_ref: T001
      design_delta:
        changed: "V2 inference is implemented behind the existing NarrativeFrame boundary."
        stable: "V1 fields remain compatible."
  - id: T005
    type: worker
    assignee: Worker
    status: done
    worker_kind: polish
    objective: "Polish the user-facing feedback without exposing internals."
    allowed_files:
      - src/app/dashboard/create/page.tsx
      - src/__tests__/narrative-frame.test.ts
    verify:
      - npm test -- narrative-frame
      - npm run typecheck
    stop_if:
      - "No meaningful failing test can be written."
    receipt:
      result: done
      changed_files:
        - src/app/dashboard/create/page.tsx
      commands:
        - cmd: npm test -- narrative-frame
          status: pass
        - cmd: npm run typecheck
          status: pass
      impact_assessment_ref: T001
      verification: "UI feedback is covered by existing narrative-frame and typecheck verification."
  - id: T998`,
    );
}

function finalBoardWithoutWorkflowSafeguards() {
  return validFinalBoard()
    .replace(/\n      workflow_safeguards:[\s\S]*?  - id: T003/, "\n  - id: T003")
    .replace(/\n      design_delta:[\s\S]*?  - id: T998/, "\n  - id: T998");
}

function activeWorkerWithDeterministicStopBoard() {
  return `version: 2

goal:
  status: active

rules:
  require_tdd_worker_flow: true
  require_github_ship_task: true
  require_quality_checker: true
  require_impact_assessment: true

goal_policy:
  mode: implementation

workflow_safeguards:
  requires_design_concept: true
  requires_ubiquitous_language: true
  requires_feedback_policy: true
  requires_test_strategy: true
  requires_module_map: true
  requires_interface_contract: true
  requires_architecture_review: true
  requires_design_delta: true

tasks:
  - id: T001
    type: scout
    assignee: Scout
    status: done
    objective: "Map impact_assessment before implementation."
    receipt:
      result: done
      impact_assessment:
        db_schema_migrations: not_required
        data_backfill: not_required
        env_secrets: not_required
        auth_permissions: not_required
        api_contract: required
        ui_routes: not_required
        background_jobs: not_required
        external_services: not_required
        deploy_rollback: not_required
        observability: not_required
        docs: not_required
  - id: T004
    type: worker
    assignee: Worker
    status: active
    objective: "Implement data-to-settings behavior using impact_assessment T001."
    inputs:
      - "T001 impact_assessment"
      - "feedback_policy: run the targeted settings test before broad checks"
      - "test_strategy: deterministic unit test at settings derivation boundary"
      - "interface_contract: deriveSettings(input) returns stable defaults without mutating user choices"
    impact_assessment_ref: T001
    allowed_files:
      - src/lib/settings.ts
      - src/__tests__/settings.test.ts
    verify:
      - npm test -- src/__tests__/settings.test.ts
    stop_if:
      - "Need files outside allowed_files."
      - "Need DB migration, schema change, backfill, env/secret, auth/RLS/permission, external service, background job, deploy, or rollback work outside allowed_files."
      - "Cannot express the behavior with deterministic tests."
  - id: T998
    type: pm
    assignee: PM
    status: queued
    objective: "Ship verified work to GitHub before the goal can be marked done."
    constraints:
      - "Commit all goal-related changes with a clear message."
      - "Push the current branch to origin."
    receipt: null
  - id: T999
    type: judge
    assignee: Judge
    status: queued
    objective: "Audit completion."
    constraints:
      - "Reject completion unless T998 has a commit SHA and successful push result."
    receipt: null
`;
}

function readOnlyAuditBoard() {
  return `version: 2

goal:
  kind: audit
  status: done
  intake:
    proof_type: review

rules:
  require_quality_checker: true
  allow_read_only_goal_without_shipping: true

tasks:
  - id: T001
    type: scout
    assignee: Scout
    status: done
    objective: "Audit remaining risks without editing files."
    receipt:
      result: done
      audit_scope:
        mode: read_only
        changed_files: []
      audit_findings:
        - "No code changes requested."
  - id: T999
    type: judge
    assignee: Judge
    status: done
    objective: "Audit completion."
    receipt:
      result: done
      decision: complete
      review: "Read-only audit complete."
`;
}

function auditWithWorkerBoard() {
  return `version: 2

goal:
  kind: audit
  status: done
  intake:
    proof_type: review

rules:
  require_quality_checker: true
  require_github_ship_task: true

goal_policy:
  mode: audit_read_only
  requires_shipping: true

tasks:
  - id: T003
    type: worker
    assignee: Worker
    status: done
    objective: "Edit code during audit."
    receipt:
      result: done
      changed_files:
        - src/app.ts
  - id: T999
    type: judge
    assignee: Judge
    status: done
    objective: "Audit completion."
    receipt:
      result: done
      decision: complete
`;
}

function docsBoard() {
  return `version: 2

goal:
  status: done

rules:
  require_quality_checker: true
  require_github_ship_task: true

goal_policy:
  mode: docs
  requires_tdd: false
  requires_impact_assessment: false
  requires_shipping: true

tasks:
  - id: T003
    type: worker
    assignee: Worker
    status: done
    objective: "Update deployment docs."
    allowed_files:
      - docs/DEPLOYMENT.md
    verify:
      - npm test
    receipt:
      result: done
      changed_files:
        - docs/DEPLOYMENT.md
      commands:
        - cmd: npm test
          status: passed
  - id: T998
    type: pm
    assignee: PM
    status: done
    objective: "Ship verified work to GitHub before the goal can be marked done."
    constraints:
      - "Commit all goal-related changes with a clear message."
      - "Push the current branch to origin."
    receipt:
      result: done
      commit_sha: abcdef1234567890
      remote_branch: origin/docs/update
      push_result: success
  - id: T999
    type: judge
    assignee: Judge
    status: done
    objective: "Audit completion."
    constraints:
      - "Reject completion unless T998 has a commit SHA and successful push result."
    receipt:
      result: done
      decision: complete
      full_outcome_complete: true
`;
}

function verificationBoard() {
  return `version: 2

goal:
  kind: specific
  status: done
  intake:
    proof_type: test

rules:
  require_quality_checker: true
  require_impact_assessment: true
  require_github_ship_task: false
  require_tdd_worker_flow: false

goal_policy:
  mode: verification
  requires_tdd: false
  requires_impact_assessment: true
  requires_shipping: false
  requires_visual_verification: true

tasks:
  - id: T001
    type: scout
    assignee: Scout
    status: done
    objective: "Map calendar and publication surfaces before tests."
    receipt:
      result: done
      impact_assessment:
        db_schema_migrations: not_required
        data_backfill: not_required
        env_secrets: required_for_live_publish_only
        auth_permissions: required_for_publish_paths
        api_contract: not_required
        ui_routes: required
        background_jobs: required
        external_services: blocked_without_approval
        deploy_rollback: not_required
        observability: not_required
        docs: not_required
  - id: T003
    type: worker
    assignee: Worker
    status: done
    objective: "Run safe calendar and publication verification without editing files using impact_assessment T001."
    impact_assessment_ref: T001
    verify:
      - npm test -- calendar-publication.test.ts
      - npx playwright test calendar-publication.spec.ts
    receipt:
      result: done
      commands:
        - cmd: npm test -- calendar-publication.test.ts
          status: passed
        - cmd: npx playwright test calendar-publication.spec.ts
          status: passed
      browser_check:
        screenshot: calendar-publication-desktop.png
        mobile: passed
        desktop: passed
      tested_surfaces:
        - calendar
        - publication
  - id: T999
    type: judge
    assignee: Judge
    status: done
    objective: "Audit safe verification completion."
    receipt:
      result: done
      decision: complete
      full_outcome_complete: true
      review: "Safe verification complete; no external publish occurred."
`;
}

function verificationWithChangesBoard() {
  return verificationBoard().replace(
    "      commands:",
    "      changed_files:\n        - src/app/calendar.ts\n      commands:",
  );
}

function dataMigrationWithoutProofBoard() {
  return validFinalBoard()
    .replace("mode: implementation", "mode: data_migration")
    .replace("        - src/app/api/posts/swipe/route.ts", "        - supabase/migrations/20260519000000_add_table.sql")
    .replace("      - src/app/api/posts/swipe/route.ts", "      - supabase/migrations/20260519000000_add_table.sql");
}

function frontendWithoutVisualBoard() {
  return validFinalBoard()
    .replace("mode: implementation", "mode: frontend")
    .replace("        - src/app/api/posts/swipe/route.ts", "        - src/components/Button.tsx")
    .replace("      - src/app/api/posts/swipe/route.ts", "      - src/components/Button.tsx");
}
