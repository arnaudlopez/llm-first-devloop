# DevLoop Judge Worker Template

## Original Request

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

## Ready Mode Instruction

Use this goal as a implementation Ready Mode run.

LLM first principle: the free-form conversation already did the exploration work. This board starts only after the owner says the spec is mature enough to freeze into proof.

1. Clarify the design concept and domain language before implementation.
2. Turn the desired end state into observable acceptance tests or equivalent proof.
3. Follow the board policy for red tests before production code.
4. Complete the largest safe useful slice inside approved boundaries.
5. Verify, review, commit, push, and finish only when the oracle is true.

## Oracle

Tests prove that an active Judge handoff includes a useful task_updates scaffold for queued red-test, implementation, and verification Workers, with required guardrails and no board mutation.

## Files

- `state.yaml`: GoalBuddy board state.
- `acceptance-contract.md`: initial owner-facing acceptance contract to refine during T001/T002.
