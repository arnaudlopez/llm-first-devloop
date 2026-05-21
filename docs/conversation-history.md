# Conversation History

This document condenses the working conversation that led to LLM First DevLoop.

## Starting Point

The initial problem was practical: GoalBuddy helped structure work, but some runs still finished without commit/push, did not reliably write tests first, and could forget operational concerns such as migrations, environment variables, deployment, or external side effects.

The desired workflow became:

- broad conversation first,
- then a clear spec,
- then acceptance tests,
- then implementation,
- then verification,
- then review,
- then commit and push.

## Early GoalBuddy Customization

The first changes focused on making GoalBuddy stricter:

- mandatory quality checker,
- explicit `goal_policy`,
- TDD gates for implementation work,
- split red-test and implementation workers,
- impact assessment before Worker implementation,
- migration/infra/frontend/refactor proof flags,
- read-only audit exemption,
- mandatory shipping task `T998`,
- final audit task `T999`.

The important lesson was that a single rigid policy does not fit all work. Implementation goals need TDD and shipping, but audits should remain read-only and should not be forced into fake implementation tasks.

## Audit Blind Spot

Generated audit boards exposed a weakness: the system could treat "test this feature safely" or "audit this flow" like an implementation goal.

The fix was to distinguish policy from outcome:

- `audit_read_only`: evidence and decision, no Worker edits.
- `verification`: safe checks without code changes.
- `implementation`: red tests, code changes, verification, shipping.
- `docs`: artifact and review.
- `frontend`: visual/browser evidence.
- `data_migration`: migration/backfill/rollback proof.

These modes are guardrails, not the core product.

## Video-Inspired Principles

A software engineering talk introduced several ideas that became workflow safeguards:

- shared design concept,
- ubiquitous language,
- feedback loops,
- TDD as a speed limit,
- deep modules and interface-first design,
- daily design investment.

Those became board evidence fields:

- `design_concept`
- `ubiquitous_language`
- `feedback_policy`
- `test_strategy`
- `module_map`
- `interface_contract`
- `architecture_review`
- `design_delta`

## External Tool Evaluation

Several related tools and approaches were evaluated conceptually or experimentally.

### Don Cheli

Useful philosophy, but too fragile as a runtime. It had installation and validation rough edges and was not reliable enough to become the core.

Decision: reuse ideas only.

### Spec Kit

Clean structure and good specification flow, but tests are optional by default. It is useful inspiration, not strict enough alone for the desired ATDD workflow.

Decision: use as structure inspiration.

### Spec Kitty

Powerful mission/work-package runner with long-running orchestration potential, but heavier and more intrusive than needed for the first stable version.

Decision: keep as a future runner reference.

### ADD

The closest doctrine to the desired shape:

`PRD -> Spec -> Plan -> User Test Cases -> Automated Tests -> Implementation`

Decision: adopt the doctrine, enforce it locally.

### Symphony

Interesting spec/state/event model, but adopting it would distract from the immediate TDD workflow.

Decision: do not replace GoalBuddy; revisit later if a richer runner is needed.

## Strategy Decision

The selected direction was:

1. Keep GoalBuddy as the local board and pressure layer.
2. Build a small Ready Mode generator on top.
3. Make the oracle and acceptance contract first-class.
4. Enforce red tests before implementation for behavior-changing work.
5. Require commit/push proof or an explicit blocker.
6. Keep everything local, file-backed, inspectable, and testable.

## LLM First Correction

The most important refinement was preserving the user's natural workflow.

The system should not start with bureaucracy. It should start with a free-form LLM conversation:

- explore the idea,
- challenge assumptions,
- compare options,
- reject bad ideas,
- converge on the spec.

Only after the user says "go" should Ready Mode activate.

The final principle:

> LLM first until the spec is mature. Then Ready Mode freezes the shared intent into oracle, acceptance contract, tests, execution, verification, and shipping proof.

## Current Implementation

The prototype now includes:

- `goalbuddy-ready-mode.mjs`
- `goalbuddy-quality-check.mjs`
- `goalbuddy-board-repair.mjs`
- `personalize-goalbuddy.mjs`
- unit tests for the scripts,
- a complete implementation strategy document,
- installation into local GoalBuddy skill folders.

## Next Direction

The next useful work is to turn this into a daily driver:

- improve the generated acceptance contract,
- add more fixtures for real product cases,
- add a conversation-to-brief compiler,
- add an optional lightweight runner,
- preserve project memory across goals,
- keep the LLM-first principle visible in every entry point.

