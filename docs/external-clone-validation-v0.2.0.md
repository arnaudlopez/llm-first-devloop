# External Clone Validation v0.2.0

Date: 2026-05-22

This check validates the public repository from a clean external-user clone.

## Source

```bash
git clone https://github.com/arnaudlopez/llm-first-devloop.git /tmp/llm-first-devloop-external
```

## Commands

```bash
npm install
npm test
node scripts/llm-first-devloop.mjs --help
node scripts/goalbuddy-run.mjs --help
node scripts/goalbuddy-advance.mjs --help
```

Smoke flow:

```bash
rm -rf /tmp/devloop-external-smoke

node scripts/llm-first-devloop.mjs run \
  --from examples/conversation-notes.md \
  --out /tmp/devloop-external-smoke \
  --oracle "A checker-clean external smoke board reaches an active handoff." \
  --force

node scripts/llm-first-devloop.mjs check /tmp/devloop-external-smoke/state.yaml
node scripts/llm-first-devloop.mjs next /tmp/devloop-external-smoke/state.yaml
node scripts/llm-first-devloop.mjs advance \
  --state /tmp/devloop-external-smoke/state.yaml \
  --receipt-json '{"result":"done","summary":"External smoke Scout receipt."}' \
  --json
```

## Result

- `npm install`: pass, 0 vulnerabilities.
- `npm test`: pass, 48 tests.
- CLI help: pass for public dispatcher, `run`, and `advance`.
- `run`: created checker-clean board.
- `check`: pass.
- `next`: returned T001 Scout handoff.
- `advance`: moved T001 done -> T002 active with checker pass.

No code changes were required.
