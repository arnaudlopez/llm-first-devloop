# DevLoop Board URL And Repo Guard

## Intent

Improve LLM First DevLoop so a Codex agent is harder to steer into the wrong repository and always surfaces the local board URL immediately after creating or continuing a board.

## Non-Goals

- Do not replace GoalBuddy.
- Do not start native `/goal` automatically.
- Do not add hosted state, database state, or network services.
- Do not require npm publication.
- Do not change product repositories such as SuperMemory.

## Proposed Oracle

The DevLoop CLI and tests prove that `run` exposes the target repo root and a deterministic local board URL, and warns when the board state is outside the current repository.

## Acceptance

- `runDevLoopEntry` returns `repoRoot`, `boardUrl`, and `boardCommand` for both `--from` and `--state` paths.
- CLI text output prints `Board: http://goalbuddy.localhost:41737/<slug>/` immediately after `HANDOFF_READY`.
- CLI text output prints `Repo: <absolute repo root>` so the agent can verify the target workspace.
- Existing-board mode warns or blocks when `state.yaml` is outside the current git repository unless explicitly allowed.
- Tests cover board URL generation from an output slug with spaces/special characters normalized.
- `npm test` passes.

## Constraints

- Keep the system local and file-backed.
- Prefer deterministic string generation over starting the board server inside `run`.
- Keep the URL compatible with the existing GoalBuddy local board convention.
- Preserve existing JSON output compatibility by adding fields rather than renaming old ones.

