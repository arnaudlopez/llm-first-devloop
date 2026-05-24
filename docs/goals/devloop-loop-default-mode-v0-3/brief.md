# DevLoop Loop Default Mode V0.3

## Intent

Update the product roadmap and implement the first prudent `loop` command as the future default DevLoop operating mode.

The owner intent is clear: after the LLM-first ping-pong phase defines the objective, DevLoop should keep the agent in the right rail with minimal repeated "next/go/enchaine" prompts, while still staying evidence/test/outcome driven.

- Do not build a fully autonomous agent runtime yet.
- Do not execute Codex/native `/goal` automatically.
- Do not mutate product repos.
- Do not bypass GoalBuddy receipts, TDD, quality check, final audit, or shipping proof.
- Do not make `run` disappear; keep it as a lower-level primitive/debug command.

## Non-Goals

- TODO: Name what this goal must not change.

## Proposed Oracle

The roadmap states loop is the default user experience, llm-first-devloop loop emits safe loop handoffs with receipt templates and blockers, dispatcher/bin expose it, and npm test passes.

## Suggested Mode

implementation

## Acceptance Hints

- Roadmap explicitly says `loop` is the default user experience and `run` is the lower-level primitive.
- New `llm-first-devloop loop` command accepts `--state` and `--from/--out/--oracle` like `run`.
- `loop` reuses `runDevLoopEntry` instead of duplicating interview/ready/check logic.
- Text output includes `Repo`, `Board`, `Board command`, active task, safe action, stop conditions, and a receipt template.
- JSON output includes `loopMode`, `safeAction`, `stopRules`, and `receiptTemplate`.
- Invalid or blocked boards surface blockers and do not invent a continuation.
- Dispatcher supports `llm-first-devloop loop`.
- Package exposes direct `llm-first-devloop-loop` bin.
- Tests cover valid Scout handoff, Worker red-test handoff, blocked board, and from-notes board creation.
- `npm test` passes.

## Risks And Open Questions

- TODO: List ambiguity, missing credentials, operational risks, or decisions needed before implementation.

## Constraints

- Keep V0.3 prudent: it guides and templates, it does not execute agent reasoning.
- Keep behavior additive.
- Preserve existing `run`, `next`, and `advance` APIs.
- Keep the implementation local and file-backed.

## Ready Mode Command

```bash
npm run ready -- --from ./docs/goals/devloop-loop-default-mode-v0-3/brief.md --mode implementation --oracle "The roadmap states loop is the default user experience, llm-first-devloop loop emits safe loop handoffs with receipt templates and blockers, dispatcher/bin expose it, and npm test passes." --out docs/goals/devloop-loop-default-mode-v0-3
```

## Source Notes

Compiled from: /Users/arnaud/Documents/llm-first-devloop/docs/devloop-loop-default-mode-v0-3-notes.md

> # DevLoop Loop Default Mode V0.3
> 
> ## Intent
> 
> Update the product roadmap and implement the first prudent `loop` command as the future default DevLoop operating mode.
> 
> The owner intent is clear: after the LLM-first ping-pong phase defines the objective, DevLoop should keep the agent in the right rail with minimal repeated "next/go/enchaine" prompts, while still staying evidence/test/outcome driven.
> 
> ## Non-Goals
> 
> - Do not build a fully autonomous agent runtime yet.
> - Do not execute Codex/native `/goal` automatically.
> - Do not mutate product repos.
> - Do not bypass GoalBuddy receipts, TDD, quality check, final audit, or shipping proof.
> - Do not make `run` disappear; keep it as a lower-level primitive/debug command.
> 
> ## Proposed Oracle
> 
> The roadmap states that `loop` is the future default experience over `run`, and `llm-first-devloop loop` produces a safe loop handoff with Repo, Board, active task, stop rules, and a receipt template while `npm test` passes.
> 
> ## Acceptance
> 
> - Roadmap explicitly says `loop` is the default user experience and `run` is the lower-level primitive.
> - New `llm-first-devloop loop` command accepts `--state` and `--from/--out/--oracle` like `run`.
> - `loop` reuses `runDevLoopEntry` instead of duplicating interview/ready/check logic.
> - Text output includes `Repo`, `Board`, `Board command`, active task, safe action, stop conditions, and a receipt template.
> - JSON output includes `loopMode`, `safeAction`, `stopRules`, and `receiptTemplate`.
> - Invalid or blocked boards surface blockers and do not invent a continuation.
> - Dispatcher supports `llm-first-devloop loop`.
> - Package exposes direct `llm-first-devloop-loop` bin.
> - Tests cover valid Scout handoff, Worker red-test handoff, blocked board, and from-notes board creation.
> - `npm test` passes.
> 
> ## Constraints
> 
> - Keep V0.3 prudent: it guides and templates, it does not execute agent reasoning.
> - Keep behavior additive.
> - Preserve existing `run`, `next`, and `advance` APIs.
> - Keep the implementation local and file-backed.
