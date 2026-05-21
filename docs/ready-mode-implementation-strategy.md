# Ready Mode Implementation Strategy

## 1. Executive Summary

We want an autonomous development workflow where a broad idea, PRD, or mature conversation becomes a test-driven delivery run with minimal repeated human prompting.

The target is not "generate more plans". The target is:

1. Capture what the owner actually wants.
2. Convert that desired end state into an observable oracle.
3. Write acceptance tests before production code.
4. Implement only against those tests and approved boundaries.
5. Verify the result against the original request.
6. Commit and push, or record an explicit blocker.
7. Refuse completion until the outcome is actually true.

The strategy is to keep GoalBuddy as the local goal-pressure layer, then add a stricter "Ready Mode" layer inspired by:

- GoalBuddy Goalmaxxed: oracle, local board, receipts, final audit.
- Spec Kit: structured specification and task decomposition.
- ADD: PRD -> Spec -> Plan -> User Test Cases -> Automated Tests -> Implementation.
- Spec Kitty: long-running mission/work-package discipline.
- Symphony: spec/state/event ideas, but not as a replacement runtime yet.
- The AI engineering video principles: shared design concept, ubiquitous language, feedback loops, TDD, deep modules, and daily design investment.

The immediate implementation should remain small and local:

- A generator that creates `goal.md`, `state.yaml`, and `acceptance-contract.md`.
- A checker that enforces oracle/TDD/shipping/final-audit gates.
- A repairer that normalizes generated boards.
- Later, optional runner automation around these files.

## 2. Problem Statement

The current user workflow is:

1. The user discusses a feature or product change with the LLM.
2. Through back-and-forth, the spec becomes clear.
3. The user says "go".
4. The agent should now behave like a serious engineer:
   - write what must be true at the end,
   - write tests first,
   - implement,
   - verify,
   - review,
   - commit,
   - push.

The pain today is that the agent can still:

- start coding before the end-state proof is defined,
- write tests after implementation,
- finish a slice and forget the original outcome,
- forget migrations, env vars, deployment risks, or docs,
- treat audits like implementation goals,
- skip commit/push,
- require the user to manually repair/check every board,
- create plausible but incomplete GoalBuddy plans,
- split work into tiny helper tasks that do not move the owner outcome.

## 3. Product Principle

The workflow should be centered on this invariant:

> Once the user says the spec is ready, the next system must transform the spec into tests and proof before allowing implementation.

The larger operating philosophy is **LLM first**:

- first, use the LLM as a thinking partner to explore, challenge, refine, and converge on the product intent;
- then, when the owner says "go", switch to Ready Mode and freeze the shared intent into an oracle, acceptance contract, tests, and execution board.

The strict part starts after convergence. Before that, the conversation should stay flexible.

Code can change freely inside approved boundaries, but completion is not based on "the agent did work". Completion is based on evidence that the original requested outcome is true.

## 4. Target Operating Model

### 4.1 Conversation Phase

This phase happens before Ready Mode.

The user and LLM discuss the feature, reject ideas, keep good ones, and converge on intent.

Expected output:

- clear owner intent,
- explicit non-goals,
- important examples,
- expected visible behavior,
- likely edge cases,
- product constraints,
- known technical risks,
- acceptance hints.

No code is required in this phase.

### 4.2 Ready Mode Phase

Ready Mode starts when the user says something equivalent to:

- "Ok go"
- "On est pret"
- "Prepare le travail"
- "Implement this"
- "Use the validated spec"

Ready Mode generates a GoalBuddy run with three durable artifacts:

- `goal.md`: the instruction passed to `/goal`.
- `state.yaml`: the active board and workflow state.
- `acceptance-contract.md`: the testable contract derived from the owner outcome.

The first generated board must not pretend to know the repository. It should leave implementation `allowed_files` and verification commands empty until Scout and Judge inspect the real codebase.

### 4.3 Execution Phase

The execution phase follows a fixed shape:

1. Scout maps facts and test seams.
2. Judge approves the acceptance contract and the first red-test slice.
3. Worker writes failing tests only.
4. Worker implements the largest safe useful slice.
5. Worker verifies with targeted and broad checks.
6. Judge reviews architecture and oracle coverage.
7. PM commits and pushes.
8. Judge performs final audit.

The agent can work autonomously inside this loop, but it must stop if a required boundary is missing.

## 5. Core Concepts

### 5.1 Owner Intent

The human-level outcome being requested.

Bad:

- "Update component X."

Good:

- "A user can import LinkedIn/onboarding data and receive persona/studio defaults without losing manual choices."

### 5.2 Oracle

The observable signal that proves the outcome is real.

Examples:

- acceptance tests pass,
- browser walkthrough matches expected UI,
- generated artifact exists and passes validation,
- benchmark result crosses threshold,
- source-backed audit answers the question,
- release check confirms deployment readiness.

No oracle means no serious implementation goal.

### 5.3 Acceptance Contract

The owner-facing proof contract. It says:

- what must be visible at the end,
- which paths must be tested,
- which edge cases matter,
- what must not happen,
- what evidence is required.

This is the bridge between conversation and tests.

### 5.4 Red Test

A test or check that fails before production implementation for the expected reason.

This can be:

- unit test,
- integration test,
- E2E test,
- browser assertion,
- snapshot/artifact validation,
- migration verification,
- contract test,
- source-backed audit checklist for non-code work.

### 5.5 Largest Safe Useful Slice

Safe does not mean tiny.

A safe slice is:

- bounded,
- explicit,
- reversible,
- verified,
- tied to the oracle.

A useful slice should move the owner outcome, not only add helper files or notes.

### 5.6 Final Audit

The final audit maps evidence back to the original outcome.

It must be skeptical. It should reject completion when:

- tests pass but do not prove the owner outcome,
- shipping proof is missing,
- required tasks are still queued,
- implementation drifted outside the contract,
- migration/env/deployment risks were discovered but not handled,
- visual behavior was not checked for UI work.

## 6. Why Not Replace GoalBuddy

We evaluated several directions.

### 6.1 Don Cheli

Strengths:

- strong spec-driven philosophy,
- pushes structured development.

Weaknesses:

- fragile installation and validation behavior,
- package mismatch issues,
- too coupled to its own command layout,
- not reliable enough as the core runtime.

Decision:

- Do not adopt as the base.
- Reuse only ideas.

### 6.2 Spec Kit

Strengths:

- clean initialization,
- good structure for specs and tasks,
- credible foundation for spec-to-plan workflow.

Weaknesses:

- tests are optional by default,
- not strict enough for ATDD/TDD without customization.

Decision:

- Use as inspiration for artifact structure.
- Do not rely on it alone.

### 6.3 Spec Kitty

Strengths:

- powerful mission/work-package runner,
- long-running orchestration,
- review/merge discipline,
- interesting for multi-product evolution.

Weaknesses:

- intrusive global setup,
- more complex than the immediate need,
- requires adoption ceremony and operating discipline.

Decision:

- Keep as a future runner candidate.
- Do not make it the default yet.

### 6.4 ADD

Strengths:

- closest doctrine to the desired workflow:
  PRD -> Spec -> Plan -> User Test Cases -> Automated Tests -> Implementation.
- strong RED/GREEN/REFACTOR/VERIFY framing.

Weaknesses:

- mostly prompt/process material,
- not enough local runtime enforcement.

Decision:

- Adopt the doctrine.
- Implement enforcement in our GoalBuddy layer.

### 6.5 Symphony

Strengths:

- interesting spec/state/event orientation,
- useful mental model for future orchestration.

Weaknesses:

- adopting it now would shift attention from the core TDD workflow,
- it does not directly solve the owner-intent -> acceptance-test -> implementation loop alone.

Decision:

- Do not replace GoalBuddy with Symphony.
- Consider later as a state/event model if we build a richer runner.

## 7. Chosen Strategy

The chosen strategy is hybrid but locally controlled:

1. Keep GoalBuddy as the visible local board and pressure system.
2. Add Ready Mode as the default entry point after a spec is mature.
3. Enforce ATDD/TDD through generated board structure and quality checks.
4. Keep scripts local, deterministic, and inspectable.
5. Add runner automation only after the artifact model is stable.

This avoids betting on one external project while still absorbing the best lessons from each.

## 8. Ready Mode Pipeline

### 8.1 Input

Ready Mode accepts:

- a direct goal string,
- a Markdown brief,
- later: a transcript or prepared conversation summary.

Example:

```bash
node scripts/goalbuddy-ready-mode.mjs \
  --from docs/briefs/persona-defaults.md \
  --out docs/goals/persona-defaults
```

### 8.2 Generated Artifacts

#### `goal.md`

Purpose:

- instruction for `/goal`,
- original request,
- Ready Mode instruction,
- oracle summary,
- references to generated files.

#### `acceptance-contract.md`

Purpose:

- initial proof contract,
- owner-visible behavior,
- acceptance test draft,
- visual/demo oracle if needed,
- non-goals.

T001/T002 must refine it after reading the repo.

#### `state.yaml`

Purpose:

- durable board state,
- active task,
- agent responsibilities,
- policies,
- safeguards,
- receipts,
- final audit.

## 9. Board Shape

### 9.1 Required Top-Level Fields

The generated board must include:

- `version: 2`
- `goal`
- `rules`
- `goal_policy`
- `workflow_safeguards`
- `agents`
- `active_task`
- `tasks`

### 9.2 Required Goal Fields

The goal must include:

- `slug`
- `title`
- `status`
- `original_request`
- `interpreted_outcome`
- `proof_type`
- `completion_proof`
- `goal_oracle`
- `oracle.signal`
- `oracle.final_proof`
- `likely_misfire`
- `constraints`

### 9.3 Required Rules

Minimum:

```yaml
rules:
  one_active_task: true
  require_quality_checker: true
  require_tdd_worker_flow: true
  require_github_ship_task: true
  require_impact_assessment: true
  goal_pressure_requires_oracle: true
```

### 9.4 Required Goal Policy

For implementation goals:

```yaml
goal_policy:
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
```

The policy can change only after Scout/Judge evidence. For example:

- pure audit -> `audit_read_only`,
- docs-only -> `docs`,
- verification-only -> `verification`,
- migration work -> `data_migration`,
- UI-heavy work -> `frontend`.

## 10. Standard Task Sequence

### T001 Scout: Contract And Codebase Map

Status:

- active at board creation.

Purpose:

- read the repo,
- map relevant modules,
- identify test seams,
- refine acceptance contract,
- perform impact assessment,
- map dirty worktree risks.

Expected outputs:

- `design_concept`
- `ubiquitous_language`
- `module_map`
- `interface_contract`
- `test_strategy`
- `feedback_policy`
- `acceptance_contract_updates`
- `dirty_worktree_risk_map`
- `impact_assessment`

### T002 Judge: Approve Contract And Red Tests

Purpose:

- validate the acceptance contract,
- reject vague tests,
- choose the largest safe red-test slice,
- fill `allowed_files` and `verify` for T003.

Judge must reject:

- implementation before tests,
- tests that do not express the oracle,
- micro-slices that do not advance the outcome,
- missing impact dimensions,
- unknown module boundaries.

### T003 Worker: Red Tests

Worker kind:

```yaml
worker_kind: red_test
```

Purpose:

- write failing tests only,
- no production implementation,
- prove tests fail for the expected reason.

Receipt must include:

- changed test files,
- command run,
- failing output summary,
- `expected_fail` or equivalent red evidence.

### T004 Worker: Implementation

Worker kind:

```yaml
worker_kind: implementation
```

Purpose:

- implement the approved slice,
- make T003 tests pass,
- keep changes inside allowed files,
- maintain design boundaries.

Receipt must include:

- changed files,
- red test reference,
- green test command/result,
- design delta,
- any follow-up risk.

### T005 Worker: Verification

Worker kind:

```yaml
worker_kind: verification
```

Purpose:

- run broader verification,
- browser/visual checks if needed,
- full suite when appropriate.

Receipt must include:

- commands,
- results,
- skipped checks with reasons,
- blockers if any.

### T006 Judge: Architecture And Oracle Review

Purpose:

- inspect diff and receipts,
- map result to original oracle,
- identify design drift,
- decide whether more Worker work is needed.

### T998 PM: Shipping

Purpose:

- commit goal-related changes,
- push branch,
- leave unrelated dirty files untouched.

Receipt must include:

- `commit_sha`
- `remote_branch` or push string,
- `push_result`
- `committed_files`
- `unrelated_dirty_files_left_untouched`

If impossible:

```yaml
receipt:
  result: blocked
  shipping_blocker: no_git_repository
```

or:

```yaml
receipt:
  result: blocked
  shipping_blocker: no_github_remote
```

### T999 Judge: Final Audit

Purpose:

- decide if the original outcome is actually true.

Must reject if:

- T998 is missing,
- push proof is missing,
- Worker tasks remain queued,
- red/green evidence is missing,
- tests do not prove the oracle,
- impact risks were not handled.

## 11. Policy Modes

### Implementation

Default for product behavior changes.

Requires:

- TDD,
- impact assessment,
- shipping,
- final audit.

### Audit Read-Only

For questions like:

- "Audit this feature"
- "Review coherence"
- "Find risks"

Does not require:

- implementation,
- TDD,
- commit/push.

Requires:

- audit scope,
- evidence,
- findings,
- final decision.

If files change, the board must stop being read-only.

### Docs

For documentation-only work.

Does not require TDD.

Requires shipping if files are changed.

### Verification

For safe test/browser/QA runs without code edits.

If a defect is found and fixed, switch to implementation.

### Frontend

For UI work.

Requires:

- TDD where possible,
- browser or visual verification,
- mobile/desktop checks when relevant.

### Data Migration

For DB/schema/backfill/RLS work.

Requires:

- migration proof,
- rollback/backfill notes,
- type generation or schema verification where relevant.

## 12. Impact Assessment Dimensions

Before Worker implementation starts, Scout/Judge must cover:

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

If one dimension is relevant, Worker scope must include the files and verification for it.

Example:

- A feature needs a new DB column.
- Then the Worker package must include migration files, generated types if needed, rollback/deploy notes, and migration verification.
- If those files are not allowed, Worker stops.

## 13. Quality Checker Responsibilities

The checker should enforce:

- `version: 2`
- quality checker enabled,
- TDD requirement when policy requires it,
- shipping task when policy requires it,
- final audit task,
- active Worker shape,
- red/green evidence,
- impact assessment before Worker start,
- final completion proof,
- read-only audit exemption,
- shipping blocker validity.

The checker should not:

- invent product architecture,
- guess correct files,
- mark a goal complete,
- pretend local commit equals GitHub push.

## 14. Repair Script Responsibilities

The repair script should:

- add missing structural fields,
- normalize rules,
- add `goal_policy` when missing,
- add `workflow_safeguards`,
- add standard stop conditions,
- add T998/T999 when required,
- preserve user-specific goal content.

The repair script should not:

- invent implementation details,
- invent acceptance tests,
- invent commit/push proof,
- turn an audit into implementation without evidence.

## 15. Ready Mode Generator Responsibilities

The Ready Mode generator should:

- create a clean board from a mature spec,
- require an oracle,
- create an acceptance contract draft,
- enforce red-test-first task order,
- leave Worker files/commands empty until Scout/Judge inspect the repo,
- run repair/check internally,
- refuse overwrite unless `--force`.

The generator should not:

- auto-implement,
- guess repository-specific test commands,
- skip Scout/Judge,
- make shipping proof up.

## 16. Current Prototype

Current implemented files:

- `scripts/goalbuddy-ready-mode.mjs`
- `scripts/goalbuddy-ready-mode.test.mjs`
- `scripts/goalbuddy-board-repair.mjs`
- `scripts/goalbuddy-quality-check.mjs`
- `README.md`

Current usage:

```bash
node scripts/goalbuddy-ready-mode.mjs \
  --goal "Implement the feature described in our prepared spec" \
  --slug my-feature \
  --out docs/goals/my-feature
```

From file:

```bash
node scripts/goalbuddy-ready-mode.mjs \
  --from docs/briefs/my-feature.md \
  --out docs/goals/my-feature
```

Current validation:

```bash
node --test scripts/goalbuddy-ready-mode.test.mjs scripts/goalbuddy-quality-check.test.mjs scripts/goalbuddy-board-repair.test.mjs
```

## 17. Next Implementation Phases

### Phase 1: Stabilize Ready Mode

Goal:

- Make the current generator reliable enough for daily use.

Work:

- Add `--oracle` argument.
- Add `--mode` argument with safe policy templates.
- Add `--visual` flag for frontend goals.
- Add `--no-shipping` only for explicit audit/research/verification modes.
- Improve generated `acceptance-contract.md`.
- Add fixture tests for implementation, audit, docs, verification, frontend, and migration goals.

Acceptance:

- generated boards pass checker,
- invalid combinations fail,
- docs explain common commands.

### Phase 2: Install Into GoalBuddy Personalization

Goal:

- Reapply Ready Mode after GoalBuddy updates.

Work:

- Update `scripts/personalize-goalbuddy.mjs` to install `goalbuddy-ready-mode.mjs` beside the checker and repair scripts.
- Ensure the installed GoalBuddy skill references Ready Mode.
- Add tests or dry-run checks for installed paths.

Acceptance:

- after `npx goalbuddy update`, running personalization restores Ready Mode.

### Phase 3: Conversation-To-Brief Compiler

Goal:

- Reduce manual spec copy/paste.

Work:

- Add a command/script that takes a conversation summary or Markdown transcript.
- Extract:
  - owner intent,
  - non-goals,
  - examples,
  - acceptance hints,
  - open questions,
  - suggested oracle.
- Write `brief.md`.
- Feed `brief.md` into Ready Mode.

Acceptance:

- broad feature discussions become structured briefs without losing nuance.

### Phase 4: Acceptance Test Planner

Goal:

- Make the first Scout/Judge pass more deterministic.

Work:

- Add templates for:
  - backend API feature,
  - frontend feature,
  - data migration,
  - AI generation behavior,
  - docs/audit,
  - integration with external service.
- Generate candidate test matrix.
- Require Judge to approve or revise it.

Acceptance:

- T003 starts from concrete test candidates rather than a blank instruction.

### Phase 5: Runner Automation

Goal:

- Reduce user interaction during the run.

Work:

- Add a lightweight `goalbuddy-next` runner or wrapper.
- It should:
  - read `state.yaml`,
  - identify active task,
  - run quality check,
  - suggest or execute next role step,
  - refuse unsafe transitions,
  - keep receipts in state.

Important:

- This should come after the artifact model is stable.
- Do not build a big runner before the boards are consistently good.

Acceptance:

- the user can run one command and the workflow advances until blocked or complete.

### Phase 6: Long-Running Product Evolution

Goal:

- Manage multiple products/features over time.

Work:

- Add goal index:
  - active goals,
  - blocked goals,
  - shipped goals,
  - follow-up goals.
- Add product memory:
  - decisions,
  - canonical terminology,
  - recurring risks,
  - known test commands,
  - known deployment constraints.
- Optionally integrate Spec Kitty-like missions for multi-repo or multi-feature programs.

Acceptance:

- future work starts with accumulated product knowledge instead of rediscovering everything.

## 18. Future Architecture

Possible future layout:

```text
docs/
  briefs/
    <feature>.md
  goals/
    <feature>/
      goal.md
      state.yaml
      acceptance-contract.md
      receipts/
      verification/
  product-memory/
    glossary.md
    test-commands.md
    architecture-map.md
    deployment-risks.md
scripts/
  goalbuddy-ready-mode.mjs
  goalbuddy-board-repair.mjs
  goalbuddy-quality-check.mjs
  goalbuddy-next.mjs
```

## 19. Human Interaction Model

The user should only need to intervene when:

- the spec is genuinely ambiguous,
- the oracle has multiple valid interpretations,
- external credentials are missing,
- destructive production action is required,
- a business decision is needed,
- shipping target is unclear.

The user should not need to repeatedly say:

- "write tests first",
- "did you push?",
- "did you check migrations?",
- "did you run the tests?",
- "is the goal actually complete?"

Those should be structural requirements.

## 20. Decision

The final recommended direction is:

1. Do not replace GoalBuddy.
2. Do not adopt Don Cheli as runtime.
3. Do not make Spec Kitty the default yet.
4. Do not build a large orchestrator immediately.
5. Build a small Ready Mode layer on top of GoalBuddy.
6. Make ATDD/TDD the default path after any mature spec.
7. Add runner automation only once generated boards are consistently excellent.

This is the best balance between reliability, autonomy, and control.

## 21. Definition Of Done For The Future Implementation

The future implementation is successful when:

- a user can provide a mature spec or brief,
- one command generates a GoalBuddy board,
- the board has a real oracle,
- the board starts with Scout/Judge before code,
- red tests are mandatory before implementation,
- implementation is bounded by approved files,
- verification and review are mandatory,
- commit/push or explicit shipping blocker is mandatory,
- final audit rejects weak completion,
- audits/docs/verification goals avoid unnecessary implementation gates,
- the workflow survives GoalBuddy updates through personalization.

## 22. Recommended Next Goal

Recommended next implementation goal:

> Stabilize Ready Mode into a daily driver: add explicit oracle/mode flags, policy templates, stronger acceptance-contract generation, personalization installation, and tests for implementation/audit/docs/frontend/migration cases.

The oracle for that goal:

> Given a mature spec, Ready Mode generates a checker-clean board and acceptance contract for the correct goal mode, and the generated board enforces red-test-first implementation plus final shipping/audit proof without manual repair.
