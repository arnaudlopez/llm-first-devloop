# Saved Search Conversation Notes

Users often rebuild the same filtered search several times during a week. The owner wants them to save the active filters, name that saved search, and reopen it later from the sidebar.

## Non-Goals

- Sharing saved searches with teammates.
- Email alerts or scheduled reports.
- Reworking the search backend ranking model.

## Acceptance

- Create a saved search from the current filters.
- See the saved search in the sidebar.
- Reopen the saved search and restore the same filter state.
- Rename and delete a saved search.

## Risks

- Existing filter URLs may not encode every filter.
- Empty or duplicate names need a clear validation rule.
- Saved searches must not overwrite manual filter changes unless the user chooses one.
