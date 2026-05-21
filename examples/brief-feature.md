# Saved Search Feature

## Intent

Users can save a filtered search, find it again later, and restore the saved filters without rebuilding the search manually.

## Non-Goals

- Saved-search sharing.
- Alerts or scheduled report delivery.
- Search ranking changes.

## Proposed Oracle

Acceptance tests prove saved searches can be created, listed, reopened, renamed, and deleted without losing manual filter choices.

## Suggested Mode

implementation

## Acceptance Hints

- Given active filters, when the user saves the search, then the saved search appears in the sidebar.
- Given a saved search, when the user opens it, then the original filters are restored.
- Given manual filter edits after opening a saved search, when the user navigates away and back, then manual edits are not silently overwritten.
- Given an empty or duplicate name, when the user saves, then the UI returns a clear validation error.

## Risks And Open Questions

- Confirm whether filter state is already fully serializable.
- Confirm whether saved searches are user-private or workspace-scoped.
- Confirm the persistence layer and migration requirements before implementation.

## Constraints

- Do not change search ranking.
- Do not add alerts, emails, or sharing.
- Preserve existing filter URL behavior.
