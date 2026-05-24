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
