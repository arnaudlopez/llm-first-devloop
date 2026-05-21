# Dogfood V0.3

This dogfood checks the first runner-automation primitive: applying a receipt and advancing the board without hand-editing `state.yaml`.

## Oracle

One command records a task receipt, marks the active task done or blocked, activates the next task, and leaves the board checker-clean.

## Commands

```bash
rm -rf /tmp/llm-first-devloop-advance

node scripts/llm-first-devloop.mjs run \
  --from examples/supermemory-t4-notes.md \
  --out /tmp/llm-first-devloop-advance \
  --oracle "A checker-clean board can be advanced from T001 to T002 with a receipt." \
  --force

node scripts/llm-first-devloop.mjs advance \
  --state /tmp/llm-first-devloop-advance/state.yaml \
  --receipt-json '{"result":"done","summary":"Scout mapped the fake target and confirmed next task."}' \
  --json
```

## Observed Result

- status: `advanced`
- active task updated: `T001 -> done`
- next task activated: `T002 -> active`
- quality check: `ok: true`
- task count: `8`

## Current Boundary

`advance` does not perform Scout/Judge/Worker reasoning. It only applies a receipt produced by the current agent/session and keeps board transitions safe.
