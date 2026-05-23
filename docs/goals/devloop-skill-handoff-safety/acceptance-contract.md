# Acceptance Contract

## Goal

# DevLoop Skill Handoff Safety

## Intent

Update the LLM First DevLoop skill so Codex agents consistently use the new `run` output:

- surface the board URL to the owner immediately;
- verify the repo root before doing any task work;
- use the board command when the local board needs registration;
- stop on cross-repo blockers instead of improvising.

- Do not change the CLI behavior beyond documentation/tests unless tests prove a gap.
- Do not start native `/goal` automatically.
- Do not add hosted state, background processes, or a board server manager.
- Do not modify product repos.

## Non-Goals

- TODO: Name what this goal must not change.

## Proposed Oracle

The skill requires agents to surface Board, Repo, and Board command from DevLoop run, handle state_outside_repo safely, and npm test passes.

## Suggested Mode

implementation

## Acceptance Hints

- The skill explicitly says to surface `Board: ...` immediately whenever `run` returns `HANDOFF_READY`.
- The skill explicitly says to verify `Repo: ...` matches the intended target repo before executing task work.
- The skill explicitly says to use `Board command: ...` when the board is not registered or visible.
- The skill explicitly says not to continue when `run` blocks with `state_outside_repo` unless the owner intentionally approves `--allow-outside-repo`.
- A test fails if the skill no longer mentions `Board:`, `Repo:`, `Board command:`, and `state_outside_repo`.
- `npm test` passes.

## Risks And Open Questions

- TODO: List ambiguity, missing credentials, operational risks, or decisions needed before implementation.

## Constraints

- Keep the skill concise and operational.
- Keep the source of truth in `skills/llm-first-devloop/SKILL.md`.
- Preserve the LLM-first principle and autonomous loop.

## Ready Mode Command

```bash
npm run ready -- --from ./docs/goals/devloop-skill-handoff-safety/brief.md --mode implementation --oracle "The skill requires agents to surface Board, Repo, and Board command from DevLoop run, handle state_outside_repo safely, and npm test passes." --out docs/goals/devloop-skill-handoff-safety
```

## Source Notes

Compiled from: /Users/arnaud/Documents/llm-first-devloop/docs/devloop-skill-handoff-safety-notes.md

> # DevLoop Skill Handoff Safety
> 
> ## Intent
> 
> Update the LLM First DevLoop skill so Codex agents consistently use the new `run` output:
> 
> - surface the board URL to the owner immediately;
> - verify the repo root before doing any task work;
> - use the board command when the local board needs registration;
> - stop on cross-repo blockers instead of improvising.
> 
> ## Non-Goals
> 
> - Do not change the CLI behavior beyond documentation/tests unless tests prove a gap.
> - Do not start native `/goal` automatically.
> - Do not add hosted state, background processes, or a board server manager.
> - Do not modify product repos.
> 
> ## Proposed Oracle
> 
> The skill and tests prove that a DevLoop agent must repeat the `Repo`, `Board`, and `Board command` lines from `run`, verify that the repo root matches the intended target, and continue only from that active-task handoff.
> 
> ## Acceptance
> 
> - The skill explicitly says to surface `Board: ...` immediately whenever `run` returns `HANDOFF_READY`.
> - The skill explicitly says to verify `Repo: ...` matches the intended target repo before executing task work.
> - The skill explicitly says to use `Board command: ...` when the board is not registered or visible.
> - The skill explicitly says not to continue when `run` blocks with `state_outside_repo` unless the owner intentionally approves `--allow-outside-repo`.
> - A test fails if the skill no longer mentions `Board:`, `Repo:`, `Board command:`, and `state_outside_repo`.
> - `npm test` passes.
> 
> ## Constraints
> 
> - Keep the skill concise and operational.
> - Keep the source of truth in `skills/llm-first-devloop/SKILL.md`.
> - Preserve the LLM-first principle and autonomous loop.

## LLM First Context

This contract assumes the exploratory LLM conversation has already happened. The goal now is to preserve that shared intent, not restart discovery from scratch.

## Observable Oracle

The skill requires agents to surface Board, Repo, and Board command from DevLoop run, handle state_outside_repo safely, and npm test passes.

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
