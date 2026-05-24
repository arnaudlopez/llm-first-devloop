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
