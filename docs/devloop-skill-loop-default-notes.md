# DevLoop Skill Loop Default

## Intent

Align the Codex `llm-first-devloop` skill with the new product direction: `loop` is the default guided mode, while `run` remains a lower-level primitive.

When the owner says "next", "enchaine", "use DevLoop", or asks to continue a board, the skill should guide Codex to invoke `llm-first-devloop loop`, surface the board URL, and keep advancing with receipts until blocked or complete.

## Non-Goals

- Do not remove `run`.
- Do not launch native `/goal` automatically.
- Do not build a fully autonomous runtime yet.
- Do not weaken repo guard, board URL, blocker, or receipt requirements.

## Proposed Oracle

The repository skill and installed Codex skill both document `loop` as the default guided command, tests prove this expectation, sync-skill installs it, and CI passes.

## Acceptance

- `skills/llm-first-devloop/SKILL.md` tells Codex to use `llm-first-devloop loop` by default.
- The skill still explains `run` as a lower-level primitive/debug fallback.
- The installed skill under `~/.codex/skills/llm-first-devloop/SKILL.md` is synced.
- Tests assert the skill defaults to `loop` and preserves board/repo/blocker behavior.
- `npm test` passes.
