import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const skill = readFileSync(
  new URL("../skills/llm-first-devloop/SKILL.md", import.meta.url),
  "utf8",
);

test("LLM First DevLoop skill defaults to guided loop handoff handling", () => {
  assert.match(skill, /llm-first-devloop loop --state/);
  assert.match(skill, new RegExp(String.raw`llm-first-devloop loop \\`));
  assert.match(skill, /run.*lower-level|lower-level.*run/i);
  assert.match(skill, /LOOP_READY/);
  assert.doesNotMatch(skill, /The `run` command is the source of truth/);
  assert.match(skill, /Board:/);
  assert.match(skill, /Repo:/);
  assert.match(skill, /Board command:/);
  assert.match(skill, /state_outside_repo/);
  assert.match(skill, /--allow-outside-repo/);
  assert.match(skill, /surface .*Board/i);
  assert.match(skill, /verify .*Repo/i);
  assert.match(skill, /do not continue/i);
});
