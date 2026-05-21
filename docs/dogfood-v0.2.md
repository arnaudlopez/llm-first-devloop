# Dogfood V0.2

This dogfood checks the new DevLoop entry orchestrator against a SuperMemory T4-style request.

## Oracle

One command prepares the workflow entry and returns an active-task handoff:

```text
notes -> interview -> ready -> repair/check -> next -> handoff
```

The owner should not need to run `interview`, `ready`, `repair`, `check`, and `next` one by one.

## Command

```bash
rm -rf /tmp/llm-first-devloop-t4

node scripts/llm-first-devloop.mjs run \
  --from examples/supermemory-t4-notes.md \
  --out /tmp/llm-first-devloop-t4 \
  --oracle "A checker-clean SuperMemory T4 board reaches an active-task handoff." \
  --force
```

## Expected Result

- status: `HANDOFF_READY`
- check: `PASS`
- a generated `state.yaml`
- an active task handoff beginning with `Active task: T001`

## Observed Result

Latest local dogfood:

- status: `handoff_ready`
- mode: `notes_entry`
- check: `ok: true`
- task count: `8`
- active task: `T001`
- state path: `/tmp/llm-first-devloop-t4/state.yaml`
- owner choreography removed: one `run` command replaced the manual `interview -> ready -> repair/check -> next` sequence.

## Current Boundary

This intentionally does not launch native `/goal`. Full automatic GoalBuddy execution is a later tranche after the entry workflow is stable.
