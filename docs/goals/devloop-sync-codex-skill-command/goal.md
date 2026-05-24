# DevLoop Sync Codex Skill Command

## Original Request

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

## Ready Mode Instruction

Use this goal as a implementation Ready Mode run.

LLM first principle: the free-form conversation already did the exploration work. This board starts only after the owner says the spec is mature enough to freeze into proof.

1. Clarify the design concept and domain language before implementation.
2. Turn the desired end state into observable acceptance tests or equivalent proof.
3. Follow the board policy for red tests before production code.
4. Complete the largest safe useful slice inside approved boundaries.
5. Verify, review, commit, push, and finish only when the oracle is true.

## Oracle

llm-first-devloop sync-skill installs or updates the Codex skill from repo source with dry-run/json support, dispatcher/bin exposure, README docs, and npm test passes.

## Files

- `state.yaml`: GoalBuddy board state.
- `acceptance-contract.md`: initial owner-facing acceptance contract to refine during T001/T002.
