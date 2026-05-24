# Acceptance Contract

## Goal

# DevLoop Skill Loop Default

## Intent

Align the Codex `llm-first-devloop` skill with the new product direction: `loop` is the default guided mode, while `run` remains a lower-level primitive.

When the owner says "next", "enchaine", "use DevLoop", or asks to continue a board, the skill should guide Codex to invoke `llm-first-devloop loop`, surface the board URL, and keep advancing with receipts until blocked or complete.

- Do not remove `run`.
- Do not launch native `/goal` automatically.
- Do not build a fully autonomous runtime yet.
- Do not weaken repo guard, board URL, blocker, or receipt requirements.

## Non-Goals

- TODO: Name what this goal must not change.

## Proposed Oracle

The repository skill and installed Codex skill both document loop as the default guided command, tests prove this expectation, sync-skill installs it, and CI passes.

## Suggested Mode

implementation

## Acceptance Hints

- `skills/llm-first-devloop/SKILL.md` tells Codex to use `llm-first-devloop loop` by default.
- The skill still explains `run` as a lower-level primitive/debug fallback.
- The installed skill under `~/.codex/skills/llm-first-devloop/SKILL.md` is synced.
- Tests assert the skill defaults to `loop` and preserves board/repo/blocker behavior.
- `npm test` passes.

## Risks And Open Questions

- TODO: List ambiguity, missing credentials, operational risks, or decisions needed before implementation.

## Constraints

- TODO: Capture constraints, must-preserve behavior, boundaries, or forbidden changes.

## Ready Mode Command

```bash
npm run ready -- --from ./docs/goals/devloop-skill-loop-default/brief.md --mode implementation --oracle "The repository skill and installed Codex skill both document loop as the default guided command, tests prove this expectation, sync-skill installs it, and CI passes." --out docs/goals/devloop-skill-loop-default
```

## Source Notes

Compiled from: /Users/arnaud/Documents/llm-first-devloop/docs/devloop-skill-loop-default-notes.md

> # DevLoop Skill Loop Default
> 
> ## Intent
> 
> Align the Codex `llm-first-devloop` skill with the new product direction: `loop` is the default guided mode, while `run` remains a lower-level primitive.
> 
> When the owner says "next", "enchaine", "use DevLoop", or asks to continue a board, the skill should guide Codex to invoke `llm-first-devloop loop`, surface the board URL, and keep advancing with receipts until blocked or complete.
> 
> ## Non-Goals
> 
> - Do not remove `run`.
> - Do not launch native `/goal` automatically.
> - Do not build a fully autonomous runtime yet.
> - Do not weaken repo guard, board URL, blocker, or receipt requirements.
> 
> ## Proposed Oracle
> 
> The repository skill and installed Codex skill both document `loop` as the default guided command, tests prove this expectation, sync-skill installs it, and CI passes.
> 
> ## Acceptance
> 
> - `skills/llm-first-devloop/SKILL.md` tells Codex to use `llm-first-devloop loop` by default.
> - The skill still explains `run` as a lower-level primitive/debug fallback.
> - The installed skill under `~/.codex/skills/llm-first-devloop/SKILL.md` is synced.
> - Tests assert the skill defaults to `loop` and preserves board/repo/blocker behavior.
> - `npm test` passes.

## LLM First Context

This contract assumes the exploratory LLM conversation has already happened. The goal now is to preserve that shared intent, not restart discovery from scratch.

## Observable Oracle

The repository skill and installed Codex skill both document loop as the default guided command, tests prove this expectation, sync-skill installs it, and CI passes.

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
