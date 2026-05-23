# Release v0.2.1

LLM First DevLoop v0.2.1 is a patch release for package-installed CLI aliases.

## Fix

- Fixed npm-installed binaries such as `goalbuddy-ready`, `goalbuddy-check`, `goalbuddy-run`, and `goalbuddy-advance` exiting successfully without running their CLI entrypoints when invoked through `node_modules/.bin` symlinks.
- CLI guards now resolve `process.argv[1]` through `realpathSync` before comparing it to `import.meta.url`.

## Regression Coverage

- Added `scripts/bin-entrypoint.test.mjs`, which invokes every public alias through an npm-style symlink and verifies `--help` prints usage text.
- Added CI package smoke coverage: `npm pack`, install tarball into a clean consumer project, invoke installed aliases with `npx --no-install`, and run `llm-first-devloop run` from the installed package.

## Verification

- `npm test`: 49 tests pass.
- Package tarball install in a clean consumer project: pass.
- Installed alias help commands: pass.
- Package-installed `llm-first-devloop run`: pass.
- GitHub Actions: expected to pass on release commit.
