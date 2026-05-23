# Acceptance Contract

## Goal

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

## LLM First Context

This contract assumes the exploratory LLM conversation has already happened. The goal now is to preserve that shared intent, not restart discovery from scratch.

## Observable Oracle

DevLoop run exposes repoRoot, boardUrl, and boardCommand, warns on state outside the current repo, and npm test passes.

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
