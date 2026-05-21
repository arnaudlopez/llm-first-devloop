# Dogfood V0.1

This repository dogfoods the LLM First DevLoop on its own sample saved-search feature.

## Scenario

Input:

- `examples/conversation-notes.md`
- oracle: `Acceptance tests prove saved searches can be created, listed, reopened, renamed, and deleted.`

Required flow:

```text
conversation notes -> interview -> brief -> ready -> check -> next
```

## Commands

```bash
rm -rf /tmp/llm-first-devloop-dogfood
mkdir -p /tmp/llm-first-devloop-dogfood

node scripts/llm-first-devloop.mjs interview \
  --from examples/brief-feature.md \
  --out /tmp/llm-first-devloop-dogfood/brief.md

node scripts/llm-first-devloop.mjs ready \
  --from /tmp/llm-first-devloop-dogfood/brief.md \
  --out /tmp/llm-first-devloop-dogfood/goal \
  --oracle "Acceptance tests prove saved searches can be created, listed, reopened, renamed, and deleted."

node scripts/llm-first-devloop.mjs check /tmp/llm-first-devloop-dogfood/goal/state.yaml
node scripts/llm-first-devloop.mjs next /tmp/llm-first-devloop-dogfood/goal/state.yaml
```

## Observations

- The interview step accepts a mature brief and produces a Ready Mode brief.
- Ready Mode generates a checker-clean board with T001 active.
- `next` does not mutate the board; it prints a prompt for the active Scout task.
- The board still depends on GoalBuddy/Codex for execution. This is intentional for v0.1.

## V0.2 Follow-Ups

- Add a richer runner that can append receipts after explicit approval.
- Add project memory for known test commands and repo-specific deployment constraints.
- Add more dogfood cases from real product work.

