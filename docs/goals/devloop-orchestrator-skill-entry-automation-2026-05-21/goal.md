# DevLoop Orchestrator Skill Entry Automation

## Original Request

The owner wants LLM First DevLoop to stop requiring manual command choreography. For SuperMemory T4 and similar future work, the desired experience is one natural instruction such as "use DevLoop on this feature", then the skill prepares or finds the board, repairs/checks it, runs `next`, and gives the exact active-task handoff.

## Interpreted Outcome

Implement a Codex skill layer for LLM First DevLoop that automates the entry workflow:

```text
conversation/spec -> interview/ready or existing board -> repair -> check -> next -> active-task handoff
```

For this tranche, the skill does not execute `/goal` end to end. It prepares the workflow entry and proves that a SuperMemory T4-style request can be brought to a valid next action without the owner manually running each command.

## Goal Oracle

A dogfood run for a SuperMemory T4-style request proves that one DevLoop skill invocation prepares or reuses a board, runs repair/check/next through the local tooling, and returns the exact active-task handoff with no manual command sequence required by the owner.

## Non-Goals

- Do not implement SuperMemory T4 itself in this goal.
- Do not make `/goal` execution fully automatic yet.
- Do not replace GoalBuddy.
- Do not add a hosted service, database, or external workflow marketplace.
- Do not mutate unrelated product repositories.

## Constraints

- Keep the product principle LLM-first: the conversation/spec comes before board freezing.
- Treat GoalBuddy as the pressure engine and LLM First DevLoop as the orchestration layer.
- The first tranche should be safe in the current repo and dogfoodable with a fixture or documented SuperMemory T4-style notes.
- The skill must call or document the existing CLI rather than duplicating logic in prose.
- Any implementation must be TDD-shaped and shipped with commit/push proof.

## Likely Misfire

Creating another checklist that still requires the owner to manually run `interview`, `ready`, `repair`, `check`, and `next` would miss the point. The skill must collapse that choreography into one operator-facing entry point.

## Starter Command

```text
/goal Follow docs/goals/devloop-orchestrator-skill-entry-automation-2026-05-21/goal.md.
```
