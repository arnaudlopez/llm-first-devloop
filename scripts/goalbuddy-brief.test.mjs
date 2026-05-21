import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { compileBrief, writeBrief } from "./goalbuddy-brief.mjs";

test("compileBrief creates a structured Ready Mode brief from notes", () => {
  const brief = compileBrief({
    title: "Saved Search",
    mode: "frontend",
    oracle: "Playwright proves saved searches can be created and reused.",
    sourceText: `# Saved Search

Users want to save a filtered search and reopen it later.

## Non-Goals
- Sharing saved searches

## Acceptance
- Create a saved search from active filters
- Reopen it from the sidebar

## Risks
- Existing filter URLs may be fragile`,
  });

  assert.match(brief, /# Saved Search/);
  assert.match(brief, /## Proposed Oracle/);
  assert.match(brief, /Playwright proves saved searches/);
  assert.match(brief, /## Suggested Mode\n\nfrontend/);
  assert.match(brief, /- Sharing saved searches/);
  assert.match(brief, /npm run ready -- --from/);
});

test("writeBrief refuses to overwrite without force", () => {
  const dir = mkdtempSync(join(tmpdir(), "goalbuddy-brief-"));
  try {
    const outPath = join(dir, "brief.md");
    writeBrief({ outPath, sourceText: "Build billing export." });
    assert.match(readFileSync(outPath, "utf8"), /Build billing export/);
    assert.throws(() => writeBrief({ outPath, sourceText: "Again" }), /already exists/);
    writeBrief({ outPath, sourceText: "Again", force: true });
    assert.match(readFileSync(outPath, "utf8"), /Again/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
