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
