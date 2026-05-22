#!/usr/bin/env node

import { existsSync, readFileSync, realpathSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const TEST_FILE_RE = /(^|[/\\])(__tests__|tests?|spec|e2e)([/\\]|$)|\.(test|spec)\.[cm]?[jt]sx?$/i;
const TEST_COMMAND_RE = /\b(test|vitest|jest|playwright|cypress|node --test|pytest|go test|cargo test|rspec|phpunit|mix test|dotnet test|swift test)\b/i;
const DOC_OR_CONFIG_RE = /\b(docs?-only|documentation-only|readme-only|config-only|generated-artifact-only|test-only|read-only|non-behavioral)\b/i;
const RED_RE = /\b(red_test|red test|failed_as_expected|expected_fail|expected fail|expected red|expected failure)\b/i;
const GREEN_RE = /\b(green_test|green test|green verification)\b/i;
const COMMIT_RE = /\b(commit_sha|commit sha|commit|sha)\b[^A-Za-z0-9]{0,20}[0-9a-f]{7,40}\b/i;
const REMOTE_RE = /\b(remote_branch|remote branch|origin\/|pushed branch|branch)\b/i;
const PUSH_RE = /\b(push_result|push result|pushed|push succeeded|successful push|successfully pushed|status:\s*(pass|passed|success|ok))\b/i;
const PUSH_STRING_RE = /\bpush:\s*["']?(origin|upstream)\s+[\w./-]+\s+(successful|success|pushed|ok)["']?/i;
const SHIPPING_BLOCKER_RE = /\bshipping_blocker\b.*\b(no_git_repository|no_github_remote)\b|\b(no_git_repository|no_github_remote)\b|\bnot a git repository\b|\bno github remote\b/i;
const IMPACT_RE = /\bimpact_assessment\b|\bimpact_assessment_ref\b|\bimpact assessment\b/i;
const IMPACT_STOP_RE =
  /\b(db|database|migration|schema|backfill|env|secret|rls|auth|permission|deploy|rollback|background job|cron|queue|external service)\b/i;
const IMPACT_DIMENSIONS = [
  "db_schema_migrations",
  "data_backfill",
  "env_secrets",
  "auth_permissions",
  "api_contract",
  "ui_routes",
  "background_jobs",
  "external_services",
  "deploy_rollback",
  "observability",
  "docs",
];
const POLICY_MODES = new Set([
  "implementation",
  "bugfix",
  "refactor",
  "audit_read_only",
  "verification",
  "research",
  "docs",
  "infra",
  "data_migration",
  "frontend",
  "release",
]);
const MIGRATION_FILE_RE = /(^|[/\\])(migrations?|supabase[/\\]migrations|prisma[/\\]migrations|db[/\\]migrations)([/\\]|$)|\.(sql)$/i;
const FRONTEND_FILE_RE = /(^|[/\\])(app|pages|components|src[/\\]components|e2e)([/\\]|$)|\.(tsx|jsx|css|scss)$/i;
const INFRA_FILE_RE = /(^|[/\\])(\.github[/\\]workflows|docker|infra|terraform|k8s|helm)([/\\]|$)|(^|[/\\])(Dockerfile|docker-compose\.ya?ml|wrangler\.jsonc?|vercel\.json|netlify\.toml)$/i;
const DOC_FILE_RE = /(^|[/\\])(docs?|README\.md|CHANGELOG\.md)([/\\]|$)|\.(md|mdx|adoc|rst)$/i;
const DEPENDENCY_FILE_RE = /(^|[/\\])(package\.json|package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|Cargo\.toml|Cargo\.lock|go\.mod|go\.sum|requirements.*\.txt|pyproject\.toml|poetry\.lock)$/i;
const VISUAL_RE = /\b(screenshot|playwright|visual|mobile|desktop|accessibility|a11y)\b/i;
const MIGRATION_RE = /\b(migration_proof|migration file|migration applied|rollback|backfill|rls|generated types|sql lint)\b/i;
const INFRA_RE = /\b(infra_proof|dry[- ]run|config validation|rollback|secret|env|ci validation)\b/i;
const DEPENDENCY_RE = /\b(dependency_review|lockfile|license|vulnerab|bundle size|package added)\b/i;
const REFACTOR_RE = /\b(behavior_unchanged|characterization|public behavior unchanged|no behavior change)\b/i;
const VERIFICATION_RE = /\b(verification|test result|commands?:|browser check|e2e|playwright|vitest|safe verification|tested surfaces)\b/i;
const DESIGN_CONCEPT_RE = /\bdesign_concept\b|\bshared design concept\b/i;
const UBIQUITOUS_LANGUAGE_RE = /\bubiquitous_language\b|\bubiquitous language\b|\bshared language\b/i;
const FEEDBACK_POLICY_RE = /\bfeedback_policy\b|\bfeedback cadence\b|\brate of feedback\b|\bfeedback loop\b/i;
const TEST_STRATEGY_RE = /\btest_strategy\b|\btest strategy\b|\btesting strategy\b/i;
const MODULE_MAP_RE = /\bmodule_map\b|\bmodule map\b|\bdeep module\b|\bmodule boundary\b/i;
const INTERFACE_CONTRACT_RE = /\binterface_contract\b|\binterface contract\b|\bpublic interface\b|\bboundary interface\b/i;
const ARCHITECTURE_REVIEW_RE = /\barchitecture_review\b|\barchitecture review\b|\bdesign review\b|\bdeep-module review\b/i;
const DESIGN_DELTA_RE = /\bdesign_delta\b|\bdesign delta\b|\bdesign investment\b/i;

export function checkStateText(text, options = {}) {
  const mode = options.final ? "final" : "progress";
  const errors = [];
  const warnings = [];
  errors.push(...findStructuralYamlErrors(text));
  const tasks = parseTasks(text);
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const goalStatus = scalarAtIndent(text, "goal", "status") || scalarTopLevel(text, "status");
  const goalKind = scalarAtIndent(text, "goal", "kind");
  const proofType = scalarAnywhere(text, "proof_type");
  const policy = classifyGoalPolicy(text, { goalKind, proofType, tasks });
  const readOnlyAudit = policy.readOnly;

  requireMatch(errors, text, /^version:\s*2\s*$/m, "state.yaml must declare version: 2");
  requireMatch(errors, text, /^\s{2}require_quality_checker:\s*true\s*$/m, "rules.require_quality_checker must be true");
  if (!policy.explicit) {
    warnings.push(`goal_policy missing; inferred mode=${policy.mode}`);
  }
  if (policy.explicit && !POLICY_MODES.has(policy.mode)) {
    errors.push(`goal_policy.mode is unsupported: ${policy.mode}`);
  }
  if (policy.mode === "audit_read_only" && !policy.readOnly) {
    errors.push("goal_policy.mode audit_read_only is invalid once Worker work starts or changed_files exist");
  }
  if (policy.mode === "verification" && allChangedFiles(tasks).length > 0) {
    errors.push("goal_policy.mode verification must not change files; switch to implementation for fixes");
  }

  if (policy.requiresTdd) {
    requireMatch(errors, text, /^\s{2}require_tdd_worker_flow:\s*true\s*$/m, "rules.require_tdd_worker_flow must be true");
  }
  if (policy.requiresShipping) {
    requireMatch(errors, text, /^\s{2}require_github_ship_task:\s*true\s*$/m, "rules.require_github_ship_task must be true");
  }
  if (policy.requiresImpactAssessment) {
    requireMatch(errors, text, /^\s{2}require_impact_assessment:\s*true\s*$/m, "rules.require_impact_assessment must be true");
  }

  const impact = findImpactAssessment(tasks);
  const workerStarted = tasks.some((task) => task.type === "worker" && ["active", "done"].includes(task.status));
  if (policy.requiresImpactAssessment && workerStarted && !impact.present) {
    errors.push("Worker work started before a completed impact_assessment receipt");
  }
  if (policy.requiresImpactAssessment && impact.present && impact.missingDimensions.length > 0) {
    errors.push(`impact_assessment missing dimensions: ${impact.missingDimensions.join(", ")}`);
  }

  const shippingTask = taskById.get("T998");
  if (policy.requiresShipping && !shippingTask) {
    errors.push("missing mandatory T998 GitHub shipping task");
  } else if (policy.requiresShipping) {
    requireTaskText(
      errors,
      shippingTask,
      /commit all goal-related changes|commit/i,
      "T998 must require a commit",
    );
    requireTaskText(
      errors,
      shippingTask,
      /push the current branch|push/i,
      "T998 must require a push",
    );
  }

  const finalTask = taskById.get("T999");
  if (!finalTask) {
    errors.push("missing T999 final audit task");
  } else if (policy.requiresShipping) {
    requireTaskText(
      errors,
      finalTask,
      /T998.*commit SHA.*push result|commit SHA.*successful push/i,
      "T999 must reject completion unless T998 has commit and push proof",
    );
  }

  const tddCycle = collectTddCycle(tasks);
  for (const task of tasks.filter((candidate) => candidate.type === "worker")) {
    checkWorkerTask(task, policy, tddCycle, errors, warnings);
  }

  const finalMode = mode === "final" || goalStatus === "done" || goalStatus === "complete";
  if (finalMode) {
    checkFinalState(tasks, taskById, policy, errors, warnings);
  }
  checkActiveWorkflowShape(tasks, policy, errors);

  return {
    ok: errors.length === 0,
    mode,
    goal_status: goalStatus || "unknown",
    goal_kind: goalKind || "unknown",
    goal_policy: policy,
    read_only_audit: readOnlyAudit,
    task_count: tasks.length,
    errors,
    warnings,
  };
}

export function checkStateFile(path, options = {}) {
  if (!existsSync(path)) {
    return {
      ok: false,
      mode: options.final ? "final" : "progress",
      goal_status: "unknown",
      task_count: 0,
      errors: [`state file not found: ${path}`],
      warnings: [],
    };
  }

  return checkStateText(readFileSync(path, "utf8"), options);
}

function parseTasks(text) {
  const lines = text.split(/\r?\n/);
  const starts = [];

  for (let i = 0; i < lines.length; i += 1) {
    if (/^\s{2}- id:\s*/.test(lines[i])) starts.push(i);
  }

  return starts.map((start, index) => {
    const end = starts[index + 1] ?? lines.length;
    const raw = lines.slice(start, end).join("\n");
    return {
      id: clean(raw.match(/^\s{2}- id:\s*([^\s#]+)/m)?.[1]),
      type: clean(raw.match(/^\s{4}type:\s*([^\s#]+)/m)?.[1]),
      status: clean(raw.match(/^\s{4}status:\s*([^\s#]+)/m)?.[1]),
      objective: clean(raw.match(/^\s{4}objective:\s*(.*)$/m)?.[1]),
      allowedFiles: listForKey(raw, "allowed_files"),
      verify: listForKey(raw, "verify"),
      stopIf: listForKey(raw, "stop_if"),
      changedFiles: listForReceiptKey(raw, "changed_files"),
      commands: listForReceiptKey(raw, "commands"),
      receipt: receiptText(raw),
      raw,
    };
  });
}

function findStructuralYamlErrors(text) {
  const errors = [];
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length - 1; index += 1) {
    const inlineEmptyList = lines[index].match(/^(\s+)([A-Za-z0-9_-]+):\s*\[\]\s*$/);
    if (!inlineEmptyList) continue;

    const currentIndent = inlineEmptyList[1].length;
    for (let next = index + 1; next < lines.length; next += 1) {
      if (!lines[next].trim()) continue;
      const nextIndent = lines[next].match(/^(\s*)/)?.[1].length ?? 0;
      if (nextIndent <= currentIndent) break;
      if (/^\s+-\s+/.test(lines[next])) {
        errors.push(
          `invalid YAML shape near ${inlineEmptyList[2]}: inline [] cannot also have nested list items`,
        );
      }
      break;
    }
  }
  return errors;
}

function checkWorkerTask(task, policy, tddCycle, errors, warnings) {
  const exempt = isTddExempt(task);

  if (task.status === "active") {
    if (task.allowedFiles.length === 0 && policy.mode !== "verification") errors.push(`active Worker ${task.id} missing allowed_files`);
    if (task.verify.length === 0) errors.push(`active Worker ${task.id} missing verify commands`);
  }

  if (task.status === "active" && policy.requiresTdd && !exempt) {
    if (!hasTestFile(task.allowedFiles)) errors.push(`active Worker ${task.id} allowed_files must include a test file`);
    if (!hasTestCommand(task.verify)) errors.push(`active Worker ${task.id} verify must include a targeted test command`);
    if (!hasNoTestStopCondition(task.stopIf)) {
      errors.push(`active Worker ${task.id} stop_if must include "No meaningful failing test can be written"`);
    }
  }

  if (task.status === "active" && policy.requiresImpactAssessment && !exempt) {
    if (!IMPACT_RE.test(task.raw)) errors.push(`active Worker ${task.id} must reference the completed impact_assessment`);
    if (!hasOperationalStopCondition(task.stopIf)) {
      errors.push(`active Worker ${task.id} stop_if must mention operational impacts such as migrations, env/secrets, auth/RLS, deploy, or rollback`);
    }
  }

  if (task.status !== "done" || exempt) return;

  const evidence = `${task.raw}\n${task.receipt}`;
  if (policy.mode === "verification") {
    if (task.changedFiles.length > 0) {
      errors.push(`verification Worker ${task.id} must not report changed_files`);
    }
    if (!hasVerificationEvidence(task)) {
      errors.push(`verification Worker ${task.id} missing command or browser verification evidence`);
    }
  }

  if (policy.requiresTdd) {
    if (!hasTestFile([...task.allowedFiles, ...task.changedFiles])) {
      errors.push(`done Worker ${task.id} lacks test file evidence in allowed_files or changed_files`);
    }
    const role = workerRole(task);
    if (role === "red_test") {
      if (!hasRedEvidence(task)) errors.push(`done Worker ${task.id} missing red test evidence`);
    } else if (role === "polish" || role === "shipping" || role === "verification") {
      if (!tddCycle.hasRed || !tddCycle.hasGreen) {
        errors.push(`done Worker ${task.id} missing completed goal-level TDD cycle evidence`);
      }
    } else {
      if (!hasRedEvidence(task) && !tddCycle.hasRed) {
        errors.push(`done Worker ${task.id} missing red test evidence`);
      }
      if (!hasGreenEvidence(task)) {
        errors.push(`done Worker ${task.id} missing green test evidence`);
      }
    }
    if (!hasTestCommand([...task.verify, ...task.commands]) && !TEST_COMMAND_RE.test(evidence)) {
      errors.push(`done Worker ${task.id} missing test command evidence`);
    }
  }

  if (policy.requiresImpactAssessment && !IMPACT_RE.test(evidence)) {
    errors.push(`done Worker ${task.id} missing impact_assessment reference`);
  }
  if (!/changed_files:/i.test(task.receipt) && task.changedFiles.length === 0) {
    warnings.push(`done Worker ${task.id} receipt should list changed_files`);
  }
}

function checkFinalState(tasks, taskById, policy, errors, warnings) {
  const unfinishedWorkers = tasks
    .filter((task) => task.type === "worker" && task.status !== "done" && task.status !== "blocked")
    .map((task) => task.id);

  if (!policy.readOnly && unfinishedWorkers.length > 0) {
    errors.push(`final state has unfinished Worker tasks: ${unfinishedWorkers.join(", ")}`);
  }

  if (policy.readOnly) {
    if (!hasAuditFinalEvidence(tasks)) {
      errors.push("final read-only audit missing audit_scope, audit_findings, review, or decision receipt");
    }
    return;
  }

  if (policy.mode === "verification" && !hasVerificationFinalEvidence(tasks)) {
    errors.push("final verification goal missing test/browser command evidence");
  }

  if (policy.requiresImpactAssessment) {
    const impact = findImpactAssessment(tasks);
    if (!impact.present) {
      errors.push("final state missing completed impact_assessment receipt");
    } else if (impact.missingDimensions.length > 0) {
      errors.push(`final impact_assessment missing dimensions: ${impact.missingDimensions.join(", ")}`);
    }
  }

  checkPolicySpecificFinalEvidence(tasks, policy, errors);

  if (!policy.requiresShipping) return;

  const shippingTask = taskById.get("T998");
  if (!shippingTask) return;

  if (shippingTask.status !== "done") {
    if (shippingTask.status === "blocked" && hasExplicitShippingBlocker(shippingTask.receipt || shippingTask.raw)) {
      return;
    }
    errors.push(`T998 must be done before final completion; got ${shippingTask.status || "unknown"}`);
    return;
  }

  const receipt = shippingTask.receipt || shippingTask.raw;
  if (!COMMIT_RE.test(receipt)) errors.push("T998 receipt missing commit SHA");
  if (!hasRemoteEvidence(receipt)) errors.push("T998 receipt missing remote branch");
  if (!hasPushEvidence(receipt)) errors.push("T998 receipt missing successful push result");

  const finalTask = taskById.get("T999");
  if (finalTask?.status === "done" && !/complete|full_outcome_complete:\s*true/i.test(finalTask.receipt || "")) {
    warnings.push("T999 is done but receipt does not clearly say full_outcome_complete: true");
  }
}

function classifyGoalPolicy(text, { goalKind, proofType, tasks }) {
  const changedFiles = allChangedFiles(tasks);
  const modeFromYaml = scalarAtIndent(text, "goal_policy", "mode");
  const explicitMode = modeFromYaml && POLICY_MODES.has(modeFromYaml) ? modeFromYaml : null;
  const inferredMode = inferMode({ goalKind, proofType, tasks, changedFiles });
  const mode = explicitMode || modeFromYaml || inferredMode;
  const defaults = defaultPolicyForMode(mode, { changedFiles, tasks });
  const readOnly = mode === "audit_read_only" && isReadOnlyAuditGoal({ goalKind, proofType, tasks });

  return {
    explicit: Boolean(modeFromYaml),
    mode,
    readOnly,
    requiresTdd: boolPolicy(text, "requires_tdd", defaults.requiresTdd),
    requiresImpactAssessment: boolPolicy(text, "requires_impact_assessment", defaults.requiresImpactAssessment),
    requiresShipping: boolPolicy(text, "requires_shipping", defaults.requiresShipping),
    requiresVisualVerification: boolPolicy(text, "requires_visual_verification", defaults.requiresVisualVerification),
    requiresMigrationProof: boolPolicy(text, "requires_migration_proof", defaults.requiresMigrationProof),
    requiresInfraProof: boolPolicy(text, "requires_infra_proof", defaults.requiresInfraProof),
    requiresDependencyReview: boolPolicy(text, "requires_dependency_review", defaults.requiresDependencyReview),
    requiresDirtyWorktreeGuard: boolPolicy(text, "requires_dirty_worktree_guard", defaults.requiresDirtyWorktreeGuard),
    requiresRefactorProof: boolPolicy(text, "requires_refactor_proof", defaults.requiresRefactorProof),
    requiresDesignConcept: boolWorkflow(text, "requires_design_concept", defaults.requiresDesignConcept),
    requiresUbiquitousLanguage: boolWorkflow(text, "requires_ubiquitous_language", defaults.requiresUbiquitousLanguage),
    requiresFeedbackPolicy: boolWorkflow(text, "requires_feedback_policy", defaults.requiresFeedbackPolicy),
    requiresTestStrategy: boolWorkflow(text, "requires_test_strategy", defaults.requiresTestStrategy),
    requiresModuleMap: boolWorkflow(text, "requires_module_map", defaults.requiresModuleMap),
    requiresInterfaceContract: boolWorkflow(text, "requires_interface_contract", defaults.requiresInterfaceContract),
    requiresArchitectureReview: boolWorkflow(text, "requires_architecture_review", defaults.requiresArchitectureReview),
    requiresDesignDelta: boolWorkflow(text, "requires_design_delta", defaults.requiresDesignDelta),
  };
}

function inferMode({ goalKind, proofType, tasks, changedFiles }) {
  if (isReadOnlyAuditGoal({ goalKind, proofType, tasks })) return "audit_read_only";
  if (changedFiles.length === 0 && proofType === "test") return "verification";
  if (changedFiles.some((file) => MIGRATION_FILE_RE.test(file))) return "data_migration";
  if (changedFiles.some((file) => INFRA_FILE_RE.test(file))) return "infra";
  if (changedFiles.some((file) => FRONTEND_FILE_RE.test(file))) return "frontend";
  if (changedFiles.length > 0 && changedFiles.every((file) => DOC_FILE_RE.test(file))) return "docs";
  if (goalKind === "audit") return "implementation";
  return "implementation";
}

function defaultPolicyForMode(mode, { changedFiles }) {
  const changed = changedFiles.length > 0;
  const defaults = {
    requiresTdd: true,
    requiresImpactAssessment: true,
    requiresShipping: true,
    requiresVisualVerification: false,
    requiresMigrationProof: false,
    requiresInfraProof: false,
    requiresDependencyReview: changedFiles.some((file) => DEPENDENCY_FILE_RE.test(file)),
    requiresDirtyWorktreeGuard: true,
    requiresRefactorProof: false,
    requiresDesignConcept: true,
    requiresUbiquitousLanguage: true,
    requiresFeedbackPolicy: true,
    requiresTestStrategy: true,
    requiresModuleMap: true,
    requiresInterfaceContract: true,
    requiresArchitectureReview: true,
    requiresDesignDelta: true,
  };

  if (mode === "audit_read_only" || mode === "research") {
    return {
      ...defaults,
      requiresTdd: false,
      requiresImpactAssessment: false,
      requiresShipping: changed,
      requiresDirtyWorktreeGuard: changed,
      requiresDesignConcept: false,
      requiresUbiquitousLanguage: false,
      requiresFeedbackPolicy: false,
      requiresTestStrategy: false,
      requiresModuleMap: false,
      requiresInterfaceContract: false,
      requiresArchitectureReview: false,
      requiresDesignDelta: false,
    };
  }
  if (mode === "verification") {
    return {
      ...defaults,
      requiresTdd: false,
      requiresImpactAssessment: true,
      requiresShipping: false,
      requiresDirtyWorktreeGuard: true,
      requiresDesignConcept: false,
      requiresUbiquitousLanguage: false,
      requiresFeedbackPolicy: false,
      requiresTestStrategy: false,
      requiresModuleMap: false,
      requiresInterfaceContract: false,
      requiresArchitectureReview: false,
      requiresDesignDelta: false,
    };
  }
  if (mode === "docs") {
    return {
      ...defaults,
      requiresTdd: false,
      requiresImpactAssessment: false,
      requiresShipping: changed,
      requiresDesignConcept: false,
      requiresUbiquitousLanguage: false,
      requiresFeedbackPolicy: false,
      requiresTestStrategy: false,
      requiresModuleMap: false,
      requiresInterfaceContract: false,
      requiresArchitectureReview: false,
      requiresDesignDelta: false,
    };
  }
  if (mode === "refactor") {
    return { ...defaults, requiresTdd: false, requiresRefactorProof: true };
  }
  if (mode === "infra" || mode === "release") {
    return {
      ...defaults,
      requiresTdd: false,
      requiresInfraProof: true,
      requiresDesignConcept: false,
      requiresUbiquitousLanguage: false,
      requiresFeedbackPolicy: true,
      requiresTestStrategy: false,
      requiresModuleMap: false,
      requiresInterfaceContract: false,
      requiresArchitectureReview: false,
      requiresDesignDelta: false,
    };
  }
  if (mode === "data_migration") {
    return { ...defaults, requiresMigrationProof: true };
  }
  if (mode === "frontend") {
    return { ...defaults, requiresVisualVerification: true };
  }
  return defaults;
}

function checkPolicySpecificFinalEvidence(tasks, policy, errors) {
  const evidence = tasks.map((task) => `${task.raw}\n${task.receipt}`).join("\n");
  if (policy.mode === "verification" && !VERIFICATION_RE.test(evidence)) {
    errors.push("final state missing verification evidence");
  }
  if (policy.requiresMigrationProof && !MIGRATION_RE.test(evidence)) {
    errors.push("final state missing migration_proof evidence");
  }
  if (policy.requiresVisualVerification && !VISUAL_RE.test(evidence)) {
    errors.push("final state missing visual verification evidence");
  }
  if (policy.requiresInfraProof && !INFRA_RE.test(evidence)) {
    errors.push("final state missing infra_proof evidence");
  }
  if (policy.requiresDependencyReview && !DEPENDENCY_RE.test(evidence)) {
    errors.push("final state missing dependency_review evidence");
  }
  if (policy.requiresRefactorProof && !REFACTOR_RE.test(evidence)) {
    errors.push("final state missing refactor behavior_unchanged or characterization evidence");
  }
  checkWorkflowEvidence(evidence, policy, errors);
}

function boolPolicy(text, key, fallback) {
  const value = scalarAtIndent(text, "goal_policy", key);
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function boolWorkflow(text, key, fallback) {
  const value = scalarAtIndent(text, "workflow_safeguards", key);
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function checkWorkflowEvidence(evidence, policy, errors) {
  const required = [
    ["requiresDesignConcept", "design_concept", DESIGN_CONCEPT_RE],
    ["requiresUbiquitousLanguage", "ubiquitous_language", UBIQUITOUS_LANGUAGE_RE],
    ["requiresFeedbackPolicy", "feedback_policy", FEEDBACK_POLICY_RE],
    ["requiresTestStrategy", "test_strategy", TEST_STRATEGY_RE],
    ["requiresModuleMap", "module_map", MODULE_MAP_RE],
    ["requiresInterfaceContract", "interface_contract", INTERFACE_CONTRACT_RE],
    ["requiresArchitectureReview", "architecture_review", ARCHITECTURE_REVIEW_RE],
    ["requiresDesignDelta", "design_delta", DESIGN_DELTA_RE],
  ];

  for (const [policyKey, label, regex] of required) {
    if (policy[policyKey] && !regex.test(evidence)) {
      errors.push(`final state missing ${label} evidence`);
    }
  }
}

function checkActiveWorkflowShape(tasks, policy, errors) {
  const activeWorkers = tasks.filter((task) => task.type === "worker" && task.status === "active");
  for (const task of activeWorkers) {
    const evidence = task.raw;
    if (policy.requiresFeedbackPolicy && !FEEDBACK_POLICY_RE.test(evidence)) {
      errors.push(`active Worker ${task.id} missing feedback_policy input or contract`);
    }
    if (policy.requiresTestStrategy && !TEST_STRATEGY_RE.test(evidence)) {
      errors.push(`active Worker ${task.id} missing test_strategy input or contract`);
    }
    if (policy.requiresInterfaceContract && !INTERFACE_CONTRACT_RE.test(evidence)) {
      errors.push(`active Worker ${task.id} missing interface_contract input or contract`);
    }
  }
}

function allChangedFiles(tasks) {
  return tasks.flatMap((task) => task.changedFiles);
}

function isReadOnlyAuditGoal({ goalKind, proofType, tasks }) {
  const auditIntent =
    goalKind === "audit" || ["review", "source_backed_answer", "decision"].includes(proofType || "");
  if (!auditIntent) return false;

  const hasWorkerTasks = tasks.some((task) => task.type === "worker");
  if (hasWorkerTasks) return false;

  const changedFiles = tasks.some((task) => task.changedFiles.length > 0 || /^\s{6}changed_files:\s*\n\s*-/m.test(task.receipt));
  return !changedFiles;
}

function hasVerificationEvidence(task) {
  const evidence = `${task.raw}\n${task.receipt}`;
  return task.commands.length > 0 || TEST_COMMAND_RE.test(evidence) || VISUAL_RE.test(evidence) || VERIFICATION_RE.test(evidence);
}

function collectTddCycle(tasks) {
  const doneWorkers = tasks.filter((task) => task.type === "worker" && task.status === "done" && !isTddExempt(task));
  return {
    hasRed: doneWorkers.some((task) => hasRedEvidence(task)),
    hasGreen: doneWorkers.some((task) => hasGreenEvidence(task)),
  };
}

function workerRole(task) {
  const declared = clean(task.raw.match(/\bworker_kind:\s*([^\s#]+)/i)?.[1] || task.raw.match(/\bphase:\s*([^\s#]+)/i)?.[1]);
  const intent = `${declared}\n${task.objective}`;
  if (/red_only|red_test|failing_tests?|write failing|tests rouges?/i.test(intent) || /expected_fail/i.test(task.receipt)) {
    return "red_test";
  }
  if (/polish|ui feedback|user-facing feedback|copy polish|non-behavioral/i.test(intent)) return "polish";
  if (/shipping|ship verified|commit and push|push when/i.test(intent)) return "shipping";
  if (/verification|test-only|browser check/i.test(intent)) return "verification";
  return "implementation";
}

function hasRedEvidence(task) {
  const evidence = `${task.raw}\n${task.receipt}`;
  return RED_RE.test(evidence);
}

function hasGreenEvidence(task) {
  const evidence = `${task.raw}\n${task.receipt}`;
  if (GREEN_RE.test(evidence)) return true;
  if (!TEST_COMMAND_RE.test(evidence)) return false;
  return /\bstatus:\s*["']?(pass|passed|success|ok)["']?\b/i.test(evidence);
}

function hasRemoteEvidence(receipt) {
  return REMOTE_RE.test(receipt) || PUSH_STRING_RE.test(receipt);
}

function hasPushEvidence(receipt) {
  return PUSH_RE.test(receipt) || PUSH_STRING_RE.test(receipt);
}

function hasExplicitShippingBlocker(receipt) {
  return SHIPPING_BLOCKER_RE.test(receipt) && /\b(result:\s*blocked|status:\s*failed|blocked)\b/i.test(receipt);
}

function hasVerificationFinalEvidence(tasks) {
  return tasks.some((task) => ["worker", "scout", "judge", "pm"].includes(task.type) && task.status === "done" && hasVerificationEvidence(task));
}

function hasAuditFinalEvidence(tasks) {
  return tasks.some((task) => {
    if (!["scout", "judge", "pm"].includes(task.type) || task.status !== "done") return false;
    return /\b(audit_scope|audit_findings|review|source_backed_answer|decision)\b/i.test(`${task.raw}\n${task.receipt}`);
  });
}

function findImpactAssessment(tasks) {
  const evidenceTasks = tasks.filter(
    (task) => ["scout", "judge", "pm"].includes(task.type) && task.status === "done" && IMPACT_RE.test(task.receipt || task.raw),
  );

  const evidence = evidenceTasks.map((task) => `${task.raw}\n${task.receipt}`).join("\n");
  if (!evidence) return { present: false, missingDimensions: IMPACT_DIMENSIONS };

  return {
    present: true,
    missingDimensions: IMPACT_DIMENSIONS.filter((dimension) => !new RegExp(`\\b${escapeRegExp(dimension)}\\b`, "i").test(evidence)),
  };
}

function requireMatch(errors, text, regex, message) {
  if (!regex.test(text)) errors.push(message);
}

function requireTaskText(errors, task, regex, message) {
  if (!regex.test(task.raw)) errors.push(message);
}

function scalarAtIndent(text, parent, key) {
  const lines = text.split(/\r?\n/);
  const parentIndex = lines.findIndex((line) => line === `${parent}:`);
  if (parentIndex === -1) return null;

  for (let i = parentIndex + 1; i < lines.length; i += 1) {
    if (/^\S/.test(lines[i])) return null;
    const match = lines[i].match(new RegExp(`^\\s{2}${key}:\\s*([^#]+)`));
    if (match) return clean(match[1]);
  }

  return null;
}

function scalarTopLevel(text, key) {
  return clean(text.match(new RegExp(`^${key}:\\s*([^#]+)`, "m"))?.[1]);
}

function scalarAnywhere(text, key) {
  return clean(text.match(new RegExp(`^\\s+${key}:\\s*([^#]+)`, "m"))?.[1]);
}

function listForKey(raw, key) {
  return listAfter(raw, new RegExp(`^\\s{4}${escapeRegExp(key)}:\\s*$`, "m"), /^ {4}\S/m);
}

function listForReceiptKey(raw, key) {
  return listAfter(raw, new RegExp(`^\\s{6}${escapeRegExp(key)}:\\s*$`, "m"), /^ {4}\S/m);
}

function listAfter(raw, startRe, stopRe) {
  const lines = raw.split(/\r?\n/);
  const start = lines.findIndex((line) => startRe.test(line));
  if (start === -1) return [];

  const values = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (stopRe.test(line)) break;

    const item = line.match(/^\s*-\s*(.*)$/);
    if (item) values.push(clean(item[1]));
    const cmd = line.match(/^\s*-\s*cmd:\s*(.*)$/);
    if (cmd) values.push(clean(cmd[1]));
  }

  return values.filter(Boolean);
}

function receiptText(raw) {
  const lines = raw.split(/\r?\n/);
  const start = lines.findIndex((line) => /^\s{4}receipt:\s*/.test(line));
  if (start === -1) return "";
  return lines.slice(start).join("\n");
}

function isTddExempt(task) {
  return DOC_OR_CONFIG_RE.test(`${task.objective}\n${task.raw}`);
}

function hasTestFile(files) {
  return files.some((file) => TEST_FILE_RE.test(file));
}

function hasTestCommand(commands) {
  return commands.some((command) => TEST_COMMAND_RE.test(command));
}

function hasNoTestStopCondition(stopIf) {
  return stopIf.some((condition) =>
    /no meaningful failing test can be written|cannot express .*deterministic tests?|cannot write .*meaningful test|no deterministic test can be written/i.test(
      condition,
    ),
  );
}

function hasOperationalStopCondition(stopIf) {
  return stopIf.some((condition) => IMPACT_STOP_RE.test(condition));
}

function clean(value) {
  if (!value) return "";
  return value
    .trim()
    .replace(/\s+#.*$/, "")
    .replace(/^["']|["']$/g, "")
    .trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function printHuman(result, statePath) {
  const label = result.ok ? "PASS" : "FAIL";
  console.log(`${label} goalbuddy-quality-check ${statePath}`);
  console.log(`mode=${result.mode} goal_status=${result.goal_status} tasks=${result.task_count}`);

  for (const error of result.errors) console.log(`ERROR ${error}`);
  for (const warning of result.warnings) console.log(`WARN ${warning}`);
}

function parseCli(argv) {
  const help = argv.includes("--help") || argv.includes("-h");
  const json = argv.includes("--json");
  const final = argv.includes("--final");
  const statePath = argv.find((arg) => !arg.startsWith("-"));
  return { help, json, final, statePath };
}

const HELP_TEXT = `Usage:
  goalbuddy-check [--final] [--json] docs/goals/<slug>/state.yaml
  npm run check -- [--final] docs/goals/<slug>/state.yaml

Validate a GoalBuddy state.yaml for oracle, policy, TDD, impact, shipping, and final audit evidence.

Options:
  --final       Enforce final-completion checks even when goal.status is not done.
  --json        Print machine-readable output.
  -h, --help    Show this help.
`;

async function main() {
  const { help, json, final, statePath } = parseCli(process.argv.slice(2));
  if (help) {
    console.log(HELP_TEXT.trimEnd());
    return;
  }
  if (!statePath) {
    console.error("Usage: goalbuddy-check [--final] [--json] docs/goals/<slug>/state.yaml");
    process.exitCode = 2;
    return;
  }

  const resolved = resolve(statePath);
  const result = checkStateFile(resolved, { final });

  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printHuman(result, resolved);
  }

  process.exitCode = result.ok ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  await main();
}
