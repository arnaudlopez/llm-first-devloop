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

When `run` returns `HANDOFF_READY`, it may print these operator lines before the prompt:

```text
Repo: /absolute/path/to/repo
Board: http://goalbuddy.localhost:41737/<slug>/
Board command: npx goalbuddy board /absolute/path/to/docs/goals/<slug>
```

Surface the `Board:` URL to the owner immediately every time a board is created or continued. Verify that `Repo:` matches the intended target repository before executing task work. If the board is not registered or visible in the local hub, run the exact `Board command:` from the handoff and then surface the `Board:` URL again.

If `run` blocks with `state_outside_repo`, do not continue and do not use `--allow-outside-repo` by default. Ask the owner only if this is intentionally a cross-repo continuation; use `--allow-outside-repo` only after that explicit approval.

## Autonomous Session Loop

After `run` returns `HANDOFF_READY`, keep working in the current Codex session when the active task can be executed locally:

1. read the active-task handoff and boundaries;
2. execute only that task;
3. produce a compact receipt with evidence, commands, changed files, blockers, and next recommendation;
4. call `advance`;
5. run `run --state` again to get the next handoff;
6. repeat until the board is blocked, waiting for owner input, or final-audited.

Do not ask the owner to manually run `/goal`, `check`, `next`, or `advance` for normal local work. Surface only real blockers, missing credentials, required approvals, or final results.

When a task is completed in the current session, do not hand-edit `state.yaml` if the receipt is straightforward. Apply the receipt with:

```bash
llm-first-devloop advance \
  --state docs/goals/<slug>/state.yaml \
  --receipt-json '{"result":"done","summary":"..."}'
```

Use `--next T003` for an explicit next task or `--no-next` when the task is blocked and the board should pause.

When a Judge task approves future Worker boundaries, include `task_updates` in the receipt instead of hand-editing the board:

```bash
llm-first-devloop advance \
  --state docs/goals/<slug>/state.yaml \
  --receipt-json '{"result":"done","decision":"approved","task_updates":{"T003":{"allowed_files":["test/example.test.js"],"verify":["npm test"],"stop_if":["Need files outside allowed_files."],"impact_assessment_ref":"T001.receipt.impact_assessment"}}}'
```

Only use `task_updates` for queued future tasks and bounded execution fields: `allowed_files`, `verify`, `stop_if`, and `impact_assessment_ref`.

## Boundaries

- Do not launch native `/goal` automatically in the current tranche.
- Do not implement product code while preparing the entry workflow.
- Do not edit unrelated product repositories unless the active GoalBuddy task explicitly allows it.
- If `run` returns `needs_clarification` or `blocked`, surface the blocker and ask only the missing material question.

## After Handoff

When `run` returns `HANDOFF_READY`, use the generated prompt as the next task instruction. Keep the original oracle visible, continue only within the active task boundaries, and advance the board yourself after each completed task.
