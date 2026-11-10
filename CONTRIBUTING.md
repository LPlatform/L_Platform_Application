# Contributing

1. Create a short lived `feature/`, `fix/`, `refactor/`, `chore/`, `docs/` or `security/` branch.
2. Use Conventional Commits (for example `fix(desktop): handle offline startup`).
3. Keep changes scoped. Never commit backend code, private tests, secrets, `.env*` files, signing keys or generated dependencies.
4. Run pnpm formatting/lint/typecheck/React tests and Rust fmt/clippy/tests; build on the target OS. Explain unavailable checks in the PR.
5. Open a PR to `main`, resolve conversations and wait for required CI. Squash merge is recommended. No force pushes or bypasses.

See [GitHub Actions](docs/github-actions.md) and [desktop release process](docs/release-process.md).
