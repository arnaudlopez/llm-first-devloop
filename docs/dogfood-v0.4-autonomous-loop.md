# Dogfood V0.4: Autonomous Session Loop

This dogfood tested the current Codex skill loop against a disposable fake app repository:

```text
run -> active task -> receipt -> advance -> run --state -> next task
```

## Target

Repository:

```text
/Users/arnaud/Documents/devloop-fake-app-test
```

Feature:

```text
Completion Filters
```

Oracle:

```text
Acceptance tests prove completed-task filtering and open-task filtering return only expected task copies without mutating stored tasks.
```

## Observed Flow

1. `llm-first-devloop run` created a checker-clean board from notes.
2. T001 Scout mapped the store, tests, worktree, impact assessment, and acceptance contract.
3. `advance` moved T001 -> T002.
4. T002 Judge approved the contract and wrote operational boundaries into the board.
5. `advance` moved T002 -> T003.
6. T003 wrote failing tests only.
7. `npm test` failed for the expected reason: `store.listCompletedTasks is not a function`.
8. `advance` moved T003 -> T004.
9. T004 implemented `listCompletedTasks()` and `listOpenTasks()`.
10. `npm test` passed.
11. `advance` moved T004 -> T005.
12. T005 verified the full local suite.
13. `advance` moved T005 -> T006.
14. T006 approved architecture and oracle coverage.
15. `advance` moved T006 -> T998.
16. T998 committed locally and recorded `shipping_blocker: no_github_remote`.
17. `advance` moved T998 -> T999.
18. T999 completed final audit.

## Results

- Red test evidence: present.
- Green verification: `npm test`, 5 tests pass.
- Commit: `560008e Add task completion filters`.
- Final receipt commit: `8590b92 Record completion filters goal completion`.
- Push: blocked by expected fake-repo condition, `no_github_remote`.

## Tool Learnings

Two tool defects were found and fixed:

1. `advance --no-next` left `goal.status: active` after T999. It now marks the goal `complete` when the final audit finishes.
2. The checker accepted malformed board text shaped like `allowed_files: []` followed by nested list items. It now rejects inline empty lists that also contain nested list entries.

## Remaining Gap

The loop is now usable, but T002 exposed the next meaningful automation gap:

```text
Judge decisions often need to update future task fields such as allowed_files, verify, stop_if, and impact_assessment_ref.
```

Today that still requires a normal board edit. A future `advance` enhancement should support safe task updates from structured Judge receipts.
