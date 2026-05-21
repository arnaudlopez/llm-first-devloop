#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const START = "BEGIN ARNAUD GOALBUDDY CUSTOMIZATION";
const END = "END ARNAUD GOALBUDDY CUSTOMIZATION";
const dryRun = process.argv.includes("--dry-run");
const scriptDir = dirname(fileURLToPath(import.meta.url));
const qualityCheckerSource = join(scriptDir, "goalbuddy-quality-check.mjs");
const boardRepairSource = join(scriptDir, "goalbuddy-board-repair.mjs");
const readyModeSource = join(scriptDir, "goalbuddy-ready-mode.mjs");

const home = homedir();
const candidates = [
  join(home, ".claude", "agents", "goal-worker.md"),
  join(home, ".claude", "agents", "goal-judge.md"),
  join(home, ".claude", "skills", "goalbuddy", "agents", "goal_worker.toml"),
  join(home, ".claude", "skills", "goalbuddy", "agents", "goal_judge.toml"),
  join(home, ".claude", "skills", "goalbuddy", "templates", "state.yaml"),
  join(home, ".claude", "skills", "goalbuddy", "SKILL.md"),
  ...goalbuddyPluginFiles(home, "agents/goal-worker.md"),
  ...goalbuddyPluginFiles(home, "agents/goal-judge.md"),
  ...goalbuddyPluginFiles(home, "skills/goalbuddy/agents/goal_worker.toml"),
  ...goalbuddyPluginFiles(home, "skills/goalbuddy/agents/goal_judge.toml"),
  ...goalbuddyPluginFiles(home, "skills/goalbuddy/templates/state.yaml"),
  ...goalbuddyPluginFiles(home, "skills/goalbuddy/SKILL.md"),
];

const checkerTargets = [
  join(home, ".claude", "skills", "goalbuddy", "scripts", "goalbuddy-quality-check.mjs"),
  ...goalbuddyPluginFiles(home, "skills/goalbuddy/scripts/goalbuddy-quality-check.mjs"),
];
const repairTargets = [
  join(home, ".claude", "skills", "goalbuddy", "scripts", "goalbuddy-board-repair.mjs"),
  ...goalbuddyPluginFiles(home, "skills/goalbuddy/scripts/goalbuddy-board-repair.mjs"),
];
const readyModeTargets = [
  join(home, ".claude", "skills", "goalbuddy", "scripts", "goalbuddy-ready-mode.mjs"),
  ...goalbuddyPluginFiles(home, "skills/goalbuddy/scripts/goalbuddy-ready-mode.mjs"),
];

const patches = {
  "goal-worker.md": patchWorkerMarkdown,
  "goal_worker.toml": patchWorkerToml,
  "goal-judge.md": patchJudgeMarkdown,
  "goal_judge.toml": patchJudgeToml,
  "state.yaml": patchStateTemplate,
  "SKILL.md": patchSkillMarkdown,
};

let changed = 0;
let unchanged = 0;
let missing = 0;
let copied = 0;

for (const file of unique(candidates)) {
  if (!existsSync(file)) {
    missing += 1;
    continue;
  }

  const name = file.split("/").at(-1);
  const patch = patches[name];
  if (!patch) continue;

  const before = readFileSync(file, "utf8");
  const after = patch(before);

  if (after === before) {
    unchanged += 1;
    console.log(`unchanged ${file}`);
    continue;
  }

  changed += 1;
  if (!dryRun) writeFileSync(file, after);
  console.log(`${dryRun ? "would patch" : "patched"} ${file}`);
}

installScript(qualityCheckerSource, checkerTargets);
installScript(boardRepairSource, repairTargets);
installScript(readyModeSource, readyModeTargets);

console.log(
  JSON.stringify(
    {
      dry_run: dryRun,
      changed,
      unchanged,
      missing,
      copied,
    },
    null,
    2,
  ),
);

function installScript(sourcePath, targets) {
  if (!existsSync(sourcePath)) {
    missing += 1;
    console.log(`missing ${sourcePath}`);
    return;
  }

  const source = readFileSync(sourcePath, "utf8");
  for (const target of unique(targets)) {
    if (!existsSync(dirname(target))) {
      missing += 1;
      console.log(`missing ${dirname(target)}`);
      continue;
    }

    const current = existsSync(target) ? readFileSync(target, "utf8") : null;
    if (current === source) {
      unchanged += 1;
      console.log(`unchanged ${target}`);
      continue;
    }

    copied += 1;
    if (!dryRun) {
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, source, { mode: 0o755 });
    }
    console.log(`${dryRun ? "would copy" : "copied"} ${target}`);
  }
}

function goalbuddyPluginFiles(homeDir, relativePath) {
  const root = join(homeDir, ".codex", "plugins", "cache", "goalbuddy", "goalbuddy");
  if (!existsSync(root)) return [];

  const files = [];
  for (const entry of readdirSync(root)) {
    const base = join(root, entry);
    if (!safeStat(base)?.isDirectory()) continue;
    files.push(join(base, relativePath));
  }
  return files;
}

function safeStat(path) {
  try {
    return statSync(path);
  } catch {
    return null;
  }
}

function unique(values) {
  return [...new Set(values)];
}

function managedBlock(kind, body) {
  return `${comment(kind, START)}\n${body.trimEnd()}\n${comment(kind, END)}`;
}

function comment(kind, text) {
  if (kind === "yaml" || kind === "toml") return `# ${text}`;
  return `<!-- ${text} -->`;
}

function replaceManagedBlock(text, kind, body) {
  const block = managedBlock(kind, body);
  const escapedStart = escapeRegExp(comment(kind, START));
  const escapedEnd = escapeRegExp(comment(kind, END));
  const re = new RegExp(`${escapedStart}[\\s\\S]*?${escapedEnd}`);
  if (re.test(text)) return text.replace(re, block);
  return { block, text };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function insertBefore(text, marker, block) {
  if (!text.includes(marker)) return `${text.trimEnd()}\n\n${block}\n`;
  return text.replace(marker, `${block}\n\n${marker}`);
}

function patchWorkerMarkdown(text) {
  const custom = replaceManagedBlock(text, "md", workerRulesMarkdown());
  if (typeof custom === "string") return custom;
  return insertBefore(custom.text, "Parallel safety:", custom.block);
}

function patchJudgeMarkdown(text) {
  const custom = replaceManagedBlock(text, "md", judgeRulesMarkdown());
  if (typeof custom === "string") return custom;
  return insertBefore(custom.text, "Return exactly one parseable JSON receipt object:", custom.block);
}

function patchWorkerToml(text) {
  const custom = replaceManagedBlock(text, "toml", workerRulesPlain());
  if (typeof custom === "string") return custom;
  return insertBefore(custom.text, "Parallel safety:", custom.block);
}

function patchJudgeToml(text) {
  const custom = replaceManagedBlock(text, "toml", judgeRulesPlain());
  if (typeof custom === "string") return custom;
  return insertBefore(custom.text, "Return exactly one parseable JSON receipt object:", custom.block);
}

function patchStateTemplate(text) {
  let next = text;
  next = ensureRule(next, "  require_tdd_worker_flow: true");
  next = ensureRule(next, "  require_github_ship_task: true");
  next = ensureRule(next, "  require_quality_checker: true");
  next = ensureRule(next, "  require_impact_assessment: true");
  next = ensureRule(next, "  allow_read_only_goal_without_shipping: true");
  next = ensureGoalPolicy(next);
  next = ensureWorkflowSafeguards(next);
  next = ensureT001ImpactAssessment(next);
  next = ensureT001WorkflowOutputs(next);
  next = ensureT002ImpactGate(next);
  next = ensureT002WorkflowGate(next);
  next = ensureT003ImpactStop(next);
  next = ensureT003TddStop(next);
  next = ensureT003ImpactRef(next);
  next = ensureT003WorkflowInputs(next);
  next = ensureT998(next);
  next = ensureT998ShippingOutputs(next);
  next = ensureT998GithubRemoteConstraint(next);
  next = ensureT998QualityConstraint(next);
  next = ensureT999QualityInput(next);
  next = ensureT999ImpactInput(next);
  next = ensureT999ImpactConstraint(next);
  next = ensureT999ReadOnlyAuditConstraint(next);
  next = ensureT999ShippingConstraint(next);
  next = ensureT999WorkflowConstraint(next);
  return next;
}

function patchSkillMarkdown(text) {
  const custom = replaceManagedBlock(text, "md", skillRulesMarkdown());
  if (typeof custom === "string") return custom;
  return insertBefore(custom.text, "## What `$goal-prep` Does", custom.block);
}

function ensureGoalPolicy(text) {
  if (/^goal_policy:\s*$/m.test(text)) return text;

  const block = `goal_policy:
  # implementation | bugfix | refactor | audit_read_only | verification | research | docs | infra | data_migration | frontend | release
  mode: implementation
  requires_tdd: true
  requires_impact_assessment: true
  requires_shipping: true
  requires_visual_verification: false
  requires_migration_proof: false
  requires_infra_proof: false
  requires_dependency_review: false
  requires_dirty_worktree_guard: true
  requires_refactor_proof: false

`;

  const marker = "agents:\n";
  if (!text.includes(marker)) return `${text.trimEnd()}\n\n${block}`;
  return text.replace(marker, `${block}${marker}`);
}

function ensureWorkflowSafeguards(text) {
  if (/^workflow_safeguards:\s*$/m.test(text)) return text;

  const block = `workflow_safeguards:
  requires_design_concept: true
  requires_ubiquitous_language: true
  requires_feedback_policy: true
  requires_test_strategy: true
  requires_module_map: true
  requires_interface_contract: true
  requires_architecture_review: true
  requires_design_delta: true

`;

  const marker = "agents:\n";
  if (!text.includes(marker)) return `${text.trimEnd()}\n\n${block}`;
  return text.replace(marker, `${block}${marker}`);
}

function ensureRule(text, ruleLine) {
  if (text.includes(ruleLine)) return text;
  const anchor = "  intake_misfire_must_be_audited: true\n";
  if (text.includes(anchor)) return text.replace(anchor, `${anchor}${ruleLine}\n`);
  return text;
}

function ensureT998(text) {
  if (/^\s+- id: T998\s*$/m.test(text)) return text;

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

  const marker = "  - id: T999\n";
  if (!text.includes(marker)) return `${text.trimEnd()}\n${task}\n`;
  return text.replace(marker, `${task}${marker}`);
}

function ensureT998ShippingOutputs(text) {
  return replaceTaskBlocks(text, (block) => {
    if (!/^\s{2}- id:\s*T998\s*$/m.test(block)) return block;
    let next = block
      .replace(/^(\s{4})type:\s*worker\s*$/m, "$1type: pm")
      .replace(/^(\s{4})assignee:\s*Worker\s*$/m, "$1assignee: PM");
    return ensureListItems(next, "expected_output", [
      '      - "Commit SHA"',
      '      - "Remote branch"',
      '      - "Push result"',
      '      - "Committed files"',
      '      - "Unrelated dirty files left untouched"',
      '      - "Or shipping_blocker: no_git_repository | no_github_remote"',
    ]);
  });
}

function ensureT001ImpactAssessment(text) {
  let next = text;
  const objective =
    '    objective: "Map repo purpose, architecture, verification commands, health signals, improvement candidates, and impact_assessment."';
  if (!next.includes("impact_assessment") && next.includes('    objective: "Map repo purpose, architecture, verification commands, health signals, and improvement candidates."')) {
    next = next.replace(
      '    objective: "Map repo purpose, architecture, verification commands, health signals, and improvement candidates."',
      objective,
    );
  }

  const expected = '      - "impact_assessment covering db_schema_migrations, data_backfill, env_secrets, auth_permissions, api_contract, ui_routes, background_jobs, external_services, deploy_rollback, observability, and docs"';
  if (next.includes(expected)) return next;

  const anchor = '      - "Candidate next tasks"\n';
  if (!next.includes(anchor)) return next;
  return next.replace(anchor, `${anchor}${expected}\n`);
}

function ensureT001WorkflowOutputs(text) {
  let next = text;
  const outputs = [
    '      - "design_concept: shared understanding, non-goals, and decision dependencies"',
    '      - "ubiquitous_language: domain terms, overloaded words, and forbidden synonyms"',
    '      - "module_map: relevant deep modules, boundaries, and shallow-module risks"',
  ];
  const anchor = '      - "Candidate next tasks"\n';
  for (const output of outputs) {
    if (next.includes(output)) continue;
    if (next.includes(anchor)) next = next.replace(anchor, `${anchor}${output}\n`);
  }
  return next;
}

function ensureT002ImpactGate(text) {
  let next = text;
  const constraint =
    '      - "Reject Worker tasks until a completed impact_assessment exists and the Worker references it."';
  if (!next.includes(constraint)) {
    const anchor = '      - "Do not implement."\n';
    if (next.includes(anchor)) next = next.replace(anchor, `${anchor}${constraint}\n`);
  }

  const output = '      - "impact_assessment_ref"';
  if (!next.includes(output)) {
    const anchor = '      - "stop_if"\n';
    if (next.includes(anchor)) next = next.replace(anchor, `${anchor}${output}\n`);
  }

  return next;
}

function ensureT002WorkflowGate(text) {
  let next = text;
  const constraint =
    '      - "Reject implementation Worker tasks unless design_concept, feedback_policy, test_strategy, module_map, interface_contract, and architecture_review are defined or explicitly waived by workflow_safeguards."';
  if (!next.includes(constraint)) {
    const anchor = '      - "Do not implement."\n';
    if (next.includes(anchor)) next = next.replace(anchor, `${anchor}${constraint}\n`);
  }

  const outputs = [
    '      - "feedback_policy"',
    '      - "test_strategy"',
    '      - "module_map"',
    '      - "interface_contract"',
    '      - "architecture_review"',
  ];
  for (const output of outputs) {
    if (next.includes(output)) continue;
    const anchor = '      - "impact_assessment_ref"\n';
    if (next.includes(anchor)) next = next.replace(anchor, `${anchor}${output}\n`);
  }

  return next;
}

function ensureT003ImpactStop(text) {
  const stopIf =
    '      - "Need DB migration, schema change, backfill, env/secret, auth/RLS/permission, external service, background job, deploy, or rollback work outside allowed_files."';
  if (text.includes(stopIf)) return text;

  const anchor = '      - "Need files outside allowed_files."\n';
  if (!text.includes(anchor)) return text;
  return text.replace(anchor, `${anchor}${stopIf}\n`);
}

function ensureT003TddStop(text) {
  const stopIf = '      - "No meaningful failing test can be written."';
  if (text.includes(stopIf)) return text;

  const anchor = '      - "Verification fails twice."\n';
  if (!text.includes(anchor)) return text;
  return text.replace(anchor, `${stopIf}\n${anchor}`);
}

function ensureT003ImpactRef(text) {
  if (text.includes("impact_assessment_ref:")) return text;

  const anchor = "    allowed_files: []\n";
  if (!text.includes(anchor)) return text;
  return text.replace(anchor, '    inputs:\n      - "Completed impact_assessment receipt"\n      - "Judge decision with impact_assessment_ref"\n    impact_assessment_ref: null\n    allowed_files: []\n');
}

function ensureT003WorkflowInputs(text) {
  const inputs = [
    '      - "design_concept"',
    '      - "ubiquitous_language"',
    '      - "feedback_policy"',
    '      - "test_strategy"',
    '      - "module_map"',
    '      - "interface_contract"',
    '      - "architecture_review"',
  ];
  return replaceTaskBlocks(text, (block) => {
    if (!/^\s{4}type:\s*worker\s*$/m.test(block) || !/Execute the first safe implementation task selected by Judge/.test(block)) {
      return block;
    }
    return ensureListItems(block, "inputs", inputs);
  });
}

function ensureT998GithubRemoteConstraint(text) {
  let next = text;
  const remote = '      - "Verify this is a git repository with an active GitHub remote."';
  if (!next.includes(remote)) {
    const anchor = '      - "Run git diff --check."\n';
    if (next.includes(anchor)) next = next.replace(anchor, `${anchor}${remote}\n`);
  }

  const blocked =
    '      - "If no GitHub remote exists, mark this task blocked with exact missing setup; do not count a local-only commit as shipped."';
  if (!next.includes(blocked)) {
    const anchor = '      - "Push the current branch to origin."\n';
    if (next.includes(anchor)) next = next.replace(anchor, `${anchor}${blocked}\n`);
  }

  return next;
}

function ensureT998QualityConstraint(text) {
  const constraint =
    '      - "Run node scripts/goalbuddy-quality-check.mjs --final docs/goals/<goal-slug>/state.yaml, or the installed GoalBuddy copy if the workspace script is unavailable."';
  if (text.includes(constraint)) return text;

  const anchor = '      - "Run git diff --check."\n';
  if (!text.includes(anchor)) return text;
  return text.replace(anchor, `${anchor}${constraint}\n`);
}

function ensureT999QualityInput(text) {
  const input = '      - "Quality checker final output"';
  if (text.includes(input)) return text;

  const anchor = '      - "Current dirty diff"\n';
  if (!text.includes(anchor)) return text;
  return text.replace(anchor, `${anchor}${input}\n`);
}

function ensureT999ImpactInput(text) {
  const input = '      - "Completed impact_assessment receipt"';
  if (text.includes(input)) return text;

  const anchor = '      - "Quality checker final output"\n';
  if (!text.includes(anchor)) return text;
  return text.replace(anchor, `${anchor}${input}\n`);
}

function ensureT999ImpactConstraint(text) {
  const constraint =
    '      - "Reject completion unless impact_assessment covers db_schema_migrations, data_backfill, env_secrets, auth_permissions, api_contract, ui_routes, background_jobs, external_services, deploy_rollback, observability, and docs."';
  if (text.includes(constraint)) return text;

  const anchor = '      - "Reject completion if required Worker work is still queued or active."\n';
  if (!text.includes(anchor)) return text;
  return text.replace(anchor, `${anchor}${constraint}\n`);
}

function ensureT999ReadOnlyAuditConstraint(text) {
  const constraint =
    '      - "For read-only audit goals with no active/done Worker and no changed_files, accept audit_scope/audit_findings/review/decision evidence instead of TDD, impact_assessment, T998, commit, and push."';
  if (text.includes(constraint)) return text;

  const anchor = '      - "Reject completion unless impact_assessment covers db_schema_migrations, data_backfill, env_secrets, auth_permissions, api_contract, ui_routes, background_jobs, external_services, deploy_rollback, observability, and docs."\n';
  if (!text.includes(anchor)) return text;
  return text.replace(anchor, `${anchor}${constraint}\n`);
}

function ensureT999ShippingConstraint(text) {
  const constraint =
    '      - "Reject completion unless T998 has a commit SHA and successful push result, or an explicit shipping_blocker for no_git_repository/no_github_remote."';
  if (text.includes(constraint)) return text;

  const anchor =
    '      - "Reject stopping only because a slice needs owner input, credentials, production access, destructive operations, or policy decisions."\n';
  if (!text.includes(anchor)) return text;
  return text.replace(anchor, `${anchor}${constraint}\n`);
}

function ensureT999WorkflowConstraint(text) {
  return replaceTaskBlocks(text, (block) => {
    if (!/^\s{2}- id:\s*T999\s*$/m.test(block)) return block;

    let next = block;
    next = ensureListItems(next, "inputs", [
      '      - "design_concept, ubiquitous_language, feedback_policy, test_strategy, module_map, interface_contract, architecture_review, and design_delta evidence"',
    ]);
    next = ensureListItems(next, "constraints", [
      '      - "Reject completion if design_concept, ubiquitous_language, feedback_policy, test_strategy, module_map, interface_contract, architecture_review, or design_delta evidence is missing when workflow_safeguards requires it."',
    ]);
    next = ensureListItems(next, "expected_output", [
      '      - "workflow_safeguards result"',
      '      - "design_delta"',
    ]);
    return next;
  });
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

function ensureListItems(block, key, items) {
  let next = block;
  const header = new RegExp(`^\\s{4}${key}:\\s*$`, "m");
  if (!header.test(next)) {
    next = next.replace(/(\s{4}objective:.*\n)/, `$1    ${key}:\n`);
  }

  for (const item of items) {
    if (next.includes(item)) continue;
    const match = header.exec(next);
    if (!match) continue;
    const insertAt = match.index + match[0].length + 1;
    next = `${next.slice(0, insertAt)}${item}\n${next.slice(insertAt)}`;
  }

  return next;
}

function unusedLegacyWorkflowConstraint(text) {
  let next = text;
  const input =
    '      - "design_concept, ubiquitous_language, feedback_policy, test_strategy, module_map, interface_contract, architecture_review, and design_delta evidence"';
  if (!next.includes(input)) {
    const anchor = '      - "Completed impact_assessment receipt"\n';
    if (next.includes(anchor)) next = next.replace(anchor, `${anchor}${input}\n`);
  }

  const constraint =
    '      - "Reject completion if design_concept, ubiquitous_language, feedback_policy, test_strategy, module_map, interface_contract, architecture_review, or design_delta evidence is missing when workflow_safeguards requires it."';
  if (!next.includes(constraint)) {
    const anchor = '      - "Reject completion if required Worker work is still queued or active."\n';
    if (next.includes(anchor)) next = next.replace(anchor, `${anchor}${constraint}\n`);
  }
  return next;
}

function workerRulesMarkdown() {
  return `TDD and GitHub delivery contract:

- For behavior changes, write or update the failing test before production code.
- Run the targeted test and record the expected red failure in the receipt as \`red_test\`.
- Only then implement the minimal production change needed for that slice.
- Run the same targeted test green and record it as \`green_test\`, then run every task verify command exactly as listed.
- If the board splits TDD across tasks, use \`worker_kind: red_test\` for the red-only Worker and \`worker_kind: implementation\` for the green Worker; the red-only receipt may record \`expected_fail\` instead of \`green_test\`.
- Use \`worker_kind: polish\` for follow-up UI/copy polish that is verified by tests/typecheck but does not start a fresh behavior cycle.
- If no meaningful test can be written, stop as blocked unless the task is explicitly docs-only, config-only, generated-artifact-only, or test-only.
- Worker receipts must include the evidence appropriate to their \`worker_kind\`: red-only tasks need expected red failure, implementation tasks need green verification and the prior red evidence, polish tasks need verification and changed_files.
- Do not mark implementation complete when required tests were skipped without an explicit board exception.
- Prefer one behavior-level regression test over brittle implementation-only assertions.
- Reference the completed \`impact_assessment\` in the receipt.
- Follow the task's \`feedback_policy\`: keep changes inside the feedback speed limit and run the named checks before expanding scope.
- Implement against the approved \`interface_contract\` and keep internals behind the named module boundary.
- Record \`design_delta\` in the receipt: what architecture/interface changed, stayed stable, or was intentionally deferred.
- Stop as blocked if the slice needs a DB migration, schema change, backfill, env/secret, auth/RLS/permission, API contract, external service, background job, deploy, or rollback change outside \`allowed_files\`.`;
}

function workerRulesPlain() {
  return `TDD and GitHub delivery contract:
- For behavior changes, write or update the failing test before production code.
- Run the targeted test and record the expected red failure in the receipt as red_test.
- Only then implement the minimal production change needed for that slice.
- Run the same targeted test green and record it as green_test, then run every task verify command exactly as listed.
- If the board splits TDD across tasks, use worker_kind: red_test for the red-only Worker and worker_kind: implementation for the green Worker; the red-only receipt may record expected_fail instead of green_test.
- Use worker_kind: polish for follow-up UI/copy polish that is verified by tests/typecheck but does not start a fresh behavior cycle.
- If no meaningful test can be written, stop as blocked unless the task is explicitly docs-only, config-only, generated-artifact-only, or test-only.
- Worker receipts must include the evidence appropriate to their worker_kind: red-only tasks need expected red failure, implementation tasks need green verification and the prior red evidence, polish tasks need verification and changed_files.
- Do not mark implementation complete when required tests were skipped without an explicit board exception.
- Prefer one behavior-level regression test over brittle implementation-only assertions.
- Reference the completed impact_assessment in the receipt.
- Follow the task's feedback_policy: keep changes inside the feedback speed limit and run the named checks before expanding scope.
- Implement against the approved interface_contract and keep internals behind the named module boundary.
- Record design_delta in the receipt: what architecture/interface changed, stayed stable, or was intentionally deferred.
- Stop as blocked if the slice needs a DB migration, schema change, backfill, env/secret, auth/RLS/permission, API contract, external service, background job, deploy, or rollback change outside allowed_files.`;
}

function judgeRulesMarkdown() {
  return `TDD and GitHub delivery gates:

- A Worker implementation task is not safe unless \`allowed_files\` includes the relevant test files and implementation files.
- TDD evidence may be distributed across Workers when the board labels them with \`worker_kind: red_test | implementation | polish | verification | shipping\`; Judge must still verify that the goal-level cycle has red evidence before green implementation evidence.
- Before approving Worker work or final completion, choose or validate \`goal_policy.mode\`: \`implementation\`, \`bugfix\`, \`refactor\`, \`audit_read_only\`, \`verification\`, \`research\`, \`docs\`, \`infra\`, \`data_migration\`, \`frontend\`, or \`release\`.
- Policy gates must match the work: migrations need \`migration_proof\`, frontend needs visual verification, infra/release needs dry-run or config validation, refactor needs characterization or behavior_unchanged evidence, and dependency changes need dependency_review.
- Use \`verification\` for safe test/browser QA goals that run commands but must not edit files; if a fix is needed, create a new implementation Worker with TDD and shipping.
- Set \`requires_migration_proof: true\` only when the selected Worker package actually includes DB schema migration, RLS/type generation, backfill, or rollback work; "migration possible" is not enough.
- A Worker implementation task is not safe unless \`verify\` includes a targeted test command plus a broader validation command when the repo provides one.
- A Worker implementation task must include \`stop_if: No meaningful failing test can be written.\` unless the work is explicitly docs-only, config-only, generated-artifact-only, or test-only.
- A Worker implementation task is not safe until a completed \`impact_assessment\` exists and the Worker task references it.
- The \`impact_assessment\` must explicitly cover \`db_schema_migrations\`, \`data_backfill\`, \`env_secrets\`, \`auth_permissions\`, \`api_contract\`, \`ui_routes\`, \`background_jobs\`, \`external_services\`, \`deploy_rollback\`, \`observability\`, and \`docs\`.
- If the impact assessment says a migration, backfill, env/secret, auth/RLS, API, job, external service, deploy, rollback, or docs update is required, include those files in \`allowed_files\` and verification or reject the Worker task.
- For implementation-like work, require a named \`design_concept\`, \`ubiquitous_language\`, \`feedback_policy\`, \`test_strategy\`, \`module_map\`, \`interface_contract\`, and \`architecture_review\`; waive them only when \`workflow_safeguards\` explicitly disables that gate for the goal mode.
- Prefer deep-module boundaries and interface-first Worker handoffs: Judge designs the boundary, Worker changes internals inside it.
- For read-only audit goals with no active/done Worker and no changed_files, accept audit_scope/audit_findings/review/decision evidence instead of TDD, full impact_assessment, T998, commit, and push.
- Reject completion if a behavior-changing goal lacks a complete goal-level TDD cycle: red evidence from \`red_test\`/expected_fail and green evidence from implementation verification. Do not require every polish or shipping task to carry its own red/green pair.
- Reject completion if required workflow safeguards lack evidence, especially \`design_delta\` after implementation.
- Require the final audit to include the output of \`goalbuddy-quality-check.mjs --final\`.
- Reject final completion unless the board has a done \`T998\` PM shipping task with commit SHA, remote branch or clear push string, successful push result, committed file list, and unrelated dirty files left untouched; or a blocked \`T998\` with explicit \`shipping_blocker: no_git_repository | no_github_remote\`.
- If there is no active GitHub remote, require \`T998\` to record the exact blocker; do not pretend a local-only change was shipped.`;
}

function judgeRulesPlain() {
  return `TDD and GitHub delivery gates:
- A Worker implementation task is not safe unless allowed_files includes the relevant test files and implementation files.
- TDD evidence may be distributed across Workers when the board labels them with worker_kind: red_test | implementation | polish | verification | shipping; Judge must still verify that the goal-level cycle has red evidence before green implementation evidence.
- Before approving Worker work or final completion, choose or validate goal_policy.mode: implementation, bugfix, refactor, audit_read_only, verification, research, docs, infra, data_migration, frontend, or release.
- Policy gates must match the work: migrations need migration_proof, frontend needs visual verification, infra/release needs dry-run or config validation, refactor needs characterization or behavior_unchanged evidence, and dependency changes need dependency_review.
- Use verification for safe test/browser QA goals that run commands but must not edit files; if a fix is needed, create a new implementation Worker with TDD and shipping.
- Set requires_migration_proof: true only when the selected Worker package actually includes DB schema migration, RLS/type generation, backfill, or rollback work; "migration possible" is not enough.
- A Worker implementation task is not safe unless verify includes a targeted test command plus a broader validation command when the repo provides one.
- A Worker implementation task must include stop_if: No meaningful failing test can be written. unless the work is explicitly docs-only, config-only, generated-artifact-only, or test-only.
- A Worker implementation task is not safe until a completed impact_assessment exists and the Worker task references it.
- The impact_assessment must explicitly cover db_schema_migrations, data_backfill, env_secrets, auth_permissions, api_contract, ui_routes, background_jobs, external_services, deploy_rollback, observability, and docs.
- If the impact assessment says a migration, backfill, env/secret, auth/RLS, API, job, external service, deploy, rollback, or docs update is required, include those files in allowed_files and verification or reject the Worker task.
- For implementation-like work, require a named design_concept, ubiquitous_language, feedback_policy, test_strategy, module_map, interface_contract, and architecture_review; waive them only when workflow_safeguards explicitly disables that gate for the goal mode.
- Prefer deep-module boundaries and interface-first Worker handoffs: Judge designs the boundary, Worker changes internals inside it.
- For read-only audit goals with no active/done Worker and no changed_files, accept audit_scope/audit_findings/review/decision evidence instead of TDD, full impact_assessment, T998, commit, and push.
- Reject completion if a behavior-changing goal lacks a complete goal-level TDD cycle: red evidence from red_test/expected_fail and green evidence from implementation verification. Do not require every polish or shipping task to carry its own red/green pair.
- Reject completion if required workflow safeguards lack evidence, especially design_delta after implementation.
- Require the final audit to include the output of goalbuddy-quality-check.mjs --final.
- Reject final completion unless the board has a done T998 PM shipping task with commit SHA, remote branch or clear push string, successful push result, committed file list, and unrelated dirty files left untouched; or a blocked T998 with explicit shipping_blocker: no_git_repository | no_github_remote.
- If there is no active GitHub remote, require T998 to record the exact blocker; do not pretend a local-only change was shipped.`;
}

function skillRulesMarkdown() {
  return `Board Generation Contract:

- Preserve the LLM-first workflow: broad conversation and idea exploration happen before the board; once the owner says the spec is ready, freeze that shared intent into an oracle and acceptance/evidence contract.
- Do not make policy modes the product. Modes are only guardrails so audits, docs, verification, frontend, migration, and implementation goals get the right proof shape.
- Every generated or repaired \`state.yaml\` must include \`rules.require_quality_checker: true\` and an explicit \`goal_policy\`.
- Choose \`goal_policy.mode\` before presenting the board: \`implementation\`, \`bugfix\`, \`refactor\`, \`audit_read_only\`, \`verification\`, \`research\`, \`docs\`, \`infra\`, \`data_migration\`, \`frontend\`, or \`release\`.
- Every generated or repaired board must include explicit \`workflow_safeguards\` flags.
- For implementation-like goals, require \`design_concept\`, \`ubiquitous_language\`, \`feedback_policy\`, \`test_strategy\`, \`module_map\`, \`interface_contract\`, \`architecture_review\`, and final \`design_delta\` evidence.
- Use those safeguards to keep a shared design concept, a shared language, small feedback loops, and interface-first/deep-module boundaries visible in the board.
- Use \`verification\` for safe QA/test/browser goals that run commands but must not edit files. If a fix is needed, create a separate \`implementation\` Worker with TDD and shipping.
- Use \`audit_read_only\` only when there are no Worker tasks and no \`changed_files\`.
- For implementation goals, include TDD, impact assessment, T998 shipping, and T999 final audit requirements.
- Generate \`T998\` as a PM task, not a Worker task. It should prove commit SHA, remote branch or clear push string, push result, committed files, and unrelated dirty files left untouched.
- If TDD is split across tasks, label them with \`worker_kind\` and validate the goal-level red -> green cycle instead of forcing every Worker to carry both proofs.
- If the workspace is not a git repository or has no GitHub remote, T998 must be blocked with \`shipping_blocker: no_git_repository | no_github_remote\`; never invent commit/push proof.
- Set \`requires_migration_proof: true\` only when the selected work actually includes migration, backfill, RLS/type generation, or rollback work.
- After creating or materially editing \`docs/goals/<slug>/state.yaml\`, run:
  - \`node <skill-path>/scripts/goalbuddy-board-repair.mjs docs/goals/<slug>/state.yaml\`
  - \`node <skill-path>/scripts/goalbuddy-quality-check.mjs docs/goals/<slug>/state.yaml\`
- If the checker fails after repair, keep editing the board until it passes or explicitly report the remaining blocker. Do not present a known-invalid board as ready to run.`;
}
