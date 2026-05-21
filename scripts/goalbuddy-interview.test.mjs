import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { analyzeInterview, writeInterview } from "./goalbuddy-interview.mjs";

test("analyzeInterview produces a brief when notes are mature", () => {
  const result = analyzeInterview({
    sourceText: `# Saved Search

Users can save and reopen filtered searches.

## Non-Goals
- Sharing

## Proposed Oracle
Acceptance tests prove save and reopen.

## Acceptance
- Save current filters
- Reopen saved search`,
  });

  assert.equal(result.status, "ready");
  assert.equal(result.missing.length, 0);
  assert.match(result.content, /## Intent/);
  assert.match(result.content, /Acceptance tests prove save and reopen/);
});

test("analyzeInterview asks clarification questions when notes are immature", () => {
  const result = analyzeInterview({
    sourceText: "# Rough Idea\n\nMaybe improve search somehow.",
  });

  assert.equal(result.status, "needs_clarification");
  assert.deepEqual(result.missing, ["non_goals", "oracle", "acceptance_evidence"]);
  assert.match(result.content, /Needs Clarification/);
  assert.match(result.content, /What observable proof/);
});

test("writeInterview writes needs-clarification instead of brief when not ready", () => {
  const dir = mkdtempSync(join(tmpdir(), "goalbuddy-interview-"));
  try {
    const outPath = join(dir, "brief.md");
    const result = writeInterview({
      sourceText: "Improve the dashboard.",
      outPath,
    });

    assert.equal(result.status, "needs_clarification");
    assert.equal(result.outPath, join(dir, "needs-clarification.md"));
    assert.match(readFileSync(result.outPath, "utf8"), /Needs Clarification/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
