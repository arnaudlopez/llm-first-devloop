# Private GitHub Usage Notes

## Original Request

# Private GitHub Usage Notes

## Intent

We decided not to publish `llm-first-devloop` to npm yet. Users still need a clean private/pre-public workflow that works from the GitHub repository or a local clone.

A developer can understand and verify how to use LLM First DevLoop before npm publication, without guessing which command path is supported.

- Do not publish to npm.
- Do not add hosted services.
- Do not change the GoalBuddy model.
- Do not require a global install.

## Non-Goals

- TODO: Name what this goal must not change.

## Proposed Oracle

A fresh reader can follow the README to use LLM First DevLoop without npm publication, and the package smoke tests prove the documented CLI binaries still execute.

## Suggested Mode

implementation

## Acceptance Hints

- The README has a clear "Before npm publication" path.
- The documented private/local commands match the current CLI.
- Tests or smoke checks prove the package binary entrypoints still work from a packaged install.
- The final evidence distinguishes GitHub/local usage from future npm usage.

## Risks And Open Questions

- TODO: List ambiguity, missing credentials, operational risks, or decisions needed before implementation.

## Constraints

- TODO: Capture constraints, must-preserve behavior, boundaries, or forbidden changes.

## Ready Mode Command

```bash
npm run ready -- --from ./docs/goals/private-github-usage/brief.md --mode implementation --oracle "A fresh reader can follow the README to use LLM First DevLoop without npm publication, and the package smoke tests prove the documented CLI binaries still execute." --out docs/goals/private-github-usage-notes
```

## Source Notes

Compiled from: /Users/arnaud/Documents/llm-first-devloop/examples/private-github-usage-notes.md

> # Private GitHub Usage Notes
> 
> ## Intent
> 
> We decided not to publish `llm-first-devloop` to npm yet. Users still need a clean private/pre-public workflow that works from the GitHub repository or a local clone.
> 
> ## User Outcome
> 
> A developer can understand and verify how to use LLM First DevLoop before npm publication, without guessing which command path is supported.
> 
> ## Non-Goals
> 
> - Do not publish to npm.
> - Do not add hosted services.
> - Do not change the GoalBuddy model.
> - Do not require a global install.
> 
> ## Acceptance
> 
> - The README has a clear "Before npm publication" path.
> - The documented private/local commands match the current CLI.
> - Tests or smoke checks prove the package binary entrypoints still work from a packaged install.
> - The final evidence distinguishes GitHub/local usage from future npm usage.
> 
> ## Oracle
> 
> A fresh reader can follow the README to use LLM First DevLoop without npm publication, and the package smoke tests prove the documented CLI binaries still execute.

## Ready Mode Instruction

Use this goal as a implementation Ready Mode run.

LLM first principle: the free-form conversation already did the exploration work. This board starts only after the owner says the spec is mature enough to freeze into proof.

1. Clarify the design concept and domain language before implementation.
2. Turn the desired end state into observable acceptance tests or equivalent proof.
3. Follow the board policy for red tests before production code.
4. Complete the largest safe useful slice inside approved boundaries.
5. Verify, review, commit, push, and finish only when the oracle is true.

## Oracle

A fresh reader can follow the README to use LLM First DevLoop without npm publication, and the package smoke tests prove the documented CLI binaries still execute.

## Files

- `state.yaml`: GoalBuddy board state.
- `acceptance-contract.md`: initial owner-facing acceptance contract to refine during T001/T002.
