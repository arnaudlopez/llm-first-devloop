#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { repairStateText } from "./goalbuddy-board-repair.mjs";
import { checkStateText } from "./goalbuddy-quality-check.mjs";

const IMPACT_DIMENSIONS =
  "db_schema_migrations, data_backfill, env_secrets, auth_permissions, api_contract, ui_routes, background_jobs, external_services, deploy_rollback, observability, and docs";

const MODE_POLICIES = {
  implementation: {
    mode: "implementation",
    goalKind: "specific",
    proofTypes: ["test", "artifact", "review"],
    requiresTdd: true,
    requiresImpactAssessment: true,
    requiresShipping: true,
    requiresVisualVerification: false,
    requiresMigrationProof: false,
    requiresInfraProof: false,
    requiresDependencyReview: false,
    requiresDirtyWorktreeGuard: true,
    requiresRefactorProof: false,
    workflowHeavy: true,
    taskShape: "tdd",
    defaultOracle: "Acceptance tests and verification evidence prove the delivered behavior matches the clarified spec.",
    interpretedOutcome: "Implement the requested outcome through acceptance-test-driven slices until the observable oracle is true.",
    completionProof: "Final audit maps red tests, green verification, implementation receipts, and shipping proof back to the oracle.",
    likelyMisfire: "Starting implementation from a plausible plan before converting the owner outcome into acceptance tests and observable proof.",
  },
  frontend: {
    mode: "frontend",
    goalKind: "specific",
    proofTypes: ["test", "artifact", "review"],
    requiresTdd: true,
    requiresImpactAssessment: true,
    requiresShipping: true,
    requiresVisualVerification: true,
    requiresMigrationProof: false,
    requiresInfraProof: false,
    requiresDependencyReview: false,
    requiresDirtyWorktreeGuard: true,
    requiresRefactorProof: false,
    workflowHeavy: true,
    taskShape: "tdd",
    defaultOracle: "Acceptance tests plus browser or visual verification prove the requested UI behavior works across the approved viewports.",
    interpretedOutcome: "Implement the requested frontend outcome with red tests, browser-visible proof, and final shipping evidence.",
    completionProof: "Final audit cites red/green tests, browser or screenshot evidence, visual coverage, and shipping proof.",
    likelyMisfire: "Only checking code or labels while missing the visible screen state, responsive behavior, or interaction path.",
  },
  data_migration: {
    mode: "data_migration",
    goalKind: "specific",
    proofTypes: ["test", "artifact", "review"],
    requiresTdd: true,
    requiresImpactAssessment: true,
    requiresShipping: true,
    requiresVisualVerification: false,
    requiresMigrationProof: true,
    requiresInfraProof: false,
    requiresDependencyReview: false,
    requiresDirtyWorktreeGuard: true,
    requiresRefactorProof: false,
    workflowHeavy: true,
    taskShape: "tdd",
    defaultOracle: "Migration tests, schema/backfill verification, rollback notes, and application tests prove the data change is safe.",
    interpretedOutcome: "Implement the requested data/schema change through migration-aware TDD and verified rollback/deploy evidence.",
    completionProof: "Final audit cites red/green tests, migration_proof, rollback/backfill evidence, and shipping proof.",
    likelyMisfire: "Changing schema or data paths without migration proof, rollback notes, generated types, or application-level verification.",
  },
  docs: {
    mode: "docs",
    goalKind: "specific",
    proofTypes: ["artifact", "review"],
    requiresTdd: false,
    requiresImpactAssessment: false,
    requiresShipping: true,
    requiresVisualVerification: false,
    requiresMigrationProof: false,
    requiresInfraProof: false,
    requiresDependencyReview: false,
    requiresDirtyWorktreeGuard: true,
    requiresRefactorProof: false,
    workflowHeavy: false,
    taskShape: "docs",
    defaultOracle: "The requested documentation artifact exists, is internally coherent, and passes the approved validation or review checks.",
    interpretedOutcome: "Produce the requested documentation artifact with explicit review evidence and shipping proof.",
    completionProof: "Final audit maps changed docs, validation/review evidence, and shipping proof back to the requested artifact.",
    likelyMisfire: "Writing plausible documentation that is not tied to the requested decision, artifact, or verification checks.",
  },
  audit_read_only: {
    mode: "audit_read_only",
    goalKind: "audit",
    proofTypes: ["review", "source_backed_answer", "decision"],
    requiresTdd: false,
    requiresImpactAssessment: false,
    requiresShipping: false,
    requiresVisualVerification: false,
    requiresMigrationProof: false,
    requiresInfraProof: false,
    requiresDependencyReview: false,
    requiresDirtyWorktreeGuard: false,
    requiresRefactorProof: false,
    workflowHeavy: false,
    taskShape: "audit",
    defaultOracle: "A source-backed audit answers the question with cited evidence, risks, blockers, and a final decision.",
    interpretedOutcome: "Audit the requested surface in read-only mode and answer with evidence instead of changing files.",
    completionProof: "Final audit receipt cites audit_scope, audit_findings, evidence, residual risks, and decision.",
    likelyMisfire: "Turning a read-only audit into implementation work or reporting generic opinions without concrete source evidence.",
  },
  verification: {
    mode: "verification",
    goalKind: "specific",
    proofTypes: ["test", "review"],
    requiresTdd: false,
    requiresImpactAssessment: false,
    requiresShipping: false,
    requiresVisualVerification: false,
    requiresMigrationProof: false,
    requiresInfraProof: false,
    requiresDependencyReview: false,
    requiresDirtyWorktreeGuard: true,
    requiresRefactorProof: false,
    workflowHeavy: false,
    taskShape: "verification",
    defaultOracle: "Safe verification commands or browser checks prove the requested behavior, or produce explicit blockers without file changes.",
    interpretedOutcome: "Verify the requested behavior safely without implementation unless a new approved goal is created.",
    completionProof: "Final audit cites tested surfaces, safe commands, pass/fail results, and blockers.",
    likelyMisfire: "Running generic tests while missing the requested flow, or silently fixing defects inside a verification-only goal.",
  },
  research: {
    mode: "research",
    goalKind: "specific",
    proofTypes: ["source_backed_answer", "decision"],
    requiresTdd: false,
    requiresImpactAssessment: false,
    requiresShipping: false,
    requiresVisualVerification: false,
    requiresMigrationProof: false,
    requiresInfraProof: false,
    requiresDependencyReview: false,
    requiresDirtyWorktreeGuard: false,
    requiresRefactorProof: false,
    workflowHeavy: false,
    taskShape: "audit",
    defaultOracle: "A source-backed answer or decision record resolves the research question with explicit evidence and uncertainty.",
    interpretedOutcome: "Research the requested question and produce a decision-ready answer without implementation.",
    completionProof: "Final audit cites sources, reasoning, decision, and remaining uncertainty.",
    likelyMisfire: "Producing confident but unsupported advice, or starting implementation before the research decision is made.",
  },
};

export function slugify(value) {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72) || "ready-mode-goal"
  );
}

export function titleFromText(value) {
  const words = value
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 8);
  const title = words.join(" ");
  return title ? title[0].toUpperCase() + title.slice(1) : "Ready Mode Goal";
}

export function buildReadyModeArtifacts(options = {}) {
  const goalText = normalizeRequiredString(options.goalText, "goalText");
  const policy = policyForOptions(options);
  const title = normalizeString(options.title) || titleFromText(goalText);
  const slug = slugify(normalizeString(options.slug) || title);
  const date = options.date || new Date().toISOString().slice(0, 10);
  const interpretedOutcome =
    normalizeString(options.interpretedOutcome) ||
    policy.interpretedOutcome;
  const oracleSignal =
    normalizeString(options.oracleSignal) ||
    policy.defaultOracle;

  const context = {
    date,
    goalText,
    interpretedOutcome,
    oracleSignal,
    policy,
    slug,
    title,
  };
  const stateYaml = repairStateText(adjustStateForPolicy(renderStateYaml(context), policy));
  const check = checkStateText(stateYaml);

  return {
    acceptanceContract: renderAcceptanceContract(context),
    check,
    goalMd: renderGoalMd(context),
    slug,
    stateYaml,
    title,
  };
}

export function writeReadyModeArtifacts(options = {}) {
  const artifacts = buildReadyModeArtifacts(options);
  const outDir = resolve(options.outDir || join("docs", "goals", artifacts.slug));
  const force = Boolean(options.force);
  const files = {
    "acceptance-contract.md": artifacts.acceptanceContract,
    "goal.md": artifacts.goalMd,
    "state.yaml": artifacts.stateYaml,
  };

  if (existsSync(outDir) && !force) {
    throw new Error(`output directory already exists: ${outDir}. Use --force to overwrite generated files.`);
  }

  mkdirSync(outDir, { recursive: true });
  for (const [name, text] of Object.entries(files)) {
    const filePath = join(outDir, name);
    if (existsSync(filePath) && !force) {
      throw new Error(`output file already exists: ${filePath}. Use --force to overwrite generated files.`);
    }
    writeFileSync(filePath, text);
  }

  return {
    ...artifacts,
    outDir,
    files: Object.fromEntries(Object.keys(files).map((name) => [name, join(outDir, name)])),
  };
}

function renderGoalMd(context) {
  return `# ${context.title}

## Original Request

${context.goalText}

## Ready Mode Instruction

Use this goal as a ${context.policy.mode} Ready Mode run.

LLM first principle: the free-form conversation already did the exploration work. This board starts only after the owner says the spec is mature enough to freeze into proof.

1. Clarify the design concept and domain language before implementation.
2. Turn the desired end state into observable acceptance tests or equivalent proof.
3. Follow the board policy for ${context.policy.requiresTdd ? "red tests before production code" : "evidence before completion"}.
4. Complete the largest safe useful slice inside approved boundaries.
5. Verify, review${context.policy.requiresShipping ? ", commit, push," : ","} and finish only when the oracle is true.

## Oracle

${context.oracleSignal}

## Files

- \`state.yaml\`: GoalBuddy board state.
- \`acceptance-contract.md\`: initial owner-facing acceptance contract to refine during T001/T002.
`;
}

function renderAcceptanceContract(context) {
  const evidence = evidenceBullets(context.policy);
  const tests = acceptanceDraftBullets(context.policy);
  return `# Acceptance Contract

## Goal

${context.goalText}

## LLM First Context

This contract assumes the exploratory LLM conversation has already happened. The goal now is to preserve that shared intent, not restart discovery from scratch.

## Observable Oracle

${context.oracleSignal}

## Visible Outcome

T001/T002 must replace this placeholder with the observable user-facing behavior, generated artifact, audit answer, or verification result that should exist at the end.

## Acceptance Tests To Write First

${tests.map((line) => `- ${line}`).join("\n")}

## Failure Modes To Prevent

- Implementation starts before the acceptance/evidence contract is specific enough.
- Tests pass but do not prove the owner-visible outcome.
- The work drifts outside the LLM-first intent, non-goals, or approved boundaries.
- Operational risks such as migrations, env/secrets, auth, external services, or shipping proof are discovered but not handled.

## Manual Or Visual Proof If Needed

${context.policy.requiresVisualVerification ? "T001/T002 must define expected screen state, viewport coverage, browser checks, and screenshot evidence before Worker implementation starts." : "If code tests cannot fully prove the outcome, T001/T002 must define the manual, artifact, source-backed, or browser proof required before final audit."}

## Out Of Scope

T001/T002 must keep or revise this list:

- Do not implement behavior outside the approved acceptance contract.
- Do not change unrelated dirty files.
${context.policy.requiresTdd ? "- Do not skip the red test stage because implementation seems obvious." : "- Do not add implementation work unless Judge explicitly changes the goal policy."}

## Shipping Proof

${context.policy.requiresShipping ? "- T998 must record commit SHA, remote branch or push string, push result, committed files, and unrelated dirty files left untouched." : "- This policy mode does not require shipping unless Judge changes the policy after evidence."}

## End-State Evidence To Produce

${evidence.map((line) => `- ${line}`).join("\n")}

## Acceptance Or Evidence Draft

T001 must replace this draft with concrete tests after reading the target repository.

${tests.map((line) => `- ${line}`).join("\n")}

## Visual Or Demo Oracle

${context.policy.requiresVisualVerification ? "T001/T002 must define expected screen state, viewport coverage, browser checks, and screenshot evidence before Worker implementation starts." : "If the goal has UI, T001/T002 must decide whether browser or screenshot evidence is required before Worker work starts."}

## Non-Goals

T001/T002 must keep or revise this list:

- Do not implement behavior outside the approved acceptance contract.
- Do not change unrelated dirty files.
${context.policy.requiresTdd ? "- Do not skip the red test stage because implementation seems obvious." : "- Do not add implementation work unless Judge explicitly changes the goal policy."}
`;
}

function renderStateYaml(context) {
  return `version: 2
goal:
  slug: ${yamlString(context.slug)}
  title: ${yamlString(context.title)}
  status: active
  created_at: ${yamlString(context.date)}
  updated_at: ${yamlString(context.date)}
  kind: ${context.policy.goalKind}
  original_request: ${yamlString(context.goalText)}
  interpreted_outcome: ${yamlString(context.interpretedOutcome)}
  input_shape: specific
  audience: ${yamlString("Product owner and target users")}
  authority: requested
  proof_type:
${context.policy.proofTypes.map((proof) => `    - ${proof}`).join("\n")}
  completion_proof: ${yamlString(context.policy.completionProof)}
  goal_oracle: ${yamlString(context.oracleSignal)}
  oracle:
    signal: ${yamlString(context.oracleSignal)}
    final_proof: ${yamlString(finalProofForPolicy(context.policy))}
  likely_misfire: ${yamlString(context.policy.likelyMisfire)}
  constraints:
    - "Acceptance tests or equivalent observable proof must be written before production implementation."
    - "Implementation must stay inside Judge-approved allowed_files."
    - "Unrelated dirty worktree changes must remain untouched."

rules:
  pm_owns_state: true
  one_active_task: true
  max_write_workers: 1
  no_implementation_without_worker_or_pm_task: true
  no_completion_without_judge_or_pm_audit: true
  planning_is_not_completion: true
  queued_required_worker_blocks_completion: true
  continuous_until_full_outcome: true
  missing_input_or_credentials_do_not_stop_goal: true
  preserve_and_validate_existing_plan: true
  intake_misfire_must_be_audited: true
  allow_read_only_goal_without_shipping: true
  require_quality_checker: true
  require_tdd_worker_flow: true
  require_github_ship_task: true
  require_impact_assessment: true
  goal_pressure_requires_oracle: true

goal_policy:
  mode: ${context.policy.mode}
  requires_tdd: ${context.policy.requiresTdd}
  requires_impact_assessment: ${context.policy.requiresImpactAssessment}
  requires_shipping: ${context.policy.requiresShipping}
  requires_visual_verification: ${context.policy.requiresVisualVerification}
  requires_migration_proof: ${context.policy.requiresMigrationProof}
  requires_infra_proof: ${context.policy.requiresInfraProof}
  requires_dependency_review: ${context.policy.requiresDependencyReview}
  requires_dirty_worktree_guard: ${context.policy.requiresDirtyWorktreeGuard}
  requires_refactor_proof: ${context.policy.requiresRefactorProof}
  rationale: ${yamlString(rationaleForPolicy(context.policy))}

workflow_safeguards:
  requires_design_concept: ${context.policy.workflowHeavy}
  requires_ubiquitous_language: ${context.policy.workflowHeavy}
  requires_feedback_policy: ${context.policy.workflowHeavy || context.policy.mode === "verification"}
  requires_test_strategy: ${context.policy.workflowHeavy}
  requires_module_map: ${context.policy.workflowHeavy}
  requires_interface_contract: ${context.policy.workflowHeavy}
  requires_architecture_review: ${context.policy.workflowHeavy}
  requires_design_delta: ${context.policy.workflowHeavy}
  require_t998_shipping: ${context.policy.requiresShipping}
  require_t999_final_audit: true
  protect_unrelated_dirty_worktree: true

agents:
  scout: installed
  worker: installed
  judge: installed

active_task: T001
tasks:
  - id: T001
    type: scout
    assignee: Scout
    status: active
    objective: "Turn the mature request into a concrete acceptance contract before any implementation work."
    inputs:
      - "goal.md"
      - "acceptance-contract.md"
      - "Current repository source, tests, scripts, docs, and dirty worktree status"
    constraints:
      - "Read-only."
      - "Do not edit product files."
      - "Do not start implementation."
      - "Prefer observable owner outcomes over internal task completion."
    expected_output:
      - "design_concept: shared understanding, non-goals, and decision dependencies"
      - "ubiquitous_language: domain terms, overloaded words, and forbidden synonyms"
      - "module_map: relevant deep modules, boundaries, and shallow-module risks"
      - "interface_contract: public behavior and boundaries that tests should target"
      - "test_strategy: acceptance tests, unit/integration boundaries, mocks, browser or visual checks if relevant"
      - "feedback_policy: targeted test cadence, typecheck, browser checks, and full-suite timing"
      - "acceptance_contract_updates: exact end-state evidence and failure modes"
      - "dirty_worktree_risk_map: unrelated files that must stay untouched"
      - "impact_assessment covering ${IMPACT_DIMENSIONS}"
    receipt: null

  - id: T002
    type: judge
    assignee: Judge
    status: queued
    objective: "Approve the acceptance contract and choose the largest safe red-test package."
    inputs:
      - "T001 receipt"
      - "Updated acceptance-contract.md if T001 changed it"
    constraints:
      - "Do not implement."
      - "Reject implementation work before tests can express the oracle."
      - "Reject vague acceptance criteria that cannot be verified."
      - "Choose a useful vertical slice, not tiny helper-only work."
    expected_output:
      - "Decision: approved | needs_more_evidence | blocked"
      - "Approved design_concept"
      - "Approved ubiquitous_language"
      - "feedback_policy"
      - "test_strategy"
      - "module_map"
      - "interface_contract"
      - "architecture_review"
      - "Exact Worker objective for red tests"
      - "allowed_files for T003"
      - "verify commands for T003"
      - "stop_if conditions for T003"
      - "impact_assessment_ref"
    receipt: null

  - id: T003
    type: worker
    worker_kind: red_test
    assignee: Worker
    status: queued
    objective: "Write the failing acceptance tests selected by Judge, without production implementation."
    inputs:
      - "T002 approved acceptance contract"
      - "T002 allowed_files and verify commands"
    impact_assessment_ref: null
    allowed_files: []
    verify: []
    stop_if:
      - "Need files outside allowed_files."
      - "The selected contract is ambiguous."
      - "No meaningful failing test can be written."
      - "Tests require production implementation changes before the red stage."
      - "Need DB migration, schema change, backfill, env/secret, auth/RLS/permission, external service, background job, deploy, or rollback work outside allowed_files."
      - "Unrelated dirty files would need to be modified."
    receipt: null

  - id: T004
    type: worker
    worker_kind: implementation
    assignee: Worker
    status: queued
    objective: "Implement the largest safe useful slice that makes the approved red tests pass."
    inputs:
      - "T003 red test receipt"
      - "T002 implementation boundaries"
    impact_assessment_ref: null
    allowed_files: []
    verify: []
    stop_if:
      - "Need files outside allowed_files."
      - "No prior red_test evidence exists."
      - "No meaningful failing test can be written."
      - "Need DB migration, schema change, backfill, env/secret, auth/RLS/permission, external service, background job, deploy, or rollback work outside allowed_files."
      - "Verification fails twice without a clear bounded fix."
      - "Implementation starts drifting outside the oracle."
    receipt: null

  - id: T005
    type: worker
    worker_kind: verification
    assignee: Worker
    status: queued
    objective: "Run the full verification package, including browser or visual checks when the acceptance contract requires them."
    inputs:
      - "T004 implementation receipt"
      - "Approved feedback_policy"
    impact_assessment_ref: null
    allowed_files: []
    verify: []
    stop_if:
      - "Need files outside allowed_files."
      - "No meaningful failing test can be written."
      - "Need DB migration, schema change, backfill, env/secret, auth/RLS/permission, external service, background job, deploy, or rollback work outside allowed_files."
      - "No safe local or staging target is available for required browser checks."
      - "Verification fails twice without understood cause."
    receipt: null

  - id: T006
    type: judge
    assignee: Judge
    status: queued
    objective: "Review architecture, spec fidelity, and test evidence before shipping."
    inputs:
      - "T001 through T005 receipts"
      - "Current diff"
      - "Last verification output"
    constraints:
      - "Do not implement."
      - "Reject completion if the implementation only satisfies internal tasks but not the original oracle."
      - "Reject hidden design drift, shallow-module sprawl, or missing acceptance evidence."
    expected_output:
      - "approved | changes_required"
      - "design_delta"
      - "architecture_review"
      - "oracle_coverage"
      - "remaining risks"
      - "whether another Worker slice is needed"
    receipt: null

  - id: T998
    type: pm
    assignee: PM
    status: queued
    objective: "Commit all goal-related changes and push the current branch once verification is green."
    inputs:
      - "Approved implementation and verification receipts"
      - "Current git status"
    constraints:
      - "Do not include unrelated dirty files."
      - "If the workspace is not a git repository, record shipping_blocker: no_git_repository."
      - "If no GitHub remote exists, record shipping_blocker: no_github_remote."
    expected_output:
      - "commit_sha"
      - "remote_branch or push string"
      - "push_result"
      - "committed_files"
      - "unrelated_dirty_files_left_untouched"
    receipt: null

  - id: T999
    type: judge
    assignee: Judge
    status: queued
    objective: "Final audit: decide whether the original owner outcome is actually true."
    inputs:
      - "All task receipts"
      - "Acceptance contract"
      - "Last verification"
      - "T998 commit SHA and successful push result"
    constraints:
      - "Do not implement."
      - "Reject completion unless receipts map back to the oracle."
      - "Reject completion unless T998 contains commit SHA and successful push result, or a valid explicit shipping_blocker."
      - "Reject completion if any required Worker or Judge task is queued or active."
    expected_output:
      - "complete | not_complete"
      - "full_outcome_complete: true | false"
      - "oracle_evidence"
      - "tests_and_verification"
      - "shipping_evidence"
      - "missing evidence"
      - "next task if not complete"
    receipt: null
`;
}

function adjustStateForPolicy(text, policy) {
  let next = text;

  if (!policy.requiresShipping) next = removeTask(next, "T998");

  if (policy.taskShape === "audit") {
    next = removeTask(next, "T003");
    next = removeTask(next, "T004");
    next = removeTask(next, "T005");
    next = removeTask(next, "T006");
    next = next.replace(
      'objective: "Approve the acceptance contract and choose the largest safe red-test package."',
      'objective: "Approve the read-only evidence plan and decide whether the audit can proceed safely."',
    );
    next = next.replace(
      '      - "Reject implementation work before tests can express the oracle."',
      '      - "Reject implementation work; this goal is read-only unless the owner explicitly creates a new implementation goal."',
    );
    return next;
  }

  if (policy.taskShape === "docs") {
    next = removeTask(next, "T004");
    next = next.replace("worker_kind: red_test", "worker_kind: documentation");
    next = next.replace(
      'objective: "Write the failing acceptance tests selected by Judge, without production implementation."',
      'objective: "Produce the approved documentation artifact and its review checklist."',
    );
    next = next.replace("T002 allowed_files and verify commands", "T002 allowed_files, documentation outline, and validation commands");
    next = next.replace("T003 red test receipt", "T003 documentation receipt");
    next = next.replace(
      'objective: "Run the full verification package, including browser or visual checks when the acceptance contract requires them."',
      'objective: "Run documentation validation, link checks, or review commands required by the contract."',
    );
    return next;
  }

  if (policy.taskShape === "verification") {
    next = removeTask(next, "T004");
    next = removeTask(next, "T005");
    next = next.replace("worker_kind: red_test", "worker_kind: verification");
    next = next.replace(
      'objective: "Write the failing acceptance tests selected by Judge, without production implementation."',
      'objective: "Run the safe verification package selected by Judge without changing files."',
    );
    next = next.replace(
      '      - "Tests require production implementation changes before the red stage."',
      '      - "The requested verification would require code changes; create a new implementation goal instead."',
    );
    next = next.replace(
      'objective: "Approve the acceptance contract and choose the largest safe red-test package."',
      'objective: "Approve the verification plan and safe commands that prove or block the requested behavior."',
    );
    return next;
  }

  if (policy.requiresVisualVerification) {
    next = next.replace(
      '      - "oracle_coverage"',
      '      - "visual verification evidence: desktop, mobile, and interaction path when relevant"\n      - "oracle_coverage"',
    );
  }

  if (policy.requiresMigrationProof) {
    next = next.replace(
      '      - "oracle_coverage"',
      '      - "migration_proof: migration/backfill/rollback/schema verification evidence"\n      - "oracle_coverage"',
    );
  }

  return next;
}

function removeTask(text, id) {
  const re = new RegExp(`\\n  - id: ${id}\\n[\\s\\S]*?(?=\\n  - id: T\\d{3}\\n|\\n*$)`, "m");
  return text.replace(re, "");
}

function policyForOptions(options) {
  const requestedMode = normalizeString(options.mode || options.policyMode) || "implementation";
  const mode = requestedMode === "migration" ? "data_migration" : requestedMode;
  if (!MODE_POLICIES[mode]) {
    throw new Error(`unsupported mode: ${requestedMode}. Supported modes: ${Object.keys(MODE_POLICIES).join(", ")}`);
  }

  const policy = { ...MODE_POLICIES[mode] };
  if (options.visual) {
    policy.requiresVisualVerification = true;
    if (policy.mode === "implementation") policy.mode = "frontend";
  }
  if (options.noShipping) {
    if (["implementation", "frontend", "data_migration"].includes(policy.mode)) {
      throw new Error("--no-shipping is only allowed for audit_read_only, verification, research, or docs modes");
    }
    policy.requiresShipping = false;
  }
  return policy;
}

function evidenceBullets(policy) {
  const bullets = [];
  if (policy.taskShape === "audit") {
    bullets.push("Read-only audit scope and concrete source evidence.");
    bullets.push("Findings, risks, blockers, and a final decision mapped to the owner question.");
    bullets.push("Explicit statement that no files were changed.");
    return bullets;
  }
  if (policy.taskShape === "verification") {
    bullets.push("Safe verification commands, browser checks, or manual test transcript.");
    bullets.push("Pass/fail results mapped to the requested behavior.");
    bullets.push("Explicit blockers when credentials, environment, or external actions are unavailable.");
    return bullets;
  }
  if (policy.taskShape === "docs") {
    bullets.push("Documentation artifact visible to the owner.");
    bullets.push("Validation or review checks with results.");
    bullets.push("Consistency check against the requested decision, workflow, or architecture.");
  } else {
    bullets.push("Product behavior or artifact visible to the owner.");
    bullets.push("Acceptance tests that fail before implementation and pass after implementation.");
    bullets.push("Verification commands with results.");
    bullets.push("Design review mapped back to the original request.");
  }
  if (policy.requiresVisualVerification) bullets.push("Browser or screenshot evidence for the approved viewports and interactions.");
  if (policy.requiresMigrationProof) bullets.push("Migration proof, rollback/backfill notes, and schema/application verification.");
  if (policy.requiresShipping) {
    bullets.push("Commit and push proof, or an explicit shipping blocker such as `no_git_repository` or `no_github_remote`.");
  }
  return bullets;
}

function acceptanceDraftBullets(policy) {
  if (policy.taskShape === "audit") {
    return [
      "Given the audit question, when Scout reviews the relevant sources, then the final answer cites concrete evidence rather than generic advice.",
      "Given a risky or ambiguous finding, when the audit reports it, then it names the blocker and the decision needed.",
      "Given this is read-only, when the goal finishes, then no changed_files are reported.",
    ];
  }
  if (policy.taskShape === "verification") {
    return [
      "Given the requested behavior, when the approved safe checks run, then results prove pass/fail for the actual flow.",
      "Given missing credentials or unsafe external actions, when verification reaches that boundary, then the blocker is explicit and scoped.",
      "Given this is verification-only, when the goal finishes, then no implementation files are changed.",
    ];
  }
  if (policy.taskShape === "docs") {
    return [
      "Given the requested artifact, when the owner reads it, then it answers the intended decision or workflow directly.",
      "Given related existing docs, when validation runs, then terminology and links remain coherent.",
      "Given a likely misinterpretation, when the doc is reviewed, then the non-goals and boundaries prevent it.",
    ];
  }
  return [
    "Given the clarified spec, when the owner exercises the main path, then the visible outcome matches the requested behavior.",
    "Given an important edge case from the spec, when the code handles it, then the result is deterministic and documented.",
    "Given a likely failure mode, when the implementation is incomplete, then a targeted test fails before production code is changed.",
  ];
}

function finalProofForPolicy(policy) {
  if (policy.requiresShipping) {
    return "T999 states full_outcome_complete: true and cites passing acceptance evidence, verification commands, design review, and T998 shipping evidence.";
  }
  return "T999 states full_outcome_complete: true and cites evidence mapped to the oracle, with no required shipping for this policy mode.";
}

function rationaleForPolicy(policy) {
  if (policy.mode === "audit_read_only") return "Ready Mode is preserving the user's audit-only intent; no Worker implementation or shipping is required.";
  if (policy.mode === "verification") return "Ready Mode is verifying an existing behavior safely without implementation changes.";
  if (policy.mode === "docs") return "Ready Mode is producing a documentation artifact, so review/validation replaces code TDD.";
  if (policy.mode === "frontend") return "Ready Mode is treating this as UI behavior, so visual/browser verification is required.";
  if (policy.mode === "data_migration") return "Ready Mode is treating this as data/schema work, so migration proof is required.";
  return "Ready Mode is for app-code or product-behavior work after an LLM-first spec conversation has converged.";
}

function normalizeRequiredString(value, name) {
  const normalized = normalizeString(value);
  if (!normalized) throw new Error(`${name} is required`);
  return normalized;
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function yamlString(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, "\\n")}"`;
}

function parseArgs(argv) {
  const args = {
    dryRun: false,
    force: false,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "-h" || arg === "--help") args.help = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--force") args.force = true;
    else if (arg === "--json") args.json = true;
    else if (arg === "--visual") args.visual = true;
    else if (arg === "--no-shipping") args.noShipping = true;
    else if (arg === "--goal") args.goalText = argv[++index];
    else if (arg === "--oracle") args.oracleSignal = argv[++index];
    else if (arg === "--mode") args.mode = argv[++index];
    else if (arg === "--from") args.from = argv[++index];
    else if (arg === "--title") args.title = argv[++index];
    else if (arg === "--slug") args.slug = argv[++index];
    else if (arg === "--out") args.outDir = argv[++index];
    else throw new Error(`unknown argument: ${arg}`);
  }

  if (args.from) args.goalText = readFileSync(resolve(args.from), "utf8");
  return args;
}

const HELP_TEXT = `Usage:
  goalbuddy-ready --from brief.md --out docs/goals/my-feature [options]
  npm run ready -- --from brief.md --out docs/goals/my-feature [options]

Generate a GoalBuddy Ready Mode board from a mature brief or explicit goal.

Inputs:
  --from <file>       Read the goal/brief text from a Markdown file.
  --goal <text>       Inline goal text. Use this instead of --from for short goals.
  --oracle <text>     Observable completion proof. Optional but strongly recommended.

Output:
  --out <dir>         Directory to write goal.md, state.yaml, and acceptance-contract.md.
  --slug <slug>       Stable slug for generated paths.
  --title <text>      Human title for the goal.
  --force             Overwrite generated files if they already exist.
  --dry-run           Print state.yaml instead of writing files.
  --json              Print JSON output.

Policy:
  --mode <mode>       implementation | frontend | data_migration | docs | audit_read_only | verification | research
  --visual            Require browser/screenshot evidence; implementation goals become frontend goals.
  --no-shipping       Disable shipping only for non-implementation modes.

Examples:
  goalbuddy-ready --from examples/brief-feature.md --mode implementation --oracle "Acceptance tests prove saved searches can be created, listed, and reused." --out docs/goals/saved-search
  npm run ready -- --goal "Audit the publication flow without changing files" --mode audit_read_only --out docs/goals/publication-audit
`;

function printHuman(result, dryRun) {
  const status = result.check.ok ? "PASS" : "FAIL";
  if (dryRun) {
    process.stdout.write(result.stateYaml);
    process.stdout.write("\n");
    process.stderr.write(`goalbuddy-ready-mode dry-run quality-check: ${status}\n`);
    return;
  }
  process.stdout.write(`Ready Mode board written to ${result.outDir}\n`);
  process.stdout.write(`Quality check: ${status}\n`);
  for (const [name, filePath] of Object.entries(result.files)) {
    process.stdout.write(`- ${name}: ${filePath}\n`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(HELP_TEXT);
    return;
  }
  const result = args.dryRun ? buildReadyModeArtifacts(args) : writeReadyModeArtifacts(args);
  if (args.json) {
    process.stdout.write(JSON.stringify(result, null, 2));
    process.stdout.write("\n");
  } else {
    printHuman(result, args.dryRun);
  }

  if (!result.check.ok) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
