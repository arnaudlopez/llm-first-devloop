import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "devloop-sync-skill-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function runSyncSkill(args, env = {}) {
  return spawnSync(process.execPath, ["scripts/llm-first-devloop-sync-skill.mjs", ...args], {
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

test("sync-skill copies the repo skill into a temporary Codex home", () => {
  withTempDir((dir) => {
    const result = runSyncSkill(["--codex-home", dir, "--json"]);
    assert.equal(result.status, 0, result.stderr || result.stdout);

    const output = JSON.parse(result.stdout);
    assert.equal(output.changed, true);
    assert.equal(output.upToDate, false);
    assert.equal(output.dryRun, false);
    assert.equal(output.targetPath, join(dir, "skills", "llm-first-devloop", "SKILL.md"));
    assert.equal(existsSync(output.targetPath), true);
    assert.equal(
      readFileSync(output.targetPath, "utf8"),
      readFileSync("skills/llm-first-devloop/SKILL.md", "utf8"),
    );
  });
});

test("sync-skill dry-run reports a copy without writing", () => {
  withTempDir((dir) => {
    const result = runSyncSkill(["--codex-home", dir, "--dry-run", "--json"]);
    assert.equal(result.status, 0, result.stderr || result.stdout);

    const output = JSON.parse(result.stdout);
    assert.equal(output.changed, true);
    assert.equal(output.dryRun, true);
    assert.equal(existsSync(output.targetPath), false);
  });
});

test("sync-skill reports up-to-date after a copy", () => {
  withTempDir((dir) => {
    const first = runSyncSkill(["--codex-home", dir, "--json"]);
    assert.equal(first.status, 0, first.stderr || first.stdout);

    const second = runSyncSkill(["--codex-home", dir, "--json"]);
    assert.equal(second.status, 0, second.stderr || second.stdout);
    const output = JSON.parse(second.stdout);
    assert.equal(output.changed, false);
    assert.equal(output.upToDate, true);
  });
});

test("sync-skill uses CODEX_HOME by default when provided", () => {
  withTempDir((dir) => {
    const result = runSyncSkill(["--json"], { CODEX_HOME: dir });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const output = JSON.parse(result.stdout);
    assert.equal(output.targetPath, join(dir, "skills", "llm-first-devloop", "SKILL.md"));
  });
});

test("dispatcher exposes sync-skill", () => {
  withTempDir((dir) => {
    const result = spawnSync(
      process.execPath,
      ["scripts/llm-first-devloop.mjs", "sync-skill", "--codex-home", dir, "--json"],
      { encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.equal(JSON.parse(result.stdout).changed, true);
  });
});
