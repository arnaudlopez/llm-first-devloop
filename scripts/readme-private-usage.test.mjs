import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");

test("README documents the supported pre-publication usage path", () => {
  assert.match(readme, /## Before NPM Publication/);
  assert.match(readme, /git clone https:\/\/github\.com\/arnaudlopez\/llm-first-devloop\.git/);
  assert.match(readme, /npm install/);
  assert.match(readme, /npm test/);
  assert.match(readme, /npm run run --/);
});

test("README separates pre-public local usage from future npm usage", () => {
  const prePublicSection = readme.match(
    /## Before NPM Publication[\s\S]*?(?=\n## |\n$)/
  )?.[0] ?? "";

  assert.match(prePublicSection, /not published to npm/i);
  assert.match(prePublicSection, /local clone/i);
  assert.match(prePublicSection, /future npm/i);
  assert.doesNotMatch(prePublicSection, /npx llm-first-devloop(?! from GitHub)/);
});
