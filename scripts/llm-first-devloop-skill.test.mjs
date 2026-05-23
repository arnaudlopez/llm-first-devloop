import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const skill = readFileSync(
  new URL("../skills/llm-first-devloop/SKILL.md", import.meta.url),
  "utf8",
);

test("LLM First DevLoop skill requires safe run handoff handling", () => {
  assert.match(skill, /Board:/);
  assert.match(skill, /Repo:/);
  assert.match(skill, /Board command:/);
  assert.match(skill, /state_outside_repo/);
  assert.match(skill, /--allow-outside-repo/);
  assert.match(skill, /surface .*Board/i);
  assert.match(skill, /verify .*Repo/i);
  assert.match(skill, /do not continue/i);
});
