# SuperMemory T4 Workflow Entry

## Intent

Implement the T4 tranche of SuperMemory from a mature LLM-first specification, using GoalBuddy to force acceptance evidence before code.

## Non-Goals

- Do not implement the SuperMemory engine in the entry workflow.
- Do not mutate production data.
- Do not launch native `/goal` automatically in this tranche.

## Proposed Oracle

A checker-clean SuperMemory T4 board reaches an active-task handoff without the owner manually running interview, ready, repair, check, and next.

## Acceptance

- The workflow can start from these notes and create a GoalBuddy board.
- The generated board passes the quality checker.
- The workflow returns the exact active-task handoff.
- If the notes are incomplete, the workflow asks for clarification instead of creating a weak board.
