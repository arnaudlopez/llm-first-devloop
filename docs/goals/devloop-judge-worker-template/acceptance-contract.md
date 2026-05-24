# Acceptance Contract

## Goal

# DevLoop Judge Worker Template

## Intent

Use the dogfood result to reduce the last obviously manual step in the local autonomous loop: when a Judge task is active, `llm-first-devloop loop` should give Codex a concrete `task_updates` receipt scaffold for queued Worker tasks instead of an empty object.

The owner goal is less repeated "next/go/enchaine" and fewer chances for the agent to forget `allowed_files`, `verify`, `stop_if`, or `impact_assessment_ref` before Worker execution.

- Do not make `loop` execute native `/goal`.
- Do not auto-approve architecture decisions.
- Do not guess exact product files.
- Do not mutate `state.yaml` from `loop`.
- Do not remove Judge responsibility.

## Non-Goals

- TODO: Name what this goal must not change.

## Proposed Oracle

Tests prove that an active Judge handoff includes a useful task_updates scaffold for queued red-test, implementation, and verification Workers, with required guardrails and no board mutation.

## Suggested Mode

implementation

## Acceptance Hints

- A Judge `receiptTemplate` contains `task_updates` entries for queued Worker tasks.
- Each Worker update includes `allowed_files`, `verify`, `stop_if`, and `impact_assessment_ref`.
- Red-test, implementation, and verification Workers get role-specific stop rules.
- The template uses placeholders where exact files/commands require repo-specific judgment.
- Existing Scout, Worker, PM and blocked behavior still passes.
- `npm test` passes.

## Risks And Open Questions

- TODO: List ambiguity, missing credentials, operational risks, or decisions needed before implementation.

## Constraints

- TODO: Capture constraints, must-preserve behavior, boundaries, or forbidden changes.

## Ready Mode Command

```bash
npm run ready -- --from ./docs/goals/devloop-judge-worker-template/brief.md --mode implementation --oracle "Tests prove that an active Judge handoff includes a useful task_updates scaffold for queued red-test, implementation, and verification Workers, with required guardrails and no board mutation." --out docs/goals/devloop-judge-worker-template
```

## Source Notes

Compiled from: /Users/arnaud/Documents/llm-first-devloop/docs/devloop-judge-worker-template-notes.md

> # DevLoop Judge Worker Template
> 
> ## Intent
> 
> Use the dogfood result to reduce the last obviously manual step in the local autonomous loop: when a Judge task is active, `llm-first-devloop loop` should give Codex a concrete `task_updates` receipt scaffold for queued Worker tasks instead of an empty object.
> 
> The owner goal is less repeated "next/go/enchaine" and fewer chances for the agent to forget `allowed_files`, `verify`, `stop_if`, or `impact_assessment_ref` before Worker execution.
> 
> ## Non-Goals
> 
> - Do not make `loop` execute native `/goal`.
> - Do not auto-approve architecture decisions.
> - Do not guess exact product files.
> - Do not mutate `state.yaml` from `loop`.
> - Do not remove Judge responsibility.
> 
> ## Proposed Oracle
> 
> Tests prove that an active Judge handoff includes a useful `task_updates` scaffold for queued red-test, implementation, and verification Workers, with required guardrails and no board mutation.
> 
> ## Acceptance
> 
> - A Judge `receiptTemplate` contains `task_updates` entries for queued Worker tasks.
> - Each Worker update includes `allowed_files`, `verify`, `stop_if`, and `impact_assessment_ref`.
> - Red-test, implementation, and verification Workers get role-specific stop rules.
> - The template uses placeholders where exact files/commands require repo-specific judgment.
> - Existing Scout, Worker, PM and blocked behavior still passes.
> - `npm test` passes.
> 
> ## Suggested Mode
> 
> implementation

## LLM First Context

This contract assumes the exploratory LLM conversation has already happened. The goal now is to preserve that shared intent, not restart discovery from scratch.

## Observable Oracle

Tests prove that an active Judge handoff includes a useful task_updates scaffold for queued red-test, implementation, and verification Workers, with required guardrails and no board mutation.

## Visible Outcome

T001/T002 must replace this placeholder with the observable user-facing behavior, generated artifact, audit answer, or verification result that should exist at the end.

## Acceptance Tests To Write First

- Given the clarified spec, when the owner exercises the main path, then the visible outcome matches the requested behavior.
- Given an important edge case from the spec, when the code handles it, then the result is deterministic and documented.
- Given a likely failure mode, when the implementation is incomplete, then a targeted test fails before production code is changed.

## Failure Modes To Prevent

- Implementation starts before the acceptance/evidence contract is specific enough.
- Tests pass but do not prove the owner-visible outcome.
- The work drifts outside the LLM-first intent, non-goals, or approved boundaries.
- Operational risks such as migrations, env/secrets, auth, external services, or shipping proof are discovered but not handled.

## Manual Or Visual Proof If Needed

If code tests cannot fully prove the outcome, T001/T002 must define the manual, artifact, source-backed, or browser proof required before final audit.

## Out Of Scope

T001/T002 must keep or revise this list:

- Do not implement behavior outside the approved acceptance contract.
- Do not change unrelated dirty files.
- Do not skip the red test stage because implementation seems obvious.

## Shipping Proof

- T998 must record commit SHA, remote branch or push string, push result, committed files, and unrelated dirty files left untouched.

## End-State Evidence To Produce

- Product behavior or artifact visible to the owner.
- Acceptance tests that fail before implementation and pass after implementation.
- Verification commands with results.
- Design review mapped back to the original request.
- Commit and push proof, or an explicit shipping blocker such as `no_git_repository` or `no_github_remote`.

## Acceptance Or Evidence Draft

T001 must replace this draft with concrete tests after reading the target repository.

- Given the clarified spec, when the owner exercises the main path, then the visible outcome matches the requested behavior.
- Given an important edge case from the spec, when the code handles it, then the result is deterministic and documented.
- Given a likely failure mode, when the implementation is incomplete, then a targeted test fails before production code is changed.

## Visual Or Demo Oracle

If the goal has UI, T001/T002 must decide whether browser or screenshot evidence is required before Worker work starts.

## Non-Goals

T001/T002 must keep or revise this list:

- Do not implement behavior outside the approved acceptance contract.
- Do not change unrelated dirty files.
- Do not skip the red test stage because implementation seems obvious.
