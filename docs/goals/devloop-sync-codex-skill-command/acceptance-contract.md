# Acceptance Contract

## Goal

# DevLoop Sync Codex Skill Command

## Intent

Add an official DevLoop command that installs or updates the Codex skill from the repository source into the user's Codex skills directory.

Today, after changing `skills/llm-first-devloop/SKILL.md`, we manually copy it to `~/.codex/skills/llm-first-devloop/SKILL.md`. That is fragile and easy to forget. DevLoop should make this an explicit, tested command.

- Do not publish to npm.
- Do not modify GoalBuddy plugin internals.
- Do not change product repositories.
- Do not require network access.
- Do not overwrite unrelated skills.

## Non-Goals

- TODO: Name what this goal must not change.

## Proposed Oracle

llm-first-devloop sync-skill installs or updates the Codex skill from repo source with dry-run/json support, dispatcher/bin exposure, README docs, and npm test passes.

## Suggested Mode

implementation

## Acceptance Hints

- New script copies the repo skill to `<codex-home>/skills/llm-first-devloop/SKILL.md`.
- Command creates the target directory when missing.
- `--dry-run` reports the pending copy without writing.
- `--json` returns source path, target path, changed/up_to_date/dry_run status.
- Tests use a temporary Codex home and never write to the real home.
- Dispatcher supports `llm-first-devloop sync-skill`.
- Package exposes a direct `llm-first-devloop-sync-skill` bin.
- README documents the command.
- `npm test` passes.

## Risks And Open Questions

- TODO: List ambiguity, missing credentials, operational risks, or decisions needed before implementation.

## Constraints

- Keep the repo skill as source of truth.
- Default Codex home is `CODEX_HOME` when set, otherwise `~/.codex`.
- Keep behavior additive and local-only.

## Ready Mode Command

```bash
npm run ready -- --from ./docs/goals/devloop-sync-codex-skill-command/brief.md --mode implementation --oracle "llm-first-devloop sync-skill installs or updates the Codex skill from repo source with dry-run/json support, dispatcher/bin exposure, README docs, and npm test passes." --out docs/goals/devloop-sync-codex-skill-command
```

## Source Notes

Compiled from: /Users/arnaud/Documents/llm-first-devloop/docs/devloop-sync-codex-skill-command-notes.md

> # DevLoop Sync Codex Skill Command
> 
> ## Intent
> 
> Add an official DevLoop command that installs or updates the Codex skill from the repository source into the user's Codex skills directory.
> 
> Today, after changing `skills/llm-first-devloop/SKILL.md`, we manually copy it to `~/.codex/skills/llm-first-devloop/SKILL.md`. That is fragile and easy to forget. DevLoop should make this an explicit, tested command.
> 
> ## Non-Goals
> 
> - Do not publish to npm.
> - Do not modify GoalBuddy plugin internals.
> - Do not change product repositories.
> - Do not require network access.
> - Do not overwrite unrelated skills.
> 
> ## Proposed Oracle
> 
> `llm-first-devloop sync-skill` copies `skills/llm-first-devloop/SKILL.md` into the target Codex home, supports dry-run/JSON output, is exposed through the dispatcher and package bin, and `npm test` passes.
> 
> ## Acceptance
> 
> - New script copies the repo skill to `<codex-home>/skills/llm-first-devloop/SKILL.md`.
> - Command creates the target directory when missing.
> - `--dry-run` reports the pending copy without writing.
> - `--json` returns source path, target path, changed/up_to_date/dry_run status.
> - Tests use a temporary Codex home and never write to the real home.
> - Dispatcher supports `llm-first-devloop sync-skill`.
> - Package exposes a direct `llm-first-devloop-sync-skill` bin.
> - README documents the command.
> - `npm test` passes.
> 
> ## Constraints
> 
> - Keep the repo skill as source of truth.
> - Default Codex home is `CODEX_HOME` when set, otherwise `~/.codex`.
> - Keep behavior additive and local-only.

## LLM First Context

This contract assumes the exploratory LLM conversation has already happened. The goal now is to preserve that shared intent, not restart discovery from scratch.

## Observable Oracle

llm-first-devloop sync-skill installs or updates the Codex skill from repo source with dry-run/json support, dispatcher/bin exposure, README docs, and npm test passes.

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
