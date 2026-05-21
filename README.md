# LLM First DevLoop

[![CI](https://github.com/arnaudlopez/llm-first-devloop/actions/workflows/ci.yml/badge.svg)](https://github.com/arnaudlopez/llm-first-devloop/actions/workflows/ci.yml)

LLM First DevLoop is a small, local workflow layer for turning a mature LLM conversation or PRD into a GoalBuddy run that is driven by an observable oracle, acceptance tests, verification, and shipping proof.

The principle is simple:

1. **LLM first**: use the LLM freely to explore, challenge, reject, and refine ideas until the product intent is clear.
2. **Ready Mode**: when the owner says the spec is ready, freeze that shared intent into an oracle, acceptance contract, and execution board.
3. **ATDD/TDD execution**: write failing tests or equivalent evidence before implementation, then implement only against approved boundaries.
4. **Proof before done**: final completion requires verification, review, commit/push proof, or an explicit blocker.

This repository is meant to be reusable tooling, not just an archive. It gives you a CLI path from "we talked through the idea" to a GoalBuddy board that can be checked, repaired, implemented, audited, and shipped.

## What Is Included

- `scripts/goalbuddy-brief.mjs`: compiles conversation notes, a PRD, or a transcript into a Ready Mode brief.
- `scripts/goalbuddy-interview.mjs`: checks whether LLM-first notes are mature enough, or writes clarification questions.
- `scripts/goalbuddy-ready-mode.mjs`: generates `goal.md`, `state.yaml`, and `acceptance-contract.md` from a mature spec.
- `scripts/goalbuddy-next.mjs`: inspects a board and prints the exact next prompt without mutating state.
- `scripts/goalbuddy-quality-check.mjs`: validates GoalBuddy boards for oracle, TDD, impact, shipping, and final audit evidence.
- `scripts/goalbuddy-board-repair.mjs`: normalizes generated boards without inventing product details.
- `scripts/personalize-goalbuddy.mjs`: reapplies these customizations after GoalBuddy updates.
- `examples/`: copyable conversation and brief examples.
- `docs/ready-mode-implementation-strategy.md`: full strategy and future implementation plan.
- `docs/conversation-history.md`: condensed history of the design decisions behind the project.

## Quick Start

Clone the repo and run the tests:

```bash
npm install
npm test
```

Check whether conversation notes are mature enough:

```bash
npm run interview -- \
  --from examples/conversation-notes.md \
  --out briefs/saved-search.md \
  --oracle "Acceptance tests prove saved searches can be created, listed, reopened, renamed, and deleted."
```

Compile conversation notes directly into a clean brief:

```bash
npm run brief -- \
  --from examples/conversation-notes.md \
  --out briefs/saved-search.md \
  --oracle "Acceptance tests prove saved searches can be created, listed, reopened, renamed, and deleted."
```

Generate a Ready Mode board from that brief:

```bash
npm run ready -- \
  --from briefs/saved-search.md \
  --mode implementation \
  --oracle "Acceptance tests prove saved searches can be created, listed, reopened, renamed, and deleted." \
  --out docs/goals/saved-search
```

Check the generated board:

```bash
npm run check -- docs/goals/saved-search/state.yaml
```

Ask what to do next without mutating the board:

```bash
npm run next -- docs/goals/saved-search/state.yaml
```

Repair a hand-written or older board:

```bash
npm run repair -- --dry-run --json docs/goals/saved-search/state.yaml
```

## CLI Commands

When installed as an npm package, the same tools are exposed as binaries:

```bash
llm-first-devloop --help
llm-first-devloop brief --help
llm-first-devloop interview --help
llm-first-devloop ready --help
llm-first-devloop next --help
goalbuddy-brief --help
goalbuddy-interview --help
goalbuddy-ready --help
goalbuddy-check --help
goalbuddy-repair --help
goalbuddy-next --help
```

Until the package is published, use the `npm run` commands from a clone. After publishing, these direct forms will work:

```bash
npx llm-first-devloop ready --help
npx --package llm-first-devloop goalbuddy-ready --help
```

## How To Use

1. Start with an ordinary LLM conversation. Explore the idea, reject weak options, clarify examples, and converge on intent.
2. Save the useful notes, PRD, or transcript to Markdown.
3. Run `goalbuddy-interview` if the notes may still be immature; resolve any generated clarification questions in the LLM conversation.
4. Run `goalbuddy-brief` to turn mature notes into a structured brief with intent, non-goals, oracle, acceptance hints, risks, and constraints.
5. Run `goalbuddy-ready` when the owner says "go".
6. Run `goalbuddy-next` to inspect the board and produce the next prompt.
7. Give the generated `goal.md` and `state.yaml` to GoalBuddy through `/goal`.
8. Let Scout and Judge refine the acceptance contract before Worker implementation.
9. Finish only after verification, final audit, and shipping proof or an explicit blocker.

## GoalBuddy Personalization

This workspace keeps local GoalBuddy customizations that can be reapplied after each GoalBuddy update.

## Reapply After Updating GoalBuddy

Preview changes:

```bash
./scripts/personalize-goalbuddy.mjs --dry-run
```

Apply changes:

```bash
./scripts/personalize-goalbuddy.mjs
```

The script patches the installed GoalBuddy Worker/Judge prompts and state template in:

- `~/.claude`
- `~/.codex/plugins/cache/goalbuddy`

It also installs `goalbuddy-quality-check.mjs` and `goalbuddy-board-repair.mjs` into GoalBuddy's own `scripts/` directories.

## Board Repair

Generated boards should be repaired and checked before being shown as ready:

```bash
node scripts/goalbuddy-board-repair.mjs docs/goals/<slug>/state.yaml
node scripts/goalbuddy-quality-check.mjs docs/goals/<slug>/state.yaml
```

Dry-run repair:

```bash
node scripts/goalbuddy-board-repair.mjs --dry-run --json docs/goals/<slug>/state.yaml
```

The repair script adds missing `rules`, `goal_policy`, Worker `impact_assessment_ref`, standard stop conditions, `T998` shipping when required, and a complete `T999` final audit task. It does not invent product architecture or implementation details.

## Ready Mode

Ready Mode is the stricter entry point for a mature conversation or PRD. It creates a GoalBuddy board that starts from the end-state proof, then forces acceptance tests before implementation:

The operating principle stays **LLM first**: use the LLM freely to explore, debate, reject ideas, and converge on the spec. Ready Mode starts after that, when the owner says the spec is ready and the conversation should be frozen into an oracle, acceptance contract, and execution board.

```bash
node scripts/goalbuddy-ready-mode.mjs \
  --goal "Implement the feature described in our prepared spec" \
  --oracle "Acceptance tests prove the visible outcome matches the approved spec" \
  --slug my-feature \
  --out docs/goals/my-feature
```

From a Markdown brief:

```bash
node scripts/goalbuddy-ready-mode.mjs \
  --from docs/briefs/my-feature.md \
  --mode implementation \
  --out docs/goals/my-feature
```

Useful options:

- `--oracle "...":` explicit observable proof for completion.
- `--mode implementation|frontend|data_migration|docs|audit_read_only|verification|research`: guardrail policy; implementation remains the default.
- `--visual`: shortcut for frontend-style visual/browser evidence.
- `--no-shipping`: allowed only for non-implementation modes where shipping is not part of done.

It writes:

- `goal.md`: the `/goal` instruction.
- `state.yaml`: a checker-clean board with oracle, Scout/Judge/Worker tasks, red-test Worker, implementation Worker, verification, shipping, and final audit.
- `acceptance-contract.md`: the owner-facing test contract that T001/T002 must refine before code.

The acceptance contract includes visible outcome, tests to write first, failure modes, manual/visual proof, out-of-scope boundaries, and shipping proof.

Use it when the human conversation has converged and the next exchange should be “build this, but prove it from tests first”. The generated board deliberately leaves Worker `allowed_files` and `verify` empty until Scout and Judge inspect the real repository. That prevents the generator from pretending to know module boundaries it has not read yet.

## Workflow Safeguards

Implementation-like boards include explicit `workflow_safeguards` so the AI does not drift into blind specs-to-code:

```yaml
workflow_safeguards:
  requires_design_concept: true
  requires_ubiquitous_language: true
  requires_feedback_policy: true
  requires_test_strategy: true
  requires_module_map: true
  requires_interface_contract: true
  requires_architecture_review: true
  requires_design_delta: true
```

These fields turn the video-derived habits into board evidence:

- `design_concept`: the shared understanding, non-goals, and decision dependencies.
- `ubiquitous_language`: domain terms the user, board, prompts, and code should use consistently.
- `feedback_policy`: the speed limit for the Worker, including targeted checks before broader changes.
- `test_strategy`: what behavior is tested, at what boundary, and what is mocked.
- `module_map`: the relevant deep modules, boundaries, and shallow-module risks.
- `interface_contract`: the boundary Judge approves before Worker changes internals.
- `architecture_review`: the design risk review before implementation and final completion.
- `design_delta`: what architecture or interface changed, stayed stable, or was intentionally deferred.

`audit_read_only`, `verification`, `research`, and docs-only goals keep these safeguards disabled by default unless the board explicitly opts in. The point is shared design discipline, not process cosplay.

## TDD Gate

For behavior-changing Worker tasks, the customized workflow requires:

- `red_test`: the targeted test fails for the expected reason before production code changes.
- `green_test`: the same targeted test passes after implementation.
- `verification`: the task verification commands pass.
- `changed_files`: the receipt lists the files changed.

TDD can be split across tasks when the board says so explicitly:

```yaml
worker_kind: red_test        # writes failing tests only; expected_fail counts as red evidence
worker_kind: implementation  # makes the prior red tests pass
worker_kind: polish          # verified follow-up polish without a fresh red/green cycle
worker_kind: verification    # test/browser checks only
```

The checker validates the goal-level red -> green cycle instead of forcing every Worker to carry both proofs. Docs-only, config-only, generated-artifact-only, and test-only tasks can also be exempt when the board says so explicitly.

## Goal Policy Matrix

New boards include an explicit `goal_policy` section. The checker uses it to activate only the gates that fit the work:

```yaml
goal_policy:
  mode: implementation # implementation | bugfix | refactor | audit_read_only | verification | research | docs | infra | data_migration | frontend | release
  requires_tdd: true
  requires_impact_assessment: true
  requires_shipping: true
  requires_visual_verification: false
  requires_migration_proof: false
  requires_infra_proof: false
  requires_dependency_review: false
  requires_dirty_worktree_guard: true
  requires_refactor_proof: false
```

If `goal_policy` is missing, the checker infers a conservative policy and emits a warning. Explicit policy is preferred.

Mode-specific proof examples:

- `implementation` / `bugfix`: red test, green test, impact assessment, shipping.
- `refactor`: characterization or `behavior_unchanged` evidence, verification, shipping.
- `audit_read_only`: audit evidence only, as long as no Worker starts and no files change.
- `verification`: safe QA/test/browser commands with no file changes; if a fix is needed, switch to `implementation`.
- `research`: sources/decision evidence; shipping only if files change.
- `docs`: no TDD; shipping required when docs files change.
- `infra` / `release`: dry-run, config validation, env/secrets and rollback evidence.
- `data_migration`: migration proof, rollback/backfill/RLS/types evidence. Use this only when the selected implementation actually includes migration/backfill/RLS/type-generation work; a possible future migration should stay as `requires_migration_proof: false` until confirmed.
- `frontend`: visual verification such as Playwright screenshot, mobile/desktop, or accessibility evidence.

## Impact Assessment Gate

Worker implementation must not start until a completed `impact_assessment` exists. The assessment must explicitly cover:

- `db_schema_migrations`
- `data_backfill`
- `env_secrets`
- `auth_permissions`
- `api_contract`
- `ui_routes`
- `background_jobs`
- `external_services`
- `deploy_rollback`
- `observability`
- `docs`

If the assessment says a migration, backfill, env/secret, auth/RLS/permission, API contract, job, external service, deployment, rollback, or docs change is required, the Worker task must include the relevant files in `allowed_files` and verification. Otherwise the Judge should reject the Worker task, and the Worker should stop blocked if it discovers the missing impact during implementation.

## Final Shipping Gate

New boards get a mandatory `T998` PM task before final audit. A goal must not be marked done until `T998` records:

- commit SHA
- remote branch, or a clear push string such as `push: "origin main successful"`
- successful push result
- committed files
- unrelated dirty files left untouched

The final audit task `T999` must reject completion without that shipping proof.

If the workspace is not a git repository or has no active GitHub remote, `T998` must be blocked with the exact missing setup:

```yaml
receipt:
  result: blocked
  shipping_blocker: no_git_repository # or no_github_remote
```

A local-only commit does not count as shipped, and the board must never invent commit/push proof.

## Read-Only Audit Exemption

Pure read-only audits are intentionally exempt from implementation gates. The checker treats a goal as read-only audit when:

- `goal.kind: audit` or `proof_type: review | source_backed_answer | decision`
- no Worker task is `active` or `done`
- no task receipt reports `changed_files`

In that case, final completion does not require TDD, full implementation impact assessment, `T998`, commit, or push. It does require read-only audit evidence such as `audit_scope`, `audit_findings`, `review`, or `decision`.

If an audit starts Worker work or changes files, the exemption is removed and the normal implementation gates apply again.

## Manual Quality Check

Run during a goal:

```bash
node scripts/goalbuddy-quality-check.mjs docs/goals/<slug>/state.yaml
```

Run before marking a goal complete:

```bash
node scripts/goalbuddy-quality-check.mjs --final docs/goals/<slug>/state.yaml
```

Machine-readable output:

```bash
node scripts/goalbuddy-quality-check.mjs --final --json docs/goals/<slug>/state.yaml
```
