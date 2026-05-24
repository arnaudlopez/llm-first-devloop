# Acceptance Contract

## Goal

# DevLoop Spec Pressure Mode

## Intent

Strengthen the LLM-first intake so a light spec is challenged before Ready Mode. If the input is too vague, DevLoop should not create a weak board; it should produce a useful `needs-clarification.md` that helps the owner improve the spec.

The clarification should feel like a product/engineering coach: concise, direct, and oriented toward TDD-ready evidence.

- Do not use an LLM API.
- Do not block mature specs.
- Do not invent precise repo facts before Scout reads the repo.
- Do not create `state.yaml` for immature inputs.
- Do not ask dozens of questions.

## Non-Goals

- TODO: Name what this goal must not change.

## Proposed Oracle

Tests prove that immature notes produce a pressure-oriented needs-clarification.md with missing inputs, risk of misfire, priority questions, an amended spec draft, and minimal oracle guidance, while mature notes still produce a brief.

## Suggested Mode

implementation

## Acceptance Hints

- Immature notes return `needs_clarification`.
- The clarification includes why the spec is too light.
- The clarification includes risk/misfire warnings.
- The clarification includes a small number of priority questions.
- The clarification includes a proposed amended spec skeleton.
- The clarification includes a minimal oracle/evidence section.
- Mature notes still return `ready`.
- `loop --from` still stops before board generation when clarification is needed.
- `npm test` passes.

## Risks And Open Questions

- TODO: List ambiguity, missing credentials, operational risks, or decisions needed before implementation.

## Constraints

- TODO: Capture constraints, must-preserve behavior, boundaries, or forbidden changes.

## Ready Mode Command

```bash
npm run ready -- --from ./docs/goals/devloop-spec-pressure-mode/brief.md --mode implementation --oracle "Tests prove that immature notes produce a pressure-oriented needs-clarification.md with missing inputs, risk of misfire, priority questions, an amended spec draft, and minimal oracle guidance, while mature notes still produce a brief." --out docs/goals/devloop-spec-pressure-mode
```

## Source Notes

Compiled from: /Users/arnaud/Documents/llm-first-devloop/docs/devloop-spec-pressure-mode-notes.md

> # DevLoop Spec Pressure Mode
> 
> ## Intent
> 
> Strengthen the LLM-first intake so a light spec is challenged before Ready Mode. If the input is too vague, DevLoop should not create a weak board; it should produce a useful `needs-clarification.md` that helps the owner improve the spec.
> 
> The clarification should feel like a product/engineering coach: concise, direct, and oriented toward TDD-ready evidence.
> 
> ## Non-Goals
> 
> - Do not use an LLM API.
> - Do not block mature specs.
> - Do not invent precise repo facts before Scout reads the repo.
> - Do not create `state.yaml` for immature inputs.
> - Do not ask dozens of questions.
> 
> ## Proposed Oracle
> 
> Tests prove that immature notes produce a pressure-oriented `needs-clarification.md` with missing inputs, risk of misfire, priority questions, an amended spec draft, and minimal oracle guidance, while mature notes still produce a brief.
> 
> ## Acceptance
> 
> - Immature notes return `needs_clarification`.
> - The clarification includes why the spec is too light.
> - The clarification includes risk/misfire warnings.
> - The clarification includes a small number of priority questions.
> - The clarification includes a proposed amended spec skeleton.
> - The clarification includes a minimal oracle/evidence section.
> - Mature notes still return `ready`.
> - `loop --from` still stops before board generation when clarification is needed.
> - `npm test` passes.
> 
> ## Suggested Mode
> 
> implementation

## LLM First Context

This contract assumes the exploratory LLM conversation has already happened. The goal now is to preserve that shared intent, not restart discovery from scratch.

## Observable Oracle

Tests prove that immature notes produce a pressure-oriented needs-clarification.md with missing inputs, risk of misfire, priority questions, an amended spec draft, and minimal oracle guidance, while mature notes still produce a brief.

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
