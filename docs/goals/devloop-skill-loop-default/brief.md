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
