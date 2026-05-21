#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { checkStateText } from "./goalbuddy-quality-check.mjs";

const dryRun = process.argv.includes("--dry-run");

export function repairStateText(text) {
  let next = text;
  next = ensureRules(next);
  next = ensureGoalPolicy(next);
  next = ensureWorkflowSafeguards(next);
  next = ensureScoutImpactAssessment(next);
  next = ensureScoutWorkflowOutputs(next);
  next = ensureJudgeWorkflowOutputs(next);
  next = ensureWorkerContracts(next);
  next = ensureWorkerWorkflowInputs(next);
  next = ensureShippingTask(next);
  next = ensureShippingTaskShape(next);
  next = ensureFinalAuditTask(next);
  next = ensureFinalAuditWorkflow(next);
  return next;
}

function ensureRules(text) {
  const required = [
    "  require_quality_checker: true",
    "  require_tdd_worker_flow: true",
    "  require_github_ship_task: true",
    "  require_impact_assessment: true",
    "  allow_read_only_goal_without_shipping: true",
  ];

  if (!/^rules:\s*$/m.test(text)) {
    const block = `rules:
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
${required.join("\n")}

`;
    return insertBeforeTopSection(text, ["goal_policy:", "agents:", "visual_board:", "active_task:", "tasks:"], block);
  }

  let next = text;
  for (const line of required) {
    const key = line.trim().split(":")[0];
    const re = new RegExp(`^\\s{2}${escapeRegExp(key)}:\\s*`, "m");
    if (re.test(next)) {
      next = next.replace(re, `${line}\n# goalbuddy-board-repair normalized duplicate: `).replace(new RegExp(`^${escapeRegExp(line)}\\n# goalbuddy-board-repair normalized duplicate: .*\\n?`, "m"), `${line}\n`);
      continue;
    }
    next = insertIntoSection(next, "rules", `${line}\n`);
  }
  return next;
}

function ensureGoalPolicy(text) {
  const inferred = inferPolicyMode(text);
  const shipping = inferred === "audit_read_only" || inferred === "verification" || inferred === "research" ? "false" : "true";
  const tdd = inferred === "implementation" || inferred === "bugfix" || inferred === "data_migration" || inferred === "frontend" ? "true" : "false";
  const impact = inferred === "audit_read_only" || inferred === "research" || inferred === "docs" ? "false" : "true";
  const visual = inferred === "frontend" || inferred === "verification" ? "true" : "false";
  const migration = inferred === "data_migration" ? "true" : "false";

  if (!/^goal_policy:\s*$/m.test(text)) {
    const block = `goal_policy:
  # implementation | bugfix | refactor | audit_read_only | verification | research | docs | infra | data_migration | frontend | release
  mode: ${inferred}
  requires_tdd: ${tdd}
  requires_impact_assessment: ${impact}
  requires_shipping: ${shipping}
  requires_visual_verification: ${visual}
  requires_migration_proof: ${migration}
  requires_infra_proof: ${inferred === "infra" || inferred === "release" ? "true" : "false"}
  requires_dependency_review: false
  requires_dirty_worktree_guard: true
  requires_refactor_proof: ${inferred === "refactor" ? "true" : "false"}

`;
    return insertBeforeTopSection(text, ["agents:", "visual_board:", "active_task:", "tasks:"], block);
  }

  let next = text;
  const policyLines = [
    ["mode", inferred],
    ["requires_tdd", tdd],
    ["requires_impact_assessment", impact],
    ["requires_shipping", shipping],
    ["requires_visual_verification", visual],
    ["requires_migration_proof", migration],
    ["requires_infra_proof", inferred === "infra" || inferred === "release" ? "true" : "false"],
    ["requires_dependency_review", "false"],
    ["requires_dirty_worktree_guard", "true"],
    ["requires_refactor_proof", inferred === "refactor" ? "true" : "false"],
  ];

  for (const [key, value] of policyLines) {
    if (new RegExp(`^\\s{2}${key}:\\s*`, "m").test(sectionText(next, "goal_policy"))) continue;
    next = insertIntoSection(next, "goal_policy", `  ${key}: ${value}\n`);
  }
  return next;
}

function ensureWorkflowSafeguards(text) {
  const inferred = inferPolicyMode(text);
  const defaults = workflowDefaultsForMode(inferred);
  const lines = [
    ["requires_design_concept", defaults.designConcept],
    ["requires_ubiquitous_language", defaults.ubiquitousLanguage],
    ["requires_feedback_policy", defaults.feedbackPolicy],
    ["requires_test_strategy", defaults.testStrategy],
    ["requires_module_map", defaults.moduleMap],
    ["requires_interface_contract", defaults.interfaceContract],
    ["requires_architecture_review", defaults.architectureReview],
    ["requires_design_delta", defaults.designDelta],
  ];

  if (!/^workflow_safeguards:\s*$/m.test(text)) {
    const block = `workflow_safeguards:
  requires_design_concept: ${defaults.designConcept}
  requires_ubiquitous_language: ${defaults.ubiquitousLanguage}
  requires_feedback_policy: ${defaults.feedbackPolicy}
  requires_test_strategy: ${defaults.testStrategy}
  requires_module_map: ${defaults.moduleMap}
  requires_interface_contract: ${defaults.interfaceContract}
  requires_architecture_review: ${defaults.architectureReview}
  requires_design_delta: ${defaults.designDelta}

`;
    return insertBeforeTopSection(text, ["agents:", "visual_board:", "active_task:", "tasks:"], block);
  }

  let next = text;
  const section = sectionText(next, "workflow_safeguards");
  for (const [key, value] of lines) {
    if (new RegExp(`^\\s{2}${key}:\\s*`, "m").test(section)) continue;
    next = insertIntoSection(next, "workflow_safeguards", `  ${key}: ${value}\n`);
  }
  return next;
}

function workflowDefaultsForMode(mode) {
  const heavy = ["implementation", "bugfix", "refactor", "frontend", "data_migration"].includes(mode);
  if (heavy) {
    return {
      designConcept: true,
      ubiquitousLanguage: true,
      feedbackPolicy: true,
      testStrategy: true,
      moduleMap: true,
      interfaceContract: true,
      architectureReview: true,
      designDelta: true,
    };
  }
  if (mode === "infra" || mode === "release") {
    return {
      designConcept: false,
      ubiquitousLanguage: false,
      feedbackPolicy: true,
      testStrategy: false,
      moduleMap: false,
      interfaceContract: false,
      architectureReview: false,
      designDelta: false,
    };
  }
  return {
    designConcept: false,
    ubiquitousLanguage: false,
    feedbackPolicy: false,
    testStrategy: false,
    moduleMap: false,
    interfaceContract: false,
    architectureReview: false,
    designDelta: false,
  };
}

function ensureScoutImpactAssessment(text) {
  if (/impact_assessment covering db_schema_migrations/.test(text)) return text;
  const anchor = /(\s{4}expected_output:\n(?:\s{6}- .*\n)+)/;
  if (!anchor.test(text)) return text;
  return text.replace(anchor, (match) => `${match}      - "impact_assessment covering db_schema_migrations, data_backfill, env_secrets, auth_permissions, api_contract, ui_routes, background_jobs, external_services, deploy_rollback, observability, and docs"\n`);
}

function ensureScoutWorkflowOutputs(text) {
  if (!requiresWorkflowHeavy(text)) return text;
  const additions = [
    '      - "design_concept: shared understanding, non-goals, and decision dependencies"',
    '      - "ubiquitous_language: domain terms, overloaded words, and forbidden synonyms"',
    '      - "module_map: relevant deep modules, boundaries, and shallow-module risks"',
  ];
  return addExpectedOutputsToFirstScout(text, additions);
}

function ensureJudgeWorkflowOutputs(text) {
  if (!requiresWorkflowHeavy(text)) return text;
  return replaceTaskBlocks(text, (block) => {
    if (!/^\s{4}type:\s*judge\s*$/m.test(block) || !/Worker objective|implementation slice|first implementation/i.test(block)) {
      return block;
    }
    let next = block;
    const additions = [
      '      - "feedback_policy"',
      '      - "test_strategy"',
      '      - "module_map"',
      '      - "interface_contract"',
      '      - "architecture_review"',
    ];
    for (const addition of additions) {
      if (!next.includes(addition)) next = insertAfterLine(next, /^\s{4}expected_output:\s*$/m, `${addition}\n`);
    }
    return next;
  });
}

function ensureWorkerContracts(text) {
  return replaceTaskBlocks(text, (block) => {
    if (!/^\s{4}type:\s*worker\s*$/m.test(block)) return block;
    let next = block;
    if (!/^\s{4}inputs:\s*$/m.test(next)) {
      next = next.replace(/(\s{4}objective:.*\n)/, '$1    inputs:\n      - "Completed impact_assessment receipt"\n      - "Judge decision with impact_assessment_ref"\n');
    }
    if (!/^\s{4}impact_assessment_ref:/m.test(next)) {
      const anchor = /^\s{4}allowed_files:/m;
      if (anchor.test(next)) next = next.replace(anchor, "    impact_assessment_ref: null\n    allowed_files:");
      else next += "    impact_assessment_ref: null\n";
    }
    if (!/^\s{4}stop_if:\s*$/m.test(next)) {
      next += `    stop_if:
      - "Need files outside allowed_files."
      - "No meaningful failing test can be written."
      - "Need DB migration, schema change, backfill, env/secret, auth/RLS/permission, external service, background job, deploy, or rollback work outside allowed_files."
      - "Verification fails twice."
`;
      return next;
    }

    const stops = [
      '      - "No meaningful failing test can be written."',
      '      - "Need DB migration, schema change, backfill, env/secret, auth/RLS/permission, external service, background job, deploy, or rollback work outside allowed_files."',
    ];
    for (const stop of stops) {
      if (!next.includes(stop)) next = insertAfterLine(next, /^\s{4}stop_if:\s*$/m, `${stop}\n`);
    }
    return next;
  });
}

function ensureWorkerWorkflowInputs(text) {
  if (!requiresWorkflowHeavy(text)) return text;
  return replaceTaskBlocks(text, (block) => {
    if (!/^\s{4}type:\s*worker\s*$/m.test(block)) return block;
    let next = block;
    const inputs = [
      '      - "design_concept"',
      '      - "ubiquitous_language"',
      '      - "feedback_policy"',
      '      - "test_strategy"',
      '      - "module_map"',
      '      - "interface_contract"',
      '      - "architecture_review"',
    ];
    if (!/^\s{4}inputs:\s*$/m.test(next)) {
      next = next.replace(/(\s{4}objective:.*\n)/, "$1    inputs:\n");
    }
    for (const input of inputs) {
      if (!next.includes(input)) next = insertAfterLine(next, /^\s{4}inputs:\s*$/m, `${input}\n`);
    }
    return next;
  });
}

function ensureShippingTask(text) {
  if (!requiresShipping(text) || /^\s{2}- id:\s*T998\s*$/m.test(text)) return text;
  const task = `  - id: T998
    type: pm
    assignee: PM
    status: queued
    reasoning_hint: default
    objective: "Ship verified work to GitHub before the goal can be marked done."
    constraints:
      - "Run git status --short."
      - "Run git diff --check."
      - "Verify this is a git repository with an active GitHub remote."
      - "Run node scripts/goalbuddy-quality-check.mjs --final docs/goals/<goal-slug>/state.yaml, or the installed GoalBuddy copy if the workspace script is unavailable."
      - "Run the goal's required verification commands."
      - "Commit all goal-related changes with a clear message."
      - "Push the current branch to origin."
      - "If no GitHub remote exists, mark this task blocked with exact missing setup; do not count a local-only commit as shipped."
      - "If commit or push is blocked by credentials, network, permissions, or approval, mark this task blocked and do not mark the goal done."
    expected_output:
      - "Commit SHA"
      - "Remote branch"
      - "Push result"
      - "Committed files"
      - "Unrelated dirty files left untouched"
      - "Or shipping_blocker: no_git_repository | no_github_remote"
    receipt: null
`;
  if (/^\s{2}- id:\s*T999\s*$/m.test(text)) return text.replace(/^(\s{2}- id:\s*T999\s*$)/m, `${task}$1`);
  return `${text.trimEnd()}\n${task}`;
}

function ensureShippingTaskShape(text) {
  return replaceTaskBlocks(text, (block) => {
    if (!/^\s{2}- id:\s*T998\s*$/m.test(block)) return block;
    let next = block
      .replace(/^(\s{4})type:\s*worker\s*$/m, "$1type: pm")
      .replace(/^(\s{4})assignee:\s*Worker\s*$/m, "$1assignee: PM");
    const outputs = [
      '      - "Commit SHA"',
      '      - "Remote branch"',
      '      - "Push result"',
      '      - "Committed files"',
      '      - "Unrelated dirty files left untouched"',
      '      - "Or shipping_blocker: no_git_repository | no_github_remote"',
    ];
    if (!/^\s{4}expected_output:\s*$/m.test(next)) {
      next = next.replace(/(\s{4}objective:.*\n)/, "$1    expected_output:\n");
    }
    for (const output of outputs) {
      if (!next.includes(output)) next = insertAfterLine(next, /^\s{4}expected_output:\s*$/m, `${output}\n`);
    }
    return next;
  });
}

function ensureFinalAuditTask(text) {
  const task = `  - id: T999
    type: judge
    assignee: Judge
    status: queued
    reasoning_hint: high
    objective: "Audit whether the full original outcome is complete."
    inputs:
      - "All done task receipts"
      - "Last verification"
      - "Current dirty diff"
      - "Quality checker final output"
      - "Completed impact_assessment receipt"
      - "T998 shipping proof when shipping is required"
    constraints:
      - "Do not implement."
      - "Reject completion if required Worker work is still queued or active."
      - "Reject completion unless impact_assessment covers db_schema_migrations, data_backfill, env_secrets, auth_permissions, api_contract, ui_routes, background_jobs, external_services, deploy_rollback, observability, and docs when impact assessment is required."
      - "For read-only audit goals with no Worker tasks and no changed_files, accept audit_scope/audit_findings/review/decision evidence instead of TDD, impact_assessment, T998, commit, and push."
      - "For verification goals, reject completion unless safe test/browser command evidence exists and no changed_files are reported."
      - "Reject completion unless T998 has a commit SHA and successful push result, or an explicit shipping_blocker for no_git_repository/no_github_remote, when shipping is required."
    expected_output:
      - "complete | not_complete"
      - "full_outcome_complete: true | false"
      - "missing evidence"
      - "next task if not complete"
    receipt: null
`;

  if (!/^\s{2}- id:\s*T999\s*$/m.test(text)) return `${text.trimEnd()}\n${task}`;

  return replaceTaskBlocks(text, (block) => {
    if (!/^\s{2}- id:\s*T999\s*$/m.test(block)) return block;
    if (/Quality checker final output/.test(block) && /full_outcome_complete/.test(block)) return block;
    return task;
  });
}

function ensureFinalAuditWorkflow(text) {
  if (!requiresWorkflowHeavy(text)) return text;
  return replaceTaskBlocks(text, (block) => {
    if (!/^\s{2}- id:\s*T999\s*$/m.test(block)) return block;
    let next = block;
    const inputs = [
      '      - "design_concept, ubiquitous_language, feedback_policy, test_strategy, module_map, interface_contract, architecture_review, and design_delta evidence"',
    ];
    for (const input of inputs) {
      if (!next.includes(input)) next = insertAfterLine(next, /^\s{4}inputs:\s*$/m, `${input}\n`);
    }
    const constraints = [
      '      - "Reject completion if design_concept, ubiquitous_language, feedback_policy, test_strategy, module_map, interface_contract, architecture_review, or design_delta evidence is missing when workflow_safeguards requires it."',
    ];
    for (const constraint of constraints) {
      if (!next.includes(constraint)) next = insertAfterLine(next, /^\s{4}constraints:\s*$/m, `${constraint}\n`);
    }
    const outputs = [
      '      - "workflow_safeguards result"',
      '      - "design_delta"',
    ];
    for (const output of outputs) {
      if (!next.includes(output)) next = insertAfterLine(next, /^\s{4}expected_output:\s*$/m, `${output}\n`);
    }
    return next;
  });
}

function inferPolicyMode(text) {
  const lower = text.toLowerCase();
  if (/mode:\s*(implementation|bugfix|refactor|audit_read_only|verification|research|docs|infra|data_migration|frontend|release)/.test(lower)) {
    return lower.match(/mode:\s*(implementation|bugfix|refactor|audit_read_only|verification|research|docs|infra|data_migration|frontend|release)/)[1];
  }
  const hasWorker = /^\s{4}type:\s*worker\s*$/m.test(text);
  const hasImplementation = /\b(implement|fix|change|add|wire|refactor|modify)\b/i.test(text);
  const asksTestsOnly = /\b(test|verify|verification|e2e|browser)\b/i.test(text) && !hasImplementation;
  if (asksTestsOnly) return "verification";
  if (!hasWorker && /\b(audit|review|source_backed_answer|decision)\b/i.test(text)) return "audit_read_only";
  if (/\b(data_migration|migration_proof)\b/i.test(text) && hasImplementation) return "data_migration";
  if (/\b(frontend|ui|visual|screenshot|playwright)\b/i.test(text) && hasImplementation) return "frontend";
  return hasImplementation || hasWorker ? "implementation" : "research";
}

function requiresWorkflowHeavy(text) {
  const mode = inferPolicyMode(text);
  const workflow = sectionText(text, "workflow_safeguards");
  if (/^\s{2}requires_design_concept:\s*true\s*$/m.test(workflow)) return true;
  return ["implementation", "bugfix", "refactor", "frontend", "data_migration"].includes(mode);
}

function addExpectedOutputsToFirstScout(text, additions) {
  let changed = false;
  return replaceTaskBlocks(text, (block) => {
    if (changed || !/^\s{4}type:\s*scout\s*$/m.test(block)) return block;
    changed = true;
    let next = block;
    if (!/^\s{4}expected_output:\s*$/m.test(next)) {
      next += "    expected_output:\n";
    }
    for (const addition of additions) {
      if (!next.includes(addition)) next = insertAfterLine(next, /^\s{4}expected_output:\s*$/m, `${addition}\n`);
    }
    return next;
  });
}

function requiresShipping(text) {
  if (/^goal_policy:\s*[\s\S]*?^\S/m.test(text)) {
    const policy = sectionText(text, "goal_policy");
    if (/^\s{2}requires_shipping:\s*false\s*$/m.test(policy)) return false;
    if (/^\s{2}mode:\s*(audit_read_only|verification|research)\s*$/m.test(policy)) return false;
  }
  if (/^\s{2}requires_shipping:\s*false\s*$/m.test(text)) return false;
  if (/^\s{2}mode:\s*(audit_read_only|verification|research)\s*$/m.test(text)) return false;
  return true;
}

function replaceTaskBlocks(text, transform) {
  const starts = [...text.matchAll(/^\s{2}- id:\s*T\d{3}\s*$/gm)].map((match) => match.index);
  if (starts.length === 0) return text;
  let result = text.slice(0, starts[0]);
  for (let i = 0; i < starts.length; i += 1) {
    const start = starts[i];
    const end = starts[i + 1] ?? text.length;
    result += transform(text.slice(start, end));
  }
  return result;
}

function insertBeforeTopSection(text, markers, block) {
  const indexes = markers
    .map((marker) => {
      const index = text.search(new RegExp(`^${escapeRegExp(marker)}\\s*$`, "m"));
      return index === -1 ? null : index;
    })
    .filter((index) => index !== null);
  if (indexes.length === 0) return `${text.trimEnd()}\n\n${block}`;
  const index = Math.min(...indexes);
  return `${text.slice(0, index)}${block}${text.slice(index)}`;
}

function insertIntoSection(text, section, line) {
  const re = new RegExp(`^${escapeRegExp(section)}:\\s*$`, "m");
  const match = re.exec(text);
  if (!match) return text;
  const insertAt = match.index + match[0].length + 1;
  return `${text.slice(0, insertAt)}${line}${text.slice(insertAt)}`;
}

function insertAfterLine(text, re, line) {
  const match = re.exec(text);
  if (!match) return text;
  const insertAt = match.index + match[0].length + 1;
  return `${text.slice(0, insertAt)}${line}${text.slice(insertAt)}`;
}

function sectionText(text, section) {
  const match = new RegExp(`^${escapeRegExp(section)}:\\s*$`, "m").exec(text);
  if (!match) return "";
  const start = match.index;
  const afterHeader = match.index + match[0].length;
  const next = text.slice(afterHeader).search(/\n\S[^:\n]*:\s*(\n|$)/);
  if (next === -1) return text.slice(start);
  return text.slice(start, afterHeader + next + 1);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseCli(argv) {
  const help = argv.includes("--help") || argv.includes("-h");
  const json = argv.includes("--json");
  const statePath = argv.find((arg) => !arg.startsWith("-"));
  return { help, json, statePath };
}

const HELP_TEXT = `Usage:
  goalbuddy-repair [--dry-run] [--json] docs/goals/<slug>/state.yaml
  npm run repair -- [--dry-run] docs/goals/<slug>/state.yaml

Normalize a GoalBuddy board without inventing product details.

Options:
  --dry-run     Preview repaired state and checker result without writing.
  --json        Print machine-readable output.
  -h, --help    Show this help.
`;

async function main() {
  const { help, json, statePath } = parseCli(process.argv.slice(2));
  if (help) {
    console.log(HELP_TEXT.trimEnd());
    return;
  }
  if (!statePath) {
    console.error("Usage: goalbuddy-repair [--dry-run] [--json] docs/goals/<slug>/state.yaml");
    process.exitCode = 2;
    return;
  }

  const resolved = resolve(statePath);
  if (!existsSync(resolved)) {
    console.error(`state file not found: ${resolved}`);
    process.exitCode = 2;
    return;
  }

  const before = readFileSync(resolved, "utf8");
  const after = repairStateText(before);
  const changed = before !== after;
  const check = checkStateText(after);

  if (!dryRun && changed) writeFileSync(resolved, after);

  const result = {
    dry_run: dryRun,
    changed,
    ok_after_repair: check.ok,
    errors_after_repair: check.errors,
    warnings_after_repair: check.warnings,
  };

  if (json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`${changed ? dryRun ? "would repair" : "repaired" : "unchanged"} ${resolved}`);
    console.log(`${check.ok ? "PASS" : "FAIL"} goalbuddy-quality-check after repair`);
    for (const error of check.errors) console.log(`ERROR ${error}`);
    for (const warning of check.warnings) console.log(`WARN ${warning}`);
  }

  process.exitCode = check.ok ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
