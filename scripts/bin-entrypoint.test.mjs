import assert from "node:assert/strict";
import { mkdtempSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const bins = [
  ["goalbuddy-brief", "scripts/goalbuddy-brief.mjs"],
  ["goalbuddy-interview", "scripts/goalbuddy-interview.mjs"],
  ["goalbuddy-ready", "scripts/goalbuddy-ready-mode.mjs"],
  ["goalbuddy-check", "scripts/goalbuddy-quality-check.mjs"],
  ["goalbuddy-repair", "scripts/goalbuddy-board-repair.mjs"],
  ["goalbuddy-next", "scripts/goalbuddy-next.mjs"],
  ["goalbuddy-run", "scripts/goalbuddy-run.mjs"],
  ["goalbuddy-advance", "scripts/goalbuddy-advance.mjs"]
];

test("bin scripts run when invoked through npm-style symlinks", () => {
  const dir = mkdtempSync(join(tmpdir(), "devloop-bin-"));

  for (const [binName, scriptPath] of bins) {
    const linkPath = join(dir, binName);
    symlinkSync(resolve(scriptPath), linkPath);

    const result = spawnSync(process.execPath, [linkPath, "--help"], {
      encoding: "utf8"
    });

    assert.equal(result.status, 0, `${binName} should exit 0\nSTDERR:\n${result.stderr}`);
    assert.match(result.stdout, /Usage:/, `${binName} should print help`);
  }
});
