# DevLoop Board URL And Repo Guard

## Original Request

# DevLoop Board URL And Repo Guard

## Intent

Improve LLM First DevLoop so a Codex agent is harder to steer into the wrong repository and always surfaces the local board URL immediately after creating or continuing a board.

- Do not replace GoalBuddy.
- Do not start native `/goal` automatically.
- Do not add hosted state, database state, or network services.
- Do not require npm publication.
- Do not change product repositories such as SuperMemory.

## Non-Goals

- TODO: Name what this goal must not change.

## Proposed Oracle

DevLoop run exposes repoRoot, boardUrl, and boardCommand, warns on state outside the current repo, and npm test passes.

## Suggested Mode

implementation

## Acceptance Hints

- `runDevLoopEntry` returns `repoRoot`, `boardUrl`, and `boardCommand` for both `--from` and `--state` paths.
- CLI text output prints `Board: http://goalbuddy.localhost:41737/<slug>/` immediately after `HANDOFF_READY`.
- CLI text output prints `Repo: <absolute repo root>` so the agent can verify the target workspace.
- Existing-board mode warns or blocks when `state.yaml` is outside the current git repository unless explicitly allowed.
- Tests cover board URL generation from an output slug with spaces/special characters normalized.
- `npm test` passes.

## Risks And Open Questions

- TODO: List ambiguity, missing credentials, operational risks, or decisions needed before implementation.

## Constraints

- Keep the system local and file-backed.
- Prefer deterministic string generation over starting the board server inside `run`.
- Keep the URL compatible with the existing GoalBuddy local board convention.
- Preserve existing JSON output compatibility by adding fields rather than renaming old ones.

## Ready Mode Command

```bash
npm run ready -- --from ./docs/goals/devloop-board-url-and-repo-guard/brief.md --mode implementation --oracle "DevLoop run exposes repoRoot, boardUrl, and boardCommand, warns on state outside the current repo, and npm test passes." --out docs/goals/devloop-board-url-and-repo-guard
```

## Source Notes

Compiled from: /Users/arnaud/Documents/llm-first-devloop/docs/devloop-board-url-and-repo-guard-notes.md

> # DevLoop Board URL And Repo Guard
> 
> ## Intent
> 
> Improve LLM First DevLoop so a Codex agent is harder to steer into the wrong repository and always surfaces the local board URL immediately after creating or continuing a board.
> 
> ## Non-Goals
> 
> - Do not replace GoalBuddy.
> - Do not start native `/goal` automatically.
> - Do not add hosted state, database state, or network services.
> - Do not require npm publication.
> - Do not change product repositories such as SuperMemory.
> 
> ## Proposed Oracle
> 
> The DevLoop CLI and tests prove that `run` exposes the target repo root and a deterministic local board URL, and warns when the board state is outside the current repository.
> 
> ## Acceptance
> 
> - `runDevLoopEntry` returns `repoRoot`, `boardUrl`, and `boardCommand` for both `--from` and `--state` paths.
> - CLI text output prints `Board: http://goalbuddy.localhost:41737/<slug>/` immediately after `HANDOFF_READY`.
> - CLI text output prints `Repo: <absolute repo root>` so the agent can verify the target workspace.
> - Existing-board mode warns or blocks when `state.yaml` is outside the current git repository unless explicitly allowed.
> - Tests cover board URL generation from an output slug with spaces/special characters normalized.
> - `npm test` passes.
> 
> ## Constraints
> 
> - Keep the system local and file-backed.
> - Prefer deterministic string generation over starting the board server inside `run`.
> - Keep the URL compatible with the existing GoalBuddy local board convention.
> - Preserve existing JSON output compatibility by adding fields rather than renaming old ones.

## Ready Mode Instruction

Use this goal as a implementation Ready Mode run.

LLM first principle: the free-form conversation already did the exploration work. This board starts only after the owner says the spec is mature enough to freeze into proof.

1. Clarify the design concept and domain language before implementation.
2. Turn the desired end state into observable acceptance tests or equivalent proof.
3. Follow the board policy for red tests before production code.
4. Complete the largest safe useful slice inside approved boundaries.
5. Verify, review, commit, push, and finish only when the oracle is true.

## Oracle

DevLoop run exposes repoRoot, boardUrl, and boardCommand, warns on state outside the current repo, and npm test passes.

## Files

- `state.yaml`: GoalBuddy board state.
- `acceptance-contract.md`: initial owner-facing acceptance contract to refine during T001/T002.
