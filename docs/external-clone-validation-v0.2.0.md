# External Clone Validation v0.2.0

Date: 2026-05-22

This check validates the public repository from a clean external-user clone and a package-installed consumer project.

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

Package install smoke:

```bash
npm pack --pack-destination /tmp/devloop-pack
mkdir -p /tmp/devloop-consumer
cd /tmp/devloop-consumer
npm init -y
npm install /tmp/devloop-pack/llm-first-devloop-0.2.0.tgz
npx --no-install goalbuddy-ready --help
npx --no-install goalbuddy-check --help
npx --no-install goalbuddy-run --help
npx --no-install goalbuddy-advance --help
npx --no-install llm-first-devloop run \
  --from examples/conversation-notes.md \
  --out goals/pkg-saved-search \
  --oracle "Acceptance tests prove package-installed run works." \
  --force
```

## Result

- `npm install`: pass, 0 vulnerabilities.
- `npm test`: pass, 49 tests.
- CLI help: pass for public dispatcher, `run`, and `advance`.
- `run`: created checker-clean board.
- `check`: pass.
- `next`: returned T001 Scout handoff.
- `advance`: moved T001 done -> T002 active with checker pass.
- Package install from tarball: pass.
- Installed `npx --no-install` aliases: pass after fixing symlink entrypoint detection.
- Package-installed `llm-first-devloop run`: pass.

## Finding Fixed

The first package-installed smoke test exposed that alias binaries such as `goalbuddy-ready` and `goalbuddy-check` exited with code 0 but printed no help when invoked through npm symlinks.

Cause: each script compared `import.meta.url` with the raw `process.argv[1]` symlink path, so `main()` was not executed from `node_modules/.bin`.

Fix: CLI entrypoint guards now compare against `realpathSync(process.argv[1])`, and `scripts/bin-entrypoint.test.mjs` protects all public alias scripts with npm-style symlink execution.
