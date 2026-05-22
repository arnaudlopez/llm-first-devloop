# Release v0.2.0

LLM First DevLoop v0.2.0 is the first dogfooded autonomous-loop release.

## Highlights

- Added `llm-first-devloop run` as the one-command entry path from notes or an existing board.
- Added `llm-first-devloop advance` to apply task receipts, move `active_task`, and keep boards checker-clean.
- Added `receipt.task_updates` so Judge receipts can safely fill future Worker boundaries without manual YAML edits.
- Added final-audit completion handling: finishing `T999` with no next task marks `goal.status: complete`.
- Hardened the checker against malformed inline-empty-list YAML such as `allowed_files: []` followed by nested items.
- Documented and dogfooded the autonomous loop across fake app goals:
  - priority filtering
  - completion filtering
  - title search

## Supported Loop

```text
LLM conversation -> run -> active task -> receipt -> advance -> next task -> final audit
```

The CLI remains the local state transition and guardrail layer. Codex/GoalBuddy still performs Scout/Judge/Worker reasoning in-session.

## Verification

- `npm test`: 48 tests pass.
- `npm pack --dry-run`: package includes CLI scripts, docs, examples, and skill.
- GitHub Actions: expected to pass on release commit.

## Known Boundary

The tool does not yet execute agent reasoning by itself. That is intentional for this release: the skill drives the loop, while the CLI enforces state, receipts, checks, and safe transitions.
