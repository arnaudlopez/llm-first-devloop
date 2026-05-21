# GoalBuddy Video Workflow Upgrades

## Original Request

Préparer le travail pour intégrer dans notre personnalisation GoalBuddy les propositions issues de la vidéo : design concept partagé, langage ubiquitaire, feedback loops, TDD en petits pas, deep modules, interfaces explicites, et audit continu du design.

## Interpreted Outcome

Notre personnalisation locale de GoalBuddy génère et répare des boards qui cadrent mieux l'intention utilisateur, parlent le langage du domaine, imposent une stratégie de feedback/TDD proportionnée, protègent l'architecture, et prouvent ces comportements par tests et exemples de boards.

## Current Tranche

Design and implement a tested local customization package that upgrades GoalBuddy board generation, repair, and checking with video-derived workflow safeguards while preserving compatibility with future GoalBuddy updates.

## Scope

In scope:

- Improve the local scripts and patches that personalize GoalBuddy.
- Add deterministic tests for new board-generation and board-repair behavior.
- Add example board coverage for implementation, verification, audit, research/docs, and architecture-sensitive goals.
- Keep the customization compatible with the existing update-adaptation script.

Out of scope:

- No upstream GoalBuddy refactor or contribution in this tranche.
- No product-code changes outside the local GoalBuddy customization workspace.
- No live GitHub publishing unless a valid git remote and credentials are available and the shipping task confirms it is safe.

## Constraints

- Preserve the user's existing update-friendly customization approach.
- Do not turn every goal into heavyweight ceremony.
- Audit and verification goals must remain lightweight and must not be forced into fake TDD or shipping.
- Implementation goals must remain test-driven and must not complete without proof.
- If a real repo is unavailable, shipping must be recorded as blocked with evidence rather than silently skipped.

## Success Proof

The goal is complete when:

- The design additions are reflected in local GoalBuddy customization scripts/templates/instructions.
- Tests cover board repair/check behavior for the new safeguards.
- Representative boards pass the quality checker after repair.
- A final audit maps the result to the original video-derived improvement list and confirms no incompatible upstream refactor was introduced.

## Likely Misfire

Adding many new fields and rules that make boards look sophisticated but do not materially improve execution quality, or breaking audit/verification modes by forcing implementation-only gates onto them.

## Starter Command

```text
/goal Follow docs/goals/goalbuddy-video-workflow-upgrades-2026-05-19/goal.md.
```
