---
name: llm-first-devloop
description: Use when the user wants DevLoop, LLM First DevLoop, Ready Mode, or GoalBuddy entry automation for a feature/spec/PRD/conversation. Automates the entry workflow by invoking the local llm-first-devloop CLI to prepare or reuse a board, repair/check it, and return the next active-task handoff without manually running each command.
---

# LLM First DevLoop

Use this skill when the owner says things like:

- "use DevLoop on this"
- "prepare this with LLM First DevLoop"
- "continue this GoalBuddy board"
- "automate the workflow entry"
- "implement this feature from our LLM-first spec"

## Principle

Keep the workflow LLM-first. The owner may explore the idea freely in conversation first. Once the owner says the spec is ready, freeze it into a board with an observable oracle and acceptance evidence.

## What To Do

Do not ask the owner to manually run `interview`, `ready`, `repair`, `check`, and `next`.

Instead, run one of these from the target repo:

```bash
llm-first-devloop run --state docs/goals/<slug>/state.yaml
```

or, for notes/spec input:

```bash
llm-first-devloop run \
  --from notes.md \
  --out docs/goals/<slug> \
  --oracle "<observable proof>"
```

If the package is not installed globally, use the repo script directly:

```bash
node <llm-first-devloop-repo>/scripts/llm-first-devloop.mjs run ...
```

## Behavior

The `run` command is the source of truth. It:

1. handles existing `state.yaml` or notes/spec input;
2. runs interview/ready when needed;
3. repairs and checks the board;
4. runs next;
5. returns the active-task handoff;
6. stops with clarification or blocker output instead of creating a weak board.

When a task is completed in the current session, do not hand-edit `state.yaml` if the receipt is straightforward. Apply the receipt with:

```bash
llm-first-devloop advance \
  --state docs/goals/<slug>/state.yaml \
  --receipt-json '{"result":"done","summary":"..."}'
```

Use `--next T003` for an explicit next task or `--no-next` when the task is blocked and the board should pause.

## Boundaries

- Do not launch native `/goal` automatically in the current tranche.
- Do not implement product code while preparing the entry workflow.
- Do not edit unrelated product repositories unless the active GoalBuddy task explicitly allows it.
- If `run` returns `needs_clarification` or `blocked`, surface the blocker and ask only the missing material question.

## After Handoff

When `run` returns `HANDOFF_READY`, use the generated prompt as the next task instruction. Keep the original oracle visible and continue only within the active task boundaries.
